import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const feature=fs.readFileSync(new URL('../src/features/congregation/index.js',import.meta.url),'utf8');
const service=fs.readFileSync(new URL('../src/app/congregation-membership.js',import.meta.url),'utf8');

test('congregation page consumes the integrated active-congregation owner',()=>{
  assert.match(feature,/membership\.getActive\(\)/);
  assert.match(feature,/membership\.setActive\(/);
  assert.match(feature,/membership\.list\(\)/);
  assert.match(service,/return Object\.freeze\(\{load,join,list,get,getActive,setActive,/);
});

test('multiple memberships expose an explicit visible switch action',()=>{
  assert.match(feature,/const switchable=rows\.length>1/);
  assert.match(feature,/data-congregation-switch=/);
  assert.match(feature,/Use \$\{escapeHtml\(row\.congregation\.name\)\}/);
});

test('current membership is visibly marked and is not rendered as a switch target',()=>{
  assert.match(feature,/data-congregation-active aria-current="true">Active congregation/);
  assert.match(feature,/const isActive=row\.congregationId===activeId/);
  assert.match(feature,/isActive\s*\?'<p class="bq-form-message"/);
});

test('switching uses the selected membership id then rerenders from service state',()=>{
  assert.match(feature,/switchButton\.getAttribute\('data-congregation-switch'\)/);
  assert.match(feature,/const active=membership\.setActive/);
  assert.match(feature,/render\(membership\.list\(\)\)/);
  assert.match(feature,/Active congregation changed to \$\{active\.congregation\.name\}\./);
});

test('rejected switching remains visible and fail-closed',()=>{
  assert.match(service,/BQ_CONGREGATION_NOT_MEMBER/);
  assert.match(service,/BQ_CONGREGATION_CONTEXT_STALE/);
  assert.match(feature,/catch\(error\)\{setMessage\(error\?\.message\|\|'Could not switch active congregation\.'\)\}/);
});

test('tranche does not create local active-congregation persistence',()=>{
  assert.doesNotMatch(feature,/localStorage|sessionStorage|indexedDB|activeCongregationId\s*=/i);
  assert.match(feature,/membership\.getActive\(\)/);
});
