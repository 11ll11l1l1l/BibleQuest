import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const {createResetRecoveryService}=await import(pathToFileURL(new URL('../src/app/reset-recovery.js',import.meta.url).pathname));

const calls=[];
const account={resetPassword:async input=>{calls.push(input);return {ok:true,recovery_code:'BQ-NEW-CODE'}}};
const service=createResetRecoveryService({account});
assert.equal(service.getState().status,'ready');
assert(!JSON.stringify(service.getState()).includes('email'),'Reset Recovery state must not contain submitted email fields.');

let result=await service.submit({email:'User@Example.test',recoveryCode:'BQ-OLD',newPassword:'password123',confirmPassword:'password123'});
assert.equal(calls.length,1);
assert.deepEqual(calls[0],{email:'User@Example.test',recoveryCode:'BQ-OLD',newPassword:'password123',confirmPassword:'password123'});
assert.equal(result.status,'success');
assert.equal(result.recoveryCode,'BQ-NEW-CODE');
assert.equal(result.codeSaved,false);
const serialized=JSON.stringify(result);
assert(!serialized.includes('User@Example.test'));
assert(!serialized.includes('password123'));
assert(!serialized.includes('BQ-OLD'));
result=service.acknowledgeSaved(true);assert.equal(result.codeSaved,true);
service.clear();assert.equal(service.getState().status,'ready');
service.cancel();assert.equal(service.getState().status,'cancelled');assert.equal(calls.length,1,'Pre-submit cancellation must not invoke Account recovery.');

const invalid=createResetRecoveryService({account:{resetPassword:async()=>{throw new Error('Recovery code is invalid or expired.')}}});
await assert.rejects(()=>invalid.submit({email:'bad@example.test',recoveryCode:'BAD',newPassword:'abcdefgh',confirmPassword:'abcdefgh'}),/invalid or expired/);
assert.equal(invalid.getState().status,'error');
assert.equal(invalid.getState().recoveryCode,'');
assert(!JSON.stringify(invalid.getState()).includes('bad@example.test'));
invalid.cancel();assert.equal(invalid.getState().status,'cancelled');

let release;
const pending=createResetRecoveryService({account:{resetPassword:()=>new Promise(resolve=>{release=()=>resolve({ok:true,recovery_code:'BQ-LATER'})})}});
const inFlight=pending.submit({email:'pending@example.test',recoveryCode:'PENDING',newPassword:'abcdefgh',confirmPassword:'abcdefgh'});
assert.equal(pending.getState().status,'submitting');
assert.throws(()=>pending.cancel(),error=>error.code==='BQ_RESET_BUSY');
await assert.rejects(()=>pending.submit({}),error=>error.code==='BQ_RESET_BUSY');
release();await inFlight;assert.equal(pending.getState().status,'success');
result=pending.acknowledgeSaved(false);assert.equal(result.codeSaved,false);

const missing=createResetRecoveryService({account:{resetPassword:async()=>({ok:true})}});
await assert.rejects(()=>missing.submit({}),error=>error.code==='BQ_RESET_CODE_MISSING');
assert.equal(missing.getState().status,'error');

console.log('BibleQuest v3 Reset Recovery state/privacy edge regression passed.');
