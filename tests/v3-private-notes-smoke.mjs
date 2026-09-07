import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.private-notes')||'{}'));

async function readDownload(download){
  const stream=await download.createReadStream();let text='';
  for await(const chunk of stream)text+=chunk.toString('utf8');
  return text;
}

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});await page.locator('[data-route-link="learn"]').click();await page.waitForURL(/#\/learn$/);await page.locator('[data-open-private-notes]').waitFor();
  assert((await page.locator('[data-open-private-notes]').textContent())?.includes('Private Notes'),'Learn page does not expose Private Notes.');
  await page.locator('[data-open-private-notes]').click();await page.waitForURL(/#\/private-notes$/);await page.locator('[data-note-new]').waitFor();
  let metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-private-notes-view] button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Private Notes overview mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Private Notes overview touch target below 44px: ${metrics.minTarget}px.`);
  const privacy=(await page.locator('[data-private-notes-view]').textContent())||'';assert(privacy.includes('does not upload or sync'),'Private Notes must state the local-only privacy boundary.');

  await page.locator('[data-note-new]').click();await page.locator('[data-note-form]').waitFor();await page.locator('input[name="title"]').fill('Romans observation');await page.locator('textarea[name="body"]').fill('Nothing can separate us from the love of God.');await page.locator('[data-note-form] button[type="submit"]').click();await page.locator('[data-note-open]').waitFor();
  let stored=await state(page);assert(stored.notes?.length===1&&stored.notes[0]?.title==='Romans observation','Private Notes create did not persist through the shared browser storage boundary.');const id=stored.notes[0].id;

  await page.reload({waitUntil:'networkidle'});await page.locator('[data-note-open]').waitFor();stored=await state(page);assert(stored.notes?.length===1&&stored.notes[0]?.id===id,'Private Notes did not survive browser reload.');
  await page.locator(`[data-note-open="${id}"]`).click();await page.locator('[data-note-form]').waitFor();assert(await page.locator('textarea[name="body"]').inputValue()==='Nothing can separate us from the love of God.','Reloaded Private Notes editor lost the saved body.');await page.locator('textarea[name="body"]').fill('Updated private study observation.');await page.locator('[data-note-form] button[type="submit"]').click();await page.locator('[data-note-open]').waitFor();stored=await state(page);assert(stored.notes?.[0]?.body==='Updated private study observation.','Private Notes edit did not persist.');

  const downloadPromise=page.waitForEvent('download');await page.locator('[data-note-export]').click();const download=await downloadPromise;assert(/^biblequest-private-notes-\d{4}-\d{2}-\d{2}\.json$/.test(download.suggestedFilename()),'Private Notes export filename is not stable and recognizable.');const exported=JSON.parse(await readDownload(download));assert(exported.schema==='biblequest.private-notes'&&exported.notes?.length===1&&exported.notes[0]?.body==='Updated private study observation.','Private Notes exported JSON does not match saved local state.');

  await page.locator(`[data-note-open="${id}"]`).click();await page.locator('[data-note-delete]').waitFor();page.once('dialog',dialog=>dialog.accept());await page.locator('[data-note-delete]').click();await page.locator('[data-note-new]').waitFor();stored=await state(page);assert(stored.notes?.length===0,'Private Notes delete did not persist.');assert((await page.locator('[data-private-notes-view]').textContent())?.includes('No private notes yet'),'Private Notes empty state did not return after deletion.');
  metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-private-notes-view] button')].map(node=>node.getBoundingClientRect().height))}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Private Notes final mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Private Notes final touch target below 44px: ${metrics.minTarget}px.`);assert(errors.length===0,`Unexpected Private Notes console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Private Notes browser regression passed.')}finally{await browser.close()}
