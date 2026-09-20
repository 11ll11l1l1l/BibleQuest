const STORAGE_KEY = 'progress-state';
const VERSION = 1;
const COUNTER_KEYS = Object.freeze(['chaptersRead', 'quizCorrect', 'reflections', 'assessments', 'situations']);
const REWARD_KEYS = Object.freeze(['stars', 'coins']);

export const PROGRESS_BADGES = Object.freeze([
  Object.freeze({ id: 'first-step', label: 'First Step', description: 'Complete one meaningful BibleQuest activity.' }),
  Object.freeze({ id: 'streak-3', label: '3-Day Streak', description: 'Be active on three consecutive local calendar days.' }),
  Object.freeze({ id: 'streak-7', label: '7-Day Streak', description: 'Be active on seven consecutive local calendar days.' }),
  Object.freeze({ id: 'bible-recall', label: 'Bible Recall', description: 'Answer at least 20 Bible recall questions correctly.' }),
  Object.freeze({ id: 'reader', label: 'Reader', description: 'Mark 10 Bible chapters read.' }),
  Object.freeze({ id: 'reflection', label: 'Reflection', description: 'Complete and save one reflection.' })
]);

const badgeRule = Object.freeze({
  'first-step': state => state.totalActivities >= 1,
  'streak-3': state => state.streak >= 3,
  'streak-7': state => state.streak >= 7,
  'bible-recall': state => state.counters.quizCorrect >= 20,
  reader: state => state.counters.chaptersRead >= 10,
  reflection: state => state.counters.reflections >= 1
});

function defaultState() {
  return {
    version: VERSION,
    xp: 0,
    stars: 0,
    coins: 0,
    streak: 0,
    lastActivityDate: null,
    totalActivities: 0,
    counters: { chaptersRead: 0, quizCorrect: 0, reflections: 0, assessments: 0, situations: 0 },
    badges: [],
    events: {}
  };
}

const integer = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : fallback;
};

function normalizeMetrics(input) {
  const metrics = {};
  for (const key of COUNTER_KEYS) metrics[key] = integer(input?.[key], 0);
  return metrics;
}

function normalizeRewards(input) {
  const rewards = {};
  for (const key of REWARD_KEYS) rewards[key] = integer(input?.[key], 0);
  return rewards;
}

function validateEventMetrics(input) {
  if (input == null) return normalizeMetrics(null);
  if (typeof input !== 'object' || Array.isArray(input)) throw new Error('Progress metrics must be an object.');
  for (const key of Object.keys(input)) if (!COUNTER_KEYS.includes(key)) throw new Error(`Unknown progress metric: ${key}`);
  const metrics = {};
  for (const key of COUNTER_KEYS) {
    if (!(key in input)) { metrics[key] = 0; continue; }
    const value = input[key];
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 1000000) throw new Error(`Progress metric ${key} must be an integer from 0 to 1000000.`);
    metrics[key] = value;
  }
  return metrics;
}

function validateEventRewards(input) {
  if (input == null) return normalizeRewards(null);
  if (typeof input !== 'object' || Array.isArray(input)) throw new Error('Progress rewards must be an object.');
  for (const key of Object.keys(input)) if (!REWARD_KEYS.includes(key)) throw new Error(`Unknown progress reward: ${key}`);
  const rewards = {};
  for (const key of REWARD_KEYS) {
    if (!(key in input)) { rewards[key] = 0; continue; }
    const value = input[key];
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > 1000000) throw new Error(`Progress reward ${key} must be an integer from 0 to 1000000.`);
    rewards[key] = value;
  }
  return rewards;
}

function validDateKey(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

const validToken = (value, max = 180) => typeof value === 'string' && value.length > 0 && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);

function applyBadgeRules(input) {
  const current = new Set(Array.isArray(input.badges) ? input.badges : []);
  for (const badge of PROGRESS_BADGES) if (badgeRule[badge.id](input)) current.add(badge.id);
  return { ...input, badges: PROGRESS_BADGES.map(item => item.id).filter(id => current.has(id)) };
}

function normalize(input) {
  const base = defaultState();
  if (!input || typeof input !== 'object' || Array.isArray(input) || Number(input.version) !== VERSION) return base;
  const events = {};
  if (input.events && typeof input.events === 'object' && !Array.isArray(input.events)) {
    for (const [id, row] of Object.entries(input.events)) {
      const date = validDateKey(row?.date);
      if (!validToken(id) || !row || typeof row !== 'object' || !validToken(row.type, 100) || !date) continue;
      events[id] = { type: row.type, date, at: typeof row.at === 'string' ? row.at : '', xp: integer(row.xp, 0), meaningful: row.meaningful !== false, metrics: normalizeMetrics(row.metrics), rewards: normalizeRewards(row.rewards) };
    }
  }
  const badges = Array.isArray(input.badges) ? input.badges.filter(id => PROGRESS_BADGES.some(item => item.id === id)) : [];
  return applyBadgeRules({
    version: VERSION,
    xp: integer(input.xp, 0),
    stars: integer(input.stars, 0),
    coins: integer(input.coins, 0),
    streak: integer(input.streak, 0),
    lastActivityDate: validDateKey(input.lastActivityDate),
    totalActivities: integer(input.totalActivities, 0),
    counters: normalizeMetrics(input.counters),
    badges,
    events
  });
}

function freezeState(state) {
  const events = {};
  for (const [id, row] of Object.entries(state.events)) events[id] = Object.freeze({ ...row, metrics: Object.freeze({ ...row.metrics }), rewards: Object.freeze({ ...row.rewards }) });
  return Object.freeze({ ...state, counters: Object.freeze({ ...state.counters }), badges: Object.freeze([...state.badges]), events: Object.freeze(events) });
}

function formatter(timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function civilDateKey(value, timeZone) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Progress event time is invalid.');
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  const key = `${parts.year}-${parts.month}-${parts.day}`;
  if (!validDateKey(key)) throw new Error('Progress civil date could not be resolved.');
  return key;
}

function dayDistance(from, to) {
  const parse = key => {
    const [year, month, day] = key.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((parse(to) - parse(from)) / 86400000);
}

function sameMetrics(a, b) {
  return COUNTER_KEYS.every(key => integer(a?.[key], 0) === integer(b?.[key], 0));
}

function sameRewards(a, b) {
  return REWARD_KEYS.every(key => integer(a?.[key], 0) === integer(b?.[key], 0));
}

function sameProgressEvent(a,b){
  return Boolean(a&&b)
    && a.type===b.type
    && a.date===b.date
    && String(a.at||'')===String(b.at||'')
    && integer(a.xp,0)===integer(b.xp,0)
    && (a.meaningful!==false)===(b.meaningful!==false)
    && sameMetrics(a.metrics,b.metrics)
    && sameRewards(a.rewards,b.rewards);
}

function addSafe(left, right, label) {
  const value = left + right;
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} exceeded the supported progress range.`);
  return value;
}

const cloneJson = value => JSON.parse(JSON.stringify(value));

function deriveFromEvents(events, preservedBadges = []) {
  let xp=0,stars=0,coins=0,totalActivities=0;
  const counters=normalizeMetrics(null),meaningfulDates=new Set();
  for(const row of Object.values(events||{})){
    xp=addSafe(xp,integer(row?.xp,0),'XP');
    const rewards=normalizeRewards(row?.rewards);
    stars=addSafe(stars,rewards.stars,'Stars');
    coins=addSafe(coins,rewards.coins,'Coins');
    const metrics=normalizeMetrics(row?.metrics);
    for(const key of COUNTER_KEYS)counters[key]=addSafe(counters[key],metrics[key],`Progress metric ${key}`);
    if(row?.meaningful!==false){totalActivities=addSafe(totalActivities,1,'Activity count');if(validDateKey(row?.date))meaningfulDates.add(row.date)}
  }
  const dates=[...meaningfulDates].sort(),lastActivityDate=dates.at(-1)||null;
  let streak=0;
  if(lastActivityDate){
    streak=1;
    for(let index=dates.length-2;index>=0;index-=1){
      if(dayDistance(dates[index],dates[index+1])!==1)break;
      streak=addSafe(streak,1,'Streak');
    }
  }
  return applyBadgeRules({
    version:VERSION,xp,stars,coins,streak,lastActivityDate,totalActivities,counters,
    badges:[...new Set((preservedBadges||[]).filter(id=>PROGRESS_BADGES.some(item=>item.id===id)))],
    events:{...events}
  });
}

function mergeProgressStates(leftInput,rightInput){
  const left=normalize(leftInput),right=normalize(rightInput),events={...left.events};
  for(const [id,row] of Object.entries(right.events)){
    if(events[id]){
      if(!sameProgressEvent(events[id],row))throw new Error(`Progress event identity conflict during account merge: ${id}`);
      continue;
    }
    events[id]=row;
  }
  const leftDerived=deriveFromEvents(left.events,left.badges),rightDerived=deriveFromEvents(right.events,right.badges);
  const merged=deriveFromEvents(events,[...left.badges,...right.badges]);
  const legacy={
    xp:Math.max(0,left.xp-leftDerived.xp,right.xp-rightDerived.xp),
    stars:Math.max(0,left.stars-leftDerived.stars,right.stars-rightDerived.stars),
    coins:Math.max(0,left.coins-leftDerived.coins,right.coins-rightDerived.coins),
    totalActivities:Math.max(0,left.totalActivities-leftDerived.totalActivities,right.totalActivities-rightDerived.totalActivities),
    counters:Object.fromEntries(COUNTER_KEYS.map(key=>[key,Math.max(0,left.counters[key]-leftDerived.counters[key],right.counters[key]-rightDerived.counters[key])]))
  };
  const counters={...merged.counters};
  for(const key of COUNTER_KEYS)counters[key]=addSafe(counters[key],legacy.counters[key],`Progress metric ${key}`);
  let lastActivityDate=merged.lastActivityDate,streak=merged.streak;
  for(const candidate of[left,right]){
    if(candidate.lastActivityDate&&(!lastActivityDate||candidate.lastActivityDate>lastActivityDate)){
      lastActivityDate=candidate.lastActivityDate;streak=candidate.streak;
    }else if(candidate.lastActivityDate&&candidate.lastActivityDate===lastActivityDate){
      streak=Math.max(streak,candidate.streak);
    }
  }
  return applyBadgeRules({
    ...merged,
    xp:addSafe(merged.xp,legacy.xp,'XP'),
    stars:addSafe(merged.stars,legacy.stars,'Stars'),
    coins:addSafe(merged.coins,legacy.coins,'Coins'),
    totalActivities:addSafe(merged.totalActivities,legacy.totalActivities,'Activity count'),
    counters,lastActivityDate,streak
  });
}

export function createProgressService({ storage, store, clock = () => new Date(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' }) {
  if (!storage || !store) throw new Error('Progress service requires storage and global store boundaries.');
  formatter(timeZone);
  let state = normalize(storage.read(STORAGE_KEY, defaultState()));
  const listeners=new Set();

  const getState = () => freezeState(state);
  const publish = () => store.setState(current => ({ ...current, progress: getState() }));
  const notify = source => {
    const snapshot=getState();
    for(const listener of listeners){
      try{listener(Object.freeze({source,state:snapshot}))}
      catch(error){console.warn('Progress state listener failed',error)}
    }
  };
  publish();

  function record(input) {
    const id = input?.id;
    const type = input?.type;
    if (!validToken(id)) throw new Error('Progress event requires a stable string event id.');
    if (!validToken(type, 100)) throw new Error('Progress event requires a valid string type.');
    const xp = input?.xp ?? 0;
    if (typeof xp !== 'number' || !Number.isSafeInteger(xp) || xp < 0 || xp > 10000) throw new Error('Progress XP must be an integer from 0 to 10000.');
    const meaningful = input?.meaningful ?? true;
    if (typeof meaningful !== 'boolean') throw new Error('Progress meaningful flag must be boolean.');
    const metrics = validateEventMetrics(input?.metrics);
    const rewards = validateEventRewards(input?.rewards);
    const existing = state.events[id];
    if (existing) {
      if (existing.type !== type || existing.xp !== xp || existing.meaningful !== meaningful || !sameMetrics(existing.metrics, metrics) || !sameRewards(existing.rewards, rewards)) throw new Error(`Progress event identity conflict: ${id}`);
      return Object.freeze({ applied: false, duplicate: true, date: existing.date, awardedXp: 0, awardedRewards: Object.freeze({ stars: 0, coins: 0 }), newlyUnlocked: Object.freeze([]), state: getState() });
    }

    const rawTime = clock();
    const occurredAt = rawTime instanceof Date ? new Date(rawTime.getTime()) : new Date(rawTime);
    if (!Number.isFinite(occurredAt.getTime())) throw new Error('Progress event time is invalid.');
    const date = civilDateKey(occurredAt, timeZone);
    let streak = state.streak;
    let lastActivityDate = state.lastActivityDate;
    if (meaningful) {
      if (!lastActivityDate) {
        streak = 1;
        lastActivityDate = date;
      } else if (date > lastActivityDate) {
        streak = dayDistance(lastActivityDate, date) === 1 ? addSafe(streak, 1, 'Streak') : 1;
        lastActivityDate = date;
      }
    }

    const counters = { ...state.counters };
    for (const key of COUNTER_KEYS) counters[key] = addSafe(counters[key], metrics[key], `Progress metric ${key}`);
    const beforeBadges = new Set(state.badges);
    const next = applyBadgeRules({
      ...state,
      xp: addSafe(state.xp, xp, 'XP'),
      stars: addSafe(state.stars, rewards.stars, 'Stars'),
      coins: addSafe(state.coins, rewards.coins, 'Coins'),
      streak,
      lastActivityDate,
      totalActivities: meaningful ? addSafe(state.totalActivities, 1, 'Activity count') : state.totalActivities,
      counters,
      events: { ...state.events, [id]: { type, date, at: occurredAt.toISOString(), xp, meaningful, metrics, rewards } }
    });
    const newlyUnlocked = next.badges.filter(idValue => !beforeBadges.has(idValue));

    storage.write(STORAGE_KEY, next);
    state = next;
    publish();
    notify('local');
    return Object.freeze({ applied: true, duplicate: false, date, awardedXp: xp, awardedRewards: Object.freeze({ ...rewards }), newlyUnlocked: Object.freeze(newlyUnlocked), state: getState() });
  }

  function exportAccountState(){return cloneJson(state)}
  function mergeFromAccount(remoteInput){
    const next=mergeProgressStates(state,remoteInput);
    const changed=JSON.stringify(next)!==JSON.stringify(state);
    if(changed){
      storage.write(STORAGE_KEY,next);
      state=next;
      publish();
      notify('account');
    }
    return Object.freeze({changed,state:getState()});
  }
  function subscribe(listener){
    if(typeof listener!=='function')throw new Error('Progress subscription requires a function.');
    listeners.add(listener);
    return()=>listeners.delete(listener);
  }

  return Object.freeze({
    getState,record,exportAccountState,mergeFromAccount,subscribe,
    hasEvent(id) { return Boolean(state.events[String(id || '')]); },
    getDateKey(value = clock()) { return civilDateKey(value, timeZone); },
    badges: PROGRESS_BADGES,timeZone
  });
}