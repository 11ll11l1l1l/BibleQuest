import { authStorage } from './storage.js';

const SUPABASE_MODULE = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';
const CONFIG = Object.freeze({
  supabaseUrl: 'https://zkfmgezvzugchcwppreq.supabase.co',
  publishableKey: 'sb_publishable_mJyieT7WZT1vAZX7XFdsrg_lRgDxcsq'
});
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const CLOUD_NOTE_FIELDS='id,user_id,book,chapter,verse_start,verse_end,title,content,tags,note_type,is_pinned,created_at,updated_at';
const COUPLE_SHARED_FIELDS='id,pair_id,author_id,item_type,body,due_on,completed_at,created_at,updated_at';
const JOURNEY_GROUP_FIELDS='id,owner_id,congregation_id,name,description,schedule_text,max_members,active,created_at,updated_at';
const JOURNEY_GROUP_MEMBER_FIELDS='group_id,user_id,role,active,joined_at';
const ENCOURAGEMENT_FIELDS='id,group_id,sender_id,recipient_id,kind,created_at';
const PRESENCE_FIELDS='congregation_id,user_id,last_seen_at,surface';
const TEAM_FIELDS='id,congregation_id,created_by,team_type,name,active,created_at';
const TEAM_MEMBER_FIELDS='team_id,user_id,joined_at';
const TEAM_DIRECTORY_FIELDS='congregation_id,user_id,role,display_name,active,joined_at';
const RECOGNITION_DIRECTORY_FIELDS='congregation_id,user_id,role,display_name,avatar,active,joined_at';
const RECOGNITION_FIELDS='id,congregation_id,user_id,awarded_by,award_code,title,note,icon,visible,created_at';
const EARNED_BADGE_FIELDS='congregation_id,user_id,badge_id,metadata,earned_at';
const BADGE_CATALOG_FIELDS='id,icon,name,category,description,threshold,active,created_at';

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
      const {data:directory,error:directoryError}=await client.from('bible_congregation_members').select(TEAM_DIRECTORY_FIELDS).eq('congregation_id',congregationId).eq('active',true).order('joined_at',{ascending:true});
      if(directoryError)throw directoryError;
      return {scores:scores||[],directory:directory||[]};
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

  const cloudNotes = Object.freeze({
    async list(userId) {
      const client=await getClient();
      const {data,error}=await client.from('bible_notes').select(CLOUD_NOTE_FIELDS).eq('user_id',userId).order('is_pinned',{ascending:false}).order('updated_at',{ascending:false});
      if(error)throw error;
      return data||[];
    },
    async create(userId,payload) {
      const client=await getClient();
      const {data,error}=await client.from('bible_notes').insert({...payload,user_id:userId}).select(CLOUD_NOTE_FIELDS).single();
      if(error)throw error;
      return data;
    },
    async update(userId,id,expectedUpdatedAt,payload) {
      const client=await getClient();
      const {data,error}=await client.from('bible_notes').update(payload).eq('id',id).eq('user_id',userId).eq('updated_at',expectedUpdatedAt).select(CLOUD_NOTE_FIELDS).maybeSingle();
      if(error)throw error;
      return data||null;
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

  return Object.freeze({ auth, account, congregation, presence, teamCenter, scoreEvents, leaderboards, congregationRecognition, cloudNotes, couples, journeyGroups, encouragements, media, diagnostics });
}