import { CONTENT_PROVENANCE, getContentProvenance } from '../src/core/content-provenance.js';
import { sourceLabel, sourceGuide } from '../src/ui/source-labels.js';
import { createBibleDataService } from '../src/core/bible.js';
import { createRecallPackService } from '../src/core/recall-packs.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};

const ids=['bq-study','bq-retelling','bq-wisdom','bq-recall','bq-game'];
assert(Object.isFrozen(CONTENT_PROVENANCE),'Content provenance catalog must be immutable.');
for(const id of ids){
  const item=getContentProvenance(id);
  assert(Object.isFrozen(item),`${id} provenance row must be immutable.`);
  assert(item.id===id&&item.label&&item.kind&&item.detail,`${id} provenance row is incomplete.`);
  assert(/not .*?(?:Bible quotation|Bible translation text|Scripture quotation|Scripture text)/i.test(item.detail),`${id} must explicitly distinguish authored prose from Scripture text.`);
  const html=sourceLabel(item,{compact:true});
  assert(html.includes(`data-source-id="${id}"`),`${id} source label must expose stable identity.`);
  assert(html.includes('is-compact'),`${id} compact source label contract is missing.`);
}
let unknown='';try{getContentProvenance('unknown')}catch(error){unknown=error.message}
assert(/Unknown content provenance/.test(unknown),'Unknown provenance IDs must fail explicitly.');
let invalid='';try{sourceLabel({label:'Incomplete',detail:'No id'})}catch(error){invalid=error.message}
assert(/requires id/i.test(invalid),'Source label must reject metadata without stable identity.');

const bible=createBibleDataService({fetcher:async()=>{throw new Error('Source guide metadata must not fetch Scripture.')}});
assert(bible.translations.length===4,'Source guide must consume all current translation metadata from Bible owner.');
assert(bible.translations.some(row=>row.id==='bsb'&&/Berean Standard Bible/.test(row.source)),'BSB source metadata missing from Bible owner.');
assert(bible.translations.some(row=>row.id==='nlt'&&row.mode==='licensed-link'&&/does not redistribute/i.test(row.attribution)),'NLT licensed attribution missing from Bible owner.');

const recall=createRecallPackService({fetcher:async()=>{throw new Error('sourceInfo() must not fetch the recall manifest.')}});
const recallInfo=recall.sourceInfo();
assert(Object.isFrozen(recallInfo),'Recall sourceInfo() must be immutable.');
assert(recallInfo.source==='unfoldingWord Translation Questions v90'&&recallInfo.license==='CC BY-SA 4.0','Recall sourceInfo() must retain exact open-source attribution.');
assert(recall.cacheSize()===0,'Reading source metadata must not load recall packs.');

const guide=sourceGuide({translations:bible.translations,recall:recallInfo,custom:ids.map(getContentProvenance)});
for(const translation of bible.translations)assert(guide.includes(`data-source-guide-id="translation:${translation.id}"`),`Source guide missing translation ${translation.id}.`);
assert(guide.includes('data-source-guide-id="recall"'),'Source guide missing recall-resource attribution.');
for(const id of ids)assert(guide.includes(`data-source-guide-id="${id}"`),`Source guide missing custom content type ${id}.`);
assert(guide.includes('A Scripture reference is not presented as though it were a quotation.'),'Source guide must state the reference-vs-quotation rule.');

const escaped=sourceLabel({id:'x" onmouseover="bad',label:'<b>unsafe</b>',kind:'x',detail:'A & B'});
assert(!escaped.includes('<b>unsafe</b>')&&!escaped.includes('onmouseover="bad"'),'Source label helper must HTML-escape supplied metadata.');

console.log('BibleQuest v3 source-label provenance edge regression passed.');
