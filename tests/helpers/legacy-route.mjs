// V7 keeps legacy feature URLs while its five primary tabs have new owners.
// Use the hash router without reloading so leave/resume state remains under test.
export async function openLegacyRoute(page, route) {
  const tab = page.locator(`[data-route-link="${route}"]`);
  if (await tab.count()) await tab.click();
  else await page.evaluate(route => { location.hash = '/' + route; }, route);
  await page.waitForURL(url => url.hash === '#/' + route);
}
