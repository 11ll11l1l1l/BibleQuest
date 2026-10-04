import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderDevotional, devotionalMessages } from '../../src/features/library/devotional.js';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';

const translate = (key, {locale, dictionaries, values}) => (dictionaries[locale.split('-')[0]]?.[key] || dictionaries.en[key]).replace(/\{(\w+)\}/g, (_, name) => values[name]);
const item = overrides => ({
  id: 'reading-1', contentType: 'devotional', publishedRevisionId: 'r1',
  publicationState: 'published', title: 'Hope', locale: 'en', sourceLocale: 'en',
  source: {kind:'external', title:'Source', uri:'https://example.org/reading'},
  sourceContent: {title:'Hope', body:'First paragraph.\n\n<script>alert(1)</script>'},
  rights:{status:'verified',holder:'Author',basis:'Permission',attribution:'Author',allowedUses:['display']},
  review:{status:'approved',reviewer:'editor',decidedAt:'2026-10-04T00:00:00Z'},
  taxonomyLinks:[{id:'topic.hope',kind:'topic',labels:{en:'Hope',tl:'Pag-asa'},order:0}],
  translations:[], ...overrides,
});
const translation = body => ({locale:'tl',reviewStatus:'reviewed',translatedFromRevision:'r1',
  translatedBy:'translator',reviewedBy:'editor',reviewedAt:'2026-10-04T00:00:00Z',content:{title:'Pag-asa',body}});

test('devotional renders escaped source text, topics and safe source link', () => {
  const html = renderDevotional(item(), {translate});
  assert.ok(html.includes('lang="en"'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('Topics: Hope'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
});

test('reviewed translation requires a complete readable body; fallback keeps source language', () => {
  const translated = renderDevotional(item({translations:[translation('Unang talata.')]}), {locale:'tl',translate});
  assert.ok(translated.includes('lang="fil"'));
  assert.ok(translated.includes('Mga paksa: Pag-asa'));
  assert.ok(translated.includes('Unang talata.'));
  assert.ok(!translated.includes('First paragraph.'));
  const fallback = renderDevotional(item({translations:[translation(undefined)]}), {locale:'tl',translate});
  assert.ok(fallback.includes('lang="en"'));
  assert.ok(fallback.includes('orihinal na wika: en'));
  assert.ok(fallback.includes('First paragraph.'));
});

test('unpublished, wrong-type, rights-limited and malformed readings remain unavailable', () => {
  for (const record of [
    item({publicationState:'draft'}), item({contentType:'book'}),
    item({rights:{...item().rights,allowedUses:['link']}}),
    item({sourceContent:{title:'Hope',body:{blocks:[{type:'html',text:'<img>'}]}}}),
    item({translations:[{...translation('text'),translatedFromRevision:'old'}]}),
  ]) assert.ok(!renderDevotional(record,{translate}).includes('<article'));
});

test('structured reading blocks are escaped and unsafe source URLs never become links', () => {
  const html=renderDevotional(item({source:{kind:'external',title:'Source',uri:'javascript:alert(1)'},
    sourceContent:{title:'Hope',body:{blocks:[{type:'heading',text:'<img>'},{type:'paragraph',text:'A reading.'}]}}}),{translate});
  assert.ok(html.includes('<h3>&lt;img&gt;</h3>'));
  assert.ok(!html.includes('href='));
});

test('devotional locale keys match and representative source bundle remains pending review', () => {
  for (const dictionary of Object.values(devotionalMessages)) assert.deepEqual(Object.keys(dictionary),Object.keys(devotionalMessages.en));
  const bundle=JSON.parse(readFileSync(new URL('../../content/v7/devotionals/spurgeon-samples.json',import.meta.url),'utf8'));
  const parsed=parseV7ContentBundle(bundle);
  assert.equal(parsed.items.length,2);
  assert.ok(parsed.items.every(row=>row.publicationState==='pending_review' && row.review.status==='pending_review'));
  assert.ok(parsed.items.every(row=>row.source.kind==='external' && row.rights.status==='verified'));
});

test('shared detail route renders devotional body and clears it when context resets', async () => {
  const { createLibraryItemPage } = await import('../../src/features/library/item-page.js');
  const host = { innerHTML:'', set textContent(value) { this.innerHTML=''; this.text=value; } };
  const back = { addEventListener() {}, removeEventListener() {} };
  let listener;
  let requested;
  let subscribed=true;
  const service={
    subscribe(fn) { listener=fn; return () => { subscribed=false; }; },
    async getItem(id) { requested=id; listener({status:'ready',selectedItem:item()}); },
  };
  const page=createLibraryItemPage({service,id:'reading-1',onBack(){}});
  const dispose=page.mount({querySelector:selector=>selector==='[data-library-detail]'?host:back});
  assert.equal(requested,'reading-1');
  assert.ok(host.innerHTML.includes('data-devotional-reading'));
  assert.ok(host.innerHTML.includes('First paragraph.'));
  listener({status:'idle',selectedItem:null});
  assert.equal(host.innerHTML,'');
  dispose();
  assert.equal(subscribed,false);
});
