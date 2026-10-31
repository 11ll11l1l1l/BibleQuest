// Reuses the existing shell and checksum/license-aware Bible package manager.
export function createPracticeOffline({ books, shell, getOwner, load = () => import('../../v6/reader/browser-packages.ts') }) {
  let pending = null, controller = null, active = null, generation = 0, disposed = false;
  async function packages() {
    if (disposed) throw new Error('Offline preparation is closed.');
    if (!pending) pending = load().then(module => module.createBrowserScripturePackageController({ books })).catch(error => { pending = null; throw error; });
    const result = await pending;
    if (disposed) throw new Error('Offline preparation is closed.');
    controller = result;
    return result;
  }
  function reference(ref) {
    if (!ref || typeof ref.translation !== 'string' || typeof ref.book !== 'string' || !books.some(book => book.code === ref.book)) throw new Error('Choose a Bible passage first.');
    return { translation: ref.translation, book: ref.book };
  }
  async function status(ref = null) {
    const owner = getOwner(), token = generation;
    const guidesReady = shell?.getState()?.ready === true;
    if (!ref) return { guidesReady, book: null };
    const target = reference(ref), manager = await packages();
    const book = await manager.snapshot(target.translation, target.book);
    if (disposed || token !== generation || owner !== getOwner()) throw new Error('Offline context changed.');
    return { guidesReady, book };
  }
  function cancel() {
    generation++;
    if (active) controller?.cancel(active.translation, active.book);
    active = null;
  }
  async function prepare(ref, onProgress = () => {}) {
    if (active) throw new Error('A Bible book is already being prepared.');
    const owner = getOwner(), token = generation, target = reference(ref);
    active = target;
    try {
      const manager = await packages();
      if (disposed || owner !== getOwner() || token !== generation) throw new Error('Offline context changed.');
      const snapshot = await manager.snapshot(target.translation, target.book);
      if (disposed || owner !== getOwner() || token !== generation) throw new Error('Offline context changed.');
      if (!snapshot.downloadable) throw new Error(snapshot.reason || 'This Bible source cannot be downloaded.');
      await manager.install(target.translation, target.book, progress => { if (!disposed && token === generation && owner === getOwner()) onProgress(progress); });
      if (disposed || token !== generation || owner !== getOwner()) throw new Error('Offline context changed.');
      return await status(ref);
    } finally { if (token === generation) active = null; }
  }
  async function remove(ref) {
    const owner = getOwner(), token = generation, target = reference(ref), manager = await packages();
    if (disposed || owner !== getOwner() || token !== generation) throw new Error('Offline context changed.');
    if (active) throw new Error('Cancel preparation before removing this book.');
    await manager.remove(target.translation, target.book);
    if (disposed || owner !== getOwner() || token !== generation) throw new Error('Offline context changed.');
    return status(ref);
  }
  function dispose() { cancel(); disposed = true; }
  return Object.freeze({ status, prepare, cancel, remove, dispose });
}
