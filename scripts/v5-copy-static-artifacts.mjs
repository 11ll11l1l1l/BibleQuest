import path from "node:path";
import process from "node:process";
import { copyStaticArtifacts } from "./v5-static-artifacts.mjs";

const root = path.resolve(process.argv[2] ?? process.cwd());
const outDir = process.argv[3] ?? "dist";
const result = await copyStaticArtifacts({ root, outDir });

console.log(
  JSON.stringify(
    {
      outputRoot: result.outputRoot,
      copied: result.copied
    },
    null,
    2
  )
);
