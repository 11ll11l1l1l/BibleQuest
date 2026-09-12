// BibleQuest V4 Community / Relational family presentation contract.
// The original Community tranche remains byte-exact except: the local
// Couples owner, whose intentional Communication Journey evolution is now
// governed by the dedicated V4 Couples Journey contracts (Couples Cloud
// stays byte-locked); and Congregation Recognition, whose intentional icon
// restructuring (bare-text emoji -> stable data-award-code/data-badge-id
// elements) is governed by the V4 whole-app audit contract instead.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baselineSha='7b2abd7507adf5b7363fe068d5038f54d1c7263a';
const preserved=[
  'src/features/community/index.js',
  'src/features/couples-cloud/index.js',
  'src/features/journey-groups/index.js',
  'src/features/team-center/index.js',
  'src/features/live-rooms/index.js',
  'src/features/media-library/index.js',
  'src/features/recordings/index.js',
  'src/features/leaderboards/index.js',
  'src/features/encouragements/index.js'
];

for(const relative of preserved){
  const current=fs.readFileSync(path.join(root,relative),'utf8');
  const baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8'});
  assert.equal(current,baseline,`${relative} must remain byte-for-byte unchanged in the V4 Community presentation tranche.`);
}

const congregationRecognitionSrc=fs.readFileSync(path.join(root,'src/features/congregation-recognition/index.js'),'utf8');
assert.ok(congregationRecognitionSrc.includes('bq-recognition-icon'),'Congregation Recognition icon restructuring must be present (governed by the V4 whole-app audit contract, not byte-locked here).');

const css=fs.readFileSync(path.join(root,'src/ui/community-family-v4.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/v3-regression.yml'),'utf8');
assert.ok(html.includes('src/ui/community-family-v4.css'),'Community V4 stylesheet must be activated from index.html.');
assert.ok(workflow.includes('tests/v4-couples-journey-static.mjs')&&workflow.includes('tests/v4-couples-journey-edge.mjs')&&workflow.includes('tests/v4-couples-journey-smoke.mjs'),'Intentional local Couples evolution must remain delegated to the dedicated Communication Journey acceptance contracts.');

const routeScopes=[
  '[data-community-view]',
  '[data-couples-view]',
  '[data-couples-cloud-view]',
  '[data-journey-groups-view]',
  '[data-team-center-view]',
  '[data-live-rooms-view]',
  '[data-media-library-page]',
  '[data-recordings-page]',
  '[data-recognition-view]',
  '[data-leaderboards-view]',
  '[data-encouragements-view]'
];
for(const selector of routeScopes)assert.ok(css.includes(selector),`Community V4 styles must explicitly cover ${selector}.`);

assert.ok(css.includes('--family-community-deep')&&css.includes('--family-community-accent')&&css.includes('--family-community-soft'),'Community V4 must consume the certified family accent tokens.');
assert.ok(css.includes('@media(max-width:430px)'),'Community V4 must include narrow-phone composition rules.');
assert.ok(css.includes('@media(prefers-contrast:more)'),'Community V4 must preserve stronger-contrast presentation.');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Community V4 must preserve reduced-motion presentation.');
assert.ok(!/https?:\/\//.test(css),'Community V4 must not introduce remote presentation assets.');

assert.ok(css.includes('.bq-community-boundary')&&css.includes('border-left:4px'),'Community privacy boundary must be structural, not color-only.');
assert.ok(css.includes('.bq-couples-cloud-privacy')&&css.includes('.bq-couples-safety'),'Local/cloud couples safety boundaries must remain visually explicit.');
assert.ok(css.includes('.bq-couples-cloud-danger')&&css.includes('border:2px solid var(--danger'),'Couples unlink must remain structurally destructive.');
assert.ok(css.includes('[data-live-room-connection]')&&css.includes('[data-live-room-code]'),'Live Room connection and room identity states must remain explicit.');
assert.ok(css.includes('[data-live-room-end]')&&css.includes('var(--danger'),'Live Room host end action must remain visibly destructive.');
assert.ok(css.includes('.bq-team-boundary')&&css.includes('.bq-team-danger'),'Team role boundary and destructive management must remain explicit.');
assert.ok(css.includes('grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr)'),'Wide media surfaces must use intentional browse/player composition.');
assert.ok(css.includes('.bq-media-player-shell')&&css.includes('.bq-recording-player-shell'),'Both media owners must receive the V4 player composition.');

const hooks={
  'src/features/community/index.js':['data-community-view','data-community-route','data-community-retry'],
  'src/features/couples-family/index.js':['data-couples-view','data-couples-mode','data-couples-reader'],
  'src/features/couples-cloud/index.js':['data-couples-cloud-view','data-couple-cloud-create','data-couple-cloud-leave'],
  'src/features/journey-groups/index.js':['data-journey-groups-view','data-journey-groups-join','data-journey-groups-create'],
  'src/features/team-center/index.js':['data-team-center-view','data-team-create','data-team-archive'],
  'src/features/live-rooms/index.js':['data-live-rooms-view','data-live-room-create','data-live-room-join','data-live-room-end'],
  'src/features/media-library/index.js':['data-media-library-page','data-media-open','data-media-play','data-media-stop'],
  'src/features/recordings/index.js':['data-recordings-page','data-recording-select','data-recording-play','data-recording-stop'],
  'src/features/congregation-recognition/index.js':['data-recognition-view','data-recognition-award','data-recognition-leaderboards'],
  'src/features/leaderboards/index.js':['data-leaderboards-view','data-leaderboard-period','data-leaderboard-lane'],
  'src/features/encouragements/index.js':['data-encouragements-view','data-send-encouragement','data-encouragements-back']
};
for(const [relative,required] of Object.entries(hooks)){
  const source=fs.readFileSync(path.join(root,relative),'utf8');
  for(const hook of required)assert.ok(source.includes(hook),`${relative} must preserve ${hook}.`);
}

console.log('BibleQuest v4 Community / Relational family static presentation contract passed.');
