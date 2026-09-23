import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const service=read('src/app/ministry-hub.js');
const view=read('src/features/ministry-hub/index.js');
const bootstrap=read('src/app/bootstrap.js');
const browserSmoke=read('tests/v3-ministry-hub-smoke.mjs');

assert.ok(service.includes("id:'calendar'")&&service.includes("route:'calendar'")&&service.includes('available:true'),'Ministry Hub Calendar tool must publish the canonical calendar route.');
assert.ok(view.includes("onNavigate?.(button.dataset.ministryRoute)"),'Ministry Hub tool buttons must forward their exact declared route.');
assert.ok(bootstrap.includes("'ministry-hub':()=>ministryHubPage({hub:ministryHub,onNavigate:navigateGeneral"),'Active V5 Ministry Hub must use the primary router callback.');
assert.ok(bootstrap.includes("calendar:()=>calendarPage("),'Active V5 router must retain the Calendar destination.');
assert.ok(browserSmoke.includes("routes.join(',')==='assignments,calendar,journey-groups'"),'Browser certification must prove the Calendar callback rather than only its markup.');

console.log('V5 Ministry Hub to Calendar route chain: PASS');
