import fs from 'node:fs';
const failures=[];const fail=message=>failures.push(message);const read=file=>fs.readFileSync(file,'utf8');
const required=['PWA_INSTALL_V3.md','manifest.webmanifest','index.html','app-icon.svg','src/app/pwa-install.js','src/app/bootstrap.js','src/features/more/index.js'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing PWA install file: ${file}`);
if(!failures.length){
  const manifest=JSON.parse(read('manifest.webmanifest')),index=read('index.html'),owner=read('src/app/pwa-install.js'),bootstrap=read('src/app/bootstrap.js'),more=read('src/features/more/index.js'),icon=read('app-icon.svg'),inventory=read('FEATURE_INVENTORY_V3.md');
  for(const [key,value] of Object.entries({id:'./',start_url:'./',scope:'./',display:'standalone',theme_color:'#f6f7f2',background_color:'#f6f7f2'}))if(manifest[key]!==value)fail(`Manifest ${key} must equal ${value}.`);
  if(manifest.name!=='BibleQuest'||manifest.short_name!=='BibleQuest'||manifest.lang!=='en-PH')fail('Manifest identity fields are invalid.');
  if(!manifest.icons?.some(item=>item.src==='app-icon.svg'&&item.sizes==='any'&&item.type==='image/svg+xml'))fail('Manifest must declare the scalable BibleQuest SVG icon truthfully.');
  if(!/viewBox="0 0 512 512"/.test(icon))fail('BibleQuest install icon must retain its 512-square viewBox.');
  if(!index.includes('<link rel="manifest" href="manifest.webmanifest">'))fail('The v3 shell must link the deployment-relative manifest.');
  for(const contract of['createPwaInstallService','beforeinstallprompt','appinstalled','preventDefault','userChoice','dispose'])if(!owner.includes(contract))fail(`PWA install owner missing contract ${contract}.`);
  for(const contract of['createPwaInstallService','pwaInstall.dispose()','morePage({pwaInstall'])if(!bootstrap.includes(contract))fail(`Bootstrap missing PWA install composition: ${contract}.`);
  if(!more.includes('data-install-app')||!more.includes('pwaInstall?.subscribe')||!more.includes('pwaInstall?.prompt'))fail('More must present and forward the PWA owner contract.');
  for(const forbidden of['serviceWorker','caches.','CacheStorage','fetch(','localStorage','sessionStorage','window.BQ'])if(owner.includes(forbidden)||bootstrap.includes(forbidden))fail(`#97 must not own offline/global behavior: ${forbidden}`);
  if(/serviceWorker|(?:src|href)="(?:\.\/)?(?:sw\.js|pwa-runtime\.js)"/.test(index))fail('#97 v3 entrypoint must not register or load a service worker before #98.');
  if(!inventory.includes('| 97 | PWA install/manifest | Yes | Clean | Not started |'))fail('#97 must remain Not started until the complete functional suite passes.');
}
if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 PWA install architecture boundary passed.');
