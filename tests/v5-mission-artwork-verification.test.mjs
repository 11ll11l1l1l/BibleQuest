import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const missionSource = await readFile(new URL('../src/engines/mission.js', import.meta.url), 'utf8');
const missionUi = await readFile(new URL('../src/features/mission/index.js', import.meta.url), 'utf8');
const missionArtwork = await readFile(new URL('../assets/mission-feature-icons.svg', import.meta.url), 'utf8');

// Mission recommendations own behavior through semantic action IDs. Dead emoji
// presentation fields must not return now that the UI renders genuine assets.
assert.doesNotMatch(missionSource, /icon\s*:/, 'Mission engine must not expose unused presentation glyph fields');
assert.match(missionSource, /action:\s*'review'/);
assert.match(missionSource, /action:\s*'study'/);
assert.match(missionArtwork, /<symbol id="review"\b/, 'mission artwork exposes an exact review symbol');
assert.match(missionArtwork, /<symbol id="study"\b/, 'mission artwork exposes an exact study symbol');

// The renderer derives artwork only from the semantic action owner. Artwork is
// decorative; visible title/copy and button text independently carry meaning.
assert.match(missionUi, /rec\.action==='review'\?'review':'study'/, 'renderer must map semantic actions to exact artwork IDs');
assert.match(missionUi, /data-mission-art="\$\{id\}" aria-hidden="true"/, 'mission artwork must remain decorative');
assert.match(missionUi, /<h1>\$\{esc\(rec\.title\)\}<\/h1>/, 'visible recommendation title must remain independent');
assert.match(missionUi, /\$\{esc\(rec\.text\)\}/, 'visible recommendation explanation must remain independent');
assert.match(missionUi, /Start this mission/, 'mission action must retain visible text');

console.log('PASS v5 mission artwork: semantic review/study IDs render genuine decorative assets with independent text');
