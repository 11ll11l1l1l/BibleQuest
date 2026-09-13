import { readFile, access, stat } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

function assertSafeRelativePath(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`[built-output] ${label} must be a non-empty relative path`);
  const normalized = value.replaceAll("\\", "/");
  if (normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized)) throw new Error(`[built-output] ${label} must be repository-relative: ${value}`);
  if (normalized.split("/").includes("..")) throw new Error(`[built-output] ${label} must not escape its root: ${value}`);
  return normalized;
}

function isExternalReference(value) {
  return /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("mailto:") || value.startsWith("tel:") || value.startsWith("#");
}

function stripQueryHash(value) {
  return value.split("#", 1)[0].split("?", 1)[0];
}

async function mustExist(filePath, label) {
  try { await access(filePath); } catch { throw new Error(`[built-output] missing ${label}: ${filePath}`); }
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error(`[built-output] ${label} is not a file: ${filePath}`);
}

async function sha256(filePath) {
  const bytes = await readFile(filePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function localDocumentReferences(html) {
  const refs = new Set();
  const pattern = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  for (const match of html.matchAll(pattern)) {
    const value = match[1].trim();
    if (!value || isExternalReference(value)) continue;
    const clean = stripQueryHash(value);
    if (!clean || clean === "/") continue;
    refs.add(clean.replace(/^\.\//, "").replace(/^\//, ""));
  }
  return [...refs];
}

export async function validateBuiltOutput({ root = process.cwd(), outDir = "dist" } = {}) {
  const rootAbs = path.resolve(root);
  const outRel = assertSafeRelativePath(outDir, "outDir");
  const outAbs = path.resolve(rootAbs, outRel);
  if (outAbs === rootAbs || !outAbs.startsWith(`${rootAbs}${path.sep}`)) throw new Error("[built-output] outDir must stay inside the repository root");

  const contractPath = path.join(rootAbs, "config", "v5-static-artifacts.json");
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  const entryDocument = assertSafeRelativePath(contract.entryDocument, "entryDocument");
  const manifestPath = assertSafeRelativePath(contract.manifest, "manifest");
  const rootCopies = Array.isArray(contract.rootCopies) ? contract.rootCopies.map((item, i) => assertSafeRelativePath(item, `rootCopies[${i}]`)) : [];

  const indexPath = path.join(outAbs, entryDocument);
  await mustExist(indexPath, "built entry document");
  const html = await readFile(indexPath, "utf8");
  for (const ref of localDocumentReferences(html)) await mustExist(path.join(outAbs, assertSafeRelativePath(ref, "index reference")), `index reference ${ref}`);

  const viteManifestPath = path.join(outAbs, ".vite", "manifest.json");
  await mustExist(viteManifestPath, "Vite manifest");
  const viteManifest = JSON.parse(await readFile(viteManifestPath, "utf8"));
  const entries = Object.values(viteManifest).filter((entry) => entry && typeof entry === "object" && entry.isEntry === true);
  if (entries.length === 0) throw new Error("[built-output] Vite manifest contains no entry chunk");
  for (const entry of entries) {
    if (typeof entry.file !== "string") throw new Error("[built-output] Vite manifest entry is missing file");
    await mustExist(path.join(outAbs, assertSafeRelativePath(entry.file, "Vite entry file")), `Vite entry file ${entry.file}`);
    for (const css of entry.css ?? []) await mustExist(path.join(outAbs, assertSafeRelativePath(css, "Vite entry css")), `Vite entry css ${css}`);
  }

  const webManifestBuilt = path.join(outAbs, manifestPath);
  await mustExist(webManifestBuilt, "web manifest");
  const webManifest = JSON.parse(await readFile(webManifestBuilt, "utf8"));
  for (const icon of webManifest.icons ?? []) {
    if (!icon?.src || isExternalReference(icon.src)) continue;
    const iconRel = assertSafeRelativePath(stripQueryHash(icon.src).replace(/^\.\//, "").replace(/^\//, ""), "manifest icon");
    await mustExist(path.join(outAbs, iconRel), `manifest icon ${iconRel}`);
  }

  for (const rel of rootCopies) {
    const source = path.join(rootAbs, rel);
    const built = path.join(outAbs, rel);
    await mustExist(source, `source root artifact ${rel}`);
    await mustExist(built, `built root artifact ${rel}`);
    if (await sha256(source) !== await sha256(built)) throw new Error(`[built-output] built root artifact differs from source: ${rel}`);
  }

  return { entryDocument, localReferences: localDocumentReferences(html).length, viteEntries: entries.length, rootCopies: rootCopies.length };
}
