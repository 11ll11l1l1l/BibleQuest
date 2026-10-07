import { localization } from '../../app/localization.js';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const COPY={en:{'books.author':'Author','books.language':'Language','books.open':'Open book at source','books.external':'Opens the original provider in a new tab.','books.unavailable':'An approved external reading link is unavailable.'},tl:{'books.author':'May-akda','books.language':'Wika','books.open':'Buksan ang aklat sa pinagmulan','books.external':'Bubukas ang orihinal na provider sa bagong tab.','books.unavailable':'Walang aprubadong panlabas na link sa pagbabasa.'},ceb:{'books.author':'Awtor','books.language':'Pinulongan','books.open':'Ablihi ang libro sa tinubdan','books.external':'Moabli ang orihinal nga provider sa bag-ong tab.','books.unavailable':'Walay aprob nga external reading link.'}};

export function approvedBookUrl(item) {
  if(item?.contentType!=='book'||item.publicationState!=='published'||item.review?.status!=='approved'
    ||item.rights?.status!=='verified'||!item.rights.allowedUses?.includes('external_link'))return null;
  try{
    const url=new URL(item.source?.uri);
    if(url.protocol!=='https:'||url.username||url.password)return null;
    if(url.hostname==='www.gutenberg.org'||url.hostname==='gutenberg.org'){
      if(!/^\/ebooks\/\d+$/.test(url.pathname)||url.search||url.hash)return null;
    }
    return url.href;
  }catch{return null}
}

export function renderBookMetadata(item) {
  const t=key=>escapeHtml(localization.t(key,{dictionaries:COPY}));
  const url=approvedBookUrl(item);
  return `<section data-book-detail><dl><dt>${t('books.author')}</dt><dd>${escapeHtml(item.source?.creator||'—')}</dd><dt>${t('books.language')}</dt><dd>${escapeHtml(item.sourceLocale||item.locale||'—')}</dd></dl>${url?`<a class="bq-primary-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-describedby="book-external-notice">${t('books.open')}</a><p id="book-external-notice">${t('books.external')}</p>`:`<p>${t('books.unavailable')}</p>`}</section>`;
}
