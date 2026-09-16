import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentPath = path.join(root, 'src/features/story-journey/content.js');
const expected = new Map([
  ['s1', ['David & Goliath', '🪨', '1 Samuel 17']],
  ['s2', ['The Good Samaritan', '🫶', 'Luke 10:25–37']],
  ['s3', ['Daniel’s Choice', '🦁', 'Daniel 6']],
  ['s4', ['Joseph Chooses Integrity', '🌾', 'Genesis 39']],
  ['s5', ['Ruth Stays', '🌾', 'Ruth 1–4']],
  ['s6', ['Elijah on Mount Carmel', '🔥', '1 Kings 18']],
  ['s7', ['Esther Risks the Audience', '👑', 'Esther 4–7']],
  ['s8', ['Peter Learns About Outsiders', '🌍', 'Acts 10']],
  ['s9', ['Paul and Silas in Philippi', '⛓️', 'Acts 16']],
  ['s10', ['Jesus Washes the Disciples’ Feet', '🫧', 'John 13']],
]);

test('Story Journey reviewed glyph set remains bounded and text-independent', async () => {
  const mod = await import(`${pathToFileURL(contentPath).href}?v5-story-art=${Date.now()}`);
  assert.equal(mod.STORY_JOURNEYS.length, expected.size);

  for (const story of mod.STORY_JOURNEYS) {
    const review = expected.get(story.id);
    assert.ok(review, `unexpected Story Journey id ${story.id}`);
    assert.equal(story.title, review[0]);
    assert.equal(story.emoji, review[1]);
    assert.equal(story.book, review[2]);
    assert.ok(story.title.trim().length > 0, `${story.id} needs an independent visible title`);
    assert.ok(story.book.trim().length > 0, `${story.id} needs an independent passage label`);
    assert.ok(story.checkpoint.reference.trim().length > 0, `${story.id} needs an independent Scripture reference`);
    assert.ok(!story.title.includes(story.emoji), `${story.id} title must not depend on decorative glyph`);
    assert.ok(!story.book.includes(story.emoji), `${story.id} passage label must not depend on decorative glyph`);
  }
});

test('Story Journey glyphs are content identity tokens, not hidden Scripture-reference semantics', async () => {
  const source = await readFile(contentPath, 'utf8');
  for (const [id, [title, glyph, book]] of expected) {
    assert.match(source, new RegExp(`\\['${id}','${title.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}'`));
    assert.ok(source.includes(`'${glyph}'`), `${id} reviewed glyph missing`);
    assert.ok(source.includes(`'${book}'`), `${id} visible passage label missing`);
  }
  assert.match(source, /return Object\.freeze\(\{\s*id,title,emoji,book,/s);
});
