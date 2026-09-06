import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const diagnostics=read('client-diagnostics.js');
const runtime=read('runtime-recovery.js');
const media=read('media-library.js');
const index=read('index.html');
const transform=read('transform.html');

for(const code of ['BQ-NET-001','BQ-NET-002','BQ-AUTH-001','BQ-AUTH-002','BQ-SRV-429','BQ-SRV-500','BQ-DATA-001','BQ-MOD-001','BQ-MOD-002','BQ-MOD-003','BQ-APP-001','BQ-APP-002','BQ-UI-001','BQ-UNK-001']){
  assert.ok(diagnostics.includes(code),`shared diagnostics missing ${code}`);
}
assert.match(diagnostics,/async function probeConnection\(/,'diagnostics must actively test connectivity instead of trusting navigator.onLine alone');
assert.match(diagnostics,/bq-net-probe/,'connectivity probe must use a cache-busting same-origin request');
assert.match(diagnostics,/kind==='freeze'/,'diagnostics must classify recovered main-thread stalls separately');
assert.match(diagnostics,/delay<5500/,'freeze watchdog must have a finite stall threshold');
assert.match(diagnostics,/serverReachable/,'diagnostics must preserve the connection-test result');
assert.match(diagnostics,/diagnoseAndPresent/,'global runtime failures must be user-visible with a diagnostic code');

const diagPos=index.indexOf('<script src="client-diagnostics.js"></script>');
const appPos=index.indexOf('<script src="app.js"></script>');
assert.ok(diagPos>0&&appPos>0&&diagPos<appPos,'shared diagnostics must load before the main application runtime');

assert.match(runtime,/diagnostic\.code/,'feature recovery UI must show the classified diagnostic code');
assert.match(runtime,/Internet check passed/,'feature recovery UI must state when connectivity is not the likely cause');
assert.match(runtime,/Internet\/server reachability check failed/,'feature recovery UI must state when connectivity is the likely cause');
assert.match(runtime,/module-timeout/,'module recovery timeout must be classified separately');

assert.match(media,/diagnoseError:handleError/,'Live Recordings must expose its diagnostic failure path');
assert.match(media,/Network requests are time-limited/,'Live Recordings must not leave users on an indefinite loading state');
assert.match(media,/BQ-NET-001/,'Live Recordings must have an offline fallback code');
assert.match(media,/BQ-DATA-001/,'Live Recordings must have an online data-failure fallback code');
assert.match(media,/Internet check passed\. The connection is not the likely cause/,'Live Recordings must explicitly distinguish an app/data failure from internet failure');

assert.match(transform,/<script src="client-diagnostics\.js"><\/script>/,'Transform must use shared diagnostics');
assert.match(transform,/diagnostic\.serverReachable===true/,'Transform startup must show when internet connectivity was verified');
assert.match(transform,/BQ-MOD-001/,'Transform must fall back to a standard app-module error code');

for(const file of ['client-diagnostics.js','runtime-recovery.js','media-library.js'])execFileSync(process.execPath,['--check',new URL(`../${file}`,import.meta.url).pathname],{stdio:'inherit'});

console.log('BibleQuest network-vs-app diagnostic code guard passed');
