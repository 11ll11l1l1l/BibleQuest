import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditV7VisualAssets } from './v7-visual-assets-audit.mjs';

const REPO_ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const MANIFEST_PATH = 'data/v7/visual-assets.json';

function imageRelativePath(src) {
  if (typeof src !== 'string' ||
      !/^\/v7\/images\/[a-z0-9-]+\/[a-z0-9-]+\.(?:webp|png|jpe?g)$/i.test(src)) {
    throw new Error('Visual publication rejected a path outside the approved image namespace.');
  }
  return src.slice(1);
}

/** Publish ONLY the strict Lane A audit's approved manifest-listed binaries.
 * Draft derivative bundles may remain in source control without becoming
 * available in the production artifact.
 */
export async function publishV7VisualAssets({ root = REPO_ROOT, outDir } = {}) {
  if (!outDir) throw new Error('V7 visual publication needs an output directory.');
  const source = resolve(root);
  const output = resolve(outDir);
  const audit = await auditV7VisualAssets(source);
  if (audit.status !== 'PASS') {
    throw new Error('V7 image audit rejected release: ' + audit.errors.join(' | '));
  }
  const paths = new Set();
  for (const asset of audit.manifest.assets) {
    for (const src of [asset.src, ...(asset.variants || []).map(variant => variant.src)]) {
      const relative = imageRelativePath(src);
      if (paths.has(relative)) throw new Error('V7 image manifest duplicated a source path.');
      paths.add(relative);
      const target = join(output, relative);
      await mkdir(dirname(target), { recursive: true });
      await copyFile(join(source, 'public', relative), target);
    }
  }
  const destination = join(output, MANIFEST_PATH);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(audit.manifest) + '\n');
  return Object.freeze({
    approved: audit.manifest.assets.length, files: paths.size,
    warnings: Object.freeze([...(audit.warnings || [])]), manifest: MANIFEST_PATH,
  });
}
