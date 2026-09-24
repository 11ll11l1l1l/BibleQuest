import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

export const V6_ARTIFACT_INTEGRITY_FILE = 'bq-artifact-integrity.json';

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

const normalizePath = (root, file) => relative(root, file).replaceAll('\\', '/');
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function inventory(outDir) {
  const root = resolve(outDir);
  const paths = (await walk(root))
    .map((file) => ({ file, path: normalizePath(root, file) }))
    .filter(({ path }) => path !== V6_ARTIFACT_INTEGRITY_FILE)
    .sort((a, b) => a.path.localeCompare(b.path));

  const files = [];
  let totalBytes = 0;
  for (const entry of paths) {
    const bytes = await readFile(entry.file);
    totalBytes += bytes.byteLength;
    files.push(Object.freeze({
      path: entry.path,
      bytes: bytes.byteLength,
      sha256: sha256(bytes),
    }));
  }
  const canonical = files.map((file) => `${file.sha256} ${file.bytes} ${file.path}\n`).join('');
  return Object.freeze({
    files: Object.freeze(files),
    fileCount: files.length,
    totalBytes,
    artifactSha256: sha256(Buffer.from(canonical, 'utf8')),
  });
}

export async function writeArtifactIntegrityManifest(outDir, sourceSha) {
  const normalizedSha = String(sourceSha || '').trim();
  if (!normalizedSha) throw new Error('Artifact integrity requires a source SHA.');
  const current = await inventory(outDir);
  const manifest = Object.freeze({
    schemaVersion: 1,
    algorithm: 'sha256',
    sourceSha: normalizedSha,
    artifactSha256: current.artifactSha256,
    fileCount: current.fileCount,
    totalBytes: current.totalBytes,
    files: current.files,
  });
  await writeFile(
    join(resolve(outDir), V6_ARTIFACT_INTEGRITY_FILE),
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8',
  );
  return manifest;
}

export async function verifyArtifactIntegrityManifest(outDir, expectedSha) {
  const root = resolve(outDir);
  const manifest = JSON.parse(await readFile(join(root, V6_ARTIFACT_INTEGRITY_FILE), 'utf8'));
  const current = await inventory(root);
  const failures = [];

  if (manifest.schemaVersion !== 1) failures.push(`schemaVersion ${manifest.schemaVersion} != 1`);
  if (manifest.algorithm !== 'sha256') failures.push(`algorithm ${manifest.algorithm} != sha256`);
  if (manifest.sourceSha !== expectedSha) failures.push(`sourceSha ${manifest.sourceSha} != ${expectedSha}`);
  if (manifest.fileCount !== current.fileCount) failures.push(`fileCount ${manifest.fileCount} != ${current.fileCount}`);
  if (manifest.totalBytes !== current.totalBytes) failures.push(`totalBytes ${manifest.totalBytes} != ${current.totalBytes}`);
  if (manifest.artifactSha256 !== current.artifactSha256) {
    failures.push(`artifactSha256 ${manifest.artifactSha256} != ${current.artifactSha256}`);
  }

  const recorded = Array.isArray(manifest.files) ? manifest.files : [];
  if (recorded.length !== current.files.length) {
    failures.push(`file inventory length ${recorded.length} != ${current.files.length}`);
  } else {
    for (let index = 0; index < current.files.length; index += 1) {
      const expected = current.files[index];
      const actual = recorded[index] || {};
      if (
        actual.path !== expected.path
        || actual.bytes !== expected.bytes
        || actual.sha256 !== expected.sha256
      ) {
        failures.push(`file inventory mismatch at ${expected.path}`);
        break;
      }
    }
  }

  if (failures.length) {
    throw new Error(`V6 artifact integrity verification failed: ${failures.join('; ')}`);
  }
  return Object.freeze({ ...manifest, files: Object.freeze(recorded.map((file) => Object.freeze({ ...file }))) });
}
