import fs from 'node:fs/promises';

const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const read=path=>fs.readFile(path,'utf8');

const [index,foundation,sectionH,offlineShell,pwaInstall,worker]=await Promise.all([
  read('index.html'),read('src/ui/v4-foundation.css'),read('src/ui/section-h-release-gates-v4.css'),
  read('src/app/offline-shell.js'),read('src/app/pwa-install.js'),read('offline-shell-sw.js')
]);
const manifest=JSON.parse(await read('manifest.webmanifest'));

assert(index.includes('width=device-width,initial-scale=1,viewport-fit=cover'),'Viewport must opt into safe-area aware rendering.');
assert(index.includes('src/ui/section-h-release-gates-v4.css'),'Section H presentation layer is not loaded.');
assert(index.indexOf('games-art-final-v4.css')<index.indexOf('section-h-release-gates-v4.css'),'Section H release-gate CSS must load after prior V4 presentation layers.');

for(const inset of ['safe-area-inset-top','safe-area-inset-right','safe-area-inset-bottom','safe-area-inset-left']){
  assert(sectionH.includes(`env(${inset})`),`Section H CSS is missing ${inset}.`);
}
assert(sectionH.includes('.bq-shell')&&sectionH.includes('.bq-topbar')&&sectionH.includes('.bq-nav'),'Safe-area contract must protect shell, top bar, and fixed navigation.');
assert(foundation.includes('@media(prefers-reduced-motion:reduce)'),'V4 foundation must honor prefers-reduced-motion.');
assert(foundation.includes('animation-duration:.01ms!important')&&foundation.includes('transition-duration:.01ms!important'),'Reduced-motion mode must effectively suppress animation and transition motion.');
assert(foundation.includes(':focus-visible')&&foundation.includes('outline:3px solid var(--focus)'),'V4 must provide a strong visible keyboard focus treatment.');

assert(manifest.id==='./'&&manifest.start_url==='./'&&manifest.scope==='./','Manifest id/start_url/scope must stay relative to the deployed app.');
assert(manifest.display==='standalone','Manifest must request standalone display mode.');
assert(typeof manifest.name==='string'&&manifest.name.length>0&&typeof manifest.short_name==='string'&&manifest.short_name.length>0,'Manifest requires installable names.');
const icon192=manifest.icons?.find(icon=>icon.sizes==='192x192'&&icon.type==='image/png');
const icon512=manifest.icons?.find(icon=>icon.sizes==='512x512'&&icon.type==='image/png'&&icon.purpose==='any');
const maskable=manifest.icons?.find(icon=>icon.sizes==='512x512'&&icon.type==='image/png'&&String(icon.purpose).includes('maskable'));
assert(icon192&&icon512&&maskable,'Manifest must expose 192, 512, and maskable PNG install icons.');
for(const icon of [icon192,icon512,maskable]){
  const stat=await fs.stat(icon.src);
  assert(stat.size>0,`Manifest icon ${icon.src} is missing or empty.`);
}

assert(offlineShell.includes("serviceWorker.register('offline-shell-sw.js',{scope:'./'})"),'Offline shell must register the scoped BibleQuest service worker.');
assert(offlineShell.includes("publish('ready')")&&offlineShell.includes('BIBLEQUEST_WARM_SHELL'),'Offline shell must expose ready state and warm the rendered shell.');
for(const eventName of ["'install'","'activate'","'fetch'","'message'"]){
  assert(worker.includes(`addEventListener(${eventName}`),`Offline worker is missing ${eventName} handling.`);
}
assert(worker.includes('BIBLEQUEST_WARM_SHELL'),'Offline worker must support shell warmup messages.');
assert(pwaInstall.includes("'(display-mode: standalone)'")&&pwaInstall.includes("'beforeinstallprompt'")&&pwaInstall.includes("'appinstalled'"),'PWA service must detect standalone launch and browser install lifecycle events.');

console.log('BibleQuest V4 Section H static contracts passed.');
