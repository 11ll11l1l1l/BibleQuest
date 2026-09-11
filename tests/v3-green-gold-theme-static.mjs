import fs from 'node:fs';
const failures=[];const fail=message=>failures.push(message);const read=file=>fs.readFileSync(file,'utf8');
const cssPath='src/ui/theme-green-gold.css';
if(!fs.existsSync(cssPath))fail(`Missing ${cssPath}`);
if(!failures.length){
  const css=read(cssPath),index=read('index.html');
  for(const token of['--bq-theme-green-900','--bq-theme-gold-600','--bq-theme-cream','.bq-brand-mark','.bq-primary-button','.bq-nav a[aria-current]','.bq-scripture-panel','.bq-world-region.is-next'])if(!css.includes(token))fail(`Theme contract missing ${token}`);
  for(const forbidden of['display:','grid-template','position:','width:','height:','min-height:','max-height:','padding:','margin:','gap:','transform:','animation:','transition:'])if(css.includes(forbidden))fail(`Theme layer must not own geometry or motion: ${forbidden}`);
  for(const forbidden of['url(','@import','javascript:','localStorage','sessionStorage','supabase','serviceWorker'])if(css.includes(forbidden))fail(`Theme layer must remain presentation-only: ${forbidden}`);
  if(!index.includes('<link rel="stylesheet" href="src/ui/theme-green-gold.css">'))fail('index.html must load the green-and-gold theme layer.');
  const themeIndex=index.indexOf('src/ui/theme-green-gold.css');
  const tutorialIndex=index.indexOf('src/ui/tutorial.css');
  const accessibilityIndex=index.indexOf('src/ui/accessibility.css');
  if(themeIndex<0||themeIndex<tutorialIndex)fail('Theme layer must load after accumulated feature CSS.');
  if(accessibilityIndex<0||themeIndex>accessibilityIndex)fail('Accessibility CSS must remain authoritative after the theme layer.');
}
if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 green-and-gold theme static contract passed.');
