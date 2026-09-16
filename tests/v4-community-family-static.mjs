// BibleQuest V4 Community / Relational family presentation contract.
// Frozen relational owners remain byte-exact. Three later accepted V5 evolutions
// are intentionally verified by behavior instead of the obsolete V4 byte lock:
// Community EN/TL localization and retirement of the duplicate Media Library
// owner in favor of canonical Recordings, plus reviewed Encouragement artwork.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');
const baselineSha='7b2abd7507adf5b7363fe068d5038f54d1c7263a';
const preserved=[
  'src/features/couples-cloud/index.js',
  'src/features/journey-groups/index.js',
  'src/features/team-center/index.js',
  'src/features/live-rooms/index.js',
  'src/features/leaderboards/index.js'
];

for(const relative of preserved){
  const current=fs.readFileSync(path.join(root,relative),'utf8');
  const baseline=execFileSync('git',['show',`${baselineSha}:${relative}`],{cwd:root,encoding:'utf8'});
  assert.equal(current,baseline,`${relative} must remain byte-for-byte unchanged in the frozen relational presentation owners.`);
}

// Community intentionally evolved after the V4 presentation tranche to use the
// accepted V5 localization owner. Preserve its navigation/privacy/data hooks
// instead of requiring obsolete English bytes.
const communitySrc=fs.readFileSync(path.join(root,'src/features/community/index.js'),'utf8');
assert.ok(communitySrc.includes("../../app/localization.js"),'Community must consume the accepted localization owner.');
for(const key of ['community.title','community.summary.aria','community.boundary.heading','community.error.fallback']){
  assert.ok(communitySrc.includes(key),`Community must retain localized key ${key}.`);
}
for(const hook of ['data-community-view','data-community-route','data-community-retry']){
  assert.ok(communitySrc.includes(hook),`Community must preserve ${hook}.`);
}
assert.ok(communitySrc.includes('esc(row.name)')&&communitySrc.includes('esc(row.roleLabel)'),'Community runtime congregation identity/role data must remain escaped rather than translated as authored copy.');
assert.ok(communitySrc.includes('bq-community-boundary'),'Community privacy boundary must remain present after localization.');

// Encouragements intentionally evolved after the V4 presentation tranche to
// use reviewed genuine artwork where an exact semantic match exists. Preserve
// the relational/privacy contract structurally instead of requiring obsolete
// glyph-rendering bytes.
const encouragementServiceSrc=fs.readFileSync(path.join(root,'src/app/encouragements.js'),'utf8');
const encouragementSrc=fs.readFileSync(path.join(root,'src/features/encouragements/index.js'),'utf8');
for(const kind of ['pray','cheer','heart','word','flame']){
  assert.ok(encouragementServiceSrc.includes(`${kind}:Object.freeze`),`Encouragement service must preserve the reviewed ${kind} preset owner.`);
}
assert.ok(encouragementServiceSrc.includes("'BQ_ENCOURAGEMENTS_KIND'"),'Encouragement service must reject unreviewed/custom preset kinds.');
assert.ok(encouragementServiceSrc.includes("'BQ_ENCOURAGEMENTS_PERMISSION'"),'Encouragement service must preserve group-scope authorization.');
for(const hook of ['data-encouragements-view','data-send-encouragement','data-group-id','data-encouragements-back']){
  assert.ok(encouragementSrc.includes(hook),`Encouragement presentation must preserve ${hook}.`);
}
assert.ok(encouragementSrc.includes('esc(group.id)')&&encouragementSrc.includes('esc(group.name)'),'Encouragement group identity and names must remain escaped.');
assert.ok(encouragementSrc.includes('esc(preset.label)')&&encouragementSrc.includes('esc(item.label)'),'Encouragement preset/feed labels must remain escaped and independently visible.');
assert.ok(encouragementSrc.includes('sent.has(kind)')&&encouragementSrc.includes('disabled aria-disabled="true"'),'Encouragement send-once state must remain visibly and accessibly disabled.');
assert.ok(encouragementSrc.includes('data-encouragement-art=')&&encouragementSrc.includes('data-encouragement-glyph='),'Encouragement presentation must retain reviewed artwork and fallback hooks.');
assert.ok(encouragementSrc.includes('alt=""')&&encouragementSrc.includes('aria-hidden="true"'),'Encouragement artwork/fallbacks must remain decorative while text carries meaning.');
assert.ok(encouragementSrc.includes('Encouragements never include private notes, reflections, answers, completion status, rankings, or XP.'),'Encouragement privacy boundary must remain explicit.');

// The duplicate Media Library UI/service was deliberately retired in V5. The
// canonical media route must remain Recordings-owned rather than resurrecting
// the deleted owner merely to satisfy this historical V4 contract.
assert.ok(!fs.existsSync(path.join(root,'src/features/media-library/index.js')),'Retired duplicate Media Library page must not return.');
assert.ok(!fs.existsSync(path.join(root,'src/app/media-library.js')),'Retired duplicate Media Library service must not return.');
const bootstrapSrc=fs.readFileSync(path.join(root,'src/app/bootstrap.js'),'utf8');
assert.ok(/media\s*:\s*\(\)\s*=>\s*recordingsPage/.test(bootstrapSrc),'The media route must remain delegated to the canonical Recordings page.');

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
assert.ok(css.includes('.bq-media-player-shell')&&css.includes('.bq-recording-player-shell'),'Legacy CSS compatibility plus canonical Recordings player composition must remain available.');

const hooks={
  'src/features/couples-family/index.js':['data-couples-view','data-couples-mode','data-couples-reader'],
  'src/features/couples-cloud/index.js':['data-couples-cloud-view','data-couple-cloud-create','data-couple-cloud-leave'],
  'src/features/journey-groups/index.js':['data-journey-groups-view','data-journey-groups-join','data-journey-groups-create'],
  'src/features/team-center/index.js':['data-team-center-view','data-team-create','data-team-archive'],
  'src/features/live-rooms/index.js':['data-live-rooms-view','data-live-room-create','data-live-room-join','data-live-room-end'],
  'src/features/recordings/index.js':['data-recordings-page','data-video-select','data-video-curator-toggle','data-video-add-form'],
  'src/features/congregation-recognition/index.js':['data-recognition-view','data-recognition-award','data-recognition-leaderboards'],
  'src/features/leaderboards/index.js':['data-leaderboards-view','data-leaderboard-period','data-leaderboard-lane'],
  'src/features/encouragements/index.js':['data-encouragements-view','data-send-encouragement','data-encouragements-back']
};
for(const [relative,required] of Object.entries(hooks)){
  const source=fs.readFileSync(path.join(root,relative),'utf8');
  for(const hook of required)assert.ok(source.includes(hook),`${relative} must preserve ${hook}.`);
}

console.log('BibleQuest V4/V5 Community / Relational family static presentation contract passed.');
