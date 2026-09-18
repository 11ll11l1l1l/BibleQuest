import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const pkg = JSON.parse(read('package.json'));
const nodePin = read('.nvmrc').trim();
const tsconfig = JSON.parse(read('tsconfig.json'));
const viteConfig = read('vite.config.mjs');

assert(/^\d+\.\d+\.\d+$/.test(nodePin), '.nvmrc must pin an exact Node version');
assert(pkg.engines?.node === nodePin, 'package.json engines.node must match .nvmrc');
assert(pkg.private === true, 'V6 package must remain private');
assert(pkg.scripts?.build === 'vite build', 'build script must use Vite');
assert(pkg.scripts?.typecheck?.includes('tsc'), 'typecheck script is required');
assert(/^\d+\.\d+\.\d+$/.test(pkg.devDependencies?.vite || ''), 'Vite must use an exact version');
assert(
  /^\d+\.\d+\.\d+$/.test(pkg.devDependencies?.typescript || ''),
  'TypeScript must use an exact version',
);
assert(tsconfig.compilerOptions?.strict === true, 'new V6 TypeScript contracts must be strict');
assert(tsconfig.compilerOptions?.allowJs === true, 'legacy JS compatibility must remain enabled');
assert(viteConfig.includes("outDir = resolve(root, 'dist-v6')"), 'V6 build must remain shadowed in dist-v6');
assert(viteConfig.includes("'assets', 'data', 'kids-games'"), 'legacy runtime directories must be preserved');
assert(viteConfig.includes('__BQ_BUILD_SHA__'), 'exact build SHA must be injectable');
assert(viteConfig.includes('compatibilityBaseline'), 'build identity metadata must record compatibility baseline');
assert(fs.existsSync(path.join(root, 'scripts', 'validate-release.mjs')), 'inherited V5 release validator must remain present');

console.log('✓ V6 Phase-1 toolchain bootstrap contract');
console.log(`  Node ${nodePin}`);
console.log(`  Vite ${pkg.devDependencies.vite}`);
console.log(`  TypeScript ${pkg.devDependencies.typescript}`);
console.log('  Shadow output: dist-v6/');
