import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const LEGACY_WORKFLOW_NAME = /^name:\s*BibleQuest v3 regression\s*$/m;
const LEGACY_CONCURRENCY = /\bgroup:\s*biblequest-v3-/;
const LEGACY_TEMP_PATH = /\/tmp\/biblequest-v3-[A-Za-z0-9._/-]*/g;
const V6_BRANCH = /^\s*-\s*v6\/architecture-upgrade\s*$/m;
const VERSION_NEUTRAL_STATIC_ACTION =
  /uses:\s*\.\/\.github\/actions\/inherited-regression-static(?:\/action\.yml)?\s*$/m;
const VERSION_NEUTRAL_BROWSER_ACTION =
  /uses:\s*\.\/\.github\/actions\/inherited-regression-browser(?:\/action\.yml)?\s*$/m;

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&');
}

function blockForStep(source, stepName) {
  const match = source.match(
    new RegExp(
      '^[ \\t]*- name:[ \\t]*' + escapeRegExp(stepName) +
        '[ \\t]*$([\\s\\S]*?)(?=^[ \\t]*- name:|^[ \\t]*- uses:|^[A-Za-z0-9_-]+:|(?![\\s\\S]))',
      'm',
    ),
  );
  return match?.[0] ?? '';
}

function compatibilityIndexBlock(source) {
  return source.match(
    /BQ_INHERITED_STATIC_COMPATIBILITY_INDEX:\s*\|\n([\s\S]*?)\n[ \t]*run:\s*":"/,
  )?.[1] ?? '';
}

function collect(source, expression) {
  return uniqueSorted([...source.matchAll(expression)].map((match) => match[0]));
}

export function analyzeInheritedRegressionWorkflow(source) {
  if (typeof source !== 'string') {
    throw new TypeError('Inherited regression workflow source must be a string.');
  }

  const staticBlock = blockForStep(source, 'Run accumulated architecture validators');
  const browserBlock = blockForStep(source, 'Run accumulated browser/mobile regressions');
  const compatibilityBlock = compatibilityIndexBlock(source);
  const directStaticValidators = collect(
    staticBlock,
    /\bscripts\/validate-v3-[A-Za-z0-9._/-]+\.mjs\b/g,
  );
  const compatibilityStaticEntries = collect(
    compatibilityBlock,
    /\bscripts\/validate-v3-[A-Za-z0-9._/-]+\.mjs\b/g,
  );
  const directBrowserTests = collect(
    browserBlock,
    /\btests\/v(?:3|4|5)[A-Za-z0-9._/-]+\.mjs\b/g,
  );
  const legacyTempPaths = collect(source, LEGACY_TEMP_PATH);

  const report = {
    targetsV6: V6_BRANCH.test(source),
    legacyWorkflowName: LEGACY_WORKFLOW_NAME.test(source),
    legacyConcurrencyGroup: LEGACY_CONCURRENCY.test(source),
    legacyTempPaths,
    usesVersionNeutralStaticAction: VERSION_NEUTRAL_STATIC_ACTION.test(source),
    usesVersionNeutralBrowserAction: VERSION_NEUTRAL_BROWSER_ACTION.test(source),
    directStaticValidators,
    compatibilityStaticEntries,
    directBrowserTests,
    remainingLegacyCoupling: [],
  };

  if (report.legacyWorkflowName) report.remainingLegacyCoupling.push('workflow-display-name');
  if (report.legacyConcurrencyGroup) report.remainingLegacyCoupling.push('concurrency-group');
  if (report.legacyTempPaths.length) report.remainingLegacyCoupling.push('temporary-paths');
  if (report.directStaticValidators.length) report.remainingLegacyCoupling.push('inline-static-cohort');
  if (report.directBrowserTests.length) report.remainingLegacyCoupling.push('inline-browser-cohort');

  return Object.freeze({
    ...report,
    remainingLegacyCoupling: Object.freeze([...report.remainingLegacyCoupling]),
    directStaticValidators: Object.freeze([...report.directStaticValidators]),
    compatibilityStaticEntries: Object.freeze([...report.compatibilityStaticEntries]),
    directBrowserTests: Object.freeze([...report.directBrowserTests]),
    legacyTempPaths: Object.freeze([...report.legacyTempPaths]),
    versionNeutral: report.remainingLegacyCoupling.length === 0,
  });
}

export function readCurrentInheritedRegressionWorkflow() {
  return fs.readFileSync(
    new URL('../.github/workflows/v3-regression.yml', import.meta.url),
    'utf8',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = analyzeInheritedRegressionWorkflow(readCurrentInheritedRegressionWorkflow());
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
}
