import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { filterRecordingRows,RECORDING_CATEGORY_LABELS } from '../src/features/recordings/index.js';
import { RECORDING_CATEGORIES } from '../src/app/recordings.js';

assert.deepEqual(Object.keys(RECORDING_CATEGORY_LABELS),RECORDING_CATEGORIES);
const rows=[
  {id:'1',title:'Sunday',description:'',featured:true,category:'sunday-service'},
  {id:'2',title:'Study',description:'Romans',featured:false,category:'bible-study'},
  {id:'3',title:'Story',description:'Grace',featured:false,category:'testimony'}
];
assert.deepEqual(filterRecordingRows(rows,{category:'bible-study'}).map(row=>row.id),['2']);
assert.deepEqual(filterRecordingRows(rows,{category:'sunday-service',featuredOnly:true}).map(row=>row.id),['1']);
assert.deepEqual(filterRecordingRows(rows,{category:'testimony',query:'grace'}).map(row=>row.id),['3']);

const [migration,api,service,page]=await Promise.all([
  readFile(new URL('../supabase/migrations/20260917032935_add_media_categories.sql',import.meta.url),'utf8'),
  readFile(new URL('../src/core/api.js',import.meta.url),'utf8'),
  readFile(new URL('../src/app/recordings.js',import.meta.url),'utf8'),
  readFile(new URL('../src/features/recordings/index.js',import.meta.url),'utf8')
]);
assert.match(migration,/add column if not exists category/);
assert.match(migration,/bible_media_library_category_idx/);
assert.match(api,/media_type,category/);
assert.match(service,/category:cleanCategory/);
assert.match(page,/data-recordings-category-filter/);
assert.doesNotMatch(service,/title.*includes|description.*includes/i,'Categories must not be guessed from title or description.');
console.log('BibleQuest v5 metadata-backed Media categories regression passed.');
