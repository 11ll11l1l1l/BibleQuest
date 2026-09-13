import assert from 'node:assert/strict';
import fs from 'node:fs';

const notificationPath='src/features/notification-center/index.js';
const encouragementPath='src/features/encouragements/index.js';
const presetPath='src/app/encouragements.js';
const notification=fs.readFileSync(notificationPath,'utf8');
const encouragement=fs.readFileSync(encouragementPath,'utf8');
const presets=fs.readFileSync(presetPath,'utf8');

const notificationArtwork={
  assignment:'assets/v4/ministry-more/assignments.png',
  encouragement:'assets/v4/community/encouragements.png',
  award:'assets/v4/community/recognition.png',
  info:'assets/v4/ministry-more/notification-center.png'
};
for(const [type,path] of Object.entries(notificationArtwork)){
  assert.ok(fs.existsSync(path),`notification artwork exists for ${type}: ${path}`);
  assert.match(notification,new RegExp(`${type}:'/${path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'`),`notification ${type} is wired to its matching artwork`);
}
assert.match(notification,/notificationIconHtml\(item\.type\)/,'notification rows use the artwork-aware icon renderer');
assert.match(notification,/alt=\\?"\\?"/,'notification artwork stays decorative so title/body remain the accessible name');
for(const [type,emoji] of Object.entries({feedback:'💬',devotional:'📖',announcement:'📣',activity:'🧭',poll:'📊',media:'🎬'})){
  assert.match(notification,new RegExp(`${type}:'${emoji}'`),`unmatched notification ${type} keeps its truthful emoji exception`);
}

const encouragementArtwork={
  pray:'assets/v4/community/prayer-circle.png',
  heart:'assets/v4/community/encouragements.png'
};
for(const [kind,path] of Object.entries(encouragementArtwork)){
  assert.ok(fs.existsSync(path),`encouragement artwork exists for ${kind}: ${path}`);
  assert.match(encouragement,new RegExp(`${kind}:'/${path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'`),`encouragement ${kind} is wired to matching artwork`);
}
assert.match(encouragement,/encouragementIcon\(kind,preset\.emoji\)/,'preset controls use the artwork-aware icon renderer');
assert.match(encouragement,/encouragementIcon\(item\.kind,item\.emoji,20\)/,'feed rows use the same artwork-aware renderer');
assert.match(encouragement,/alt=\\?"\\?"/,'encouragement artwork is decorative and labels stay independent');
for(const [kind,emoji] of Object.entries({cheer:'👏',word:'📖',flame:'🔥'})){
  assert.match(presets,new RegExp(`${kind}:Object\\.freeze\\(\\{emoji:'${emoji}'`),`unmatched encouragement ${kind} remains a documented emoji-backed domain preset`);
}

console.log('v5 notification/encouragement artwork verification: PASS');
