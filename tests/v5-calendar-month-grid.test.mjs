import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const page=await readFile(new URL('../src/features/calendar/index.js',import.meta.url),'utf8');
const css=await readFile(new URL('../src/ui/calendar.css',import.meta.url),'utf8');

test('Calendar renders a semantic seven-column month grid with navigation',()=>{
  assert.match(page,/data-calendar-month-prev/);
  assert.match(page,/data-calendar-month-next/);
  assert.match(page,/role="grid"/);
  assert.match(page,/role="gridcell"/);
  assert.match(page,/\['Sun','Mon','Tue','Wed','Thu','Fri','Sat'\]/);
  assert.match(css,/grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
});

test('month grid reuses existing agenda event sources instead of adding data ownership',()=>{
  assert.match(page,/const eventsByDate=new Map\(agenda\.map/);
  assert.match(page,/event\.source/);
  for(const source of ['personal','assignment','congregation']){
    assert.match(page,new RegExp(`bq-calendar-month-dot--${source}`));
    assert.match(css,new RegExp(`\\.bq-calendar-month-dot--${source}`));
  }
});

test('existing Calendar mutations remain owned by the Calendar service',()=>{
  for(const owner of ['calendar.addEvent','calendar.updateCongregationEvent','calendar.removeEvent','calendar.removeCongregationEvent']){
    assert.ok(page.includes(owner),`missing existing owner ${owner}`);
  }
  assert.doesNotMatch(page,/fetch\s*\(/);
  assert.doesNotMatch(page,/supabase/i);
});

test('month cells expose event counts and titles accessibly',()=>{
  assert.match(page,/aria-label="\$\{esc\(fmt\(iso\)\)\}/);
  assert.match(page,/bq-sr-only/);
  assert.match(page,/title="\$\{esc\(event\.title\)\}"/);
});

test('mobile month grid keeps bounded cell geometry',()=>{
  assert.match(css,/@media \(max-width:480px\)/);
  assert.match(css,/\.bq-calendar-month-cell\{min-height:48px;padding:4px\}/);
});
