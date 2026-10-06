import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page=readFileSync(new URL('../../src/features/content-review/index.js',import.meta.url),'utf8');
const api=readFileSync(new URL('../../src/core/api.js',import.meta.url),'utf8');

test('Lane B Content Review exposes three distinct V7 Library audit tabs',()=>{
  for(const label of ['Books','Devotionals','Past Teachings'])assert.ok(page.includes(label),`missing ${label} audit tab`);
  assert.ok(page.includes('Recall quarantine'));
  assert.ok(page.includes('Member reports'));
  assert.ok(page.includes('Library audit remains available'));
});

test('Lane B audit cards expose source, rights, translations, Scripture and automated evidence',()=>{
  for(const marker of ['<b>Source</b>','<b>Rights</b>','EN / TL / CEB / ILO content','Scripture / references','Automated criteria and evidence','Decision evidence']){
    assert.ok(page.includes(marker),`missing review evidence surface: ${marker}`);
  }
});

test('Lane B preserves explicit post-release human override actions',()=>{
  assert.ok(page.includes('>Approve</button>'));
  assert.ok(page.includes('>Request Changes</button>'));
  assert.ok(page.includes('>Reject</button>'));
  assert.ok(page.includes("data-library-review-decide"));
});

test('shared API reads the global Library queue and writes only explicit human audit rows from the client',()=>{
  for(const table of ['v7_library_items','v7_library_revisions','v7_library_translations','v7_library_revision_taxonomy','v7_library_taxonomy','v7_library_review_decisions']){
    assert.ok(api.includes(`.from('${table}')`),`missing Library review API table ${table}`);
  }
  assert.ok(api.includes('saveLibraryHumanDecision'));
  assert.ok(api.includes("client.from('v7_library_review_decisions').insert(row)"));
});
