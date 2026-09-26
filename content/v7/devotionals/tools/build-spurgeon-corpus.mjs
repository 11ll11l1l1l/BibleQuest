import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const outDir = path.join(root, "generated");

const MONTHS = [
  ["january","01",31],["february","02",29],["march","03",31],["april","04",30],
  ["may","05",31],["june","06",30],["july","07",31],["august","08",31],
  ["september","09",30],["october","10",31],["november","11",30],["december","12",31],
];

const SOURCES = {
  fcb: {
    sourceId: "spurgeon-faiths-checkbook",
    repo: "lyteword/chspurgeon-fcb",
    commit: "62968334253c0bb0bf4ffe16a4e2b0825e42d0c5",
    expected: 366,
    license: "CC0-1.0 repository edition",
    rights: "Underlying C. H. Spurgeon work is public domain",
  },
  mae: {
    sourceId: "spurgeon-morning-evening",
    repo: "lyteword/chspurgeon-mae",
    commit: "989b49141ef9bcb3721802054920840f7e2832f1",
    expected: 732,
    license: "CC0-1.0 repository edition",
    rights: "Underlying C. H. Spurgeon work is public domain",
  },
};

function rawUrl(source, filePath) {
  const [owner, repo] = source.repo.split("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${source.commit}/${filePath}`;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": "BibleQuest-V7-devotional-preprocessor" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.text();
}

function stripFrontmatter(text) {
  if (!text.startsWith("---")) return text;
  const end = text.indexOf("\n---", 3);
  return end < 0 ? text : text.slice(end + 4).replace(/^\s+/, "");
}

function splitLines(text) {
  return text.replace(/\r\n/g, "\n").split("\n");
}

function cleanRef(ref) {
  return ref
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function referenceFromQuote(line) {
  const marker = "&mdash;";
  const pos = line.indexOf(marker);
  return pos >= 0 ? cleanRef(line.slice(pos + marker.length)) : "";
}

function titleAfterDash(heading) {
  const pos = heading.indexOf(" - ");
  return pos >= 0 ? heading.slice(pos + 3).trim() : heading.trim();
}

function parseFcb(markdown, meta) {
  const body = stripFrontmatter(markdown);
  const lines = splitLines(body);
  const headingIndex = lines.findIndex((line) => line.startsWith("# "));
  const heading = headingIndex >= 0 ? lines[headingIndex].slice(2).trim() : meta.dateKey;
  const quoteIndex = lines.findIndex((line, i) => i > headingIndex && line.includes("&mdash;"));
  const scripture = quoteIndex >= 0 ? referenceFromQuote(lines[quoteIndex]) : "";
  const devotionalBody = lines.slice(quoteIndex + 1).join("\n").trim();
  return [{
    id: `spurgeon-faiths-checkbook:${meta.dateKey}`,
    sourceId: "spurgeon-faiths-checkbook",
    sourceUnit: meta.dateKey,
    dateKey: meta.dateKey,
    period: null,
    title: titleAfterDash(heading),
    scriptureRefs: scripture ? [scripture] : [],
    lifeSituations: [],
    secondaryTags: [],
    body: devotionalBody,
    source: meta.source,
    review: { provenance: "verified", rights: "verified", scripture: "pending", pastoral: "pending", publishable: false },
  }];
}

function section(lines, name, nextName) {
  const start = lines.findIndex((line) => line.trim() === `## ${name}`);
  if (start < 0) return null;
  const end = nextName ? lines.findIndex((line, i) => i > start && line.trim() === `## ${nextName}`) : lines.length;
  const chunk = lines.slice(start + 1, end < 0 ? lines.length : end);
  const quoteIndex = chunk.findIndex((line) => line.includes("&mdash;"));
  const scripture = quoteIndex >= 0 ? referenceFromQuote(chunk[quoteIndex]) : "";
  const devotionalBody = chunk.slice(quoteIndex + 1).join("\n").trim();
  return { scripture, devotionalBody };
}

function parseMae(markdown, meta) {
  const body = stripFrontmatter(markdown);
  const lines = splitLines(body);
  const morning = section(lines, "Morning", "Evening");
  const evening = section(lines, "Evening", null);
  if (!morning || !evening) throw new Error(`Missing Morning/Evening sections: ${meta.source.path}`);
  return [
    ["morning", morning],
    ["evening", evening],
  ].map(([period, part]) => ({
    id: `spurgeon-morning-evening:${meta.dateKey}:${period}`,
    sourceId: "spurgeon-morning-evening",
    sourceUnit: `${meta.dateKey}:${period}`,
    dateKey: meta.dateKey,
    period,
    title: `${period === "morning" ? "Morning" : "Evening"}, ${meta.label} ${meta.day}`,
    scriptureRefs: part.scripture ? [part.scripture] : [],
    lifeSituations: [],
    secondaryTags: [],
    body: part.devotionalBody,
    source: { ...meta.source, section: period },
    review: { provenance: "verified", rights: "verified", scripture: "pending", pastoral: "pending", publishable: false },
  }));
}

async function build(key) {
  const cfg = SOURCES[key];
  const entries = [];
  for (const [month, mm, days] of MONTHS) {
    for (let day = 1; day <= days; day++) {
      const dd = String(day).padStart(2, "0");
      const dateKey = `${mm}-${dd}`;
      const sourcePath = `${month}/${month}-${day}.md`;
      const url = rawUrl(cfg, sourcePath);
      const markdown = await fetchText(url);
      const meta = {
        dateKey,
        day,
        label: month[0].toUpperCase() + month.slice(1),
        source: {
          repository: cfg.repo,
          commitSha: cfg.commit,
          path: sourcePath,
          section: null,
          canonicalUrl: url,
          license: cfg.license,
          underlyingRights: cfg.rights,
        },
      };
      entries.push(...(key === "fcb" ? parseFcb(markdown, meta) : parseMae(markdown, meta)));
    }
  }
  if (entries.length !== cfg.expected) throw new Error(`${key}: expected ${cfg.expected}, got ${entries.length}`);
  return entries;
}

async function main() {
  const only = process.argv.find((arg) => arg.startsWith("--source="))?.split("=")[1] || "all";
  const wanted = only === "all" ? ["fcb","mae"] : [only];
  await fs.mkdir(outDir, { recursive: true });
  for (const key of wanted) {
    if (!SOURCES[key]) throw new Error(`Unknown source: ${key}`);
    const entries = await build(key);
    const file = path.join(outDir, `${SOURCES[key].sourceId}.corpus.json`);
    await fs.writeFile(file, JSON.stringify({ schemaVersion: 1, sourceId: SOURCES[key].sourceId, entries }, null, 2) + "\n");
    console.log(`${SOURCES[key].sourceId}: wrote ${entries.length} entries -> ${file}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
