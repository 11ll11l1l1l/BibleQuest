(() => {
  const STORAGE_KEY = 'biblequest_translation_v1';
  const VERSIONS = {
    BSB: {
      code: 'BSB',
      name: 'Berean Standard Bible',
      mode: 'bundled',
      note: 'Full in-app reader · on-demand book packs'
    },
    NLT: {
      code: 'NLT',
      name: 'New Living Translation',
      mode: 'live',
      note: 'Live in-app text · official Tyndale API'
    },
    ESV: {
      code: 'ESV',
      name: 'English Standard Version',
      mode: 'licensed-link',
      note: 'Selectable · opens the official ESV reader'
    },
    NIV: {
      code: 'NIV',
      name: 'New International Version',
      mode: 'licensed-link',
      note: 'Selectable · opens a licensed NIV reader'
    },
    AMP: {
      code: 'AMP',
      name: 'Amplified Bible',
      mode: 'licensed-link',
      note: 'Selectable · opens a licensed AMP reader'
    }
  };

  window.BQ_BIBLE_TRANSLATIONS = VERSIONS;

  const esc = (s = '') => String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

  function selectedVersion() {
    const value = localStorage.getItem(STORAGE_KEY) || 'BSB';
    return VERSIONS[value] ? value : 'BSB';
  }

  function saveVersion(code) {
    if (!VERSIONS[code]) return;
    localStorage.setItem(STORAGE_KEY, code);
  }

  function optionsHtml(current) {
    return Object.values(VERSIONS).map(v =>
      `<option value="${v.code}" ${v.code === current ? 'selected' : ''}>${v.code} · ${esc(v.name)}</option>`
    ).join('');
  }

  function externalReaderUrl(code, book, chapter) {
    const passage = `${book} ${chapter}`;
    if (code === 'ESV') {
      return `https://www.esv.org/${encodeURIComponent(passage).replace(/%20/g, '+')}/`;
    }
    const version = code === 'AMP' ? 'AMP' : code;
    return `https://www.biblegateway.com/passage/?search=${encodeURIComponent(passage)}&version=${encodeURIComponent(version)}`;
  }

  function passageContext(layer) {
    const book = layer.querySelector('.reader-top b')?.textContent?.trim() || '';
    const chapter = Number(layer.querySelector('#readerChapter')?.value || 0);
    return { book, chapter };
  }

  function sanitizeHtml(raw) {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    doc.querySelectorAll('script,style,iframe,object,embed,form,input,button').forEach(el => el.remove());
    doc.querySelectorAll('*').forEach(el => {
      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        const value = String(attr.value || '').trim().toLowerCase();
        if (name.startsWith('on') || name === 'style' || (name === 'href' && value.startsWith('javascript:'))) {
          el.removeAttribute(attr.name);
        }
      });
      if (el.tagName === 'A') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    });
    return doc.body.innerHTML;
  }

  function sourceNotice(code) {
    if (code === 'BSB') {
      return '<b>Version:</b> BSB · Berean Standard Bible. Delivered from BibleQuest on-demand book packs.';
    }
    if (code === 'NLT') {
      return '<b>Version:</b> NLT · New Living Translation. Text is requested live from Tyndale and is not bundled into BibleQuest. Scripture quotations marked (NLT) are taken from the Holy Bible, New Living Translation, copyright ©1996, 2004, 2015 by Tyndale House Foundation. Used by permission of Tyndale House Publishers. All rights reserved.';
    }
    if (code === 'ESV') {
      return '<b>Version:</b> ESV · English Standard Version. BibleQuest does not publish or cache the ESV access key or bulk ESV text; the selected chapter opens on ESV.org.';
    }
    if (code === 'NIV') {
      return '<b>Version:</b> NIV · New International Version. Full digital-app text requires the applicable Biblica/Zondervan permission, so BibleQuest opens the selected passage in a licensed reader.';
    }
    return '<b>Version:</b> AMP · Amplified Bible. BibleQuest does not bulk-store the copyrighted AMP text; the selected passage opens in a licensed reader.';
  }

  function updateSource(panel, code) {
    let node = panel.querySelector('[data-bq-version-source]');
    if (!node) {
      node = document.createElement('div');
      node.className = 'reader-source';
      node.setAttribute('data-bq-version-source', '1');
      panel.appendChild(node);
    }
    node.innerHTML = sourceNotice(code);
  }

  async function loadNlt(article, book, chapter) {
    article.innerHTML = '<div class="reader-loading"><div class="reader-sheep">📖</div><p>Loading NLT from Tyndale…</p></div>';
    try {
      const ref = `${book}.${chapter}`;
      const response = await fetch(`https://api.nlt.to/api/passages?ref=${encodeURIComponent(ref)}&version=NLT`);
      if (!response.ok) throw new Error(`NLT API returned ${response.status}`);
      const html = await response.text();
      if (!article.isConnected || selectedVersion() !== 'NLT') return;
      article.innerHTML = sanitizeHtml(html);
      const mark = document.createElement('div');
      mark.className = 'reader-source';
      mark.innerHTML = '<b>NLT</b> · Live text supplied by the official Tyndale NLT API.';
      article.appendChild(mark);
    } catch (error) {
      if (!article.isConnected || selectedVersion() !== 'NLT') return;
      const url = externalReaderUrl('NLT', book, chapter);
      article.innerHTML = `
        <div class="reader-source">
          <b>NLT could not be loaded inside the app.</b><br>
          The reader can still open this same chapter in a licensed online Bible reader.
        </div>
        <p><a class="reader-primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open ${esc(book)} ${chapter} · NLT ↗</a></p>`;
    }
  }

  function showLicensedLink(article, code, book, chapter) {
    const v = VERSIONS[code];
    const url = externalReaderUrl(code, book, chapter);
    const detail = code === 'ESV'
      ? 'Crossway permits API use for qualifying non-commercial projects, but the access key may not be published. BibleQuest therefore does not expose a shared key in this public GitHub Pages app.'
      : code === 'NIV'
        ? 'NIV full-text use in a digital product is subject to Biblica/Zondervan licensing. BibleQuest keeps the edition selectable without redistributing the copyrighted Bible text.'
        : 'The Lockman Foundation permits limited AMP quotation, but not bulk redistribution or a standalone full-text dataset. BibleQuest therefore keeps the edition selectable without bundling it.';

    article.innerHTML = `
      <div class="reader-source">
        <b>${esc(code)} · ${esc(v.name)}</b><br>${esc(detail)}
      </div>
      <p><a class="reader-primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Read ${esc(book)} ${chapter} · ${esc(code)} ↗</a></p>`;
  }

  function applyChapter(layer) {
    const panel = layer.querySelector('.reader-chapter');
    if (!panel) return false;
    const article = panel.querySelector('.verse-list');
    const tools = panel.querySelector('.chapter-tools');
    if (!article || !tools) return true;

    const code = selectedVersion();
    let picker = panel.querySelector('#bqTranslationSelect');
    if (!picker) {
      const label = document.createElement('label');
      label.setAttribute('data-bq-version-picker', '1');
      label.innerHTML = `Version <select id="bqTranslationSelect">${optionsHtml(code)}</select>`;
      tools.insertBefore(label, tools.firstChild);
      picker = label.querySelector('select');
      picker.onchange = () => {
        saveVersion(picker.value);
        article.dataset.bqAppliedVersion = '';
        applyChapter(layer);
      };
    } else {
      picker.value = code;
    }

    updateSource(panel, code);
    if (!article.__bqBsbHtml) article.__bqBsbHtml = article.innerHTML;
    if (article.dataset.bqAppliedVersion === code) return true;
    article.dataset.bqAppliedVersion = code;

    const { book, chapter } = passageContext(layer);
    if (!book || !chapter) return true;

    if (code === 'BSB') {
      article.innerHTML = article.__bqBsbHtml;
      return true;
    }
    if (code === 'NLT') {
      loadNlt(article, book, chapter);
      return true;
    }
    showLicensedLink(article, code, book, chapter);
    return true;
  }

  function applyLibrary(layer) {
    const panel = layer.querySelector('.reader-panel');
    if (!panel || panel.classList.contains('reader-chapter')) return false;
    const search = panel.querySelector('#readerSearch');
    if (!search) return false;

    const code = selectedVersion();
    let picker = panel.querySelector('#bqTranslationSelectLibrary');
    if (!picker) {
      const wrap = document.createElement('div');
      wrap.className = 'chapter-tools';
      wrap.setAttribute('data-bq-library-version', '1');
      wrap.innerHTML = `<label>Bible version <select id="bqTranslationSelectLibrary">${optionsHtml(code)}</select></label><span class="reader-chip">${esc(VERSIONS[code].note)}</span>`;
      search.before(wrap);
      picker = wrap.querySelector('select');
      picker.onchange = () => {
        saveVersion(picker.value);
        const chip = wrap.querySelector('.reader-chip');
        if (chip) chip.textContent = VERSIONS[picker.value].note;
        updateSource(panel, picker.value);
      };
    } else {
      picker.value = code;
    }
    updateSource(panel, code);
    return true;
  }

  function enhance() {
    const layer = document.getElementById('bqReaderLayer');
    if (!layer || layer.classList.contains('hidden')) return;
    if (applyChapter(layer)) return;
    applyLibrary(layer);
  }

  const observer = new MutationObserver(enhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('change', e => {
    if (e.target?.id === 'readerChapter') setTimeout(enhance, 0);
  });
  enhance();
})();
