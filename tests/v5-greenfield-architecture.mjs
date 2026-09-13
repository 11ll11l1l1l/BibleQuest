import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [packageJsonText, viteConfig, v5Html, main, routes, shell, styles, routerContracts, assignmentsView, assignmentsRepository, congregationService] = await Promise.all([
  read('package.json'),
  read('vite.config.ts'),
  read('v5.html'),
  read('src/v5/main.ts'),
  read('src/v5/app/routes.ts'),
  read('src/v5/app/shell.ts'),
  read('src/v5/styles.css'),
  read('src/v5/platform/router/contracts.ts'),
  read('src/v5/features/assignments/view.ts'),
  read('src/v5/data/assignments/repository.ts'),
  read('src/v5/platform/congregation/service.ts')
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
assert.match(main, /createUnavailableAssignmentsRepository/, 'app composition must explicitly own the assignments repository adapter');
assert.match(main, /createUnavailableCongregationContext/, 'app composition must explicitly own congregation context');
assert.doesNotMatch(main, /src\/app|\.\.\/app\/bootstrap|bootstrap\.js/, 'V5 entry must not import the V4 bootstrap owner');

assert.match(routes, /import\(['"]\.\.\/features\/home\/view['"]\)/, 'Home must remain route-lazy');
assert.match(routes, /import\(['"]\.\.\/features\/assignments\/view['"]\)/, 'Assignments must be route-lazy');
assert.match(routes, /import\(['"]\.\.\/features\/not-found\/view['"]\)/, 'Not Found must remain route-lazy');
assert.doesNotMatch(routes, /from\s+['"]\.\.\/features\//, 'feature views must not become eager static imports in the route registry');

assert.match(shell, /renderVersion/, 'shell must retain stale async-render suppression');
assert.match(shell, /aria-current/, 'shell must retain explicit active-route accessibility state');

assert.match(routerContracts, /readonly session:\s*SessionService/, 'route context must inject session as a narrow service');
assert.match(routerContracts, /readonly congregation:\s*CongregationContextService/, 'route context must inject congregation context separately from auth');
assert.match(routerContracts, /readonly assignments:\s*AssignmentsRepository/, 'route context must inject the assignments repository');

assert.match(assignmentsView, /session\.authenticated/, 'protected assignments view must gate repository access on authenticated session state');
assert.match(assignmentsView, /congregation\.status !== 'selected'/, 'protected assignments view must require an active congregation');
assert.match(assignmentsView, /context\.assignments\.listVisible/, 'assignments view must read through the repository boundary');
assert.doesNotMatch(assignmentsView, /createClient\s*\(|service[_-]?role|SUPABASE_SERVICE/i, 'feature view must not create privileged/direct backend clients');
assert.doesNotMatch(assignmentsView, /fetch\s*\(/, 'feature view must not bypass the repository boundary with direct network access');
assert.match(assignmentsRepository, /AssignmentsUnavailableError/, 'unconnected repository must fail closed rather than fabricate protected data');
assert.match(congregationService, /status:\s*'unavailable'/, 'unconnected congregation context must be explicit');

assert.doesNotMatch(styles, /@import[^;]*(?:src\/styles|styles\/)/i, 'greenfield CSS must not pull in the V4 override stack');

const v5Source = `${main}\n${routes}\n${shell}\n${routerContracts}\n${assignmentsView}\n${assignmentsRepository}`;
assert.doesNotMatch(v5Source, /service[_-]?role|SUPABASE_SERVICE|serviceRole/i, 'service-role credentials must never enter the client runtime');
assert.doesNotMatch(`${main}\n${routes}\n${shell}\n${assignmentsView}`, /createClient\s*\(/, 'views/shell must not create direct Supabase clients; a repository boundary owns future data access');

console.log('V5 greenfield architecture contracts: PASS');
