import fs from 'node:fs';
import assert from 'node:assert/strict';

const home = fs.readFileSync(new URL('../src/features/home/index.js', import.meta.url), 'utf8');
const week = fs.readFileSync(new URL('../src/features/home/today-this-week.js', import.meta.url), 'utf8');

// V5 P0.5 requires composition of existing owners, not a replacement state engine.
assert.match(home, /dailyMission\?\.today\?\.\(\)/, 'Home must continue consuming the existing Daily Journey owner');
assert.match(home, /assignments\?\.load/, 'Home must continue consuming the existing Assignments owner');
assert.match(home, /data-open-this-week-calendar/, 'This Week must continue linking to the existing Calendar owner');
assert.match(home, /data-open-recordings/, 'Home must preserve the existing Recordings destination while latest-service composition is unfinished');
assert.match(week, /home\.week\.heading/, 'This Week composition header must remain localized');

// Characterize the exact remaining accepted P0.5 gaps on current head. These assertions
// intentionally describe missing owner inputs without inventing replacement storage/services.
const signature = home.match(/export function homePage\(([^\n]+)\)/)?.[1] || '';
assert.ok(!/notification/i.test(signature), 'Current Home does not yet receive Notification Center/unread state');
assert.ok(!/transformation/i.test(signature), 'Current Home does not yet receive Transformation prompt state');
assert.ok(!/reading|readerState|continueReading/i.test(signature), 'Current Home does not yet receive continue-reading state');
assert.ok(!/latestService|latestRecording/i.test(signature), 'Current Home does not yet receive a stable latest-service item');

assert.ok(!/data-home-unread-notifications/.test(home), 'Unread-notification composition is not yet rendered');
assert.ok(!/data-home-transformation-prompt/.test(home), 'Transformation prompt composition is not yet rendered');
assert.ok(!/data-home-continue-reading/.test(home), 'Continue-reading composition is not yet rendered');
assert.ok(!/data-home-latest-service/.test(home), 'Latest-service composition is not yet rendered');
assert.ok(!/data-home-next-event/.test(home), 'Next-event composition is not yet rendered; current Calendar link alone does not satisfy P0.5');

console.log('PASS v5 Home/Today composition gap characterization: existing Daily Journey + Assignments + Calendar + Recordings composition preserved; next-event, continue-reading, latest-service, Transformation prompt, and unread-notification owner inputs remain explicitly absent on current head.');
