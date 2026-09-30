import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_CSP_SOURCES = Object.freeze({
  'script-src': Object.freeze(["'self'", 'https://cdn.jsdelivr.net', 'https://www.youtube.com']),
  'connect-src': Object.freeze([
    "'self'",
    'https://zkfmgezvzugchcwppreq.supabase.co',
    'wss://zkfmgezvzugchcwppreq.supabase.co',
    'https://cdn.jsdelivr.net',
    'https://openbible.com',
  ]),
  'media-src': Object.freeze(["'self'", 'https://openbible.com']),
  'frame-src': Object.freeze(['https://www.youtube.com']),
  'img-src': Object.freeze(["'self'", 'https://i.ytimg.com']),
});

export const RUNTIME_EVIDENCE = Object.freeze([
  Object.freeze({
    file: 'src/core/api.js',
    directive: 'script-src',
    token: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/+esm',
  }),
  Object.freeze({
    file: 'src/core/api.js',
    directive: 'connect-src',
    token: 'https://zkfmgezvzugchcwppreq.supabase.co',
  }),
  Object.freeze({
    file: 'src/app/japanese-furigana-tokenizer.js',
    directive: 'script-src',
    token: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js',
  }),
  Object.freeze({
    file: 'src/app/japanese-furigana-tokenizer.js',
    directive: 'connect-src',
    token: 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/',
  }),
  Object.freeze({
    file: 'src/v6/reader/openbible-hays-catalog.ts',
    directive: 'media-src',
    token: 'https://openbible.com/audio/',
  }),
  Object.freeze({
    file: 'src/v6/media/youtube-iframe-loader.ts',
    directive: 'script-src',
    token: 'https://www.youtube.com/iframe_api',
  }),
  Object.freeze({
    file: 'src/v6/media/youtube-iframe-adapter.ts',
    directive: 'frame-src',
    token: 'picture-in-picture',
  }),
  Object.freeze({
    file: 'media-library.js',
    directive: 'img-src',
    token: 'https://i.ytimg.com/vi/',
  }),
]);

export function parseCsp(policyText) {
  const directives = new Map();
  for (const segment of String(policyText || '').split(';')) {
    const parts = segment.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) continue;
    const [name, ...sources] = parts;
    if (directives.has(name)) throw new Error(`CSP repeats directive: ${name}`);
    directives.set(name, sources);
  }
  return directives;
}

export function rootCspFromHeaders(headersText) {
  const lines = String(headersText || '').split(/\r?\n/);
  let inRoot = false;
  for (const line of lines) {
    if (!/^\s/.test(line) && line.trim()) {
      inRoot = line.trim() === '/*';
      continue;
    }
    if (!inRoot) continue;
    const match = /^\s+Content-Security-Policy:\s*(.+)$/i.exec(line);
    if (match) return match[1].trim();
  }
  return null;
}

export function validatePolicyCompatibility(policyText) {
  const directives = parseCsp(policyText);
  const missing = [];
  for (const [directive, required] of Object.entries(REQUIRED_CSP_SOURCES)) {
    const actual = new Set(directives.get(directive) || []);
    for (const source of required) {
      if (!actual.has(source)) missing.push(`${directive} missing ${source}`);
    }
  }
  if ((directives.get('script-src') || []).includes("'unsafe-eval'")) {
    missing.push("script-src must not use 'unsafe-eval'");
  }
  return Object.freeze({ compatible: missing.length === 0, missing, directives });
}

export async function auditRuntimeEvidence(readText = path => readFile(path, 'utf8')) {
  const evidence = [];
  for (const item of RUNTIME_EVIDENCE) {
    const content = await readText(item.file);
    if (!content.includes(item.token)) {
      throw new Error(`CSP runtime evidence changed: ${item.file} no longer contains ${item.token}`);
    }
    evidence.push(item);
  }
  return evidence;
}

export async function auditCspCompatibility({
  headersPath = '_headers',
  readText = path => readFile(path, 'utf8'),
} = {}) {
  const evidence = await auditRuntimeEvidence(readText);
  const headers = await readText(headersPath);
  const policy = rootCspFromHeaders(headers);
  if (!policy) {
    return Object.freeze({
      enforced: false,
      compatible: false,
      reason: 'No root Content-Security-Policy header is currently enforced.',
      requiredSources: REQUIRED_CSP_SOURCES,
      evidence,
    });
  }
  const validation = validatePolicyCompatibility(policy);
  return Object.freeze({
    enforced: true,
    compatible: validation.compatible,
    missing: validation.missing,
    requiredSources: REQUIRED_CSP_SOURCES,
    evidence,
  });
}

const invokedAsCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  auditCspCompatibility().then(
    result => {
      console.log(JSON.stringify(result, null, 2));
      if (result.enforced && !result.compatible) process.exitCode = 1;
    },
    error => {
      console.error(error?.stack || error);
      process.exitCode = 1;
    },
  );
}
