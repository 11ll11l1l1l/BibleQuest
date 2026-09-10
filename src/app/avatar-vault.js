// #82 Avatar Vault lifecycle/persistence owner. Reuses Session (owner
// identity), private storage (device cache, owner-scoped like Personality
// Profile/Psychometrics) and the API boundary (Supabase writes live only in
// src/core/api.js). Reuses Progress for xp/streak instead of tracking its
// own copy. Does not own congregation membership, router or avatar
// rendering — this module is selection + persistence only.
import { STYLES, findStyle, unlockedIds, progressFor, normalizeMetrics } from '../engines/avatar-vault.js';

const SCHEMA = 1;

function fail(code, message) { const error = new Error(message); error.code = code; throw error; }

export function createAvatarVaultService({ session, privateStorage, api, progress }) {
  if (!session?.getState || !privateStorage?.read || !privateStorage?.write || !api?.avatarVault) {
    throw new Error('Avatar Vault requires Session, private storage and the API boundary.');
  }

  const owner = () => {
    const s = session.getState();
    return s?.authenticated && s?.user?.id ? `account:${s.user.id}` : 'guest';
  };
  const key = current => `avatar-vault:${current}`;

  function metrics() {
    const s = progress?.getState ? progress.getState() : {};
    return normalizeMetrics(s);
  }

  function readLocal(current) {
    const saved = privateStorage.read(key(current), null);
    if (!saved || typeof saved !== 'object' || Number(saved.schema) !== SCHEMA || saved.owner !== current) {
      return { selected: 'starter', earned: ['starter'] };
    }
    return {
      selected: typeof saved.selected === 'string' ? saved.selected : 'starter',
      earned: Array.isArray(saved.earned) ? saved.earned : ['starter']
    };
  }

  function writeLocal(current, selected, earnedSet) {
    privateStorage.write(key(current), { schema: SCHEMA, owner: current, selected, earned: [...earnedSet] });
  }

  function validLocalSelection(local, earned) {
    const selected = findStyle(local?.selected).id;
    return earned.has(selected) ? selected : 'starter';
  }

  function present() {
    const current = owner();
    const m = metrics();
    const local = readLocal(current);
    const earned = unlockedIds(m, local.earned);
    const selected = validLocalSelection(local, earned);
    writeLocal(current, selected, earned);
    return Object.freeze({
      owner: current,
      scope: current.startsWith('account:') ? 'account-cloud' : 'guest-device',
      selected: findStyle(selected),
      styles: Object.freeze(STYLES.map(style => Object.freeze({
        ...style,
        unlocked: earned.has(style.id),
        active: style.id === selected,
        progressLabel: progressFor(style, m, earned)
      })))
    });
  }

  async function load() {
    const s = session.getState();
    if (!s?.authenticated || !s?.user?.id) return present();
    const current = owner();
    try {
      const remote = await api.avatarVault.load(s.user.id);
      const local = readLocal(current);
      const earned = unlockedIds(metrics(), local.earned);
      const remoteStyle = remote?.selected_style ? findStyle(remote.selected_style).id : '';
      const selected = remoteStyle && earned.has(remoteStyle) ? remoteStyle : validLocalSelection(local, earned);
      writeLocal(current, selected, earned);

      // Re-run the idempotent cloud save whenever the Vault opens. This repairs a
      // previous partial/uncertain sync and re-projects the selected cosmetic into
      // congregation-visible avatar state without making cloud failure fatal locally.
      try { await api.avatarVault.save(s.user.id, selected); }
      catch { /* device state remains authoritative until a later retry succeeds */ }
    } catch { /* device state remains authoritative until cloud reachable */ }
    return present();
  }

  async function select(id) {
    const current = owner();
    const style = findStyle(id);
    const local = readLocal(current);
    const earned = unlockedIds(metrics(), local.earned);
    if (!earned.has(style.id)) fail('BQ_AVATAR_VAULT_LOCKED', 'This avatar style is not unlocked yet.');
    writeLocal(current, style.id, earned);
    const s = session.getState();
    let synced = true;
    if (s?.authenticated && s?.user?.id) {
      try { await api.avatarVault.save(s.user.id, style.id); }
      catch { synced = false; }
    }
    return Object.freeze({ ...present(), synced });
  }

  return Object.freeze({ load, select, getState: present });
}
