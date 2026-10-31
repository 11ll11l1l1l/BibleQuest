// Store canonical references only. Scripture bytes remain owned by the Bible provider.
export function createMeditationPassageService({ bible, storage, getOwner }) {
  const key = owner => `spiritual-practices.passage.v1.${owner}`;
  function normalize(value) {
    if (!value || typeof value.translation !== 'string' || typeof value.book !== 'string') throw new Error('Choose a Bible verse first.');
    const translation = bible.getTranslation(value.translation), book = bible.getBook(value.book);
    if (translation.id !== value.translation || book.code !== value.book || translation.mode === 'licensed-link') throw new Error('This translation is available only in its licensed reader.');
    if (!Number.isInteger(value.chapter) || value.chapter < 1 || value.chapter > book.chapters || !Number.isInteger(value.verse) || value.verse < 1 || value.verse > 176) throw new Error('Invalid meditation passage.');
    return Object.freeze({ translation: translation.id, book: book.code, chapter: value.chapter, verse: value.verse });
  }
  function selection() { try { return normalize(storage.read(key(getOwner()), null)); } catch { return null; } }
  async function resolve(value) {
    const owner = getOwner(), ref = normalize(value);
    const chapter = await bible.loadChapter(ref.translation, ref.book, ref.chapter);
    if (owner !== getOwner()) throw new Error('Account changed. Choose the passage again.');
    if (chapter?.book?.code !== ref.book || chapter?.chapter !== ref.chapter || chapter?.translation?.id !== ref.translation || chapter.translation.mode === 'licensed-link') throw new Error('Scripture response does not match this passage.');
    const verse = chapter.verses?.find(row => row.verse === ref.verse);
    if (!verse || typeof verse.text !== 'string' || !verse.text.trim()) throw new Error('Verse unavailable. Open the Bible Reader and retry when the passage is available.');
    return Object.freeze({ ref, reference: `${chapter.book.name} ${ref.chapter}:${ref.verse}`, text: verse.text, attribution: chapter.translation.attribution || '', translation: chapter.translation.label || ref.translation });
  }
  async function select(value) {
    const owner = getOwner(), result = await resolve(value);
    if (owner !== getOwner()) throw new Error('Account changed. Choose the passage again.');
    storage.write(key(owner), result.ref);
    return result.ref;
  }
  return Object.freeze({ selection, select, resolve });
}
