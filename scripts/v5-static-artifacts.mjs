import { copyFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

function fail(message) {
  throw new Error(`[static-artifacts] ${message}`);
}

function ensureSafeRelative(value, label) {
  const normalized = path.posix.normalize(String(value ?? "").replaceAll("\\", "/"));
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

async function mustBeFile(absolutePath, label) {
  try {
    const info = await stat(absolutePath);
    if (!info.isFile()) fail(`${label} is not a file: ${absolutePath}`);
  } catch (error) {
    if (error?.code === "ENOENT") fail(`${label} is missing: ${absolutePath}`);
    throw error;
  }
}

export async function loadStaticArtifactContract(root = process.cwd()) {
  const repositoryRoot = path.resolve(root);
  const contractPath = path.join(repositoryRoot, "config", "v5-static-artifacts.json");
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  if (contract.schemaVersion !== 1) {
    fail(`unsupported schemaVersion: ${contract.schemaVersion}`);
  }

  const rootCopies = (contract.rootCopies ?? []).map((entry) =>
    ensureSafeRelative(entry, "rootCopies entry")
  );
  if (new Set(rootCopies).size !== rootCopies.length) {
    fail("rootCopies contains duplicate paths");
  }

  return {
    ...contract,
    repositoryRoot,
    rootCopies
  };
}

export async function copyStaticArtifacts({
  root = process.cwd(),
  outDir = "dist"
} = {}) {
  const contract = await loadStaticArtifactContract(root);
  const outputRoot = path.resolve(contract.repositoryRoot, outDir);

  if (outputRoot === contract.repositoryRoot) {
    fail("outDir must not resolve to the repository root");
  }
  if (!outputRoot.startsWith(`${contract.repositoryRoot}${path.sep}`)) {
    fail(`outDir must stay inside the repository root: ${outDir}`);
  }

  const copied = [];
  for (const relativePath of contract.rootCopies) {
    const source = path.resolve(contract.repositoryRoot, relativePath);
    const destination = path.resolve(outputRoot, relativePath);

    if (!source.startsWith(`${contract.repositoryRoot}${path.sep}`)) {
      fail(`source escapes repository root: ${relativePath}`);
    }
    if (!destination.startsWith(`${outputRoot}${path.sep}`)) {
      fail(`destination escapes output root: ${relativePath}`);
    }

    await mustBeFile(source, "source artifact");
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);

    const [sourceBytes, destinationBytes] = await Promise.all([
      readFile(source),
      readFile(destination)
    ]);
    if (!sourceBytes.equals(destinationBytes)) {
      fail(`copied artifact differs from source: ${relativePath}`);
    }
    copied.push(relativePath);
  }

  return {
    outputRoot,
    copied: copied.sort()
  };
}
