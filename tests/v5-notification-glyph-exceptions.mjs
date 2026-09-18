import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source=fs.readFileSync(new URL('../src/features/notification-center/index.js',import.meta.url),'utf8');

const expected=Object.freeze({
  assignment:'📮',
  feedback:'💬',
  devotional:'📖',
  announcement:'📣',
  activity:'🧭',
  encouragement:'💛',
  poll:'📊',
  award:'🏅',
  media:'🎬',
  info:'🔔'
});

test('Notification Center keeps only the reviewed unmatched type glyph inventory',()=>{
  const match=source.match(/const icons=Object\.freeze\(\{([^}]+)\}\);/);
  assert.ok(match,'Notification Center icon inventory must remain explicit');
  const actual=Object.fromEntries([...match[1].matchAll(/([a-z]+):'([^']+)'/g)].map(([,key,glyph])=>[key,glyph]));
  assert.deepEqual(actual,expected,'new or changed notification glyphs require a fresh genuine-match/exception review');
  assert.match(source,/icons\[item\.type\]\|\|'🔔'/,'unknown notification types must retain the reviewed info/bell fallback');
});

test('decorative notification glyphs remain accessibility-independent',()=>{
  assert.match(source,/class="notification-center-icon"[^>]*aria-hidden="true"/,'notification glyph must remain hidden from assistive technology');
  assert.match(source,/<h3>\$\{escapeHtml\(item\.title\)\}<\/h3>/,'notification title must remain visible independent of its glyph');
  assert.match(source,/<small>\$\{escapeHtml\(relativeTime\(item\.createdAt\)\)\} · \$\{escapeHtml\(item\.type\)\}<\/small>/,'notification type text must remain visible independent of its glyph');
});
