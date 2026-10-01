import { createHash } from 'node:crypto';

import { validateChapterAlignment } from '../src/v6/reader/audio-alignment.ts';

const SHA256 = /^[a-f0-9]{64}$/i;
const GIT_REVISION = /^[a-f0-9]{40}$/i;
const EXPECTED_BSB_CHAPTERS = 1189;

function fail(message) {
  throw new Error(message);
}

function nonBlank(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function chapterKey(row) {
  return String(row?.book ?? '').toUpperCase() + '-' + Number(row?.chapter);
}

function sortedChapters(chapters) {
  return [...chapters].sort((left, right) => {
    const book = String(left?.book ?? '').localeCompare(String(right?.book ?? ''));
    return book || Number(left?.chapter) - Number(right?.chapter);
  });
}

function inventoryDigest(input) {
  const header = [
    'bsb',
    input.audioContentVersion,
    input.scriptureContentVersion,
    input.alignmentSource,
    input.alignmentRevision,
    input.complete ? 'complete' : 'partial',
  ].join('|');
  const rows = input.chapters.map(row => [
    String(row.book).toUpperCase(),
    row.chapter,
    row.durationSeconds,
    row.verses.map(verse => String(verse.verse) + '@' + verse.startSeconds + '-' + verse.endSeconds).join(','),
  ].join('|'));
  return createHash('sha256').update([header, ...rows].join('\n')).digest('hex');
}

export function buildBsbAlignmentManifest({
  alignments,
  metadata,
  scriptureContentVersion,
  complete = false,
}) {
  if (!metadata || metadata.translationId !== 'bsb') fail('BSB alignment manifest requires translationId "bsb".');
  for (const key of ['source', 'license', 'alignmentSource', 'alignmentRevision', 'contentVersion']) {
    if (!nonBlank(metadata[key])) fail('BSB alignment manifest requires ' + key + '.');
  }
  const revision = metadata.alignmentRevision.trim().toLowerCase();
  if (!GIT_REVISION.test(revision)) fail('BSB alignment manifest requires an immutable 40-hex alignment revision.');
  if (!nonBlank(scriptureContentVersion)) fail('BSB alignment manifest requires the current Scripture content version.');
  if (!Array.isArray(alignments) || alignments.length === 0) fail('BSB alignment manifest requires chapter timings.');
  if (typeof complete !== 'boolean') fail('BSB alignment manifest completeness must be boolean.');

  const alignmentSource = metadata.alignmentSource.trim() + '@' + revision;
  const chapters = sortedChapters(alignments);
  const seen = new Set();
  let verseCount = 0;
  for (const row of chapters) {
    const key = chapterKey(row);
    if (seen.has(key)) fail('BSB alignment manifest duplicates ' + key + '.');
    seen.add(key);
    if (row.translationId !== 'bsb'
      || row.contentVersion !== metadata.contentVersion
      || row.scriptureContentVersion !== scriptureContentVersion
      || row.alignmentSource !== alignmentSource
      || row.source !== metadata.source
      || row.license !== metadata.license) {
      fail('BSB alignment manifest provenance mismatch for ' + key + '.');
    }
    const validation = validateChapterAlignment(row, {
      translationId: 'bsb',
      book: String(row.book ?? '').toUpperCase(),
      chapter: Number(row.chapter),
    });
    if (!validation.valid) fail('BSB alignment manifest contains invalid timing for ' + key + ': ' + validation.issues.join('; ') + '.');
    verseCount += row.verses.length;
  }
  if (complete && chapters.length !== EXPECTED_BSB_CHAPTERS) {
    fail('Complete BSB alignment manifest requires all ' + EXPECTED_BSB_CHAPTERS + ' chapters.');
  }

  const inventorySha256 = inventoryDigest({
    audioContentVersion: metadata.contentVersion,
    scriptureContentVersion,
    alignmentSource,
    alignmentRevision: revision,
    complete,
    chapters,
  });
  return Object.freeze({
    schemaVersion: 1,
    translationId: 'bsb',
    alignmentContentVersion: 'sha256-' + inventorySha256,
    audioContentVersion: metadata.contentVersion,
    scriptureContentVersion,
    alignmentSource,
    alignmentRevision: revision,
    complete,
    chapterCount: chapters.length,
    verseCount,
    inventorySha256,
    chapters: Object.freeze(chapters),
  });
}

export function validateBsbAlignmentManifest(manifest, expected = {}) {
  const issues = [];
  if (!manifest || typeof manifest !== 'object') return Object.freeze({ valid: false, issues: Object.freeze(['alignment manifest is required']) });
  if (manifest.schemaVersion !== 1) issues.push('unsupported alignment manifest schema');
  if (manifest.translationId !== 'bsb') issues.push('alignment manifest must be BSB');
  if (!nonBlank(manifest.audioContentVersion)) issues.push('audio content version is required');
  if (!nonBlank(manifest.scriptureContentVersion)) issues.push('Scripture content version is required');
  if (!nonBlank(manifest.alignmentSource)) issues.push('alignment source is required');
  if (!GIT_REVISION.test(String(manifest.alignmentRevision ?? ''))) issues.push('immutable alignment revision is required');
  if (typeof manifest.complete !== 'boolean') issues.push('completeness flag is required');
  if (!Array.isArray(manifest.chapters) || manifest.chapters.length === 0) issues.push('chapter timings are required');
  if (!Number.isSafeInteger(manifest.chapterCount) || manifest.chapterCount < 1
    || !Array.isArray(manifest.chapters) || manifest.chapterCount !== manifest.chapters.length) {
    issues.push('chapter count mismatch');
  }
  if (!Number.isSafeInteger(manifest.verseCount) || manifest.verseCount < 1) issues.push('verse count is invalid');
  if (!SHA256.test(String(manifest.inventorySha256 ?? ''))) issues.push('inventory checksum is invalid');
  if (manifest.alignmentContentVersion !== 'sha256-' + String(manifest.inventorySha256 ?? '')) {
    issues.push('alignment content version does not match inventory checksum');
  }
  if (manifest.complete === true && manifest.chapterCount !== EXPECTED_BSB_CHAPTERS) {
    issues.push('complete alignment manifest does not contain all BSB chapters');
  }
  if (expected.requireComplete === true && manifest.complete !== true) issues.push('complete alignment manifest is required');
  if (expected.audioContentVersion && manifest.audioContentVersion !== expected.audioContentVersion) issues.push('audio content version mismatch');
  if (expected.scriptureContentVersion && manifest.scriptureContentVersion !== expected.scriptureContentVersion) issues.push('Scripture content version mismatch');

  if (Array.isArray(manifest.chapters)) {
    const seen = new Set();
    let verseCount = 0;
    for (const row of manifest.chapters) {
      const key = chapterKey(row);
      if (seen.has(key)) issues.push('duplicate chapter ' + key);
      seen.add(key);
      if (row?.translationId !== 'bsb'
        || row?.contentVersion !== manifest.audioContentVersion
        || row?.scriptureContentVersion !== manifest.scriptureContentVersion
        || row?.alignmentSource !== manifest.alignmentSource) {
        issues.push('chapter provenance mismatch for ' + key);
      }
      const validation = validateChapterAlignment(row, {
        translationId: 'bsb',
        book: String(row?.book ?? '').toUpperCase(),
        chapter: Number(row?.chapter),
      });
      if (!validation.valid) issues.push('invalid chapter timing for ' + key);
      if (Array.isArray(row?.verses)) verseCount += row.verses.length;
    }
    if (Number.isSafeInteger(manifest.verseCount) && verseCount !== manifest.verseCount) issues.push('verse count mismatch');
    if (issues.length === 0 || SHA256.test(String(manifest.inventorySha256 ?? ''))) {
      const digest = inventoryDigest({
        audioContentVersion: manifest.audioContentVersion,
        scriptureContentVersion: manifest.scriptureContentVersion,
        alignmentSource: manifest.alignmentSource,
        alignmentRevision: manifest.alignmentRevision,
        complete: manifest.complete,
        chapters: sortedChapters(manifest.chapters),
      });
      if (digest !== manifest.inventorySha256) issues.push('alignment inventory checksum mismatch');
    }
  }

  return Object.freeze({ valid: issues.length === 0, issues: Object.freeze(issues) });
}
