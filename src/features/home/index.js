export function homePage() {
  return {
    title: 'Home',
    html: `
      <section class="bq-hero">
        <div>
          <p class="bq-eyebrow">Stable foundation</p>
          <h1>BibleQuest</h1>
          <p>The v3 rebuild is restoring the original feature set one verified capability at a time.</p>
        </div>
        <img src="assets/bq-pinoy-japan-hero.svg" alt="" aria-hidden="true">
      </section>
      <section class="bq-panel">
        <h2>Rebuild status</h2>
        <p>Shell, navigation, global state, and storage boundaries are the first milestone. Features remain marked Not started until their clean implementation is added and verified.</p>
      </section>`
  };
}

export function pendingPage(name) {
  return {
    title: name,
    html: `<section class="bq-panel"><p class="bq-eyebrow">Feature migration</p><h1>${name}</h1><p>This feature is intentionally not migrated yet. It will not be marked implemented until its clean workflow exists on the v3 architecture.</p></section>`
  };
}
