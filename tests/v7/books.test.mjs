import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedBookUrl,renderBookMetadata} from '../../src/features/books/presentation.js';
import {parseV7ContentBundle} from '../../src/v7/content/contract.js';
const book=()=>({contentType:'book',publicationState:'published',review:{status:'approved'},rights:{status:'verified',allowedUses:['external_link']},source:{uri:'https://www.gutenberg.org/ebooks/131',creator:'John Bunyan'},sourceLocale:'en'});
test('Books links require approved publication and explicit external-link permission',()=>{
  assert.equal(approvedBookUrl(book()),'https://www.gutenberg.org/ebooks/131');
  for(const patch of [{publicationState:'pending_review'},{review:{status:'pending_review'}},{rights:{status:'unknown',allowedUses:['external_link']}},{rights:{status:'verified',allowedUses:['host_text']}},{contentType:'devotional'}])assert.equal(approvedBookUrl({...book(),...patch}),null);
});
test('Books links reject unsafe schemes, credentials and direct Gutenberg files',()=>{
  for(const uri of ['javascript:alert(1)','http://example.com/book','https://user:password@example.com/book','https://www.gutenberg.org/files/131/131-h.htm','https://www.gutenberg.org/ebooks/131?download=1'])assert.equal(approvedBookUrl({...book(),source:{uri}}),null);
});
test('book presentation escapes author metadata and marks external navigation',()=>{
  const html=renderBookMetadata({...book(),source:{...book().source,creator:'<script>alert(1)</script>'}});
  assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
  assert.match(html,/rel="noopener noreferrer"/);assert.match(html,/target="_blank"/);
});
test('representative book catalog retains real source identities and link-only approved publication',()=>{
  const bundle=parseV7ContentBundle(JSON.parse(readFileSync(new URL('../../data/v7/books/representative-catalog.json',import.meta.url))));
  assert.equal(bundle.items.length,2);
  for(const item of bundle.items){assert.equal(item.publicationState,'published');assert.equal(item.review.status,'approved');assert.equal(item.review.reviewer,'biblequest.v7.representative-policy-v1');assert.equal(item.source.kind,'external');assert.deepEqual(item.rights.allowedUses,['external_link']);assert.equal(item.sourceContent.body,undefined)}
});
