// BibleQuest shares the lightweight Karimen Supabase project to stay within the Free-plan two-project limit.
// All BibleQuest database objects use the bible_* namespace and remain logically isolated from Karimen tables.
// Publishable keys are intentionally browser-safe. Never place a Supabase secret/service-role key here.
const BQ_LOCAL_HOSTS=new Set(['localhost','127.0.0.1','::1']);
window.BQ_CLOUD_CONFIG = Object.freeze({
  enabled: !BQ_LOCAL_HOSTS.has(location.hostname),
  authMode: 'email-password',
  supabaseUrl: 'https://zkfmgezvzugchcwppreq.supabase.co',
  publishableKey: 'sb_publishable_mJyieT7WZT1vAZX7XFdsrg_lRgDxcsq',
  redirectUrl: 'https://11ll11l1l1l.github.io/BibleQuest/'
});
