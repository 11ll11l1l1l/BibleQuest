import { authStorage } from './storage.js';

const SUPABASE_MODULE = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';
const CONFIG = Object.freeze({
  supabaseUrl: 'https://zkfmgezvzugchcwppreq.supabase.co',
  publishableKey: 'sb_publishable_mJyieT7WZT1vAZX7XFdsrg_lRgDxcsq'
});
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const CLOUD_NOTE_DB_FIELDS='id,user_id,title,book_code,book_name,chapter,verse_start,verse_end,body,note_type,tags,pinned,created_at,updated_at';
const CLOUD_NOTE_TYPES=new Set(['study','prayer','question','reflection','sermon','other']);
function cloudNoteFromDb(row){
  if(!row)return row;
  const {book_code:bookCode,book_name:bookName,body,pinned,...rest}=row;
  return {...rest,book:bookCode||bookName||'',content:String(body??''),is_pinned:pinned===true};
}
function cloudNoteToDb(payload={}){
  const book=String(payload.book??'').trim();
  const bookCode=/^[A-Z0-9]{3}$/.test(book)?book:null;
  const noteType=String(payload.note_type??'study').trim();
  const next={
    title:payload.title??null,
    book_code:bookCode,
    book_name:bookCode?null:(book||null),
    chapter:payload.chapter??null,
    verse_start:payload.verse_start??null,
    verse_end:payload.verse_end??null,
    body:String(payload.content??''),
    note_type:CLOUD_NOTE_TYPES.has(noteType)?noteType:'study',
    tags:Array.isArray(payload.tags)?payload.tags:[],
    pinned:payload.is_pinned===true
  };
  if(Object.prototype.hasOwnProperty.call(payload,'updated_at'))next.updated_at=payload.updated_at;
  return next;
}
const COUPLE_SHARED_FIELDS='id,pair_id,author_id,item_type,body,due_on,completed_at,created_at,updated_at';
const JOURNEY_GROUP_FIELDS='id,owner_id,congregation_id,name,description,schedule_text,max_members,active,created_at,updated_at';
const JOURNEY_GROUP_MEMBER_FIELDS='group_id,user_id,role,active,joined_at';
const ENCOURAGEMENT_FIELDS='id,group_id,sender_id,recipient_id,kind,created_at';
const PRESENCE_FIELDS='congregation_id,user_id,last_seen_at,surface';
const TEAM_FIELDS='id,congregation_id,created_by,team_type,name,active,created_at';
const TEAM_MEMBER_FIELDS='team_id,user_id,joined_at';
const TEAM_DIRECTORY_FIELDS='congregation_id,user_id,role,display_name,active,joined_at';
const RECOGNITION_DIRECTORY_FIELDS='congregation_id,user_id,role,display_name,avatar,active,joined_at';
const LEADERBOARD_DIRECTORY_FIELDS='congregation_id,user_id,role,display_name,avatar,active,joined_at';
const RECOGNITION_FIELDS='id,congregation_id,user_id,awarded_by,award_code,title,note,icon,visible,created_at';
const EARNED_BADGE_FIELDS='congregation_id,user_id,badge_id,metadata,earned_at';
const BADGE_CATALOG_FIELDS='id,icon,name,category,description,threshold,active,created_at';
const ASSIGNMENT_FIELDS='id,congregation_id,created_by,title,instructions,assignment_type,scripture_refs,target_scope,target_id,due_at,points,active,created_at,updated_at,schedule_at,recurrence_rule,reminder_at,required_reflection,min_quiz_score,evidence_type';
const ASSIGNMENT_PROGRESS_FIELDS='assignment_id,user_id,status,submission,leader_feedback,completed_at,updated_at';
const ASSIGNMENT_RESPONSE_PRESENCE_FIELDS='assignment_id,congregation_id,user_id,display_name,completed_at';
const ASSIGNMENT_PRIVATE_RESPONSE_FIELDS='assignment_id,user_id,status,submission,leader_feedback,completed_at,updated_at';
const NOTIFICATION_FIELDS='id,user_id,congregation_id,created_by,notification_type,title,body,action_kind,action_payload,read_at,expires_at,created_at';
const CONTENT_DECISION_FIELDS='congregation_id,content_key,content_type,origin,decision,updated_at';
const CONTENT_REVIEW_DECISION_FIELDS='congregation_id,content_key,content_type,origin,decision,content_ref,content_snapshot,rationale,reviewed_by,reviewed_at,updated_at';
const CONTENT_REVIEW_REPORT_FIELDS='id,congregation_id,reporter_id,content_key,content_type,content_source,content_ref,content_text,content_payload,reason,note,status,reviewed_by,reviewed_at,created_at,updated_at';
const CONTENT_REVIEW_MEMBER_FIELDS='user_id,display_name,role,avatar,active,joined_at';
const LIVE_ROOM_FIELDS='id,congregation_id,created_by,session_type,title,room_code,status,state,metadata,updated_at';
const LIVE_ROOM_PARTICIPANT_FIELDS='session_id,user_id,participation_points,created_at';
const LIVE_ROOM_DIRECTORY_FIELDS='user_id,display_name,avatar,active';
const CALENDAR_EVENT_FIELDS='id,user_id,title,notes,event_date,all_day,created_at,updated_at';
const CALENDAR_CONGREGATION_EVENT_FIELDS='id,congregation_id,user_id,title,notes,event_date,all_day,recurrence_weeks,created_at,updated_at';

function localPreview() {
  return LOCAL_HOSTS.has(location.hostname);
}

function unavailableError() {
  const error = new Error('Cloud account actions are disabled in local preview.');
  error.code = 'BQ_AUTH_LOCAL_DISABLED';
  return error;
}

async function functionMessage(error, fallback) {
  try {
    const response = error?.context;
    if (response?.clone) {
      const payload = await response.clone().json();
      if (payload?.error) return String(payload.error);
    }
  } catch {}
  return error?.message || fallback;
}

function withTimeout(promise, milliseconds, message) {
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), milliseconds); })
  ]).finally(() => clearTimeout(timer));
}

export function createApi() {
  let clientPromise = null;

  const getClient = async () => {
    if (localPreview()) throw unavailableError();
    if (!clientPromise) {
      clientPromise = import(SUPABASE_MODULE).then(module => module.createClient(
        CONFIG.supabaseUrl,
        CONFIG.publishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
            storage: authStorage
          }
        }
      ));
    }
    return clientPromise;
  };

  const invoke = async (name, body, headers = undefined) => {
    const client = await getClient();
    const { data, error } = await client.functions.invoke(name, { body, ...(headers ? { headers } : {}) });
    if (error) throw new Error(await functionMessage(error, `${name} failed.`));
    if (data?.error) throw new Error(String(data.error));
    return data || {};
  };

  const diagnostics = Object.freeze({
    async probe() {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      try {
        const target = new URL('./index.html', location.href);
        target.searchParams.set('bq-net-probe', String(Date.now()));
        const response = await fetch(target.href, { method:'GET',cache:'no-store',credentials:'same-origin',signal:controller.signal });
        return Object.freeze({ reachable:response.ok,status:response.status,reason:response.ok?'ok':'http' });
      } catch (error) {
        return Object.freeze({ reachable:false,status:0,reason:error?.name==='AbortError'?'timeout':'fetch-failed' });
      } finally { clearTimeout(timer); }
    }
  });

  const auth = Object.freeze({
    enabled() { return !localPreview(); },
    async getSession() {
      if (localPreview()) return { session: null };
      const client = await getClient();
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return { session: data.session ?? null };
    },
    async getUser() {
      if (localPreview()) return { user: null };
      const client = await getClient();
      const { data, error } = await client.auth.getUser();
      if (error) throw error;
      return { user: data.user ?? null };
    },
    async signIn(email, password) {
      if (localPreview()) throw unavailableError();
      const client = await getClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { session: data.session ?? null, user: data.user ?? null };
    },
    async verifyPassword(email, password) {
      if (localPreview()) throw unavailableError();
      const client = await getClient();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { session: data.session ?? null, user: data.user ?? null };
    },
    async updatePassword(password) {
      if (localPreview()) throw unavailableError();
      const client = await getClient();
      const { data, error } = await client.auth.updateUser({ password });
      if (error) throw error;
      return { user: data.user ?? null };
    },
    async signOut() {
      if (localPreview()) return;
      const client = await getClient();
      const { error } = await client.auth.signOut({ scope: 'local' });
      if (error) throw error;
    },
    async subscribe(listener) {
      if (localPreview()) return () => {};
      const client = await getClient();
      const { data } = client.auth.onAuthStateChange((event, session) => listener(event, session));
      return () => data.subscription.unsubscribe();
    }
  });

  const account = Object.freeze({
    async createAccount(payload) {
      const data = await invoke('bq-signup', payload);
      if (!data.ok || !data.recovery_code) throw new Error('Account creation did not return a recovery code.');
      return data;
    },
    async resetPassword(payload) {
      const data = await invoke('bq-password-reset', { action: 'reset', ...payload });
      if (!data.ok || !data.recovery_code) throw new Error('Password reset did not return a replacement recovery code.');
      return data;
    },
    async issueRecoveryCode() {
      const client = await getClient();
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) throw sessionError || new Error('Sign in again before creating a recovery code.');
      const data = await invoke('bq-password-reset', { action: 'issue' }, { Authorization: `Bearer ${sessionData.session.access_token}` });
      if (!data.ok || !data.recovery_code) throw new Error('Recovery-code creation did not finish correctly.');
      return data;
    },
    async listDevices(userId) {
      const client = await getClient();
      const { data, error } = await client.from('bible_devices').select('id,user_id,device_key,label,platform,trusted,first_seen_at,last_seen_at').eq('user_id', userId).order('last_seen_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    async upsertDevice(row) {
      const client = await getClient();
      const { data, error } = await client.from('bible_devices').upsert(row, { onConflict: 'user_id,device_key' }).select('id,user_id,device_key,label,platform,trusted,first_seen_at,last_seen_at').single();
      if (error) throw error;
      return data;
    },
    async removeDevice(userId, id) {
      const client = await getClient();
      const { error } = await client.from('bible_devices').delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    }
  });

  const congregation = Object.freeze({
    async listMemberships(userId) {
      const client = await getClient();
      const { data: memberships, error: membershipError } = await client.from('bible_congregation_members')
        .select('congregation_id,user_id,role,display_name,active,joined_at')
        .eq('user_id', userId)
        .eq('active', true)
        .order('joined_at', { ascending: true });
      if (membershipError) throw membershipError;
      const rows = memberships || [];
      if (!rows.length) return [];
      const ids = [...new Set(rows.map(row => row.congregation_id).filter(Boolean))];
      const { data: congregations, error: congregationError } = await client.from('bible_congregations')
        .select('id,name,timezone,owner_id,active')
        .in('id', ids)
        .eq('active', true);
      if (congregationError) throw congregationError;
      const byId = new Map((congregations || []).map(row => [String(row.id), row]));
      return rows.map(row => ({ ...row, congregation: byId.get(String(row.congregation_id)) || null })).filter(row => row.congregation);
    },
    async join(code) { return invoke('bq-join', { code }); }
  });

  const presence = Object.freeze({
    async list(congregationId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_presence').select(PRESENCE_FIELDS).eq('congregation_id',congregationId).order('last_seen_at',{ascending:false});
      if(error)throw error;
      return data||[];
    },
    async touch(congregationId,userId,surface='BibleQuest') {
      const client=await getClient();
      const row={congregation_id:String(congregationId),user_id:String(userId),last_seen_at:new Date().toISOString(),surface:String(surface||'BibleQuest').trim().slice(0,80)||'BibleQuest'};
      const {data,error}=await client.from('bible_presence').upsert(row,{onConflict:'congregation_id,user_id'}).select(PRESENCE_FIELDS).single();
      if(error)throw error;
      return data;
    },
    async leave(congregationId,userId) {
      const client=await getClient();
      const {error}=await client.from('bible_presence').delete().eq('congregation_id',congregationId).eq('user_id',userId);
      if(error)throw error;
    }
  });

  const teamCenter = Object.freeze({
    async list(congregationIds) {
      const ids=[...new Set((congregationIds||[]).map(String).filter(Boolean))];
      if(!ids.length)return {teams:[],members:[],directory:[]};
      const client=await getClient();
      const {data:teams,error:teamError}=await client.from('bible_teams').select(TEAM_FIELDS).in('congregation_id',ids).eq('team_type','game_team').eq('active',true).order('created_at',{ascending:true});
      if(teamError)throw teamError;
      const teamIds=[...new Set((teams||[]).map(row=>row.id).filter(Boolean))];
      let members=[];
      if(teamIds.length){const {data,error}=await client.from('bible_team_members').select(TEAM_MEMBER_FIELDS).in('team_id',teamIds).order('joined_at',{ascending:true});if(error)throw error;members=data||[]}
      const {data:directory,error:directoryError}=await client.from('bible_congregation_members').select(TEAM_DIRECTORY_FIELDS).in('congregation_id',ids).eq('active',true).order('joined_at',{ascending:true});
      if(directoryError)throw directoryError;
      return {teams:teams||[],members,directory:directory||[]};
    },
    async create(congregationId,name) { return invoke('bq-team',{action:'create',congregationId,name}); },
    async add(congregationId,teamId,targetUserId) { return invoke('bq-team',{action:'add',congregationId,teamId,targetUserId}); },
    async remove(congregationId,teamId,targetUserId) { return invoke('bq-team',{action:'remove',congregationId,teamId,targetUserId}); },
    async rename(congregationId,teamId,name) { return invoke('bq-team',{action:'rename',congregationId,teamId,name}); },
    async archive(congregationId,teamId) { return invoke('bq-team',{action:'archive',congregationId,teamId}); }
  });

  const scoreEvents = Object.freeze({
    async submit(congregationId,claims) { return invoke('bq-score',{congregationId,claims}); }
  });

  const leaderboards = Object.freeze({
    async load(congregationId,since=null) {
      const client=await getClient();
      const {data:scores,error:scoreError}=await client.rpc('bible_leaderboard',{p_congregation:congregationId,p_since:since});
      if(scoreError)throw scoreError;
      const {data:directory,error:directoryError}=await client.from('bible_congregation_members').select(LEADERBOARD_DIRECTORY_FIELDS).eq('congregation_id',congregationId).eq('active',true).order('joined_at',{ascending:true});
      if(directoryError)throw directoryError;
      return {scores:scores||[],directory:directory||[]};
    }
  });

  const avatarVault = Object.freeze({
    async load(userId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_avatar_cosmetics').select('user_id,selected_style,updated_at').eq('user_id',userId).maybeSingle();
      if(error)throw error;
      return data||null;
    },
    async save(userId,selectedStyle) {
      const client=await getClient();
      const avatar={cosmetic:selectedStyle};
      const updatedAt=new Date().toISOString();
      const cosmeticRes=await client.from('bible_avatar_cosmetics').upsert({user_id:userId,selected_style:selectedStyle,updated_at:updatedAt},{onConflict:'user_id'});
      if(cosmeticRes?.error)throw cosmeticRes.error;
      const memberRes=await client.from('bible_congregation_members').update({avatar}).eq('user_id',userId);
      if(memberRes?.error)throw memberRes.error;
      return {selected_style:selectedStyle,avatar};
    }
  });

  const congregationRecognition = Object.freeze({
    async load(congregationId) {
      const client=await getClient();
      const [directoryResult,recognitionResult,badgeResult,catalogResult]=await Promise.all([
        client.from('bible_congregation_members').select(RECOGNITION_DIRECTORY_FIELDS).eq('congregation_id',congregationId).eq('active',true).order('joined_at',{ascending:true}),
        client.from('bible_member_recognitions').select(RECOGNITION_FIELDS).eq('congregation_id',congregationId).eq('visible',true).order('created_at',{ascending:false}).limit(200),
        client.from('bible_user_badges').select(EARNED_BADGE_FIELDS).eq('congregation_id',congregationId).order('earned_at',{ascending:false}).limit(3000),
        client.from('bible_badge_catalog').select(BADGE_CATALOG_FIELDS).eq('active',true).limit(500)
      ]);
      for(const result of[directoryResult,recognitionResult,badgeResult,catalogResult])if(result.error)throw result.error;
      return {directory:directoryResult.data||[],recognitions:recognitionResult.data||[],badges:badgeResult.data||[],catalog:catalogResult.data||[]};
    },
    async award(row) {
      const client=await getClient();
      const {data,error}=await client.from('bible_member_recognitions').insert(row).select(RECOGNITION_FIELDS).single();
      if(error)throw error;
      return data;
    }
  });

  const assignments = Object.freeze({
    async load(congregationId,userId) {
      const client=await getClient();
      const {data:rows,error}=await client.from('bible_assignments').select(ASSIGNMENT_FIELDS).eq('congregation_id',congregationId).eq('active',true).order('due_at',{ascending:true,nullsFirst:false}).order('created_at',{ascending:false}).limit(200);
      if(error)throw error;
      const assignmentRows=rows||[],ids=[...new Set(assignmentRows.map(row=>row.id).filter(Boolean))];
      if(!ids.length)return {assignments:[],progress:[]};
      const {data:progress,error:progressError}=await client.from('bible_assignment_progress').select(ASSIGNMENT_PROGRESS_FIELDS).eq('user_id',userId).in('assignment_id',ids).order('updated_at',{ascending:false});
      if(progressError)throw progressError;
      return {assignments:assignmentRows,progress:progress||[]};
    },
    async loadResponsePresence(congregationId,assignmentId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_assignment_response_presence').select(ASSIGNMENT_RESPONSE_PRESENCE_FIELDS).eq('congregation_id',String(congregationId)).eq('assignment_id',String(assignmentId)).order('completed_at',{ascending:true});
      if(error)throw error;
      return data||[];
    },
    async loadPrivateResponses(assignmentId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_assignment_progress').select(ASSIGNMENT_PRIVATE_RESPONSE_FIELDS).eq('assignment_id',String(assignmentId)).eq('status','completed').order('completed_at',{ascending:true});
      if(error)throw error;
      return data||[];
    },
    async targets(congregationId) { return invoke('bq-assignment',{action:'targets',congregationId}); },
    async create(congregationId,payload) { return invoke('bq-assignment',{action:'create',congregationId,...payload}); },
    async start(congregationId,assignmentId) { return invoke('bq-assignment',{action:'start',congregationId,assignmentId}); },
    async complete(congregationId,assignmentId,submission,quizScore=null) { return invoke('bq-assignment',{action:'complete',congregationId,assignmentId,submission,quizScore}); },
    async subscribe(congregationId,userId,listener) {
      const client=await getClient();
      let closed=false;
      const channel=client.channel(`bq-v3-assignments-${congregationId}-${userId}`)
        .on('postgres_changes',{event:'*',schema:'public',table:'bible_assignments',filter:`congregation_id=eq.${congregationId}`},()=>listener?.())
        .on('postgres_changes',{event:'*',schema:'public',table:'bible_assignment_progress',filter:`user_id=eq.${userId}`},()=>listener?.())
        .subscribe();
      return ()=>{if(closed)return;closed=true;void client.removeChannel(channel)};
    }
  });

  const notifications = Object.freeze({
    async list(userId,nowIso=new Date().toISOString()) {
      const client=await getClient();
      const {data,error}=await client.from('bible_notifications').select(NOTIFICATION_FIELDS).eq('user_id',userId).or(`expires_at.is.null,expires_at.gt.${nowIso}`).order('created_at',{ascending:false}).limit(100);
      if(error)throw error;
      return data||[];
    },
    async setReadState(userId,id,readAt) {
      const client=await getClient();
      const {data,error}=await client.from('bible_notifications').update({read_at:readAt??null}).eq('id',id).eq('user_id',userId).select(NOTIFICATION_FIELDS).maybeSingle();
      if(error)throw error;
      if(!data)throw new Error('Notification was not found for this account.');
      return data;
    },
    async markAllRead(userId,readAt=new Date().toISOString()) {
      const client=await getClient();
      const {data,error}=await client.from('bible_notifications').update({read_at:readAt}).eq('user_id',userId).is('read_at',null).select('id');
      if(error)throw error;
      return data||[];
    }
  });

  const cloudNotes = Object.freeze({
    async list(userId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_notes').select(CLOUD_NOTE_DB_FIELDS).eq('user_id',userId).order('pinned',{ascending:false}).order('updated_at',{ascending:false});
      if(error)throw error;
      return (data||[]).map(cloudNoteFromDb);
    },
    async create(userId,payload) {
      const client=await getClient();
      const {data,error}=await client.from('bible_notes').insert({...cloudNoteToDb(payload),user_id:userId}).select(CLOUD_NOTE_DB_FIELDS).single();
      if(error)throw error;
      return cloudNoteFromDb(data);
    },
    async update(userId,id,expectedUpdatedAt,payload) {
      const client=await getClient();
      const {data,error}=await client.from('bible_notes').update(cloudNoteToDb(payload)).eq('id',id).eq('user_id',userId).eq('updated_at',expectedUpdatedAt).select(CLOUD_NOTE_DB_FIELDS).maybeSingle();
      if(error)throw error;
      return cloudNoteFromDb(data||null);
    },
    async remove(userId,id,expectedUpdatedAt) {
      const client=await getClient();
      const {data,error}=await client.from('bible_notes').delete().eq('id',id).eq('user_id',userId).eq('updated_at',expectedUpdatedAt).select('id').maybeSingle();
      if(error)throw error;
      return data||null;
    }
  });

  const couples = Object.freeze({
    async status() { return invoke('bq-couple',{action:'status'}); },
    async create() { return invoke('bq-couple',{action:'create'}); },
    async join(code) { return invoke('bq-couple',{action:'join',code}); },
    async leave(pairId) { return invoke('bq-couple',{action:'leave',pairId}); },
    async listShared(pairId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_couple_shared').select(COUPLE_SHARED_FIELDS).eq('pair_id',pairId).order('created_at',{ascending:false}).limit(60);
      if(error)throw error;
      return data||[];
    },
    async addShared(rows) {
      const client=await getClient();
      const {data,error}=await client.from('bible_couple_shared').insert(rows).select(COUPLE_SHARED_FIELDS);
      if(error)throw error;
      return data||[];
    }
  });

  const journeyGroups = Object.freeze({
    async list(userId) {
      const client=await getClient();
      const {data:mine,error:mineError}=await client.from('bible_group_members').select(JOURNEY_GROUP_MEMBER_FIELDS).eq('user_id',userId).eq('active',true).order('joined_at',{ascending:true});
      if(mineError)throw mineError;
      const groupIds=[...new Set((mine||[]).map(row=>row.group_id).filter(Boolean))];
      if(!groupIds.length)return {groups:[],members:[]};
      const {data:groups,error:groupError}=await client.from('bible_groups').select(JOURNEY_GROUP_FIELDS).in('id',groupIds).eq('active',true).order('created_at',{ascending:true});
      if(groupError)throw groupError;
      const visibleIds=[...new Set((groups||[]).map(row=>row.id).filter(Boolean))];
      if(!visibleIds.length)return {groups:[],members:[]};
      const {data:members,error:memberError}=await client.from('bible_group_members').select(JOURNEY_GROUP_MEMBER_FIELDS).in('group_id',visibleIds).eq('active',true).order('joined_at',{ascending:true});
      if(memberError)throw memberError;
      return {groups:groups||[],members:members||[]};
    },
    async create(payload) { return invoke('bq-journey-group',{action:'create',...payload}); },
    async join(inviteCode) { return invoke('bq-journey-group',{action:'join',invite_code:inviteCode}); },
    async rotateCode(groupId) { return invoke('bq-journey-group',{action:'rotate_code',group_id:groupId}); },
    async leave(groupId) { return invoke('bq-journey-group',{action:'leave',group_id:groupId}); }
  });

  const liveRooms = Object.freeze({
    async create(row) {
      const client=await getClient();
      const {data,error}=await client.from('bible_shared_sessions').insert(row).select(LIVE_ROOM_FIELDS).single();
      if(error)throw error;
      return data;
    },
    async findByCode(roomCode) {
      const client=await getClient();
      const {data,error}=await client.from('bible_shared_sessions').select(LIVE_ROOM_FIELDS).eq('room_code',roomCode).neq('status','ended').maybeSingle();
      if(error)throw error;
      return data||null;
    },
    async loadRoom(roomId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_shared_sessions').select(LIVE_ROOM_FIELDS).eq('id',roomId).maybeSingle();
      if(error)throw error;
      return data||null;
    },
    async joinParticipant(roomId,userId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_session_participants').upsert({session_id:roomId,user_id:userId,participation_points:0},{onConflict:'session_id,user_id'}).select(LIVE_ROOM_PARTICIPANT_FIELDS).single();
      if(error)throw error;
      return data;
    },
    async participants(roomId,congregationId) {
      const client=await getClient();
      const {data:participants,error:participantError}=await client.from('bible_session_participants').select(LIVE_ROOM_PARTICIPANT_FIELDS).eq('session_id',roomId).order('created_at',{ascending:true});
      if(participantError)throw participantError;
      const rows=participants||[],ids=[...new Set(rows.map(row=>row.user_id).filter(Boolean))];
      if(!ids.length)return {participants:rows,directory:[]};
      const {data:directory,error:directoryError}=await client.from('bible_congregation_members').select(LIVE_ROOM_DIRECTORY_FIELDS).eq('congregation_id',congregationId).eq('active',true).in('user_id',ids);
      if(directoryError)throw directoryError;
      return {participants:rows,directory:directory||[]};
    },
    async endRoom(roomId,userId) {
      const client=await getClient(),now=new Date().toISOString();
      const {data,error}=await client.from('bible_shared_sessions').update({status:'ended',ended_at:now,updated_at:now}).eq('id',roomId).eq('created_by',userId).select(LIVE_ROOM_FIELDS).maybeSingle();
      if(error)throw error;
      return data||null;
    },
    async subscribe(roomId,listener) {
      const client=await getClient();
      let closed=false;
      const channel=client.channel(`bq-v3-live-room-${roomId}`)
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'bible_shared_sessions',filter:`id=eq.${roomId}`},payload=>listener?.({type:'room',room:payload.new}))
        .on('postgres_changes',{event:'*',schema:'public',table:'bible_session_participants',filter:`session_id=eq.${roomId}`},()=>listener?.({type:'participants'}))
        .subscribe(status=>listener?.({type:'connection',status}));
      return ()=>{if(closed)return;closed=true;void client.removeChannel(channel)};
    }
  });

  const encouragements = Object.freeze({
    async list(groupIds) {
      const ids=[...new Set((groupIds||[]).map(String).filter(Boolean))];
      if(!ids.length)return [];
      const client=await getClient();
      const {data,error}=await client.from('bible_group_encouragements').select(ENCOURAGEMENT_FIELDS).in('group_id',ids).order('created_at',{ascending:false}).limit(80);
      if(error)throw error;
      return data||[];
    },
    async send(groupId,kind) { return invoke('bq-journey-group',{action:'encourage',group_id:groupId,kind}); }
  });

  const contentDecisions = Object.freeze({
    async list(congregationId) {
      const id=String(congregationId||'').trim();
      if(!id)throw new Error('Content moderation congregation is required.');
      const client=await getClient();
      const request=client.from('bible_content_decisions').select(CONTENT_DECISION_FIELDS).eq('congregation_id',id).order('updated_at',{ascending:false}).limit(4000);
      const {data,error}=await withTimeout(request,1400,'Content moderation policy took too long to load.');
      if(error)throw error;
      return data||[];
    }
  });

  const contentReports = Object.freeze({
    async submit(row) {
      const client=await getClient();
      const {data,error}=await client.from('bible_content_reports').insert(row).select('id,congregation_id,reporter_id,content_key,reason,status,created_at').single();
      if(error)throw error;
      return data;
    }
  });

  const contentReview = Object.freeze({
    async platformAccess(userId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_app_access').select('role,active').eq('user_id',userId).maybeSingle();
      if(error)throw error;
      return data||null;
    },
    async listPlatformCongregations() {
      const client=await getClient();
      const {data,error}=await client.from('bible_congregations').select('id,name,timezone,owner_id,active').eq('active',true).order('name',{ascending:true}).limit(500);
      if(error)throw error;
      return data||[];
    },
    async loadQueue(congregationId) {
      const id=String(congregationId||'').trim();if(!id)throw new Error('Content Review congregation is required.');
      const client=await getClient();
      const request=Promise.all([
        client.from('bible_content_decisions').select(CONTENT_REVIEW_DECISION_FIELDS).eq('congregation_id',id).order('updated_at',{ascending:false}).limit(4000),
        client.from('bible_content_reports').select(CONTENT_REVIEW_REPORT_FIELDS).eq('congregation_id',id).order('created_at',{ascending:false}).limit(500),
        client.from('bible_congregation_members').select(CONTENT_REVIEW_MEMBER_FIELDS).eq('congregation_id',id).eq('active',true).order('joined_at',{ascending:true}).limit(3000)
      ]);
      const [decisions,reports,members]=await withTimeout(request,6000,'Content Review queue took too long to load.');
      for(const result of[decisions,reports,members])if(result.error)throw result.error;
      return {decisions:decisions.data||[],reports:reports.data||[],members:members.data||[]};
    },
    async saveDecision(row) {
      const client=await getClient();
      const {data,error}=await client.from('bible_content_decisions').upsert(row,{onConflict:'congregation_id,content_key'}).select(CONTENT_REVIEW_DECISION_FIELDS).single();
      if(error)throw error;
      return data;
    },
    async markReportsReviewed(congregationId,contentKey,reviewedBy,reviewedAt) {
      const client=await getClient();
      const {data,error}=await client.from('bible_content_reports').update({status:'reviewed',reviewed_by:reviewedBy,reviewed_at:reviewedAt,updated_at:reviewedAt}).eq('congregation_id',congregationId).eq('content_key',contentKey).eq('status','open').select('id');
      if(error)throw error;
      return data||[];
    }
  });

  const adminConsole=Object.freeze({
    async status(){return invoke('bq-admin',{action:'status'});},
    async listUsers({page=1,perPage=200}={}){return invoke('bq-admin',{action:'list_users',page,perPage});},
    async setRole(targetUserId,role){return invoke('bq-admin',{action:'set_role',targetUserId,role});},
    async setCongregation(targetUserId,congregationId,{replace=true}={}){return invoke('bq-admin',{action:'set_congregation',targetUserId,congregationId,replace});},
    async removeCongregation(targetUserId,congregationId){return invoke('bq-admin',{action:'remove_congregation',targetUserId,congregationId});},
    async setCongregationRole(targetUserId,congregationId,role){return invoke('bq-admin',{action:'set_congregation_role',targetUserId,congregationId,role});},
    async createCongregation(name){return invoke('bq-create-congregation',{name});},
    async createSmallGroup(payload){return invoke('bq-admin',{action:'create_small_group',...payload});},
    async setGroupMembership(payload){return invoke('bq-admin',{action:'set_group_membership',...payload});},
    async setGroupOwner(targetUserId,groupId){return invoke('bq-admin',{action:'set_group_owner',targetUserId,groupId});}
  });

  const adminOperations=Object.freeze({
    async status(){return invoke('bq-admin-ops',{action:'status'});},
    async health(){return invoke('bq-admin-ops',{action:'health'});},
    async dashboard(){return invoke('bq-admin-ops',{action:'dashboard'});},
    async deleteUser(targetUserId){return invoke('bq-admin-ops',{action:'delete_user',targetUserId});},
    async suspendAccount(targetUserId,reason=''){return invoke('bq-admin-ops',{action:'suspend_account',targetUserId,reason});},
    async reactivateAccount(targetUserId){return invoke('bq-admin-ops',{action:'reactivate_account',targetUserId});},
    async forceSignOut(targetUserId){return invoke('bq-admin-ops',{action:'force_sign_out',targetUserId});},
    async setTempPassword(targetUserId,password){return invoke('bq-admin-ops',{action:'set_temp_password',targetUserId,password});},
    async frontendHealth(){
      const loadText=async path=>{const response=await withTimeout(fetch(new URL(path,location.href),{cache:'no-store',credentials:'same-origin'}),3500,`Admin Operations health check timed out for ${path}.`);if(!response.ok)throw new Error(`Admin Operations health check failed for ${path}.`);return response.text()};
      const loadJson=async path=>{const response=await withTimeout(fetch(new URL(path,location.href),{cache:'no-store',credentials:'same-origin'}),3500,`Admin Operations health check timed out for ${path}.`);if(!response.ok)throw new Error(`Admin Operations health check failed for ${path}.`);return response.json()};
      const [sw,pack,policy,build]=await Promise.all([loadText('./sw.js'),loadJson('./data/packs/manifest.json'),loadText('./data/doctrinal-safety.js'),loadJson('./build-info.json').catch(()=>({}))]);
      return Object.freeze({pwa:sw.match(/const CACHE=['"]biblequest-v(\d+)['"]/)?.[1]||'?',packPolicy:String(pack?.doctrinal_safety_version??'?'),runtimePolicy:policy.match(/const VERSION=(\d+)/)?.[1]||'?',build:String(build?.commit||build?.version||'main')});
    }
  });

  const media = Object.freeze({
    async listLiveRecordings() {
      const client = await getClient();
      const now = new Date().toISOString();
      const request = client.from('bible_media_library')
        .select('id,title,description,youtube_url,youtube_id,featured,created_at,publish_at,active,media_type')
        .eq('active', true)
        .eq('media_type', 'youtube_video')
        .lte('publish_at', now)
        .order('featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(80);
      const { data, error } = await withTimeout(request, 10000, 'Live Recordings took too long to load. Please try again.');
      if (error) throw error;
      return (data || []).filter(row => String(row.youtube_url || '').includes('youtube.com/live/'));
    }
  });

    const calendar = Object.freeze({
    async list(userId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_calendar_events').select(CALENDAR_EVENT_FIELDS).eq('user_id',userId).order('event_date',{ascending:true});
      if(error)throw error;
      return data||[];
    },
    async create(userId,event) {
      const client=await getClient();
      const {data,error}=await client.from('bible_calendar_events').insert({user_id:userId,title:event.title,notes:event.notes||'',event_date:event.date,all_day:event.allDay!==false}).select(CALENDAR_EVENT_FIELDS).single();
      if(error)throw error;
      return data;
    },
    async remove(userId,id) {
      const client=await getClient();
      const {error}=await client.from('bible_calendar_events').delete().eq('user_id',userId).eq('id',id);
      if(error)throw error;
      return true;
    },
    async listCongregation(congregationId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_calendar_events').select(CALENDAR_CONGREGATION_EVENT_FIELDS).eq('congregation_id',congregationId).order('event_date',{ascending:true});
      if(error)throw error;
      return data||[];
    },
    async createCongregation(userId,congregationId,event) {
      const client=await getClient();
      const {data,error}=await client.from('bible_calendar_events').insert({user_id:userId,congregation_id:congregationId,title:event.title,notes:event.notes||'',event_date:event.date,all_day:event.allDay!==false,recurrence_weeks:event.recurrenceWeeks||0}).select(CALENDAR_CONGREGATION_EVENT_FIELDS).single();
      if(error)throw error;
      return data;
    },
    async updateCongregation(userId,congregationId,id,event) {
      const client=await getClient();
      const {data,error}=await client.from('bible_calendar_events').update({title:event.title,notes:event.notes||'',event_date:event.date,all_day:event.allDay!==false,recurrence_weeks:event.recurrenceWeeks||0,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',userId).eq('congregation_id',congregationId).select(CALENDAR_CONGREGATION_EVENT_FIELDS).maybeSingle();
      if(error)throw error;
      return data||null;
    },
    async removeCongregation(userId,congregationId,id) {
      const client=await getClient();
      const {data,error}=await client.from('bible_calendar_events').delete().eq('id',id).eq('user_id',userId).eq('congregation_id',congregationId).select('id').maybeSingle();
      if(error)throw error;
      return data||null;
    }
  });

  return Object.freeze({ auth, account, congregation, presence, teamCenter, scoreEvents, leaderboards, avatarVault, calendar, congregationRecognition, assignments, notifications, cloudNotes, couples, journeyGroups, liveRooms, encouragements, contentDecisions, contentReports, contentReview, adminConsole, adminOperations, media, diagnostics });
}