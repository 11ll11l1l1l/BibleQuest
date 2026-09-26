import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_PATH = resolve(ROOT, 'package.json');
const LOCK_PATH = resolve(ROOT, 'package-lock.json');
const EXACT_SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const REGISTRY_PREFIX = 'https://registry.npmjs.org/';
const DIRECT_SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function validateDirectPins(manifest, lockfile, failures) {
  const lockRoot = lockfile.packages?.[''] ?? {};

  for (const section of DIRECT_SECTIONS) {
    const declared = manifest[section] ?? {};
    const locked = lockRoot[section] ?? {};

    for (const [name, spec] of Object.entries(declared)) {
      if (typeof spec !== 'string' || !EXACT_SEMVER.test(spec)) {
        failures.push(`${section} ${name} must use an exact semver pin; found ${String(spec)}`);
        continue;
      }

      if (locked[name] !== spec) {
        failures.push(
          `${section} ${name} package-lock root mismatch; package.json=${spec}, package-lock=${String(locked[name])}`,
        );
      }
    }
  }
}

function validateLockSources(lockfile, failures) {
  if (lockfile.lockfileVersion !== 3) {
    failures.push(`package-lock.json must use lockfileVersion 3; found ${String(lockfile.lockfileVersion)}`);
  }

  if (!lockfile.packages || typeof lockfile.packages !== 'object') {
    failures.push('package-lock.json packages map is missing');
    return 0;
  }

  let checked = 0;
  for (const [path, entry] of Object.entries(lockfile.packages)) {
    if (!path) continue;
    checked += 1;

    if (entry?.link === true) {
      failures.push(`${path} uses a mutable/local link dependency`);
      continue;
    }

    const resolved = entry?.resolved;
    if (typeof resolved !== 'string' || !resolved.startsWith(REGISTRY_PREFIX)) {
      failures.push(`${path} must resolve from the HTTPS npm registry; found ${String(resolved)}`);
    }

    const integrity = entry?.integrity;
    if (typeof integrity !== 'string' || !integrity.startsWith('sha512-')) {
      failures.push(`${path} must carry sha512 integrity metadata`);
    }
  }

  return checked;
}

const manifest = readJson(PACKAGE_PATH);
const lockfile = readJson(LOCK_PATH);
const failures = [];

validateDirectPins(manifest, lockfile, failures);
const checkedPackages = validateLockSources(lockfile, failures);

if (failures.length > 0) {
  console.error('V6 dependency security policy failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `V6 dependency security policy passed: ${checkedPackages} locked packages use pinned HTTPS npm-registry sources with sha512 integrity.`,
);
