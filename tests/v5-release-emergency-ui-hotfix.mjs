import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTransformLocalizer } from '../src/features/transform/localization.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFileSync(path.join(root,relative),'utf8');

for(const file of[
  'src/ui/icons.js',
  'src/features/home/index.js',
  'src/features/progress/index.js',
  'src/features/learn/index.js',
  'src/features/more/index.js',
  'src/features/transform/index.js',
  'src/features/transform/localization.js'
]){
  execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});
}

const css=read('src/ui/home-v4.css');
assert.match(css,/\.bq-home-tile-icon \.bq-icon\{[^}]*width:20px!important[^}]*visibility:visible!important/s,'Home tile vectors must have an explicit visible mobile size.');
assert.match(css,/\.bq-home-tile-icon \.bq-icon path/,'Home icon child strokes must have an explicit visibility guard.');

const icons=read('src/ui/icons.js');
for(const icon of ['assignments','transform','notifications','tutorial'])assert.ok(icons.includes(`${icon}: \``),`Missing semantic inline icon: ${icon}`);

const home=read('src/features/home/index.js');
for(const binding of ["icon: 'assignments'","iconSvg('transform'","iconSvg('notifications'","iconSvg('tutorial'"])assert.ok(home.includes(binding),`Home is missing semantic icon binding: ${binding}`);

for(const title of ['Makinig at Gawin','Paminaw ug Buhata'])assert.ok(home.includes(title),`Home Daily Journey localized title missing: ${title}`);

const grow=read('src/features/progress/index.js');
for(const token of ["import { localization }","'progress.heading':'Ang iyong pag-unlad sa BibleQuest'","'progress.heading':'Imong pag-uswag sa BibleQuest'","t('progress.openTransform')"])assert.ok(grow.includes(token),`Grow localization contract missing: ${token}`);

const learn=read('src/features/learn/index.js');
for(const token of ["import { localization }","'learn.study':'Gabay na Pag-aaral'","'learn.study':'Gigiyahang Pagtuon'","t('learn.title')"])assert.ok(learn.includes(token),`Learn localization contract missing: ${token}`);

const more=read('src/features/more/index.js');
for(const token of ["import { localization }","'More':'Higit pa'","'More':'Dugang'","localizeMore("])assert.ok(more.includes(token),`More localization contract missing: ${token}`);

const transform=read('src/features/transform/index.js');
for(const token of ['createTransformLocalizer','local.spiritual(item)','local.personalityText(item)','local.bias(task)',"copy('scriptureHeading')"])assert.ok(transform.includes(token),`Transform localized rendering contract missing: ${token}`);

const tl=createTransformLocalizer('tl');
const ceb=createTransformLocalizer('ceb');
const canonicalSpiritual={id:'word',dimension:'Scripture',text:'I regularly read Scripture carefully enough to understand context, not only isolated verses.'};
assert.equal(tl.spiritual(canonicalSpiritual).dimension,'Kasulatan');
assert.match(tl.spiritual(canonicalSpiritual).text,/Regular akong nagbabasa ng Kasulatan/);
assert.equal(ceb.spiritual(canonicalSpiritual).dimension,'Kasulatan');
assert.match(ceb.spiritual(canonicalSpiritual).text,/Kanunay akong mobasa sa Kasulatan/);

const personality={id:'E1',factor:'E',text:'I am the life of the party.'};
assert.notEqual(tl.personalityText(personality),personality.text,'Tagalog personality prompt must not fall back to English.');
assert.notEqual(ceb.personalityText(personality),personality.text,'Cebuano personality prompt must not fall back to English.');

const bias={id:'sunk',title:'Past cost vs. future value',scenario:'canonical',options:['a','b','c'],signal:'Sunk-cost thinking',practice:'canonical'};
assert.notEqual(tl.bias(bias).scenario,bias.scenario,'Tagalog thinking-pattern scenario must be localized.');
assert.notEqual(ceb.bias(bias).scenario,bias.scenario,'Cebuano thinking-pattern scenario must be localized.');

const migration=read('supabase/migrations/20260917032935_add_media_categories.sql');
assert.match(migration,/add column if not exists category text not null default 'other'/,'Media category migration must remain present.');
assert.match(migration,/bible_media_library_category_idx/,'Media category index migration must remain present.');

console.log('BibleQuest V5 emergency release UI/data hotfix regression passed.');
