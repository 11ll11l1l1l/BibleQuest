import fs from 'node:fs';
import assert from 'node:assert/strict';

const home = fs.readFileSync(new URL('../src/features/home/index.js', import.meta.url), 'utf8');
const week = fs.readFileSync(new URL('../src/features/home/today-this-week.js', import.meta.url), 'utf8');
const bootstrap = fs.readFileSync(new URL('../src/app/bootstrap.js', import.meta.url), 'utf8');

// V5 P0.5 composes existing owners; it must not replace their state/storage boundaries.
assert.match(home, /dailyMission\?\.today\?\.\(\)/, 'Home must continue consuming the existing Daily Journey owner');
assert.match(home, /assignments\?\.load/, 'Home must continue consuming the existing Assignments owner');
assert.match(home, /data-open-this-week-calendar/, 'This Week must continue linking to the existing Calendar owner');
assert.match(home, /data-open-recordings/, 'Home must preserve the existing Recordings destination');
assert.match(week, /home\.week\.heading/, 'This Week composition header must remain localized');

const signature = home.match(/export function homePage\(([^\n]+)\)/)?.[1] || '';
for (const owner of ['calendar', 'reader', 'recordings', 'transform', 'notifications']) {
  assert.match(signature, new RegExp(`\\b${owner}\\b`), `Home must receive the existing ${owner} owner`);
}

for (const marker of [
  'data-home-next-event',
  'data-home-continue-reading',
  'data-home-latest-service',
  'data-home-transformation-prompt',
  'data-home-unread-notifications'
]) {
  assert.match(home, new RegExp(marker), `Home must render accepted P0.5 surface ${marker}`);
}

assert.match(home, /calendar\?\.getState\?\.\(\)/, 'Home next-event composition must read Calendar owner state');
assert.match(home, /calendar\?\.load/, 'Home must refresh the existing Calendar owner');
assert.match(home, /reader\?\.getState\?\.\(\)/, 'Home continue-reading composition must read Reader owner state');
assert.match(home, /recordings\?\.getLatestService\?\.\(\)/, 'Home latest-service composition must use Recordings latest-service owner API');
assert.match(home, /recordings\?\.load/, 'Home must refresh Recordings through its owner');
assert.match(home, /transform\?\.getState\?\.\(\)/, 'Home Transformation prompt must read the Transform owner');
assert.match(home, /notifications\?\.snapshot\?\.\(\)/, 'Home unread composition must read Notification Center owner state');
assert.match(home, /notifications\?\.load/, 'Home unread composition must refresh Notification Center through its owner');

const homeRoute = bootstrap.split('\n').find(line => line.includes('home:()=>homePage(')) || '';
for (const owner of ['calendar', 'reader', 'recordings', 'transform', 'notifications']) {
  assert.match(homeRoute, new RegExp(`\\b${owner}\\b`), `Bootstrap Home route must wire ${owner}`);
}
assert.match(homeRoute, /onTransformation:\(\)=>router\.navigate\('transform'\)/, 'Home Transformation tile must navigate through the canonical transform route');
assert.match(homeRoute, /onNotifications:\(\)=>router\.navigate\('notification-center'\)/, 'Home notification tile must navigate through the canonical Notification Center route');

for (const forbidden of ['localStorage', 'sessionStorage', 'createClient', '@supabase']) {
  assert.ok(!home.includes(forbidden), `Home composition must not bypass existing owners with ${forbidden}`);
}

console.log('PASS v5 Home/Today P0.5 acceptance: next event, continue reading, latest stable service, Transformation prompt and unread notifications compose through existing owners while Daily Journey, Assignments, Calendar and Recordings behavior remains preserved.');
