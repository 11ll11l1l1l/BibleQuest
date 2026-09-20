// Calendar lifecycle/persistence owner (v2: personal events use an
// account-cloud cache with durable pending creates/deletes; congregation
// events remain server-authoritative). Reuses Session, Assignments,
// Congregation Membership and the centralized API boundary.
import { normalizeEvent, fromAssignmentDue, buildAgenda } from '../engines/calendar.js';

const SCHEMA = 2;
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function freezeLocal(event,pendingSync=false){return Object.freeze({...event,pendingSync:pendingSync===true})}

export function createCalendarService({ session, privateStorage, api, assignments, congregation, clock = () => new Date(), uuid = () => crypto.randomUUID() }) {
  if (!session?.getState || !privateStorage?.read || !privateStorage?.write || !api?.calendar) {
    throw new Error('Calendar requires Session, private storage and the API boundary.');
  }

  let congregationState = { congregationId: '', congregationName: '', canShare: false, events: [] };

  const sessionUserId = () => {
    const s = session.getState();
    return s?.authenticated && s?.user?.id ? String(s.user.id) : '';
  };
  const owner = () => {
    const id = sessionUserId();
    return id ? `account:${id}` : 'guest';
  };
  const key = current => `calendar-events:${current}`;
  const nextId=()=>{
    const id=String(uuid());
    if(!UUID_RE.test(id))throw new Error('Calendar could not create a valid event identity.');
    return id;
  };

  function normalizeLocal(raw,{legacyPending=false}={}){
    const event=normalizeEvent(raw);
    if(!event)return null;
    return freezeLocal(event,raw?.pendingSync===true||legacyPending);
  }

  function readCache(current) {
    const saved = privateStorage.read(key(current), null);
    if (!saved || typeof saved !== 'object' || saved.owner !== current || !Array.isArray(saved.events)) {
      return {events:[],pendingDeletes:[]};
    }
    const schema=Number(saved.schema);
    if(schema!==1&&schema!==SCHEMA)return {events:[],pendingDeletes:[]};
    const legacyAccount=schema===1&&current.startsWith('account:');
    const events=saved.events.map(row=>normalizeLocal(row,{legacyPending:legacyAccount&&String(row?.id||'').startsWith('local-')})).filter(Boolean);
    const pendingDeletes=schema===SCHEMA&&Array.isArray(saved.pendingDeletes)
      ?[...new Set(saved.pendingDeletes.map(String).filter(id=>UUID_RE.test(id)))]
      :[];
    return {events,pendingDeletes};
  }

  function writeCache(current,{events=[],pendingDeletes=[]}={}) {
    const normalizedEvents=events.map(row=>normalizeLocal(row)).filter(Boolean);
    const deletes=[...new Set(pendingDeletes.map(String).filter(id=>UUID_RE.test(id)))];
    privateStorage.write(key(current), {
      schema:SCHEMA,
      owner:current,
      events:normalizedEvents.map(row=>({...row,pendingSync:row.pendingSync===true})),
      pendingDeletes:deletes
    });
  }

  function readLocal(current) { return readCache(current).events; }

  const personalFromRemote=row=>normalizeLocal({
    id:row.id,source:'personal',ownerId:row.user_id,eventDate:row.event_date,title:row.title,notes:row.notes,allDay:row.all_day
  });

  function assignmentEvents() {
    const rows = assignments?.snapshot?.()?.assignments || [];
    return rows.map(fromAssignmentDue).filter(Boolean);
  }

  function combinedEvents() {
    return [...readLocal(owner()), ...assignmentEvents(), ...congregationState.events];
  }

  async function loadCongregation() {
    if (!congregation) { congregationState = { congregationId: '', congregationName: '', canShare: false, events: [] }; return; }
    try {
      const memberships = await congregation.load();
      const active = congregation.getActive?.() || memberships[0];
      if (!active) { congregationState = { congregationId: '', congregationName: '', canShare: false, events: [] }; return; }
      const canShare = congregation.can(active.congregationId, 'ministry');
      const rows = await api.calendar.listCongregation(active.congregationId);
      const events = (Array.isArray(rows) ? rows : []).map(row => normalizeEvent({
        id: row.id, source: 'congregation', ownerId: row.user_id, eventDate: row.event_date, title: row.title,
        notes: row.notes, allDay: row.all_day, recurrenceWeeks: row.recurrence_weeks
      })).filter(Boolean);
      congregationState = { congregationId: active.congregationId, congregationName: active.congregation?.name || '', canShare, events };
    } catch { congregationState = { congregationId: '', congregationName: '', canShare: false, events: [] }; }
  }

  async function flushPending(current,userId){
    let cache=readCache(current);
    let events=[...cache.events],pendingDeletes=[...cache.pendingDeletes];

    for(const id of [...pendingDeletes]){
      try{
        await api.calendar.remove(userId,id);
        pendingDeletes=pendingDeletes.filter(value=>value!==id);
      }catch{}
    }

    for(const event of [...events]){
      if(!event.pendingSync||pendingDeletes.includes(event.id))continue;
      try{
        const saved=await api.calendar.create(userId,event);
        const synced=personalFromRemote(saved);
        if(!synced)continue;
        events=events.map(row=>row.id===event.id?synced:row);
      }catch{}
    }

    writeCache(current,{events,pendingDeletes});
    return readCache(current);
  }

  function getAgenda({ startDate = clock(), days = 30 } = {}) {
    return buildAgenda(combinedEvents(), { today: startDate, days });
  }

  function present() {
    const current = owner();
    const cache=readCache(current),personal=cache.events;
    return Object.freeze({
      owner: current,
      accountUserId: sessionUserId(),
      scope: current.startsWith('account:') ? 'account-cloud' : 'guest-device',
      pendingSync:personal.filter(event=>event.pendingSync).length+cache.pendingDeletes.length,
      canShareWithCongregation: congregationState.canShare,
      congregationId: congregationState.congregationId,
      congregationName: congregationState.congregationName,
      events: Object.freeze(personal),
      agenda: getAgenda({ startDate: clock(), days: 30 })
    });
  }

  async function load() {
    const s = session.getState();
    const current = owner();
    if (s?.authenticated && s?.user?.id) {
      await flushPending(current,String(s.user.id));
      try {
        const remote = await api.calendar.list(s.user.id);
        const cache=readCache(current);
        const blocked=new Set(cache.pendingDeletes);
        const remoteEvents=(Array.isArray(remote)?remote:[]).map(personalFromRemote).filter(Boolean).filter(event=>!blocked.has(event.id));
        const remoteIds=new Set(remoteEvents.map(event=>event.id));
        const pendingLocal=cache.events.filter(event=>event.pendingSync&&!remoteIds.has(event.id)&&!blocked.has(event.id));
        writeCache(current,{events:[...remoteEvents,...pendingLocal],pendingDeletes:cache.pendingDeletes});
      } catch { /* pending/local cache stays authoritative until cloud reachable */ }
    }
    await loadCongregation();
    return present();
  }

  async function addEvent({ title, eventDate, notes = '', allDay = true, shareWithCongregation = false, recurrenceWeeks = 0 } = {}) {
    if (shareWithCongregation) {
      if (!congregationState.congregationId) fail('BQ_CALENDAR_NO_CONGREGATION', 'Join a congregation to share an event.');
      congregation.assert(congregationState.congregationId, 'ministry');
      const s = session.getState();
      const event = normalizeEvent({ id: nextId(), source: 'congregation', ownerId: s?.user?.id, eventDate, title, notes, allDay, recurrenceWeeks });
      if (!event) fail('BQ_CALENDAR_INPUT', 'Enter a title and a valid date.');
      await api.calendar.createCongregation(s.user.id, congregationState.congregationId, event);
      await loadCongregation();
      return present();
    }

    const event = normalizeEvent({ id: nextId(), source: 'personal', eventDate, title, notes, allDay });
    if (!event) fail('BQ_CALENDAR_INPUT', 'Enter a title and a valid date.');
    const current = owner(),s=session.getState(),accountOwned=Boolean(s?.authenticated&&s?.user?.id),cache=readCache(current);
    writeCache(current,{events:[...cache.events,freezeLocal(event,accountOwned)],pendingDeletes:cache.pendingDeletes});
    if(!accountOwned)return {...present(),synced:true};

    try {
      const saved = await api.calendar.create(s.user.id, event);
      const syncedEvent=personalFromRemote(saved);
      const latest=readCache(current);
      writeCache(current,{
        events:latest.events.map(row=>row.id===event.id?(syncedEvent||freezeLocal(event,false)):row),
        pendingDeletes:latest.pendingDeletes
      });
      return { ...present(), synced:true };
    } catch {
      return { ...present(), synced:false };
    }
  }

  async function updateCongregationEvent(id, { title, eventDate, notes, allDay, recurrenceWeeks } = {}) {
    if (!congregationState.congregationId) fail('BQ_CALENDAR_NO_CONGREGATION', 'Join a congregation to manage a shared event.');
    const userId = sessionUserId();
    if (!userId) fail('BQ_CALENDAR_AUTH_REQUIRED', 'Sign in to manage a shared event.');
    const current = congregationState.events.find(event => event.id === String(id));
    if (!current || current.ownerId !== userId) fail('BQ_CALENDAR_NOT_OWNER', 'Only the person who created this shared event can edit it.');
    const event = normalizeEvent({
      id: current.id,
      source: 'congregation',
      ownerId: userId,
      eventDate: eventDate ?? current.date,
      title: title ?? current.title,
      notes: notes ?? current.notes,
      allDay: allDay ?? current.allDay,
      recurrenceWeeks: recurrenceWeeks ?? current.recurrenceWeeks
    });
    if (!event) fail('BQ_CALENDAR_INPUT', 'Enter a title and a valid date.');
    const saved = await api.calendar.updateCongregation(userId, congregationState.congregationId, current.id, event);
    if (!saved) fail('BQ_CALENDAR_NOT_OWNER', 'This shared event could not be edited by this account.');
    await loadCongregation();
    return present();
  }

  async function removeCongregationEvent(id) {
    if (!congregationState.congregationId) fail('BQ_CALENDAR_NO_CONGREGATION', 'Join a congregation to manage a shared event.');
    const userId = sessionUserId();
    if (!userId) fail('BQ_CALENDAR_AUTH_REQUIRED', 'Sign in to manage a shared event.');
    const current = congregationState.events.find(event => event.id === String(id));
    if (!current || current.ownerId !== userId) fail('BQ_CALENDAR_NOT_OWNER', 'Only the person who created this shared event can delete it.');
    const removed = await api.calendar.removeCongregation(userId, congregationState.congregationId, current.id);
    if (!removed) fail('BQ_CALENDAR_NOT_OWNER', 'This shared event could not be deleted by this account.');
    await loadCongregation();
    return present();
  }

  async function removeEvent(id) {
    const current=owner(),targetId=String(id),cache=readCache(current),s=session.getState(),accountOwned=Boolean(s?.authenticated&&s?.user?.id);
    const events=cache.events.filter(event=>event.id!==targetId);
    let pendingDeletes=[...cache.pendingDeletes];
    if(accountOwned&&UUID_RE.test(targetId))pendingDeletes=[...new Set([...pendingDeletes,targetId])];
    writeCache(current,{events,pendingDeletes});

    if(!accountOwned||!UUID_RE.test(targetId))return {...present(),synced:true};
    try{
      await api.calendar.remove(s.user.id,targetId);
      const latest=readCache(current);
      writeCache(current,{events:latest.events,pendingDeletes:latest.pendingDeletes.filter(value=>value!==targetId)});
      return {...present(),synced:true};
    }catch{
      return {...present(),synced:false};
    }
  }

  return Object.freeze({ load, addEvent, updateCongregationEvent, removeCongregationEvent, removeEvent, getAgenda, getState: present });
}
