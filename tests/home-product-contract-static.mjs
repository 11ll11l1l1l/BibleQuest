import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const home=fs.readFileSync(path.join(root,'modern-home.js'),'utf8');
const translations=fs.readFileSync(path.join(root,'translations.js'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

assert(!home.includes("'Daily 5'")&&!home.includes('>Daily 5<'),'Modern Home must not restore Daily 5 as a competing primary journey');
assert(home.includes("window.BQJourneyLoop"),'Modern Home primary flow must use the production Daily Journey API');
assert(home.includes('data-modern-journey'),'Modern Home must expose a dedicated Daily Journey CTA');
assert(home.includes('CONTINUE · ${journey.doneSteps}/${journey.total} STEPS'),'Daily Journey resume state must remain visible');
assert(home.includes('getTimezoneOffset()'),'Modern Home daily state must use local-calendar dates rather than raw UTC dates');
assert(translations.includes("NLT:{code:'NLT',name:'New Living Translation',mode:'licensed-link'"),'Reader production truth currently requires NLT licensed-link mode');
assert(home.includes('licensed external reader'),'Home NLT source copy must match current Reader behavior');
assert(!home.includes('Tyndale’s official API')&&!home.includes('api.nlt.to'),'Home must not claim the unmerged live NLT API architecture');
assert(home.includes('Japanese Kougo-yaku')||home.includes('口語訳聖書'),'Home sources must disclose the Japanese Bible source path');

console.log('Modern Home product contract passed: Daily Journey primary, local-day resume state, Reader source copy aligned.');
