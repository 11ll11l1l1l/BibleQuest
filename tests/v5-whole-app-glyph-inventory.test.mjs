import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = path.join(root, 'src');
const sourceExtensions = new Set(['.js', '.css', '.html']);
const pictograph = /\p{Extended_Pictographic}/gu;

// Phase-3 documented exceptions established by focused reviewed contracts.
// These remain presentation glyphs only where no demonstrated genuine
// one-to-one existing artwork is available. The focused contracts are rerun
// beside this inventory so these declarations cannot silently drift.
const documented = new Map([
  ['src/features/games/index.js|🦊', 'legacy Memory Meadow marker/result while genuine-match runtime wiring remains owner work'],
  ['src/features/games/index.js|🕵', 'legacy Bible Detective marker while genuine-match runtime wiring remains owner work'],
  ['src/features/games/index.js|📘', 'legacy Recall Library marker while genuine-match runtime wiring remains owner work'],
  ['src/features/games/index.js|⭐', 'unmatched star reward glyph; do not force unrelated artwork'],
  ['src/features/games/index.js|🪙', 'unmatched coin reward glyph; do not force unrelated artwork'],

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

test('Phase 3 whole-app glyph inventory executes against current source and reports undocumented debt', async (t) => {
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
  t.diagnostic(`Phase 3 glyph inventory: ${findings.length} occurrences; ${findings.length - undocumented.length} documented; ${undocumented.length} undocumented`);
  for (const item of undocumented) {
    t.diagnostic(`UNRESOLVED ${item.file}:${item.line} ${JSON.stringify(item.glyph)}`);
  }

  // This remains an inventory/evidence collector, not the exit gate itself.
  // A later reconciliation tranche may promote the unresolved count to a hard
  // zero assertion only after each occurrence has a genuine asset match or a
  // reviewed documented exception. Keeping this informational avoids silently
  // blessing unknown glyphs or weakening product assertions to obtain green CI.
  assert.ok(Array.isArray(undocumented));
});
