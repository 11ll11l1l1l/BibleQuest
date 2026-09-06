import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const owner=read('owner-delete-control.js');
const media=read('media-library.js');
const mediaCss=read('media-library.css');

assert.match(owner,/bq-admin-ops/,'Owner deletion must call the deployed privileged admin-ops endpoint');
assert.match(owner,/targetUserId:id/,'Owner deletion must target the selected account, never infer from display text');
assert.match(owner,/id===self/,'Signed-in Owner self-delete guard must remain explicit');
assert.match(owner,/data-owner-delete-confirm/,'Permanent deletion must require in-app typed confirmation');
assert.match(owner,/Account deletion timed out/,'Owner deletion must fail visibly instead of hanging forever');
assert.doesNotMatch(owner,/prompt\(`Permanently delete/,'Owner deletion must not rely on a blocking browser prompt');

assert.match(media,/loadingView\(\)/,'Live Recordings must render immediate loading feedback before network work');
assert.match(media,/Live Recordings took too long to load/,'Live Recordings must have a bounded loading timeout');
assert.match(media,/i\.ytimg\.com\/vi/,'YouTube thumbnails must be derived from the live recording id');
assert.match(media,/target="_blank" rel="noopener noreferrer"/,'Recordings must open safely outside BibleQuest');
assert.doesNotMatch(media,/youtube-nocookie\.com\/embed/,'Live Recordings must not embed a heavy YouTube player inside BibleQuest');
assert.doesNotMatch(media,/<iframe/,'Live Recordings must not inject iframes that can stall the app shell');
assert.match(media,/\.eq\('active',true\)/,'Archived recordings must stay hidden');
assert.match(media,/\.lte\('publish_at',now\)/,'Future recordings must stay hidden until published');
assert.match(mediaCss,/body\.media-open\{overflow:hidden\}/,'Media scroll lock must be class-based and reversible');

console.log('Owner delete + Live Recordings static smoke passed.');