import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [packageJsonText, viteConfig, v5Html, main, routes, shell, styles] = await Promise.all([
  read('package.json'),
  read('vite.config.ts'),
  read('v5.html'),
  read('src/v5/main.ts'),
  read('src/v5/app/routes.ts'),
  read('src/v5/app/shell.ts'),
  read('src/v5/styles.css')
]);

const pkg = JSON.parse(packageJsonText);

assert.equal(pkg.private, true, 'greenfield lab package must remain private');
assert.match(pkg.engines?.node ?? '', /22\.12\.0/, 'Node floor must remain explicit');
for (const dependency of ['vite', 'typescript', '@types/node']) {
  assert.match(pkg.devDependencies?.[dependency] ?? '', /^\d+\.\d+\.\d+$/, `${dependency} must be exactly pinned`);
}

assert.match(viteConfig, /outDir:\s*['"]dist-v5['"]/, 'greenfield artifacts need an isolated output directory');
assert.match(viteConfig, /manifest:\s*true/, 'greenfield build must emit a manifest');
assert.match(viteConfig, /input:\s*['"]v5\.html['"]/, 'greenfield build must use the isolated browser entry');

assert.match(v5Html, /id=['"]v5-app['"]/, 'greenfield HTML must expose its own root');
assert.match(v5Html, /src=['"]\/src\/v5\/main\.ts['"]/, 'greenfield HTML must boot only the V5 entry');
assert.doesNotMatch(v5Html, /src\/app\/bootstrap\.js/, 'greenfield entry must not boot the V4 runtime');

assert.match(main, /createAppShell/, 'V5 app composition must own the shell');
assert.match(main, /createRouter/, 'V5 app composition must own the router boundary');
assert.doesNotMatch(main, /src\/app|\.\.\/app\/bootstrap|bootstrap\.js/, 'V5 entry must not import the V4 bootstrap owner');

assert.match(routes, /import\(['"]\.\.\/features\/home\/view['"]\)/, 'Home must remain route-lazy');
assert.match(routes, /import\(['"]\.\.\/features\/not-found\/view['"]\)/, 'Not Found must remain route-lazy');
assert.doesNotMatch(routes, /from\s+['"]\.\.\/features\//, 'feature views must not become eager static imports in the route registry');

assert.match(shell, /renderVersion/, 'shell must retain stale async-render suppression');
assert.match(shell, /aria-current/, 'shell must retain explicit active-route accessibility state');

assert.doesNotMatch(styles, /@import[^;]*(?:src\/styles|styles\/)/i, 'greenfield CSS must not pull in the V4 override stack');

const v5Source = `${main}\n${routes}\n${shell}`;
assert.doesNotMatch(v5Source, /service[_-]?role|SUPABASE_SERVICE|serviceRole/i, 'service-role credentials must never enter the client runtime');
assert.doesNotMatch(v5Source, /createClient\s*\(/, 'views/shell must not create direct Supabase clients; a repository boundary owns future data access');

console.log('V5 greenfield architecture contracts: PASS');
