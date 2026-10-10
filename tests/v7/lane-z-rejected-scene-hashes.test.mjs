import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KNOWN_REJECTED_LANE_Z_CLEAN_SHA256,
  knownRejectedLaneZCoverReason,
  knownRejectedVisualReason
} from '../../scripts/v7-visual-candidate-policy.mjs';

const COLLAGE_SHA='d2614b2bae7e88a36d35a4af2f96fdfc3002c398f5bafe30c41c9603d8598ea5';
const HIKER_SHA='9b75957118f7596d4b504d6503b80fdc1a32f804ec5903ec46513c66f997d474';

test('the two measured wrong-scene Lane Z generations remain hash-blocked',()=>{
  assert.equal(Object.keys(KNOWN_REJECTED_LANE_Z_CLEAN_SHA256).length,2);
  assert.match(knownRejectedLaneZCoverReason(COLLAGE_SHA),/collage/i);
  assert.match(knownRejectedLaneZCoverReason(HIKER_SHA),/mountain/i);
  for(const sha of [COLLAGE_SHA,HIKER_SHA]) {
    assert.match(sha,/^[a-f0-9]{64}$/);
    assert.match(knownRejectedVisualReason({
      assetId:'bqv7-devotional-any-01',contentType:'devotional',
      status:'production_ready',sha256:sha,variants:[]
    }),/known-bad devotional CLEAN pixels/);
  }
});

test('new correct artwork is not automatically accepted or rejected by this hash list',()=>{
  const sha='1'.repeat(64);
  assert.equal(knownRejectedLaneZCoverReason(sha),null);
  assert.equal(knownRejectedVisualReason({
    assetId:'bqv7-devotional-next-01',contentType:'devotional',
    status:'candidate_qa_pending',sha256:sha
  }),null);
});

test('an exact reject remains blocked if renamed to a different devotional asset',()=>{
  const record={contentType:'devotional',assetId:'bqv7-devotional-other-01',
    contentId:'devotional.biblequest.other.01',sha256:HIKER_SHA};
  assert.match(knownRejectedVisualReason(record),/workshop scene/);
});
