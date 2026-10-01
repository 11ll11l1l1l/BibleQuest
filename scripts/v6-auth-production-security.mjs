import { fileURLToPath } from 'node:url';

const PROJECT_REF_PATTERN = /^[a-z0-9]{8,40}$/;
const AUTH_CONFIG_ORIGIN = 'https://api.supabase.com';

export function assertLeakedPasswordProtection(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Supabase Auth configuration response is invalid.');
  }
  if (!Object.prototype.hasOwnProperty.call(config, 'password_hibp_enabled')) {
    throw new Error('Supabase Auth configuration does not expose password_hibp_enabled.');
  }
  if (config.password_hibp_enabled !== true) {
    throw new Error('Leaked-password protection is not enabled in the production Supabase Auth configuration.');
  }
  return Object.freeze({ passwordHibpEnabled: true });
}

export async function fetchAuthConfig({
  projectRef,
  accessToken,
  fetchImpl = globalThis.fetch,
} = {}) {
  const ref = String(projectRef || '').trim();
  const token = String(accessToken || '').trim();
  if (!PROJECT_REF_PATTERN.test(ref)) {
    throw new Error('Production Auth verification requires a valid Supabase project ref.');
  }
  if (!token) {
    throw new Error('Production Auth verification requires SUPABASE_ACCESS_TOKEN.');
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('Production Auth verification requires a fetch implementation.');
  }

  const url = new URL(`/v1/projects/${ref}/config/auth`, AUTH_CONFIG_ORIGIN);
  const response = await fetchImpl(url, {
    method: 'GET',
    redirect: 'error',
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Supabase Management API Auth config request failed: HTTP ${response.status}.`);
  }

  let config;
  try {
    config = await response.json();
  } catch {
    throw new Error('Supabase Management API Auth config response is not valid JSON.');
  }
  return config;
}

export async function verifyProductionLeakedPasswordProtection(options = {}) {
  const config = await fetchAuthConfig(options);
  return assertLeakedPasswordProtection(config);
}

async function main() {
  const projectRef = process.env.BQ_SUPABASE_PROJECT_REF;
  await verifyProductionLeakedPasswordProtection({
    projectRef,
    accessToken: process.env.SUPABASE_ACCESS_TOKEN,
  });
  console.log(`V6 production Auth security PASS: leaked-password protection is enabled for ${projectRef}.`);
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirect) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
