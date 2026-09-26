import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => JSON.parse(fs.readFileSync(path.join(here, name), "utf8"));
const sources = read("sources.json");
const taxonomy = read("taxonomy.json");
const catalog = read("catalog.seed.json");
const plans = read("plans.seed.json");

const errors = [];
const sourceIds = new Set(sources.sources.map((x) => x.id));
const primary = new Set(taxonomy.primaryLifeSituations);
const secondary = new Set(taxonomy.secondaryTags);
const entryIds = new Set();

for (const entry of catalog.entries) {
  if (entryIds.has(entry.id)) errors.push(`duplicate entry id: ${entry.id}`);
  entryIds.add(entry.id);
  if (!sourceIds.has(entry.sourceId)) errors.push(`unknown source: ${entry.id} -> ${entry.sourceId}`);
  for (const tag of entry.lifeSituations || []) if (!primary.has(tag)) errors.push(`unknown primary tag: ${entry.id} -> ${tag}`);
  for (const tag of entry.secondaryTags || []) if (!secondary.has(tag)) errors.push(`unknown secondary tag: ${entry.id} -> ${tag}`);
  if (entry.reviewStatus === "publish-ready") errors.push(`seed entry must not be publish-ready: ${entry.id}`);
}

if (catalog.entryCount !== catalog.entries.length) errors.push(`entryCount mismatch: ${catalog.entryCount} != ${catalog.entries.length}`);

const planIds = new Set();
for (const plan of plans.plans) {
  if (planIds.has(plan.id)) errors.push(`duplicate plan id: ${plan.id}`);
  planIds.add(plan.id);
  if (!primary.has(plan.lifeSituation)) errors.push(`unknown plan lifeSituation: ${plan.id} -> ${plan.lifeSituation}`);
  if (!Array.isArray(plan.days) || plan.days.length < 3) errors.push(`plan too short: ${plan.id}`);
  for (const id of plan.days || []) if (!entryIds.has(id)) errors.push(`plan references missing entry: ${plan.id} -> ${id}`);
}

if (errors.length) {
  console.error("V7 devotional content validation failed:");
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`V7 devotional content OK: ${sources.sources.length} sources, ${catalog.entries.length} indexed units, ${plans.plans.length} plan seeds.`);
