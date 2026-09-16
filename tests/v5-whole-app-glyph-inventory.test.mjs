import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src');
const sourceExtensions = new Set(['.js', '.css', '.html']);
const pictograph = /\p{Extended_Pictographic}/gu;

// Phase-3 documented sources/exceptions established by focused reviewed
// contracts. A documented source is either (a) a legacy/state token whose
// normal presentation is already replaced by a genuine exact asset, or (b) a
// reviewed semantic/text fallback for which forcing unrelated artwork would be
// incorrect. Focused contracts are rerun beside this collector so entries
// cannot silently drift into unreviewed debt forgiveness.
const documented = new Map([
  ['src/features/games/index.js|🦊', 'Memory Meadow HUD/result legacy token is decorative; exact Memory artwork is the normal visual presentation'],
  ['src/features/games/index.js|🕵', 'Bible Detective legacy token is aria-hidden/font-hidden under the exact Character Detective asset'],
  ['src/features/games/index.js|📘', 'Recall Library legacy token is aria-hidden/font-hidden under the exact Recall Deck asset'],
  ['src/features/games/index.js|⭐', 'reviewed Memory reward currency label; exact reward-star art is also present and visible text names stars'],
  ['src/features/games/index.js|🪙', 'reviewed Memory reward currency label; exact reward-coin art is also present and visible text names coins'],
  ['src/features/games/index.js|📖', 'reviewed textual Scripture-reference marker; final Games art contract explicitly preserves it as semantic text rather than placeholder chrome'],
  ['src/features/games/index.js|🧠', 'Recall question legacy token is aria-hidden/font-hidden under the exact Recall Deck asset'],
  ['src/features/games/index.js|🗃', 'Recall completion legacy token is aria-hidden/font-hidden under the exact Recall Deck asset'],
  ['src/features/games/index.js|🏆', 'round-result fallback token is hidden under the exact winner-trophy art in normal presentation; score/result text remains independent'],
  ['src/features/games/index.js|🌟', 'round-result fallback token is hidden under the exact winner-trophy art in normal presentation; score/result text remains independent'],
  ['src/features/games/index.js|🌱', 'round-result fallback token is hidden under the exact winner-trophy art in normal presentation; score/result text remains independent'],

  ['src/features/games/memory.js|🦊', 'Memory state identity; visual card face is exact memory-fox.png'],
  ['src/features/games/memory.js|🐼', 'Memory state identity; visual card face is exact memory-panda.png'],
  ['src/features/games/memory.js|🐸', 'Memory state identity; visual card face is exact memory-frog.png'],
  ['src/features/games/memory.js|🐵', 'Memory state identity; visual card face is exact memory-monkey.png'],
  ['src/features/games/memory.js|🦁', 'Memory state identity; visual card face is exact memory-lion.png'],
  ['src/features/games/memory.js|🐰', 'Memory state identity; visual card face is exact memory-rabbit.png'],
  ['src/features/games/memory.js|🐯', 'Memory state identity; visual card face is exact memory-tiger.png'],
  ['src/features/games/memory.js|🐨', 'Memory state identity; visual card face is exact memory-koala.png'],

  ['src/ui/games-art-final-v4.css|📖', 'documentation comment for reviewed semantic Scripture-reference exception; no rendered CSS content'],
  ['src/ui/games-art-final-v4.css|⭐', 'documentation comment for reviewed star currency label; exact reward art is separately wired'],
  ['src/ui/games-art-final-v4.css|🪙', 'documentation comment for reviewed coin currency label; exact reward art is separately wired'],

  ['src/ui/v4-custom-art.css|🦊', 'CSS selector token maps Memory state identity to exact memory-fox.png'],
  ['src/ui/v4-custom-art.css|🐼', 'CSS selector token maps Memory state identity to exact memory-panda.png'],
  ['src/ui/v4-custom-art.css|🐸', 'CSS selector token maps Memory state identity to exact memory-frog.png'],
  ['src/ui/v4-custom-art.css|🐵', 'CSS selector token maps Memory state identity to exact memory-monkey.png'],
  ['src/ui/v4-custom-art.css|🦁', 'CSS selector token maps Memory state identity to exact memory-lion.png'],
  ['src/ui/v4-custom-art.css|🐰', 'CSS selector token maps Memory state identity to exact memory-rabbit.png'],
  ['src/ui/v4-custom-art.css|🐯', 'CSS selector token maps Memory state identity to exact memory-tiger.png'],
  ['src/ui/v4-custom-art.css|🐨', 'CSS selector token maps Memory state identity to exact memory-koala.png'],

  ['src/features/notification-center/index.js|📮', 'reviewed unmatched Notification assignment glyph; decorative and text-independent'],
  ['src/features/notification-center/index.js|💬', 'reviewed unmatched Notification feedback glyph; decorative and text-independent'],
  ['src/features/notification-center/index.js|📖', 'reviewed unmatched Notification devotional glyph; decorative and text-independent'],
  ['src/features/notification-center/index.js|📣', 'reviewed unmatched Notification announcement glyph; decorative and text-independent'],
  ['src/features/notification-center/index.js|🧭', 'reviewed unmatched Notification activity glyph; decorative and text-independent'],
  ['src/features/notification-center/index.js|💛', 'reviewed unmatched Notification encouragement glyph; decorative and text-independent'],
  ['src/features/notification-center/index.js|📊', 'reviewed unmatched Notification poll glyph; decorative and text-independent'],
  ['src/features/notification-center/index.js|🏅', 'reviewed unmatched Notification award glyph; decorative and text-independent'],
  ['src/features/notification-center/index.js|🎬', 'reviewed unmatched Notification media glyph; decorative and text-independent'],
  ['src/features/notification-center/index.js|🔔', 'reviewed unmatched Notification info/fallback glyph; decorative and text-independent'],

  ['src/app/encouragements.js|🙏', 'reviewed unmatched Encouragement prayer preset glyph with independent text label'],
  ['src/app/encouragements.js|👏', 'reviewed unmatched Encouragement cheer preset glyph with independent text label'],
  ['src/app/encouragements.js|💛', 'reviewed unmatched Encouragement heart preset glyph with independent text label'],
  ['src/app/encouragements.js|📖', 'reviewed unmatched Encouragement Word preset glyph with independent text label'],
  ['src/app/encouragements.js|🔥', 'reviewed unmatched Encouragement consistency preset glyph with independent text label'],

  ['src/app/congregation-recognition.js|🔥', 'reviewed Recognition consistency source; runtime uses genuine streak artwork and visible text carries meaning'],
  ['src/app/congregation-recognition.js|📖', 'reviewed Recognition Scripture Explorer source; runtime uses genuine chapter artwork and visible text carries meaning'],
  ['src/app/congregation-recognition.js|💛', 'reviewed unmatched Recognition encourager source; decorative fallback remains beside independent text'],
  ['src/app/congregation-recognition.js|🗺', 'reviewed unmatched Recognition journey-finisher source; decorative fallback remains beside independent text'],
  ['src/app/congregation-recognition.js|🌱', 'reviewed Recognition comeback source; runtime uses genuine growth artwork and visible text carries meaning'],
  ['src/app/congregation-recognition.js|🤝', 'reviewed unmatched Recognition group-helper source; decorative fallback remains beside independent text'],
  ['src/app/congregation-recognition.js|💭', 'reviewed unmatched Recognition reflection source; decorative fallback remains beside independent text'],
  ['src/app/congregation-recognition.js|📈', 'reviewed Recognition most-improved source; runtime uses genuine progress artwork and visible text carries meaning'],
  ['src/app/congregation-recognition.js|🏅', 'reviewed Recognition badge source/default; pastor-recognition maps to genuine badge artwork and generic fallback remains decorative beside text'],
  ['src/app/congregation-recognition.js|🎖', 'reviewed dynamic earned-badge fallback; decorative only beside the visible badge name'],

  ['src/content/couples-family.js|✝', 'reviewed Couples Christ category source; normal presentation uses genuine mini-cross artwork and visible text remains independent'],
  ['src/content/couples-family.js|👂', 'reviewed unmatched Couples communication category glyph; decorative fallback remains beside independent text'],
  ['src/content/couples-family.js|🕊', 'reviewed unmatched Couples repair category glyph; decorative fallback remains beside independent text'],
  ['src/content/couples-family.js|💛', 'reviewed unmatched Couples gratitude category glyph; decorative fallback remains beside independent text'],
  ['src/content/couples-family.js|🏠', 'reviewed unmatched Couples stewardship category glyph; decorative fallback remains beside independent text'],
  ['src/content/couples-family.js|🤍', 'reviewed unmatched Couples intimacy category glyph; decorative fallback remains beside independent text'],
  ['src/content/couples-family.js|🌱', 'reviewed unmatched Couples family category glyph; decorative fallback remains beside independent text'],
  ['src/content/couples-family.js|🧭', 'reviewed unmatched Couples mission category glyph; decorative fallback remains beside independent text'],

  ['src/features/couples-cloud/index.js|🙏', 'reviewed Couple Cloud prayer source; normal presentation uses genuine prayer-circle artwork and visible text remains independent'],
  ['src/features/couples-cloud/index.js|👂', 'reviewed unmatched Couple Cloud listening glyph; decorative fallback remains beside independent text'],
  ['src/features/couples-cloud/index.js|💛', 'reviewed unmatched Couple Cloud gratitude glyph; decorative fallback remains beside independent text'],
  ['src/features/couples-cloud/index.js|🕊', 'reviewed unmatched Couple Cloud repair glyph; decorative fallback remains beside independent text'],
  ['src/features/couples-cloud/index.js|🏠', 'reviewed unmatched Couple Cloud home glyph; decorative fallback remains beside independent text'],
  ['src/features/couples-cloud/index.js|🤝', 'reviewed unmatched Couple Cloud service glyph; decorative fallback remains beside independent text'],
  ['src/features/couples-cloud/index.js|✝', 'reviewed Couple Cloud Christ source; normal presentation uses genuine mini-cross artwork and visible text remains independent'],
  ['src/features/couples-cloud/index.js|🔗', 'reviewed pairing utility glyph; Create pair code text carries the action meaning independently'],
  ['src/features/couples-cloud/index.js|🏁', 'reviewed challenge-history glyph; challenge title, day, and section heading carry the meaning independently'],

  ['src/features/couples-family/index.js|🧭', 'reviewed unmatched Couples journey glyph; decorative fallback remains beside independent text'],
  ['src/features/couples-family/index.js|💬', 'reviewed unmatched Couples card glyph; decorative fallback remains beside independent text'],
  ['src/features/couples-family/index.js|👂', 'reviewed unmatched Couples listening glyph; decorative fallback remains beside independent text'],
  ['src/features/couples-family/index.js|🌡', 'reviewed unmatched Couples check-in glyph; decorative fallback remains beside independent text'],
  ['src/features/couples-family/index.js|🕊', 'reviewed unmatched Couples repair glyph; decorative fallback remains beside independent text'],
  ['src/features/couples-family/index.js|✝', 'reviewed Couples Christ source; normal presentation uses genuine mini-cross artwork and visible text remains independent'],
  ['src/features/couples-family/index.js|✨', 'reviewed Couples date-night source; normal presentation uses genuine sparkle artwork and visible text remains independent'],
  ['src/features/couples-family/index.js|💞', 'reviewed generic card fallback glyph; visible card label/title carries meaning independently'],
  ['src/features/couples-family/index.js|📖', 'reviewed Scripture-reference marker; visible reference and Reader action carry meaning independently'],
  ['src/features/couples-family/index.js|📱', 'reviewed pass-the-phone instruction glyph; visible Pass the phone heading/instructions carry meaning independently'],

  ['src/engines/avatar-vault.js|🌱', 'Avatar Vault starter state token; current presentation uses exact starter sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|🌸', 'Avatar Vault sakura state token; current presentation uses exact sakura sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|🏮', 'Avatar Vault lantern state token; current presentation uses exact lantern sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|🔥', 'Avatar Vault flame state token; current presentation uses exact flame sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|👑', 'Avatar Vault crown state token; current presentation uses exact crown sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|🎓', 'Avatar Vault scholar state token; current presentation uses exact scholar sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|📜', 'Avatar Vault scroll state token; current presentation uses exact scroll sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|🐑', 'Avatar Vault shepherd state token; current presentation uses exact shepherd sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|💞', 'Avatar Vault couple state token; current presentation uses exact couple sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|⛪', 'Avatar Vault community state token; current presentation uses exact community sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|🌏', 'Avatar Vault world state token; current presentation uses exact world sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|🦊', 'Avatar Vault kitsune state token; current presentation uses exact kitsune sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|🌙', 'Avatar Vault moon state token; current presentation uses exact moon sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|🗻', 'Avatar Vault fuji state token; current presentation uses exact fuji sprite artwork and independent visible style name'],
  ['src/engines/avatar-vault.js|🍵', 'Avatar Vault tea state token; current presentation uses exact tea sprite artwork and independent visible style name'],

  ['src/app/bible-world.js|🌍', 'Bible World Creation state token; normal presentation uses exact world-creation.png artwork with independent visible title/books/progress text'],
  ['src/app/bible-world.js|🏕', 'Bible World Patriarchs state token; normal presentation uses exact world-patriarchs.png artwork with independent visible title/books/progress text'],
  ['src/app/bible-world.js|🌊', 'Bible World Exodus state token; normal presentation uses exact world-exodus.png artwork with independent visible title/books/progress text'],
  ['src/app/bible-world.js|🏰', 'Bible World Kingdom state token; normal presentation uses exact world-kingdom.png artwork with independent visible title/books/progress text'],
  ['src/app/bible-world.js|🎵', 'Bible World Wisdom state token; normal presentation uses exact world-wisdom.png artwork with independent visible title/books/progress text'],
  ['src/app/bible-world.js|📜', 'Bible World Prophets state token; normal presentation uses exact world-prophets.png artwork with independent visible title/books/progress text'],
  ['src/app/bible-world.js|✝', 'Bible World Gospels state token; normal presentation uses exact world-gospels.png artwork with independent visible title/books/progress text'],
  ['src/app/bible-world.js|🔥', 'Bible World Early Church state token; normal presentation uses exact world-early-church.png artwork with independent visible title/books/progress text'],
  ['src/app/bible-world.js|✉', 'Bible World Letters state token; normal presentation uses exact world-letters.png artwork with independent visible title/books/progress text'],

  ['src/core/bible.js|©', 'required translation copyright attribution text; preserved verbatim rather than replaced by artwork'],
  ['src/core/bible.js|®', 'required registered-trademark attribution text; preserved verbatim rather than replaced by artwork'],
  ['src/core/bible.js|™', 'required trademark attribution text; preserved verbatim rather than replaced by artwork'],

  ['src/features/story-journey/content.js|🪨', 'reviewed Story Journey content-identity glyph; independent story title, passage label, and checkpoint Scripture reference carry meaning'],
  ['src/features/story-journey/content.js|🫶', 'reviewed Story Journey content-identity glyph; independent story title, passage label, and checkpoint Scripture reference carry meaning'],
  ['src/features/story-journey/content.js|🦁', 'reviewed Story Journey content-identity glyph; independent story title, passage label, and checkpoint Scripture reference carry meaning'],
  ['src/features/story-journey/content.js|🌾', 'reviewed Story Journey content-identity glyph used by two stories; each has independent title, passage label, and checkpoint Scripture reference'],
  ['src/features/story-journey/content.js|🔥', 'reviewed Story Journey content-identity glyph; independent story title, passage label, and checkpoint Scripture reference carry meaning'],
  ['src/features/story-journey/content.js|👑', 'reviewed Story Journey content-identity glyph; independent story title, passage label, and checkpoint Scripture reference carry meaning'],
  ['src/features/story-journey/content.js|🌍', 'reviewed Story Journey content-identity glyph; independent story title, passage label, and checkpoint Scripture reference carry meaning'],
  ['src/features/story-journey/content.js|⛓', 'reviewed Story Journey content-identity glyph; independent story title, passage label, and checkpoint Scripture reference carry meaning'],
  ['src/features/story-journey/content.js|🫧', 'reviewed Story Journey content-identity glyph; independent story title, passage label, and checkpoint Scripture reference carry meaning'],
]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (sourceExtensions.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

test('Phase 3 whole-app glyph inventory rejects undocumented source glyphs', async (t) => {
  const files = await walk(sourceRoot);
  assert.ok(files.length > 0, 'expected current src tree to contain scannable source files');

  const findings = [];
  for (const file of files) {
    const rel = relative(file);
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    lines.forEach((line, index) => {
      const glyphs = [...line.matchAll(pictograph)].map((match) => match[0]);
      for (const glyph of new Set(glyphs)) {
        const key = `${rel}|${glyph}`;
        findings.push({
          file: rel,
          line: index + 1,
          glyph,
          documented: documented.has(key),
          reason: documented.get(key) || null,
        });
      }
    });
  }

  const undocumented = findings.filter((item) => !item.documented);
  const diagnosticsPath = process.env.V5_GLYPH_DIAGNOSTICS_PATH;
  if (diagnosticsPath) {
    await writeFile(path.resolve(root, diagnosticsPath), `${JSON.stringify({
      candidate: process.env.V5_GLYPH_CANDIDATE || null,
      total: findings.length,
      documented: findings.length - undocumented.length,
      undocumented: undocumented.length,
      unresolved: undocumented,
    }, null, 2)}\n`, 'utf8');
  }

  t.diagnostic(`Phase 3 glyph inventory: ${findings.length} occurrences; ${findings.length - undocumented.length} documented; ${undocumented.length} undocumented`);
  for (const item of undocumented) {
    t.diagnostic(`UNRESOLVED ${item.file}:${item.line} ${JSON.stringify(item.glyph)}`);
  }

  assert.deepEqual(
    undocumented,
    [],
    'Phase 3 hard-zero gate: every source glyph must have a genuine asset mapping or a focused reviewed exception'
  );
});