import { mkdtemp, mkdir, readdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditV7VisualAssets } from './v7-visual-assets-audit.mjs';

const REPO_ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const IMAGE_ROOT = 'public/v7/images';
const MANIFEST_PATH = 'data/v7/visual-assets.json';

function validateImagePath(src) {
  if (typeof src !== 'string' || !/^\/v7\/images\/[a-z0-9-]+\/[a-z0-9-]+\.(?:webp|png|jpg|jpeg)$/i.test(src)) {
    throw new Error('V7 visual publication rejected an unapproved image path.');
  }
  return src.slice(1);
}

/** Produce a deployable subset, without promoting unreviewed image-agent drafts.
 * Each production_ready master and its explicitly approved variants must pass
 * the unmodified Lane A byte-identity/rights/QC audit before any bytes ship.
 */
export async function publishV7VisualAssets({ root = REPO_ROOT, outDir } = {}) {
  if (!outDir) throw new Error('V7 visual publication needs the output directory.');
  const sourceRoot = resolve(root);
  const outputRoot = resolve(outDir);
  const stagingRoot = await mkdtemp(join(tmpdir(), 'bqv7-audited-visual-'));
  const stagedPaths = new Set();
  const quarantined = [];
  try {
    const records = join(sourceRoot, 'data/v7/visual-assets/records');
    const queues = join(sourceRoot, 'data/v7/visual-assets/queues');
    for (const name of (await readdir(queues)).filter(n => n.endsWith('.json'))) {
      const destination = join(stagingRoot, 'data/v7/visual-assets/queues', name);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(join(queues, name), destination);
    }
    for (const name of (await readdir(records)).filter(n => n.endsWith('.json'))) {
      const source = join(records, name);
      const record = JSON.parse(await readFile(source, 'utf8'));
      // Schema 2 describes image-agent working bundles, even when the agent
      // marked a draft "production_ready". Only Lane A audited schema 1 may ship.
      if (record.schemaVersion !== 1) {
        quarantined.push(name);
        continue;
      }
      if (record.status !== 'production_ready') continue;
      // Stale declarations from image agents are quarantined, never treated
      // as permission to bypass the strict published-asset schema.
      const permittedSource = ['generated', 'licensed', 'public_domain', 'owned'];
      const compatibleVariants = record.variants === undefined ||
        (Array.isArray(record.variants) && record.variants.every(variant =>
          ['with_text', 'thumbnail'].includes(variant?.kind)));
      if (!permittedSource.includes(record.rights?.sourceType) || !compatibleVariants) {
        quarantined.push(name);
        continue;
      }
      if (name !== record.assetId + '.json') {
        throw new Error('Malformed V7 production-ready sidecar: ' + name);
      }
      const destination = join(stagingRoot, 'data/v7/visual-assets/records', name);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(source, destination);
      for (const src of [record.imagePath, ...(record.variants || []).map(variant => variant.imagePath)]) {
        const relative = validateImagePath(src);
        stagedPaths.add(relative);
        const output = join(stagingRoot, 'public', relative);
        await mkdir(dirname(output), { recursive: true });
        await copyFile(join(sourceRoot, 'public', relative), output);
      }
    }
    // Even an empty approved set must produce valid staging folders; UI keeps
    // text-only cards while agents complete QA, never fabricating visuals.
    await mkdir(join(stagingRoot, IMAGE_ROOT), { recursive: true });
    await mkdir(join(stagingRoot, 'data/v7/visual-assets/records'), { recursive: true });
    const result = await auditV7VisualAssets(stagingRoot);
    if (result.status !== 'PASS') {
      throw new Error('V7 approved visual audit failed: ' + result.errors.join(' | '));
    }
    const verifiedPaths = new Set(result.manifest.assets.flatMap(asset => [
      asset.src, ...(asset.variants || []).map(variant => variant.src)
    ]).map(validateImagePath));
    if (verifiedPaths.size !== stagedPaths.size || [...verifiedPaths].some(path => !stagedPaths.has(path))) {
      throw new Error('V7 approved visual audit produced an inconsistent deployment set.');
    }
    for (const relative of verifiedPaths) {
      const destination = join(outputRoot, relative);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(join(stagingRoot, 'public', relative), destination);
    }
    const manifest = join(outputRoot, MANIFEST_PATH);
    await mkdir(dirname(manifest), { recursive: true });
    await writeFile(manifest, JSON.stringify(result.manifest) + '\n');
    return Object.freeze({ approved: result.manifest.assets.length, files: verifiedPaths.size,
      quarantined: Object.freeze(quarantined.sort()), manifest: MANIFEST_PATH });
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
}
