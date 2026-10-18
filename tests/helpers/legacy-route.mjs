// V7 keeps legacy feature routes behind visible launchers in its five-tab shell.
// Exercise the real launchers without reloading so leave/resume stays under test.
export async function openLegacyRoute(page, route) {
  const tab = page.locator(`[data-route-link="${route}"]`);
  if (await tab.count()) await tab.click();
  else if (route === 'learn' || route === 'play') {
    await page.locator('[data-route-link="more"]').click();
    await page.locator(`[data-v7-you-hub] a[href="#/${route}"]`).click();
  } else if (route === 'grow') {
    await page.locator('[data-route-link="more"]').click();
    await page.locator('[data-v7-you-hub] a[href="#/my-journey"]').click();
    await page.locator('[data-my-journey-back]').click();
  } else throw new Error(`No tested launcher for retained route: ${route}`);
  await page.waitForURL(url => url.hash === '#/' + route);
}
