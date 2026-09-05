import {spawn,spawnSync} from 'node:child_process';

function run(cmd,args,timeout=180000){
  const r=spawnSync(cmd,args,{stdio:'inherit',timeout});
  if(r.error)throw r.error;
  if(r.status!==0)throw new Error(`${cmd} ${args.join(' ')} failed with status ${r.status}`);
}

async function waitForServer(url,attempts=30){
  for(let i=0;i<attempts;i++){
    try{const r=await fetch(url);if(r.ok)return}catch{}
    await new Promise(r=>setTimeout(r,500));
  }
  throw new Error(`Local BibleQuest server did not become ready at ${url}`);
}

console.log('BibleQuest production release gate');
run(process.execPath,['scripts/validate-release.mjs'],240000);

try{await import('playwright')}catch{
  throw new Error('Playwright is required for the production gate. Install locally with `npm install --no-save playwright` and `npx playwright install chromium`, then rerun this command.');
}

const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:['ignore','ignore','inherit']});
try{
  await waitForServer('http://127.0.0.1:4173/');
  for(const test of [
    'tests/browser-smoke.mjs',
    'tests/operational-entry-smoke.mjs',
    'tests/reader-resilience-smoke.mjs',
    'tests/layout-matrix-smoke.mjs',
    'tests/pwa-offline-smoke.mjs',
    'tests/completion-smoke.mjs',
    'tests/journey-loop-smoke.mjs',
    'tests/cloud-smoke.mjs'
  ])run(process.execPath,[test]);
} finally {
  server.kill('SIGTERM');
}

console.log('\nBibleQuest production release gate passed.');
