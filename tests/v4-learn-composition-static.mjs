// BibleQuest V4 Learn hub composition contract. Locks in the fix for
// A1-V4-004: 10 near-identical cards must no longer share equal visual
// weight. Bible Reader becomes the dominant entry point; the remaining nine
// destinations are grouped into labeled categories.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const learn = fs.readFileSync(path.join(root, 'src', 'features', 'learn', 'index.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'ui', 'learn-v4.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.ok(index.includes('href="src/ui/learn-v4.css"'), 'learn-v4.css must be linked from index.html.');

// The locked stable heading must remain exact (enforced separately by
// scripts/validate-v3-source-labels.mjs, re-checked here as a hard guard).
assert.ok(learn.includes('<h1>Learn</h1>'), 'Stable Learn heading must remain exact.');

// All ten route hooks and their actions must survive unchanged (Rule 1).
const routes = ['reader', 'study', 'deep-questions', 'story-journey', 'wisdom-situations', 'bible-world', 'adaptive-learning', 'open-review', 'private-notes', 'cloud-notes'];
for (const route of routes) {
  assert.ok(learn.includes(`data-open-${route}`), `Learn must preserve the existing hook: data-open-${route}`);
}
for (const action of ['onReader?.()', 'onStudy?.()', 'onDeepQuestions?.()', 'onStoryJourney?.()', 'onWisdomSituations?.()', 'onBibleWorld?.()', 'onAdaptiveLearning?.()', 'onOpenReview?.()', 'onPrivateNotes?.()', 'onCloudNotes?.()']) {
  assert.ok(learn.includes(action), `Learn must still call the existing route action: ${action}`);
}

// Protected doctrinal/provenance surfaces must remain present verbatim
// (Learn exposes but does not own these - re-checked here as a hard guard
// alongside the dedicated doctrinal-safety/source-labels validators).
assert.ok(learn.includes('DOCTRINAL_SAFETY') && learn.includes('data-doctrinal-policy'), 'Learn must still expose the doctrinal-safety policy.');
assert.ok(learn.includes('sourceGuide'), 'Learn must still render the source guide.');

// Reader must now be a distinct, dominant entry point - not one card among ten.
assert.ok(learn.includes('data-learn-primary'), 'Reader must be pulled out as the dominant primary entry point.');
assert.ok(!/class="bq-learning-card" data-open-reader/.test(learn), 'Reader must not be styled as one flat learning-card among the other nine destinations.');

// The remaining nine destinations must be grouped into labeled categories,
// not left as one undifferentiated grid.
const groupCount = (learn.match(/bq-learn-group/g) || []).length;
assert.ok(groupCount >= 3, `Learn must organize secondary destinations into multiple labeled groups, found ${groupCount} group markers.`);
for (const label of ['STUDY &amp; REFLECT', 'EXPLORE &amp; REVIEW', 'NOTES']) {
  assert.ok(learn.includes(label), `Learn is missing the expected group label: ${label}`);
}

// CSS: the primary card must have a visually distinct, dominant treatment
// (matching the pattern already certified for Home's Daily Journey card).
assert.ok(/\.bq-learn-primary\{[^}]*background:linear-gradient/.test(css), 'Reader entry must keep a visually distinct, dominant treatment.');

console.log('BibleQuest v4 Learn hub composition contract passed.');
