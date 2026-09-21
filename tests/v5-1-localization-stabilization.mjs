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
  'src/features/transform/localization.js',
  'src/content/locales/tl.js',
  'src/content/locales/ceb.js'
]) execFileSync(process.execPath,['--check',path.join(root,file)],{stdio:'pipe'});

const icons=read('src/ui/icons.js');
for(const icon of ['assignments','transform','notifications','tutorial'])
  assert.ok(icons.includes(`${icon}:`),`Missing semantic inline icon: ${icon}`);

const home=read('src/features/home/index.js');
for(const binding of ["icon: 'assignments'","iconSvg('transform'","iconSvg('notifications'","iconSvg('tutorial'","dailyPassageTitle(daily.passage,locale)"])
  assert.ok(home.includes(binding),`Home hotfix contract missing: ${binding}`);

const grow=read('src/features/progress/index.js');
for(const token of ["import { localization }","'progress.heading':'Ang iyong pag-unlad sa BibleQuest'","'progress.heading':'Imong pag-uswag sa BibleQuest'","t('progress.openTransform')"])
  assert.ok(grow.includes(token),`Grow localization contract missing: ${token}`);

const learn=read('src/features/learn/index.js');
for(const token of ["import { localization }","'learn.explorer':'Mga Tauhan at Lugar'","'learn.explorer':'Mga Tawo ug Lugar'","72 realistic cases · difficulty 4–8","data-open-explorer"])
  assert.ok(learn.includes(token),`Learn localization/new-feature contract missing: ${token}`);

const more=read('src/features/more/index.js');
for(const token of ["import { localization }","'More':'Higit pa'","'More':'Dugang'","'Personal Challenges':'Mga Personal na Hamon'","'Personal Challenges':'Personal nga mga Hagit'","adminAccess,onAdmin","onChallenges","localizeMore("])
  assert.ok(more.includes(token),`More localization/current-feature contract missing: ${token}`);

const transform=read('src/features/transform/index.js');
for(const token of ['createTransformLocalizer','local.spiritual(item)','local.personalityText(item)','local.bias(task)',"copy('scriptureHeading')"])
  assert.ok(transform.includes(token),`Transform localization contract missing: ${token}`);

const tlFile=read('src/content/locales/tl.js');
const cebFile=read('src/content/locales/ceb.js');
assert.ok(tlFile.includes("'nav.transformation': 'Pagbabago'"),'Tagalog nav Transformation is not localized.');
assert.ok(cebFile.includes("'nav.transformation':'Pagbag-o'"),'Cebuano nav Transformation is not localized.');

const tl=createTransformLocalizer('tl');
const ceb=createTransformLocalizer('ceb');
const spiritual={id:'word',dimension:'Scripture',text:'I regularly read Scripture carefully enough to understand context, not only isolated verses.'};
assert.equal(tl.spiritual(spiritual).dimension,'Kasulatan');
assert.match(tl.spiritual(spiritual).text,/Regular akong nagbabasa ng Kasulatan/);
assert.equal(ceb.spiritual(spiritual).dimension,'Kasulatan');
assert.match(ceb.spiritual(spiritual).text,/Kanunay akong mobasa sa Kasulatan/);
const personality={id:'E1',factor:'E',text:'I am the life of the party.'};
assert.notEqual(tl.personalityText(personality),personality.text);
assert.notEqual(ceb.personalityText(personality),personality.text);

console.log('PASS V5.1 localization stabilization static regression');
