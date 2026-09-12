import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');

const shell = read('src/ui/shell.js');
const home = read('src/features/home/index.js');
const more = read('src/features/more/index.js');
const app = read('src/ui/app.css');
const accessibility = read('src/ui/accessibility.css');
const index = read('index.html');

assert.match(shell, /data-bq-shell="v4"/, 'v4 shell marker is required');
assert.doesNotMatch(shell, /Rebuild v3/, 'v3 shell branding must not remain');
for (const route of ['home', 'learn', 'play', 'grow', 'more']) {
  assert.match(shell, new RegExp(`id: '${route}'`), `primary route ${route} must remain`);
}
assert.match(shell, /aria-current', 'page'/, 'active primary navigation should expose aria-current=page');
assert.match(app, /--bq-page-max:1120px/, 'v4 foundation should expose a wider responsive app frame');
assert.match(app, /\.bq-nav-inner\{/, 'v4 navigation layout should be owned by the foundation stylesheet');
assert.match(app, /@media\(max-width:520px\)/, 'v4 foundation needs an intentional phone composition');
assert.match(app, /@media\(min-width:980px\)/, 'v4 foundation needs a larger-screen composition');

for (const hook of ['data-home-daily', 'data-home-progress', 'data-open-tutorial', 'data-open-recordings', 'data-open-media']) {
  assert.match(home, new RegExp(hook), `Home must preserve ${hook}`);
}
assert.match(home, /bq-home-dashboard/, 'Home should use the v4 dashboard composition');
assert.match(home, /TODAY'S JOURNEY/, 'Daily Journey must remain the primary next action');

for (const hook of [
  'data-open-workspace',
  'data-open-notification-center',
  'data-open-community',
  'data-open-ministry-hub',
  'data-open-content-review',
  'data-open-couples-family',
  'data-open-couples-cloud',
  'data-open-journey-groups',
  'data-open-team-center',
  'data-open-accessibility',
  'data-install-app',
  'data-open-backup',
  'data-open-mission',
  'data-open-calendar',
  'data-open-congregation'
]) {
  assert.match(more, new RegExp(hook), `More must preserve ${hook}`);
}
for (const groupTitle of ['Personal & planning', 'Relationships', 'Community', 'Ministry & leadership', 'App & device']) {
  assert.match(more, new RegExp(groupTitle.replace('&', '\\&')), `More group ${groupTitle} must remain`);
}

assert.doesNotMatch(index, /shell-visual-polish\.css/, 'migrated shell must not retain the old polish layer');
assert.doesNotMatch(index, /more-visual-polish\.css/, 'migrated More must not retain the old polish layer');
assert.doesNotMatch(index, /more-phase-b\.css/, 'migrated More must not retain the old phase-B layer');
assert.match(index, /BibleQuest v4/, 'document metadata should identify v4');

assert.match(accessibility, /html\[data-bq-text="xlarge"\]\{font-size:125%\}/, 'XL text scale must stay 125%');
assert.doesNotMatch(accessibility, /118\.75%/, 'phone layouts must not silently reduce the XL text preference');

console.log('BibleQuest v4 foundation static checks passed');
