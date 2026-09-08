const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function backupPage({ backup, onBack, onApplied }) {
  return {
    title: 'Backup & reset',
    html: `<section class="bq-panel" data-backup-page><p class="bq-eyebrow">DEVICE DATA</p><h1>Backup & reset</h1><p>Export this device's BibleQuest v3 local learning state, restore a compatible backup, or reset local learning data. Account sign-in, remembered device identity, cloud data and unrelated browser storage are not included.</p><div class="bq-reader-nav"><button type="button" class="bq-secondary-button" data-backup-back>← More</button></div></section><section class="bq-panel"><p class="bq-eyebrow">EXPORT</p><h2>Download local backup</h2><p>Creates a versioned JSON backup of portable BibleQuest local state.</p><button type="button" class="bq-primary-button" data-backup-export>Download backup</button></section><section class="bq-panel"><p class="bq-eyebrow">IMPORT</p><h2>Restore local backup</h2><p>Import replaces portable local state on this device after the file is validated. BibleQuest reloads after a successful restore.</p><label>Backup JSON<input type="file" accept="application/json,.json" data-backup-file></label><button type="button" class="bq-primary-button" data-backup-import>Import backup</button></section><section class="bq-panel"><p class="bq-eyebrow">RESET</p><h2>Reset local BibleQuest state</h2><p>This clears portable BibleQuest v3 learning state on this device. It does not sign you out, remove the device identity, delete cloud data, or clear other websites.</p><button type="button" class="bq-secondary-button" data-backup-reset>Reset local state</button></section><section class="bq-panel"><p class="bq-form-message" data-backup-message aria-live="polite"></p></section>`,
    mount(root) {
      const host = root.querySelector('[data-backup-page]')?.parentElement || root;
      const message = text => { const node = root.querySelector('[data-backup-message]'); if (node) node.textContent = text || ''; };
      const back = root.querySelector('[data-backup-back]');
      const exportButton = root.querySelector('[data-backup-export]');
      const importButton = root.querySelector('[data-backup-import]');
      const resetButton = root.querySelector('[data-backup-reset]');
      const fileInput = root.querySelector('[data-backup-file]');
      const goBack = () => onBack?.();
      const download = () => {
        try {
          const result = backup.exportBackup();
          const blob = new Blob([result.text], { type: 'application/json' });
          const href = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = href;
          link.download = `biblequest-v3-backup-${new Date().toISOString().slice(0,10)}.json`;
          host.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(href);
          message(`Backup ready · ${result.count} local state entr${result.count === 1 ? 'y' : 'ies'}.`);
        } catch (error) { message(error?.message || 'Could not export BibleQuest local state.'); }
      };
      const importFile = async () => {
        const file = fileInput?.files?.[0];
        if (!file) { message('Choose a BibleQuest backup JSON file first.'); return; }
        importButton.disabled = true;
        try {
          const result = backup.importBackup(await file.text());
          message(`Restored ${result.count} local state entr${result.count === 1 ? 'y' : 'ies'}. Reloading BibleQuest…`);
          onApplied?.();
        } catch (error) {
          message(error?.message || 'Could not import BibleQuest backup.');
          importButton.disabled = false;
        }
      };
      const reset = () => {
        if (!confirm('Reset BibleQuest local learning state on this device? Account sign-in and cloud data will remain.')) return;
        try {
          const result = backup.resetLocalState();
          message(`Reset ${result.removed} local state entr${result.removed === 1 ? 'y' : 'ies'}. Reloading BibleQuest…`);
          onApplied?.();
        } catch (error) { message(error?.message || 'Could not reset BibleQuest local state.'); }
      };
      back?.addEventListener('click', goBack);
      exportButton?.addEventListener('click', download);
      importButton?.addEventListener('click', importFile);
      resetButton?.addEventListener('click', reset);
      return () => {
        back?.removeEventListener('click', goBack);
        exportButton?.removeEventListener('click', download);
        importButton?.removeEventListener('click', importFile);
        resetButton?.removeEventListener('click', reset);
      };
    }
  };
}
