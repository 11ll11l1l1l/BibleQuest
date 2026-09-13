import { validateBuiltOutput } from "./v5-built-output-contract.mjs";

try {
  const summary = await validateBuiltOutput();
  console.log(`[built-output] PASS entry=${summary.entryDocument} refs=${summary.localReferences} viteEntries=${summary.viteEntries} rootCopies=${summary.rootCopies}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
