// BibleQuest shares the lightweight Karimen Supabase project to stay within the Free-plan two-project limit.
// All BibleQuest database objects use the bible_* namespace and remain logically isolated from Karimen tables.
// This browser file contains only the public project URL and publishable key. Never place privileged credentials here.
const BQ_LOCAL_HOSTS=new Set(['localhost','127.0.0.1','::1']);
const BQ_APP_ROOT=new URL('./',location.href).href;
window.BQ_CLOUD_CONFIG = Object.freeze({
  enabled: !BQ_LOCAL_HOSTS.has(location.hostname),
  authMode: 'email-password',
  recoveryMode: 'instant-recovery-code',
  supabaseUrl: 'https://zkfmgezvzugchcwppreq.supabase.co',
  publishableKey: 'sb_publishable_mJyieT7WZT1vAZX7XFdsrg_lRgDxcsq',
  redirectUrl: BQ_APP_ROOT
});