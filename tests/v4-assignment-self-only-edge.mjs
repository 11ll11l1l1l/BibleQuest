// BibleQuest V4 Phase 1 privacy tightening: ordinary members must see
// nothing about other members' assignment responses - not names, not
// completion status, not answers. Only ministry roles retain the review view.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(path.join(root, 'src', 'features', 'assignments', 'index.js'), 'utf8');

// Extract and evaluate responseReviewView in isolation (pure function, no DOM needed).
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const formatDate = () => 'Jan 1';
const fnMatch = src.match(/function responseReviewView\(state,row,readOnly\)\{[\s\S]*?\n\}/);
assert.ok(fnMatch, 'responseReviewView must exist with the expected signature.');
// eslint-disable-next-line no-new-func
const responseReviewView = new Function('esc', 'formatDate', `return ${fnMatch[0].replace('function responseReviewView', 'function')}`)(esc, formatDate);

const rowWithResponders = {
  id: 'a1',
  progress: { status: 'assigned' }
};
const stateWithReview = {
  activeReview: {
    assignmentId: 'a1',
    status: 'ready',
    responders: [{ displayName: 'Other Member', completedAt: '2026-09-01' }],
    responses: [{ userId: 'u2', displayName: 'Other Member', completedAt: '2026-09-01', submission: 'PRIVATE-A-7421', leaderFeedback: 'Well done' }]
  }
};

// --- Member: readOnly = false. Must get literally nothing back. ---
const memberOutput = responseReviewView(stateWithReview, rowWithResponders, false);
assert.equal(memberOutput, '', 'Ordinary members must receive an empty response-review view - no names, no completion status, no answers.');

// Also verify against every review state a member could encounter (idle/loading/error),
// not just the "ready" case above.
for (const state of [
  {},
  { activeReview: { assignmentId: 'a1', status: 'loading' } },
  { activeReview: { assignmentId: 'a1', status: 'error' } }
]) {
  assert.equal(responseReviewView(state, rowWithResponders, false), '', 'Ordinary members must get an empty review view regardless of review-loading state.');
}

// --- Ministry role: readOnly = true. Must still see the full review, including
// peer names/completion and the gated private-answer text. ---
const leaderOutput = responseReviewView(stateWithReview, rowWithResponders, true);
assert.ok(leaderOutput.includes('Other Member'), 'Ministry roles must still see responder names.');
assert.ok(leaderOutput.includes('PRIVATE-A-7421'), 'Ministry roles must still see submitted answer text.');
assert.ok(leaderOutput.includes('Well done'), 'Ministry roles must still see leader feedback.');
assert.ok(leaderOutput.includes('Member Responses'), 'Ministry review section must be clearly labeled as a leader-facing review, not a member feature.');

// --- Section-heading rename sanity: the old "Responses received" wording
// (which implied a member-facing feature) must be gone entirely.
assert.ok(!src.includes('Responses received'), 'The old member-facing "Responses received" wording must be fully removed.');

// --- The bottom-of-page privacy disclosure text must accurately describe the
// new self-only contract for members, and must not overstate what leaders get.
assert.ok(src.includes('You see only your own assignment status'), 'The privacy-boundary disclosure must accurately describe the self-only contract for members.');
assert.ok(!src.includes('Members assigned to the same task can see who has responded'), 'The old peer-visibility disclosure must be removed - it is no longer true.');

console.log('BibleQuest v4 Phase 1 assignment self-only privacy edge regression passed.');
