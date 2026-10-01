import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { buildAudioIngestManifest, inspectAudioIngestStaging } from '../../scripts/v6-audio-ingest-manifest.mjs';

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'bq-v6-audio-'));
  const source = {
    translationId: 'bsb', source: 'Licensed fixture audio', sourceUrl: 'https://source.example/audio',
    license: 'Fixture CC0 record', attribution: 'Narrator attribution', rights: 'verified',
    delivery: 'downloadable', offlineCopy: 'allowed', textAlignment: 'exact', rightsEvidence: 'https://source.example/license',
    alignmentSource: 'fixture timing export', reviewedBy: 'content reviewer', reviewedAt: '2026-09-28T00:00:00Z',
    contentVersion: 'bsb-audio-1',
    scriptureContentVersion: 'sha256-fixture-scripture-1',
    encoding: { purpose: 'speech', codec: 'mp3', bitrateKbps: 64, channels: 1, sampleRateHz: 44_100 },
    encodingEvidence: 'fixture transcode/probe evidence',
  };
  const alignment = {
    schemaVersion: 1, translationId: 'bsb', contentVersion: source.contentVersion, scriptureContentVersion: source.scriptureContentVersion, book: 'GEN', chapter: 1, durationSeconds: 60,
    source: source.source, license: source.license, alignmentSource: source.alignmentSource,
    verses: [{ verse: 1, startSeconds: 0, endSeconds: 20 }, { verse: 2, startSeconds: 20, endSeconds: 60 }],
  };
  await writeFile(join(directory, 'source.json'), JSON.stringify(source));
  await writeFile(join(directory, 'alignments.json'), JSON.stringify([alignment]));
  await writeFile(join(directory, 'GEN-1.mp3'), new Uint8Array([1, 2, 3, 4]));
  return { directory, alignment, source };
}

test('audio ingest builds deterministic chapter hashes and checked R2 inventory', async () => {
  const { directory } = await fixture();
  try {
    const result = await buildAudioIngestManifest({ inputDirectory: directory, publicBaseUrl: 'https://audio.example/bible' });
    assert.equal(result.translationId, 'bsb');
    assert.equal(result.totalBytes, 4);
    assert.equal(result.segments[0].id, 'GEN-1');
    assert.equal(result.segments[0].sha256, '9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a');
    assert.equal(result.segments[0].url, 'https://audio.example/bible/bsb-audio-1/GEN-1.mp3');
    assert.equal(result.alignments[0].chapter, 1);
    assert.equal(result.source.scriptureContentVersion, 'sha256-fixture-scripture-1');
    assert.deepEqual(result.source.encoding, {
      purpose: 'speech', codec: 'mp3', bitrateKbps: 64, channels: 1, sampleRateHz: 44_100,
      evidence: 'fixture transcode/probe evidence',
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('audio ingest accepts OpenBible Hays filenames and maps them to canonical Reader chapter identities', async () => {
  const { directory } = await fixture();
  try {
    const payload = await readFile(join(directory, 'GEN-1.mp3'));
    await rm(join(directory, 'GEN-1.mp3'));
    await writeFile(join(directory, 'BSB_01_Gen_001_H.mp3'), payload);
    const manifest = await buildAudioIngestManifest({ inputDirectory: directory, publicBaseUrl: 'https://audio.example/bible' });
    assert.equal(manifest.segments[0].id, 'GEN-1');
    assert.equal(manifest.segments[0].url, 'https://audio.example/bible/bsb-audio-1/BSB_01_Gen_001_H.mp3');
    const preflight = await inspectAudioIngestStaging({ inputDirectory: directory });
    assert.equal(preflight.stagedAudioChapters, 1);
    assert.equal(preflight.malformedFiles.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('audio ingest fails closed for unapproved rights, unsafe destination, and missing chapters', async () => {
  const { directory } = await fixture();
  try {
    await assert.rejects(buildAudioIngestManifest({ inputDirectory: directory, publicBaseUrl: 'http://audio.example' }), /must be HTTPS/);
    const sourcePath = join(directory, 'source.json');
    const source = JSON.parse(await readFile(sourcePath, 'utf8'));
    source.rights = 'review-required';
    await writeFile(sourcePath, JSON.stringify(source));
    await assert.rejects(buildAudioIngestManifest({ inputDirectory: directory, publicBaseUrl: 'https://audio.example' }), /verified rights/);
    source.rights = 'verified';
    await writeFile(sourcePath, JSON.stringify(source));
    await rm(join(directory, 'GEN-1.mp3'));
    await assert.rejects(buildAudioIngestManifest({ inputDirectory: directory, publicBaseUrl: 'https://audio.example' }), /exactly one staged audio file/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('audio ingest enforces the strict below-ceiling budget', async () => {
  const { directory } = await fixture();
  try {
    await assert.rejects(buildAudioIngestManifest({
      inputDirectory: directory, publicBaseUrl: 'https://audio.example', storageCeilingBytes: 4,
    }), /at or above the 4-byte storage ceiling/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('audio ingest refuses timing rows bound to a different BSB Scripture revision', async () => {
  const { directory } = await fixture();
  try {
    const path = join(directory, 'alignments.json');
    const alignments = JSON.parse(await readFile(path, 'utf8'));
    alignments[0].scriptureContentVersion = 'stale-bsb-revision';
    await writeFile(path, JSON.stringify(alignments));
    await assert.rejects(
      buildAudioIngestManifest({ inputDirectory: directory, publicBaseUrl: 'https://audio.example' }),
      /provenance\/translation mismatch/i,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('staging inspection reports chapter/evidence gaps without permitting a partial manifest', async () => {
  const { directory } = await fixture();
  try {
    const report = await inspectAudioIngestStaging({ inputDirectory: directory });
    assert.equal(report.expectedChapters, 1189);
    assert.equal(report.stagedAudioChapters, 1);
    assert.equal(report.stagedAlignmentChapters, 1);
    assert.equal(report.totalBytes, 4);
    assert.equal(report.belowStorageCeiling, true);
    assert.equal(report.readyForManifest, false);
    assert.ok(report.missingFiles.includes('GEN-2'));
    assert.ok(report.missingAlignments.includes('GEN-2'));
    assert.equal(report.malformedFiles.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('staging inspection catches duplicate, out-of-range and malformed audio names', async () => {
  const { directory } = await fixture();
  try {
    await writeFile(join(directory, 'GEN-1.m4a'), new Uint8Array([5]));
    await writeFile(join(directory, 'GEN-51.mp3'), new Uint8Array([6]));
    await writeFile(join(directory, 'NOT-A-CHAPTER.mp3'), new Uint8Array([7]));
    const report = await inspectAudioIngestStaging({ inputDirectory: directory });
    assert.equal(report.readyForManifest, false);
    assert.deepEqual(report.malformedFiles.sort(), [
      'GEN-1 (duplicate chapter asset)', 'GEN-1.mp3', 'GEN-51.mp3', 'NOT-A-CHAPTER.mp3',
    ]);
    assert.equal(report.totalBytes, 7);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('OpenBible source filename book number, abbreviation, and chapter must agree', async () => {
  const { directory } = await fixture();
  try {
    await writeFile(join(directory, 'BSB_02_Gen_001_H.mp3'), new Uint8Array([5]));
    await writeFile(join(directory, 'BSB_01_Exo_001_H.mp3'), new Uint8Array([6]));
    const report = await inspectAudioIngestStaging({ inputDirectory: directory });
    assert.ok(report.malformedFiles.includes('BSB_02_Gen_001_H.mp3'));
    assert.ok(report.malformedFiles.includes('BSB_01_Exo_001_H.mp3'));
    assert.equal(report.stagedAudioChapters, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('OpenBible abbreviated labels map Joel and Nahum to canonical BibleQuest book codes', async () => {
  const { directory } = await fixture();
  try {
    await writeFile(join(directory, 'BSB_29_Jol_001_H.mp3'), new Uint8Array([5]));
    await writeFile(join(directory, 'BSB_34_Nam_001_H.mp3'), new Uint8Array([6]));
    const report = await inspectAudioIngestStaging({ inputDirectory: directory });
    assert.equal(report.stagedAudioChapters, 3);
    assert.equal(report.malformedFiles.length, 0);
    assert.ok(report.missingFiles.includes('JOL-2'));
    assert.ok(report.missingFiles.includes('NAM-2'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('staging inspection refuses complete chapter coverage when timing revision or verse timing is invalid', async () => {
  const { directory } = await fixture();
  try {
    const alignmentPath = join(directory, 'alignments.json');
    const alignments = JSON.parse(await readFile(alignmentPath, 'utf8'));
    alignments[0].contentVersion = 'different-audio-revision';
    await writeFile(alignmentPath, JSON.stringify(alignments));
    const report = await inspectAudioIngestStaging({ inputDirectory: directory });
    assert.equal(report.stagedAlignmentChapters, 0);
    assert.ok(report.invalidAlignments.some(issue => issue.includes('revision')));
    assert.equal(report.readyForManifest, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});


test('hosted audio mirror requires reviewed speech-optimized encoding evidence and matching container', async () => {
  const { directory } = await fixture();
  try {
    const sourcePath = join(directory, 'source.json');
    const source = JSON.parse(await readFile(sourcePath, 'utf8'));

    for (const encoding of [
      { ...source.encoding, purpose: 'music' },
      { ...source.encoding, bitrateKbps: 128 },
      { ...source.encoding, channels: 2 },
      { ...source.encoding, sampleRateHz: 96_000 },
      { ...source.encoding, codec: 'flac' },
    ]) {
      await writeFile(sourcePath, JSON.stringify({ ...source, encoding }));
      await assert.rejects(
        buildAudioIngestManifest({ inputDirectory: directory, publicBaseUrl: 'https://audio.example' }),
        /speech-optimized encoding metadata/i,
      );
    }

    await writeFile(sourcePath, JSON.stringify({ ...source, encodingEvidence: '' }));
    await assert.rejects(
      buildAudioIngestManifest({ inputDirectory: directory, publicBaseUrl: 'https://audio.example' }),
      /speech-optimized encoding metadata/i,
    );

    await writeFile(sourcePath, JSON.stringify({
      ...source,
      encoding: { ...source.encoding, codec: 'opus' },
      encodingEvidence: 'reviewed opus probe',
    }));
    await assert.rejects(
      buildAudioIngestManifest({ inputDirectory: directory, publicBaseUrl: 'https://audio.example' }),
      /does not match declared speech codec opus/i,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('staging preflight keeps a mirror non-ready when speech encoding evidence is absent', async () => {
  const { directory } = await fixture();
  try {
    const sourcePath = join(directory, 'source.json');
    const source = JSON.parse(await readFile(sourcePath, 'utf8'));
    delete source.encodingEvidence;
    await writeFile(sourcePath, JSON.stringify(source));
    const report = await inspectAudioIngestStaging({ inputDirectory: directory });
    assert.equal(report.sourceEvidence.speechOptimizedEncoding, false);
    assert.equal(report.readyForManifest, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
