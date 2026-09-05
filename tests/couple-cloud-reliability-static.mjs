import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(root,'couple-cloud.js'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

assert(source.includes("if(shared.error)throw shared.error"),'Couple Journey shared-history read failures must not render as an empty success state');
assert(source.includes('role="alert"')&&source.includes('Couple Journey could not load.'),'Couple Journey load failures must be visible and accessible');
assert(source.includes('<button data-couple-refresh>Try again</button>'),'Couple Journey load failure must provide an explicit retry path');
assert(source.includes('async function create()')&&source.includes("message='Pair code ready.';await render()"),'pair creation must await the resulting render so cloud-read rejection is caught');
assert(source.includes('async function join(form)')&&source.includes("message='Accounts linked.';await render()"),'pair join must await the resulting render so cloud-read rejection is caught');
assert(source.includes("message='Conversation saved to your shared couple journey.';await active()"),'completion refresh must remain in the caller rejection chain');

console.log('Couple Journey reliability static smoke passed.');
