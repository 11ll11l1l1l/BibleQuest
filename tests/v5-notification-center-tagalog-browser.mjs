import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = process.env.BQ_TEST_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
try {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const [{ notificationCenterPage }, { localization }] = await Promise.all([import('/src/features/notification-center/index.js'), import('/src/app/localization.js')]);
    localization.setLocale('tl');
    const item={id:'notice-1',title:'Runtime service title',body:'Runtime service body must stay unchanged.',type:'announcement',route:'#calendar',isRead:false,createdAt:new Date().toISOString()};
    let state={status:'ready',items:[item],unread:1};
    const notifications={snapshot:()=>state,load:async()=>state,refresh:async()=>state,markAllRead:async()=>state,setRead:async()=>state,openTarget:async()=>item.route};
    document.body.innerHTML='<main id="notification-root"></main>';
    const root=document.querySelector('#notification-root');
    const feature=notificationCenterPage({notifications});
    root.innerHTML=feature.html;
    feature.mount(root);
    window.__bqNotificationTitle=feature.title;
  });
  await page.waitForSelector('[data-notification-item]');
  assert.equal(await page.evaluate(()=>window.__bqNotificationTitle),'Sentro ng mga Abiso');
  assert.equal((await page.locator('.notification-center-header h1').textContent())?.trim(),'Sentro ng mga Abiso');
  assert.equal((await page.locator('[data-notification-open]').textContent())?.trim(),'Buksan');
  assert.equal((await page.locator('[data-notification-read]').textContent())?.trim(),'Markahan bilang nabasa');
  assert.equal(await page.getByText('Runtime service title',{exact:true}).count(),1,'runtime notification title must remain unchanged');
  assert.equal(await page.getByText('Runtime service body must stay unchanged.',{exact:true}).count(),1,'runtime notification body must remain unchanged');
  for(const leak of ['Notification Center','Mark all read','Mark read','Unread']) assert.equal(await page.getByText(leak,{exact:true}).count(),0,`Notification Center exposes migrated English UI text: ${leak}`);
  const geometry=await page.evaluate(()=>({innerWidth:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,minButtonHeight:Math.min(...[...document.querySelectorAll('[data-notification-open], [data-notification-read], [data-notification-refresh], [data-notification-back]')].map(node=>node.getBoundingClientRect().height))}));
  assert.ok(geometry.scrollWidth<=geometry.innerWidth+1,`Tagalog Notification Center overflows at 390px: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
  assert.ok(geometry.minButtonHeight>=44,`Notification Center touch target regressed below 44px: ${geometry.minButtonHeight}`);
  assert.deepEqual(pageErrors,[],`Browser page errors occurred: ${pageErrors.join(' | ')}`);
  console.log('BROWSER-AUTO PASS: Tagalog Notification Center chrome, payload preservation, 390px touch/overflow');
} finally { await browser.close(); }
