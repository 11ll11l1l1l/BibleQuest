// #82 Avatar Vault lifecycle/persistence owner. Reuses Session (owner
// identity), private storage (device cache, owner-scoped like Personality
// Profile/Psychometrics) and the API boundary (Supabase writes live only in
// src/core/api.js). Reuses Progress for xp/streak instead of tracking its
// own copy. Does not own congregation membership, router or avatar
// rendering — this module is selection + persistence only.
import { STYLES, findStyle, unlockedIds, progressFor, normalizeMetrics } from '../engines/avatar-vault.js';

const SCHEMA = 1;

function fail(code, message) { const error = new Error(message); error.code = code; throw error; }

export function createAvatarVaultService({ session, privateStorage, api, progress, bibleWorld, couplesFamily, games, assignments }) {
  if (!session?.getState || !privateStorage?.read || !privateStorage?.write || !api?.avatarVault) {
    throw new Error('Avatar Vault requires Session, private storage and the API boundary.');
  }

  const owner = () => {
    const s = session.getState();
    return s?.authenticated && s?.user?.id ? `account:${s.user.id}` : 'guest';
  };
  const currentAccountId = () => {
    const s = session.getState();
    return s?.authenticated && s?.user?.id ? String(s.user.id) : '';
  };
  const contextError = () => {
    const error = new Error('The account changed. Reopen Avatar Vault before continuing.');
    error.code = 'BQ_AVATAR_VAULT_CONTEXT_STALE';
    return error;
  };
  const assertAccountContext = userId => {
    if (!userId || currentAccountId() !== String(userId)) throw contextError();
  };
  const key = current => `avatar-vault:${current}`;

  function metrics() {
    const base = progress?.getState ? progress.getState() : {};
    let world = { regions: [] };
    try { world = bibleWorld?.snapshot ? bibleWorld.snapshot() : world; } catch { /* Bible World unavailable this session */ }
    const regions = Array.isArray(world.regions) ? world.regions : [];
    const regionsExploredCount = regions.filter(r => r.explored).length;
    const maxRegionPercent = regions.reduce((max, r) => Math.max(max, Number(r.percent) || 0), 0);
    const couplesHistory = couplesFamily?.snapshot ? (couplesFamily.snapshot().history || []).length : 0;
    const recallReps = games?.recallDeckReps ? games.recallDeckReps() : 0;
    const assignmentRows = assignments?.snapshot ? (assignments.snapshot().assignments || []) : [];
    const assignmentsCompleted = assignmentRows.filter(row => row?.progress?.status === 'completed').length;
    return normalizeMetrics({
      ...base,
      recallReps,
      couplesHistory,
      assignmentsCompleted,
      regionsExplored: regions.length > 0 && regionsExploredCount === regions.length,
      regionsExploredCount,
      regionsTotal: regions.length,
      maxRegionPercent
    });
  }

  function readLocal(current) {
    const saved = privateStorage.read(key(current), null);
    if (!saved || typeof saved !== 'object' || Number(saved.schema) !== SCHEMA || saved.owner !== current) {
      return { selected: 'starter', earned: ['starter'], pending: false };
    }
    return {
      selected: typeof saved.selected === 'string' ? saved.selected : 'starter',
      earned: Array.isArray(saved.earned) ? saved.earned : ['starter'],
      pending: saved.pending === true
    };
  }

  function writeLocal(current, selected, earnedSet, pending = false) {
    privateStorage.write(key(current), { schema: SCHEMA, owner: current, selected, earned: [...earnedSet], pending: pending === true });
  }

  function present() {
    const current = owner();
    const m = metrics();
    const local = readLocal(current);
    const earned = unlockedIds(m, local.earned);
    writeLocal(current, local.selected, earned, local.pending);
    return Object.freeze({
      owner: current,
      scope: current.startsWith('account:') ? 'account-cloud' : 'guest-device',
      selected: findStyle(local.selected),
      synced: current.startsWith('account:') ? !local.pending : true,
      styles: Object.freeze(STYLES.map(style => Object.freeze({
        ...style,
        unlocked: earned.has(style.id),
        active: style.id === local.selected,
        progressLabel: progressFor(style, m, earned)
      })))
    });
  }

  async function load() {
    const s = session.getState();
    if (!s?.authenticated || !s?.user?.id) return present();
    const userId = String(s.user.id);
    const current = owner();
    let local = readLocal(current);
    const earned = unlockedIds(metrics(), local.earned);

    // A failed prior save represents newer user intent than the last cloud row.
    // Retry it before accepting remote state so an older cloud selection cannot
    // silently overwrite a choice made while connectivity was unavailable.
    if (local.pending) {
      try {
        assertAccountContext(userId);
        await api.avatarVault.save(s.user.id, local.selected);
        assertAccountContext(userId);
        writeLocal(current, local.selected, earned, false);
        local = readLocal(current);
      } catch (error) {
        if (error?.code === 'BQ_AVATAR_VAULT_CONTEXT_STALE' || currentAccountId() !== userId) throw contextError();
        return present();
      }
    }

    try {
      assertAccountContext(userId);
      const remote = await api.avatarVault.load(s.user.id);
      assertAccountContext(userId);
      if (remote?.selected_style) writeLocal(current, remote.selected_style, earned, false);
    } catch (error) {
      if (error?.code === 'BQ_AVATAR_VAULT_CONTEXT_STALE' || currentAccountId() !== userId) throw contextError();
      /* device state remains authoritative until cloud reachable */
    }
    return present();
  }

  async function select(id) {
    const current = owner();
    const style = findStyle(id);
    const local = readLocal(current);
    const earned = unlockedIds(metrics(), local.earned);
    if (!earned.has(style.id)) fail('BQ_AVATAR_VAULT_LOCKED', 'This avatar style is not unlocked yet.');
    const s = session.getState();
    const accountOwned=Boolean(s?.authenticated && s?.user?.id);
    const userId=accountOwned?String(s.user.id):'';
    writeLocal(current, style.id, earned, accountOwned);
    let synced = true;
    if (accountOwned) {
      try {
        assertAccountContext(userId);
        await api.avatarVault.save(s.user.id, style.id);
        assertAccountContext(userId);
        writeLocal(current, style.id, earned, false);
      } catch (error) {
        if (error?.code === 'BQ_AVATAR_VAULT_CONTEXT_STALE' || currentAccountId() !== userId) throw contextError();
        synced = false;
      }
    }
    return Object.freeze({ ...present(), synced });
  }

  return Object.freeze({ load, select, getState: present });
}
