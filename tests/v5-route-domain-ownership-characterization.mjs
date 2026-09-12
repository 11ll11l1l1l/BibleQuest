import fs from 'node:fs';
import assert from 'node:assert/strict';

const bootstrap=fs.readFileSync('src/app/bootstrap.js','utf8');
const router=fs.readFileSync('src/app/router.js','utf8');
const session=fs.readFileSync('src/app/session.js','utf8');

const routesBlock=bootstrap.match(/const routes=Object\.freeze\(\{([\s\S]*?)\n  \}\);\n  const showRecovery=/)?.[1];
assert.ok(routesBlock,'bootstrap must expose one frozen route table before recovery/router wiring');

const routeGroups=Object.freeze({
  shell:['home','more','help','accessibility','backup','account'],
  learn:['learn','reader','study','deep-questions','story-journey','wisdom-situations','adaptive-learning','bible-world','open-review','private-notes','cloud-notes'],
  growth:['mission','grow','transform','personality-profile','psychometrics','avatar-vault','my-mission','calendar'],
  play:['play'],
  community:['community','live-rooms','journey-groups','encouragements','congregation','team-center','leaderboards','recognition','assignments','content-review','ministry-hub','notification-center','workspace'],
  media:['recordings','media'],
  couples:['couples-family','couples-cloud'],
  fallback:['not-found']
});

const hasRoute=route=>{
  const escaped=route.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`(?:^|[,\\n]\\s*)(?:'${escaped}'|${escaped}):\\s*\\(\\)=>`).test(routesBlock);
};

for(const [domain,routes] of Object.entries(routeGroups)){
  for(const route of routes)assert.ok(hasRoute(route),`V4 parity route ${route} (${domain}) must remain registered during V5 migration`);
}

const allRoutes=Object.values(routeGroups).flat();
assert.equal(new Set(allRoutes).size,allRoutes.length,'characterized route inventory must not contain duplicates');

const ownershipContracts=[
  ['router','./router.js','createRouter','createRouter({routes'],
  ['session','./session.js','createSessionService','createSessionService({auth:api.auth,store})'],
  ['reader service','./reader.js','createReaderService','createReaderService({bible,storage,progress})'],
  ['games service','./games.js','createGameLauncherService','createGameLauncherService({progress,storage,recall,moderation:contentModeration})'],
  ['audio/media owner','./audio.js','createAudioManager','createAudioManager()'],
  ['PWA install owner','./pwa-install.js','createPwaInstallService','createPwaInstallService()'],
  ['offline shell owner','./offline-shell.js','createOfflineShellService','createOfflineShellService()']
];
for(const [label,modulePath,symbol,wiring] of ownershipContracts){
  assert.ok(bootstrap.includes(`import { ${symbol} } from '${modulePath}';`),`${label} must keep an explicit bootstrap import seam`);
  assert.ok(bootstrap.includes(wiring),`${label} must keep a single explicit bootstrap construction seam`);
}

assert.match(router,/const NAVIGATION_REQUEST='bq:navigation-request'/,'router must retain the canonical navigation-request event');
assert.match(router,/Object\.prototype\.hasOwnProperty\.call\(routes, requested\) \? requested : 'not-found'/,'unknown routes must resolve through the not-found owner');
assert.match(router,/history\.pushState\(null, '', next\)/,'router navigation must remain history-backed');
assert.match(router,/history\.replaceState\(null, '', '#\/home'\)/,'empty location must still normalize to home');

assert.match(session,/store\.setState\(current => \(\{ \.\.\.current, session: state \}\)\)/,'session state must publish through the shared store owner');
assert.match(session,/const beforeSignOutListeners = new Set\(\)/,'session must retain centralized sign-out cleanup ownership');
assert.match(session,/await Promise\.allSettled\(cleanups\)/,'sign-out cleanup must complete without one listener suppressing the rest');
assert.match(session,/finally \{ toGuest\(\); \}/,'sign-out must always publish guest state');

assert.match(bootstrap,/router\.start\(\)/,'bootstrap must start the router after shell/store wiring');
assert.match(bootstrap,/offlineShell\.start\(\)\.catch\(/,'bootstrap must remain the owner that starts offline-shell integration');
assert.match(bootstrap,/session\.boot\(\)\.then\(/,'bootstrap must remain the owner that starts session boot');
assert.match(bootstrap,/window\.addEventListener\('pagehide'/,'bootstrap must retain one lifecycle teardown boundary');

console.log(`V5 route/domain characterization present · ${allRoutes.length} routes · core router/session/Reader/Games/media/PWA seams characterized`);
