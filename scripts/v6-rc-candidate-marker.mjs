import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
export const RC_MARKER_PATH = 'docs/v6/RC_CANDIDATE.json';
export const RC_MARKER_INTENT = 'v6-release-candidate';

export function normalizeRcBaseSha(value) {
  const sha = String(value || '').trim().toLowerCase();
  if (!SHA_PATTERN.test(sha)) {
    throw new Error('V6 RC marker requires an exact 40-character integration base SHA.');
  }
  return sha;
}

export function buildRcCandidateMarker(baseIntegrationSha) {
  return Object.freeze({
    schemaVersion: 1,
    intent: RC_MARKER_INTENT,
    baseIntegrationSha: normalizeRcBaseSha(baseIntegrationSha),
    candidateIdentity: 'commit-containing-this-marker',
    automatedGateProfile: 'full',
  });
}

export function validateRcCandidateMarker(marker, expectedBaseSha) {
  if (!marker || typeof marker !== 'object' || Array.isArray(marker)) {
    throw new Error('V6 RC candidate marker must be a JSON object.');
  }
  if (marker.schemaVersion !== 1) {
    throw new Error('V6 RC candidate marker schemaVersion must be 1.');
  }
  if (marker.intent !== RC_MARKER_INTENT) {
    throw new Error('V6 RC candidate marker intent is invalid.');
  }
  if (marker.candidateIdentity !== 'commit-containing-this-marker') {
    throw new Error('V6 RC candidate identity must be the commit containing the marker.');
  }
  if (marker.automatedGateProfile !== 'full') {
    throw new Error('V6 RC candidate must request the full automated gate profile.');
  }
  const actualBase = normalizeRcBaseSha(marker.baseIntegrationSha);
  const expectedBase = normalizeRcBaseSha(expectedBaseSha);
  if (actualBase !== expectedBase) {
    throw new Error(`V6 RC marker base mismatch: marker=${actualBase} expected=${expectedBase}.`);
  }
  return Object.freeze({ ...marker, baseIntegrationSha: actualBase });
}

export async function writeRcCandidateMarker({
  baseIntegrationSha,
  outputPath = RC_MARKER_PATH,
} = {}) {
  const marker = buildRcCandidateMarker(baseIntegrationSha);
  const output = resolve(outputPath);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(marker, null, 2) + '\n', 'utf8');
  return marker;
}

async function main(argv) {
  const mode = argv[0];
  if (mode === '--write') {
    if (argv.length < 2 || argv.length > 3) {
      throw new Error('Usage: node scripts/v6-rc-candidate-marker.mjs --write <base-integration-sha> [output.json]');
    }
    const marker = await writeRcCandidateMarker({
      baseIntegrationSha: argv[1],
      outputPath: argv[2] || RC_MARKER_PATH,
    });
    process.stdout.write(JSON.stringify(marker, null, 2) + '\n');
    return;
  }
  if (mode === '--validate') {
    if (argv.length !== 3) {
      throw new Error('Usage: node scripts/v6-rc-candidate-marker.mjs --validate <marker.json> <expected-base-sha>');
    }
    const marker = JSON.parse(await readFile(resolve(argv[1]), 'utf8'));
    const validated = validateRcCandidateMarker(marker, argv[2]);
    process.stdout.write(JSON.stringify(validated, null, 2) + '\n');
    return;
  }
  throw new Error('Use --write or --validate.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => {
    console.error(error?.stack || error);
    process.exitCode = 1;
  });
}
