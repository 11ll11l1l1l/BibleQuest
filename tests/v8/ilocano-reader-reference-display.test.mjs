import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { displayIlocanoReaderReference, displayIlocanoReaderSearch } from '../../src/features/reader/ilocano-reference-display.js';

test('Ilocano Reader uses publisher book titles for a chapter, verse and verse-range display only', () => {
  assert.equal(displayIlocanoReaderReference({ code: 'JHN' }, 3), 'Juan 3');
  assert.equal(displayIlocanoReaderReference({ code: 'JHN' }, 3, 16), 'Juan 3:16');
  assert.equal(displayIlocanoReaderReference({ code: 'PSA' }, 23, 1, 3), 'Dagiti Salmo 23:1–3');
  assert.equal(displayIlocanoReaderReference({ code: 'REV' }, 21, 4), 'Paltiing 21:4');
  for (const [book, chapter, verse, end] of [
    [{code:'UNKNOWN'}, 1, 1, null], [{code:'JHN'}, 0, 1, null],
    [{code:'JHN'}, 3, 0, null], [{code:'JHN'}, 3, 17, 16],
  ]) assert.equal(displayIlocanoReaderReference(book, chapter, verse, end, 'Original 3:16'), 'Original 3:16');
});

test('Ilocano search labels are presentation-only; verse texts, index, frozen provider hits and canonical codes stay intact', () => {
  const hit = Object.freeze({book: Object.freeze({code:'JHN',name:'John',chapters:21}),
    chapter:3,verse:16,reference:'John 3:16',text:'Source wording unchanged'});
  const hitRange = Object.freeze({book: Object.freeze({code:'PSA',name:'Psalms',chapters:150}),
    chapter:23,verse:1,verseEnd:3,reference:'Psalms 23:1–3',text:'Another original verse'});
  const result = Object.freeze({query:'Juan 3:16',type:'reference',
    results:Object.freeze([hit,hitRange]),skippedBooks:Object.freeze([])});
  const localized = displayIlocanoReaderSearch(result);
  assert.deepEqual(localized.results.map(row=>row.reference), ['Juan 3:16', 'Dagiti Salmo 23:1–3']);
  assert.equal(localized.results[0].book, hit.book);
  assert.equal(localized.results[0].verse, 16);
  assert.equal(localized.results[0].text, hit.text);
  assert.equal(localized.results[1].verseEnd, 3);
  assert.equal(result.results[0].reference,'John 3:16');
  assert.equal(result.results[1].reference,'Psalms 23:1–3');
  assert.equal(displayIlocanoReaderSearch(null),null);
});

test('live Reader wiring localizes only Ilocano search/peek and exposes truthful source language scope',async()=>{
  const source=await readFile(new URL('../../src/features/reader/index.js',import.meta.url),'utf8');
  assert.match(source,/reader\.getState\(\)\.translation === 'ilo' \? displayIlocanoReaderSearch\(searchResults\)/);
  assert.match(source,/displayIlocanoReaderReference\(\{ code: reader\.getState\(\)\.book \}, reader\.getState\(\)\.chapter, peek\.verse/);
  assert.match(source,/data-reader-ilocano-scope/);
  assert.match(source,/\.setAttribute\('lang', 'ilo'\)/);
  assert.match(source,/Juan 3:16 or an Ilocano phrase/);
  assert.match(source,/other app controls remain in English/);
  assert.match(source,/reader\.openSearchResult\(result\)/,'canonical search hit remains the navigation source');
});
