import test from 'node:test';
import assert from 'node:assert/strict';
import { libraryConversationSeries, renderLibraryConversationHandoff } from '../../src/features/library/conversation-handoff.js';
import { conversationPreviewSeries, normalizeConversationDeck } from '../../src/content/conversation-decks.js';
import { buildV7PublicLibraryCatalog } from '../../scripts/v7-generate-public-library-catalog.mjs';

const item = overrides => ({
  id:'public-reading',contentType:'devotional',publishedRevisionId:'r1',publicationState:'published',title:'Public reading',sourceLocale:'en',locale:'en',
  source:{kind:'first_party',title:'Original',catalogId:'original-reading'},sourceContent:{title:'Public reading',body:'PRIVATE_MARKER must never enter the handoff URL.'},
  rights:{status:'verified',holder:'BibleQuest',basis:'Original',attribution:'BibleQuest',allowedUses:['display']},
  review:{status:'approved',reviewer:'editor',decidedAt:'2026-10-18T00:00:00Z'},translations:[],
  taxonomyLinks:[{id:'topic.community',kind:'topic',order:0}],...overrides,
});
test('only published, rights-valid readings with explicit related topics offer a handoff',()=>{
  assert.deepEqual(libraryConversationSeries(item()).map(row=>row.id),['together']);
  for(const overrides of [{publicationState:'draft'},{review:{status:'pending_review'}},{rights:{status:'unknown'}},{contentType:'book'},{taxonomyLinks:[]},{taxonomyLinks:[{id:'topic.unknown',kind:'topic',order:0}]}]){
    assert.equal(renderLibraryConversationHandoff(item(overrides)),'');
  }
  assert.equal(renderLibraryConversationHandoff(item({rights:{...item().rights,allowedUses:['external_link']}})),'');
});
test('handoff has canonical series only; reading titles/body/IDs never enter URLs',()=>{
  const html=renderLibraryConversationHandoff(item({id:'secret-id',title:'<script>private-title</script>'}));
  assert.match(html,/href="#\/conversation-deck\?series=together"/);
  assert.doesNotMatch(html,/secret-id|private-title|PRIVATE_MARKER|<script>/);
  const multi=item({taxonomyLinks:[{id:'topic.prayer',kind:'topic',order:0},{id:'topic.trust',kind:'topic',order:1},{id:'topic.community',kind:'topic',order:2}]});
  assert.deepEqual(libraryConversationSeries(multi).map(row=>row.id),['trust','together']);
});
test('group handoff is localized in EN/TL/CEB with explicit English fallback',()=>{
  for(const [locale,label]of [['en','Discuss together'],['tl','Sama-samang talakayin'],['ceb','Hisgoti nga magkauban'],['ilo','Discuss together']]){
    assert.ok(renderLibraryConversationHandoff(item(),locale).includes(label));
  }
});
test('existing session overrides Library preference and untrusted series cannot become a prompt',()=>{
  const shared={activity:'conversation-deck',version:1,seriesId:'follow',cardIds:['follow-love'],activeCardId:'follow-love'};
  assert.equal(conversationPreviewSeries(shared,'together'),'follow');
  assert.equal(conversationPreviewSeries(null,'together'),'together');
  for(const bad of ['<script>','https://evil.test','__proto__','unknown'])assert.equal(conversationPreviewSeries(null,bad),'trust');
  assert.equal(normalizeConversationDeck({activity:'conversation-deck',version:1,seriesId:'together',cardIds:['public-reading'],activeCardId:'public-reading'}),null);
});
test('handoff works against real approved public catalog without changing content publication',async()=>{
  const catalog=await buildV7PublicLibraryCatalog({candidateSha:'a'.repeat(40),generatedAt:'2026-10-28T00:00:00Z'});
  const before=JSON.stringify(catalog);
  assert.deepEqual(libraryConversationSeries(catalog.items.find(row=>row.id==='devotional.biblequest.loneliness.01')).map(row=>row.id),['together']);
  assert.deepEqual(libraryConversationSeries(catalog.items.find(row=>row.id==='devotional.biblequest.anxiety_worry.01')).map(row=>row.id),['trust']);
  assert.equal(JSON.stringify(catalog),before);
});
