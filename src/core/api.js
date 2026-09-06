import { authStorage } from './storage.js';

const SUPABASE_VERSION = '2.112.4';
const SUPABASE_MODULE = `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@${SUPABASE_VERSION}/+esm`;
const CONFIG = Object.freeze({
  supabaseUrl: 'https://zkfmgezvzugchcwppreq.supabase.co',
  publishableKey: 'sb_publishable_mJyieT7WZT1vAZX7XFdsrg_lRgDxcsq'
});
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function localPreview() {
  return LOCAL_HOSTS.has(location.hostname);
}

function unavailableError() {
  const error = new Error('Cloud sign-in is disabled in local preview.');
  error.code = 'BQ_AUTH_LOCAL_DISABLED';
  return error;
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

  return Object.freeze({ auth });
}
