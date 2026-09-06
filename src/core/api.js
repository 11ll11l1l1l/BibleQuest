import { authStorage } from './storage.js';

const SUPABASE_MODULE = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm';
const CONFIG = Object.freeze({
  supabaseUrl: 'https://zkfmgezvzugchcwppreq.supabase.co',
  publishableKey: 'sb_publishable_mJyieT7WZT1vAZX7XFdsrg_lRgDxcsq'
});
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

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

  const auth = Object.freeze({
    enabled() {
      return !localPreview();
    },
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

  return Object.freeze({ auth, account, media });
}
