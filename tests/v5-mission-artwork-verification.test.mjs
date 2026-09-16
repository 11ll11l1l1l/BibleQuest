import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const missionSource = await readFile(new URL('../src/engines/mission.js', import.meta.url), 'utf8');
const missionArtwork = await readFile(new URL('../assets/mission-feature-icons.svg', import.meta.url), 'utf8');

// Phase 3 genuine-match verification for the final Mission Engine glyph pair.
// The engine's action values are the semantic owner; artwork must expose exact
// matching stable IDs rather than relying on a filename or approximate icon.
assert.match(missionSource, /icon:\s*'🧠'[\s\S]*action:\s*'review'/, 'review recommendation remains explicitly identified');
assert.match(missionSource, /icon:\s*'📘'[\s\S]*action:\s*'study'/, 'study recommendation remains explicitly identified');
assert.match(missionArtwork, /<symbol id="review"\b/, 'mission artwork exposes an exact review symbol');
assert.match(missionArtwork, /<symbol id="study"\b/, 'mission artwork exposes an exact study symbol');

// Accessible/product meaning is independently carried by text/action fields;
// the decorative glyph is not the sole label for either recommendation.
assert.match(missionSource, /title:\s*`\$\{dueCount\} review/, 'review state retains independent visible title text');
assert.match(missionSource, /title:\s*focus \? `Strengthen \$\{focus\}` : 'Continue your study'/, 'study state retains independent visible title text');
assert.match(missionSource, /action:\s*'review'/);
assert.match(missionSource, /action:\s*'study'/);

console.log('PASS v5 mission artwork verification: review/study glyph meanings have genuine stable-ID mission assets and independent text/action semantics');
