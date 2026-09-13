import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.argv[2] ?? process.cwd());
const contractPath = path.join(root, "config", "v5-static-artifacts.json");

function fail(message) {
  throw new Error(`[artifact-contract] ${message}`);
}

function cleanRef(value) {
  const ref = String(value ?? "").trim();
  if (
    !ref ||
    ref.startsWith("#") ||
    ref.startsWith("//") ||
    /^(?:[a-z][a-z0-9+.-]*:)/i.test(ref)
  ) {
    return null;
  }
  return ref.split(/[?#]/, 1)[0].replace(/^\.?\//, "");
}

function ensureSafeRelative(value, label) {
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (
    !normalized ||
    normalized === "." ||
    normalized.startsWith("../") ||
    path.posix.isAbsolute(normalized)
  ) {
    fail(`${label} must be a repository-relative path: ${value}`);
  }
  return normalized;
}

async function mustBeFile(relativePath, label = "artifact") {
  const safe = ensureSafeRelative(relativePath, label);
  const absolute = path.resolve(root, safe);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    fail(`${label} escapes repository root: ${relativePath}`);
  }
  try {
    const info = await stat(absolute);
    if (!info.isFile()) fail(`${label} is not a file: ${safe}`);
  } catch (error) {
    if (error?.code === "ENOENT") fail(`${label} is missing: ${safe}`);
    throw error;
  }
  return safe;
}

function localHtmlRefs(html) {
  const refs = [];
  const pattern = /\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi;
  for (const match of html.matchAll(pattern)) {
    const ref = cleanRef(match[2]);
    if (ref) refs.push(ref);
  }
  return refs;
}

const contract = JSON.parse(await readFile(contractPath, "utf8"));
if (contract.schemaVersion !== 1) {
  fail(`unsupported schemaVersion: ${contract.schemaVersion}`);
}

const rootCopies = (contract.rootCopies ?? []).map((item) =>
  ensureSafeRelative(item, "rootCopies entry")
);
if (new Set(rootCopies).size !== rootCopies.length) {
  fail("rootCopies contains duplicate paths");
}

for (const artifact of rootCopies) {
  await mustBeFile(artifact, "rootCopies entry");
}

const indexPath = ensureSafeRelative(
  contract.entryDocument ?? "index.html",
  "entryDocument"
);
const indexHtml = await readFile(
  path.join(root, await mustBeFile(indexPath, "entryDocument")),
  "utf8"
);
const htmlRefs = localHtmlRefs(indexHtml);

for (const ref of htmlRefs) {
  await mustBeFile(ref, "index.html local reference");
  if (!ref.startsWith("src/") && !rootCopies.includes(ref)) {
    fail(`root URL used by index.html is not preserved by rootCopies: ${ref}`);
  }
}

const manifestPath = ensureSafeRelative(
  contract.manifest ?? "manifest.webmanifest",
  "manifest"
);
if (!rootCopies.includes(manifestPath)) {
  fail(`manifest must be preserved at root: ${manifestPath}`);
}
const manifest = JSON.parse(
  await readFile(path.join(root, await mustBeFile(manifestPath, "manifest")), "utf8")
);
for (const icon of manifest.icons ?? []) {
  const iconRef = cleanRef(icon?.src);
  if (!iconRef) continue;
  await mustBeFile(iconRef, "manifest icon");
  if (!rootCopies.includes(iconRef)) {
    fail(`manifest icon is not preserved by rootCopies: ${iconRef}`);
  }
}

const serviceWorker = ensureSafeRelative(
  contract.serviceWorker ?? "sw.js",
  "serviceWorker"
);
if (!rootCopies.includes(serviceWorker)) {
  fail(`service worker must be preserved at root: ${serviceWorker}`);
}
await mustBeFile(serviceWorker, "serviceWorker");

const sourceEntry = ensureSafeRelative(
  contract.sourceEntry ?? "src/app/bootstrap.js",
  "sourceEntry"
);
await mustBeFile(sourceEntry, "sourceEntry");
if (!htmlRefs.includes(sourceEntry)) {
  fail(`index.html does not reference sourceEntry: ${sourceEntry}`);
}

console.log(
  JSON.stringify(
    {
      schemaVersion: contract.schemaVersion,
      entryDocument: indexPath,
      sourceEntry,
      rootCopies: [...rootCopies].sort(),
      localHtmlReferenceCount: htmlRefs.length,
      manifestIconCount: (manifest.icons ?? []).length
    },
    null,
    2
  )
);
