import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('Leader Center exposes Content Review only to review-capable ministry roles', () => {
  const source = fs.readFileSync(new URL('../../src/features/leader-center/index.js', import.meta.url), 'utf8');
  assert.match(source, /\['leader','pastor','admin'\]\.includes\(state\.role\)/);
  assert.match(source, /data-leader-open-content-review/);
  assert.match(source, /onContentReview\?\.\(\)/);
});

test('Leader Center Content Review entry delegates to the existing protected route', () => {
  const source = fs.readFileSync(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
  assert.match(source, /'leader-center'.*onContentReview:\(\)=>router\.navigate\('content-review'\)/);
  assert.match(source, /'content-review':\(\)=>contentReviewPage\(\{api,session,congregation,recall/);
});

test('Content Review remains server-authorized instead of trusting Leader Center visibility', () => {
  const source = fs.readFileSync(new URL('../../src/app/content-review.js', import.meta.url), 'utf8');
  assert.match(source, /const REVIEW_ROLES=new Set\(\['leader','pastor','admin'\]\)/);
  assert.match(source, /const memberships=await congregation\.load\(\)/);
  assert.match(source, /access=await api\.platformAccess\(user\.id\)/);
  assert.match(source, /api\.loadQueue\(selected\.id\)/);
  assert.match(source, /api\.saveDecision\(congregationId,row\)/);
  assert.match(source, /api\.markReportsReviewed\(congregationId,target\.contentKey,userId,reviewedAt\)/);
});
