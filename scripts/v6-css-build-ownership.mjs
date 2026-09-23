import { access, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = process.cwd();
const outDir = resolve(root, 'dist-v6');
const sourceIndex = await readFile(join(root, 'index.html'), 'utf8');
const builtIndex = await readFile(join(outDir, 'index.html'), 'utf8');
const manifest = JSON.parse(await readFile(join(outDir, 'vite-manifest.json'), 'utf8'));

const legacyStyles = [...sourceIndex.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["'](src\/ui\/[^"']+\.css)["'][^>]*>/gi)]
  .map((match) => match[1])
  .sort();

if (!legacyStyles.length) {
  throw new Error('Expected legacy src/ui stylesheet links in the V5-compatible source index.');
}

const leakedLegacyStyles = legacyStyles.filter((style) => builtIndex.includes(style));

const manifestCss = [...new Set(
  Object.values(manifest)
    .flatMap((chunk) => Array.isArray(chunk?.css) ? chunk.css : [])
    .filter((file) => typeof file === 'string' && file.endsWith('.css')),
)].sort();

const missingBuiltCss = [];
for (const cssFile of manifestCss) {
  try {
    await access(join(outDir, cssFile));
  } catch {
    missingBuiltCss.push(cssFile);
  }
}

const builtCssLinks = [...builtIndex.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+\.css)["'][^>]*>/gi)]
  .map((match) => match[1])
  .sort();
const unownedBuiltCssLinks = builtCssLinks.filter((href) => {
  const normalized = href.replace(/^\.?\//, '').replace(/^\//, '');
  return !manifestCss.includes(normalized);
});

const report = {
  sourceLegacyStylesheetCount: legacyStyles.length,
  sourceLegacyStylesheets: legacyStyles,
  manifestCssCount: manifestCss.length,
  manifestCss,
  builtCssLinks,
  leakedLegacyStyles,
  missingBuiltCss,
  unownedBuiltCssLinks,
};

console.log(JSON.stringify(report, null, 2));

const failures = [];
if (!manifestCss.length) failures.push('Vite manifest exposes no build-owned CSS output');
if (leakedLegacyStyles.length) failures.push(`built index still references legacy src/ui CSS: ${leakedLegacyStyles.join(', ')}`);
if (missingBuiltCss.length) failures.push(`manifest CSS missing from dist-v6: ${missingBuiltCss.join(', ')}`);
if (unownedBuiltCssLinks.length) failures.push(`built index has CSS links outside Vite manifest ownership: ${unownedBuiltCssLinks.join(', ')}`);

if (failures.length) {
  throw new Error(`V6 CSS build ownership failed: ${failures.join('; ')}`);
}
