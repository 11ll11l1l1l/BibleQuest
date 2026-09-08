import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const DOWNLOAD='/tmp/biblequest-v3-backup-test.json';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});

try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
  await page.goto(`${BASE}#/reader`,{waitUntil:'networkidle'});
  await page.locator('[data-reader-page] h1',{hasText:'Bible Reader'}).waitFor();
  await page.locator('[data-reader-translation]').selectOption('bsb');
  await page.locator('[data-reader-book]').selectOption('GEN');
  await page.locator('[data-reader-chapter]').selectOption('1');
  await page.locator('[data-verse="1"]').waitFor();
  await page.locator('[data-reader-mark]').click();
  await page.locator('[data-reader-mark]',{hasText:'Marked read'}).waitFor();
  await page.evaluate(()=>{
    localStorage.setItem('biblequest.v3.device-id',JSON.stringify('11111111-1111-4111-8111-111111111111'));
    localStorage.setItem('biblequest.v3.auth.test-session','secret-auth');
    localStorage.setItem('unrelated.site.key','keep');
  });

  await page.goto(`${BASE}#/more`,{waitUntil:'networkidle'});
  await page.locator('[data-open-backup]').click();
  await page.waitForURL(/#\/backup$/);
  await page.locator('[data-backup-page] h1',{hasText:'Backup & reset'}).waitFor();
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Backup page mobile horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);

  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-backup-export]').click()]);
  await download.saveAs(DOWNLOAD);
  const backupText=fs.readFileSync(DOWNLOAD,'utf8');
  const payload=JSON.parse(backupText);
  assert(payload.format==='biblequest-v3-local-backup'&&payload.version===1,'Downloaded backup format/version is wrong.');
  assert(payload.entries.some(entry=>entry.name==='progress-state'),'Downloaded backup did not contain progress state.');
  assert(payload.entries.some(entry=>entry.name==='reader-state'),'Downloaded backup did not contain reader state.');
  assert(!backupText.includes('device-id')&&!backupText.includes('secret-auth'),'Downloaded backup leaked device/auth identity.');

  page.once('dialog',dialog=>dialog.accept());
  const resetLoad=page.waitForEvent('load');
  await page.locator('[data-backup-reset]').click();
  await resetLoad;
  await page.locator('[data-backup-page] h1',{hasText:'Backup & reset'}).waitFor();
  const afterReset=await page.evaluate(()=>({
    progress:localStorage.getItem('biblequest.v3.progress-state'),
    reader:localStorage.getItem('biblequest.v3.reader-state'),
    device:localStorage.getItem('biblequest.v3.device-id'),
    auth:localStorage.getItem('biblequest.v3.auth.test-session'),
    unrelated:localStorage.getItem('unrelated.site.key')
  }));
  assert(afterReset.progress===null&&afterReset.reader===null,'Reset left portable Reader/Progress state behind.');
  assert(afterReset.device?.includes('11111111')&&afterReset.auth==='secret-auth'&&afterReset.unrelated==='keep','Reset disturbed device/auth/unrelated storage.');

  await page.goto(`${BASE}#/grow`,{waitUntil:'networkidle'});
  await page.locator('[data-progress-page-xp]').waitFor();
  assert((await page.locator('[data-progress-page-xp]').textContent()).trim()==='0','Reset state did not rehydrate as zero XP.');

  await page.goto(`${BASE}#/backup`,{waitUntil:'networkidle'});
  await page.locator('[data-backup-file]').setInputFiles(DOWNLOAD);
  const importLoad=page.waitForEvent('load');
  await page.locator('[data-backup-import]').click();
  await importLoad;
  await page.locator('[data-backup-page] h1',{hasText:'Backup & reset'}).waitFor();
  const afterImport=await page.evaluate(()=>({device:localStorage.getItem('biblequest.v3.device-id'),auth:localStorage.getItem('biblequest.v3.auth.test-session'),unrelated:localStorage.getItem('unrelated.site.key')}));
  assert(afterImport.device?.includes('11111111')&&afterImport.auth==='secret-auth'&&afterImport.unrelated==='keep','Import disturbed excluded storage.');

  await page.goto(`${BASE}#/grow`,{waitUntil:'networkidle'});
  await page.locator('[data-progress-page-xp]').waitFor();
  assert((await page.locator('[data-progress-page-xp]').textContent()).trim()==='10','Import did not restore the original +10 XP progress state.');
  assert((await page.locator('[data-progress-page-chapters]').textContent()).trim()==='1','Import did not restore the original chapter-read counter.');
  await page.goto(`${BASE}#/reader`,{waitUntil:'networkidle'});
  await page.locator('[data-reader-mark]',{hasText:'Marked read'}).waitFor();
  assert(await page.locator('[data-reader-book]').inputValue()==='GEN'&&await page.locator('[data-reader-chapter]').inputValue()==='1','Import did not restore Reader passage/read state.');

  await page.close();
  console.log('BibleQuest v3 Backup/export/import/reset mobile browser regression passed.');
}finally{
  if(fs.existsSync(DOWNLOAD))fs.unlinkSync(DOWNLOAD);
  await browser.close();
}
