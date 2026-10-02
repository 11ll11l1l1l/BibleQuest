import assert from 'node:assert/strict';
import test from 'node:test';
import {
  requireApprovedBibleQuestOrigin,
  requireExactCandidateSha,
  sanitizeEvidenceText,
} from '../../src/v6/physical-device-evidence.js';

test('shared physical evidence contract normalizes exact SHA and approved origins',()=>{
  assert.equal(requireExactCandidateSha('A'.repeat(40)),'a'.repeat(40));
  assert.equal(requireApprovedBibleQuestOrigin('https://abc.mybiblequest.pages.dev/path?x=1'),'https://abc.mybiblequest.pages.dev');
});

test('shared sanitizer rejects account, credential and raw push endpoint material',()=>{
  for(const value of [
    'qa@example.com',
    'Bearer abcdefghijklmnopqrstuvwxyz',
    'api_key=super-secret-value',
    'https://fcm.googleapis.com/fcm/send/device-secret',
    '11111111-1111-4111-8111-111111111111',
  ]){
    assert.throws(()=>sanitizeEvidenceText(value,'Evidence'),/account, credential, endpoint, key, or token material/);
  }
});
