import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const heroPath=path.join(root,'assets','bq-pinoy-japan-hero.svg');
const hero=fs.readFileSync(heroPath,'utf8');
const home=fs.readFileSync(path.join(root,'src','features','home','index.js'),'utf8');
const appCss=fs.readFileSync(path.join(root,'src','ui','app.css'),'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

assert(hero.includes('<svg')&&hero.includes('</svg>'),'Home hero artwork must remain a complete SVG document');
assert(hero.includes('viewBox="0 0 1100 619"'),'Home hero artwork must retain the established 1100×619 viewBox');
assert(!hero.includes('+ b64 +')&&!hero.includes('data:image'),'Home hero artwork must be self-contained and must not contain a broken embedded-raster placeholder');
assert(!/<script\b/i.test(hero)&&!/<foreignObject\b/i.test(hero)&&!/javascript:/i.test(hero),'Home hero artwork must remain inert visual content');
const v7 = home.includes('class="bq-hero bq-v7-home-feature"');
assert(v7 || home.includes('<section class="bq-hero">'),
  'Home must retain a coherent semantic hero structure');
if (v7) {
  const v7Css=fs.readFileSync(path.join(root,'src','ui','v7-home-feature.css'),'utf8');
  assert(home.includes('data-home-feature') && home.includes('data-home-hero-reader') &&
    home.includes('<h1>BibleQuest</h1>'),
    'V7 Home must provide a readable branded heading and real Bible action');
  assert(home.includes('data-home-cover data-art-source="fallback" src="assets/bq-pinoy-japan-hero.svg" alt="" aria-hidden="true"'),
    'V7 Home must preserve its inert decorative SVG when no audited cover exists');
  assert(v7Css.includes('linear-gradient') && v7Css.includes('.bq-v7-home-feature__action'),
    'V7 Home must have a readable editorial fallback with a prominent action');
} else {
  assert(home.includes('<img src="assets/bq-pinoy-japan-hero.svg" alt="" aria-hidden="true">'),
    'Legacy Home must retain the decorative asset path');
  assert(home.includes('Explore · Learn · Grow'),'Legacy Home hero must use public-facing copy');
}
assert(!home.includes('Rebuild and verify')&&!home.includes('clean v3 rebuild restores'),'Home hero must not expose internal rebuild language');
assert(appCss.includes('.bq-hero img{width:100%;max-height:150px;object-fit:contain;object-position:right bottom}'),'Home hero artwork containment contract must remain unchanged');
assert(appCss.includes('@media(max-width:480px){')&&appCss.includes('.bq-hero{min-height:158px;padding:18px;grid-template-columns:minmax(0,1fr) minmax(95px,31%)}'),'Home hero mobile containment contract must remain present');

console.log('BibleQuest v3 Home visual polish static contract passed.');
