const FORMAT = 'biblequest-v3-local-backup';
const VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function parseBackup(input) {
  let payload = input;
  if (typeof input === 'string') {
    try { payload = JSON.parse(input); }
    catch { throw new Error('Backup file is not valid JSON.'); }
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Backup file has an invalid structure.');
  if (payload.format !== FORMAT) throw new Error('This file is not a BibleQuest v3 local backup.');
  if (payload.version !== VERSION) throw new Error(`Unsupported BibleQuest backup version: ${payload.version ?? 'missing'}.`);
  if (!Array.isArray(payload.entries)) throw new Error('Backup file is missing local-state entries.');
  return Object.freeze({ format: FORMAT, version: VERSION, exportedAt: String(payload.exportedAt || ''), entries: clone(payload.entries) });
}

export function createBackupService({ storage, clock = () => new Date() } = {}) {
  if (!storage?.exportPortableEntries || !storage?.replacePortableEntries || !storage?.resetPortableEntries) throw new Error('Backup service requires the central portable storage boundary.');

  function exportBackup() {
    const entries = storage.exportPortableEntries();
    const payload = Object.freeze({
      format: FORMAT,
      version: VERSION,
      exportedAt: clock().toISOString(),
      entries: Object.freeze(entries.map(entry => Object.freeze(clone(entry))))
    });
    return Object.freeze({ payload, text: JSON.stringify(payload, null, 2), count: entries.length });
  }

  function importBackup(input) {
    const payload = parseBackup(input);
    const count = storage.replacePortableEntries(payload.entries);
    return Object.freeze({ count, exportedAt: payload.exportedAt });
  }

  function resetLocalState() {
    const removed = storage.exportPortableEntries().length;
    storage.resetPortableEntries();
    return Object.freeze({ removed });
  }

  return Object.freeze({ format: FORMAT, version: VERSION, exportBackup, importBackup, resetLocalState });
}
