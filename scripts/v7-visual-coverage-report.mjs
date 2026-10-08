import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditV7VisualAssets, EMOTION_QUEUE_CANONICAL } from './v7-visual-assets-audit.mjs';

const DEFAULT_ROOT = fileURLToPath(new URL('../', import.meta.url));
const TOKEN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

export function summarizeV7VisualCoverage(audit, queueRows, recordRows = []) {
  if (!audit || !Array.isArray(audit.manifest?.assets) || !Array.isArray(queueRows))
    throw new TypeError('V7 visual coverage requires a validated audit manifest and queues');
  const ids = new Set();
  const indexed = new Map();
  for (const asset of audit.manifest.assets) {
    if (ids.has(asset.assetId)) throw new Error('Duplicate audited visual asset');
    ids.add(asset.assetId);
    if (asset.contentType !== 'emotion') continue;
    const concept = asset.queueConcept || asset.contentId;
    if (!Object.hasOwn(EMOTION_QUEUE_CANONICAL, concept)
      || asset.canonicalContentId !== EMOTION_QUEUE_CANONICAL[concept])
      throw new Error('Unrecognized release emotion identity: ' + concept);
    const arr = indexed.get(concept) || [];
    arr.push(asset);
    indexed.set(concept, arr);
  }
  const candidates = new Map();
  const nonproduction = new Map();
  for (const row of recordRows) {
    if (row.derivativeFor) {
      const entries = candidates.get(row.derivativeFor) || [];
      entries.push({ name: row.name, status: row.status || 'unknown' });
      candidates.set(row.derivativeFor, entries);
    } else if (row.status !== 'production_ready' && row.contentId) {
      let queueConcept = row.queueConcept || row.contentId;
      if (!Object.hasOwn(EMOTION_QUEUE_CANONICAL, queueConcept)) {
        const matches = Object.entries(EMOTION_QUEUE_CANONICAL)
          .filter(([, canonical]) => canonical === row.contentId);
        if (matches.length === 1) queueConcept = matches[0][0];
      }
      if (Object.hasOwn(EMOTION_QUEUE_CANONICAL, queueConcept))
        nonproduction.set(queueConcept, row.status);
    }
  }
  const coveredConcepts = new Set();
  const assignments = new Set();
  const agents = [];
  for (const queue of queueRows) {
    if (!queue.agentId || !Array.isArray(queue.initialQueue))
      throw new Error('Invalid image-agent queue');
    const tasks = [];
    for (const concept of queue.initialQueue) {
      if (typeof concept !== 'string' || !TOKEN.test(concept)
        || !Object.hasOwn(EMOTION_QUEUE_CANONICAL, concept) || assignments.has(concept))
        throw new Error('Unknown or duplicate queued concept: ' + concept);
      assignments.add(concept);
      const published = indexed.get(concept) || [];
      const master = published[0] || null;
      const full = published.find(x => x.bundleStatus === 'complete') || null;
      const submitted = master ? candidates.get(master.assetId) || [] : [];
      const nonproductionStatus = nonproduction.get(concept) || null;
      const action = full ? 'complete' : master
        ? submitted.length ? 'verify_and_consolidate_derivatives' : 'create_and_verify_derivatives'
        : nonproductionStatus ? 'finish_pending_master_qa' : 'create_clean_type_thumb';
      if (full) coveredConcepts.add(concept);
      const entry = {
        queueConcept: concept,
        canonicalEmotionId: EMOTION_QUEUE_CANONICAL[concept],
        state: full ? 'complete_bundle' : master ? 'clean_ready_partial' :
          nonproductionStatus ? 'master_qa_pending' : 'missing_master',
        action, assetIds: published.map(a => a.assetId),
        verifiedTypographyLocales: [...new Set(published.flatMap(a =>
          (a.variants || []).filter(v => v.kind === 'with_text').map(v => v.locale)))].sort(),
        verifiedThumbnail: Boolean(published.some(a =>
          (a.variants || []).some(v => v.kind === 'thumbnail'))),
        pendingCandidateSidecars: submitted,
        masterStatus: master ? 'production_ready' : nonproductionStatus,
        fallback: master ? 'clean_master_with_live_localized_label' : 'live_localized_label_only'
      };
      tasks.push(entry);
    }
    const remaining = tasks.filter(t => t.action !== 'complete');
    // Give QC/backfill work precedence over generating duplicate source scenes.
    const priority = {verify_and_consolidate_derivatives:0,
      create_and_verify_derivatives:1,finish_pending_master_qa:2,create_clean_type_thumb:3};
    const work = remaining.map((x,i) => ({x,i}))
      .sort((a,b) => (priority[a.x.action] - priority[b.x.action]) || a.i-b.i)
      .map(({x}) => x);
    agents.push({
      agentId:queue.agentId, total:tasks.length,
      productionReadyMasters:tasks.filter(t => t.state === 'clean_ready_partial' || t.state === 'complete_bundle').length,
      completeBundles:tasks.filter(t => t.state === 'complete_bundle').length,
      pendingMasterCount:tasks.filter(t => t.state === 'master_qa_pending').length,
      missingMasters:tasks.filter(t => t.state === 'missing_master').length,
      nextWork:work[0] || null,
      workOrder:work,
      tasks
    });
  }
  const expected = Object.keys(EMOTION_QUEUE_CANONICAL);
  if (assignments.size !== expected.length || expected.some(x => !assignments.has(x)))
    throw new Error('Visual assignment coverage does not match the 30-feeling taxonomy');
  const tasks = agents.flatMap(a => a.tasks);
  return {
    schemaVersion:1,
    status:audit.status,
    releaseEligible:audit.status === 'PASS',
    summary:{
      emotionTotal:expected.length,
      productionReadyMasters:tasks.filter(x => x.state === 'clean_ready_partial'||x.state === 'complete_bundle').length,
      completeThreeFileBundles:coveredConcepts.size,
      pendingDerivativeBackfills:tasks.filter(x => x.action === 'verify_and_consolidate_derivatives' ||
        x.action === 'create_and_verify_derivatives').length,
      missingMasters:tasks.filter(x => x.state === 'missing_master').length,
      pendingMasterQa:tasks.filter(x => x.state === 'master_qa_pending').length,
      auditedAssetCount:audit.manifest.assets.length,
      candidateDerivativeSidecars:recordRows.filter(x => x.derivativeFor).length
    },
    agents,
    warnings:audit.warnings || [],
    errors:audit.errors || []
  };
}

export async function buildV7VisualCoverageReport(root=DEFAULT_ROOT) {
  const audit=await auditV7VisualAssets(root);
  const queueDir=join(root,'data/v7/visual-assets/queues');
  const recordDir=join(root,'data/v7/visual-assets/records');
  const queues=await Promise.all((await readdir(queueDir))
    .filter(name=>name.endsWith('.json')).sort()
    .map(async name=>JSON.parse(await readFile(join(queueDir,name),'utf8'))));
  const records=await Promise.all((await readdir(recordDir))
    .filter(name=>name.endsWith('.json')).sort().map(async name=>{
      const item=JSON.parse(await readFile(join(recordDir,name),'utf8'));
      return {
        name, status:item.status, contentId:item.contentId,
        queueConcept:item.queueConcept,
        derivativeFor:name.endsWith('-derivatives.json')
          ? item.sourceMasterAssetId || item.parentAssetId
            || name.slice(0,-'-derivatives.json'.length):null
      };
    }));
  return summarizeV7VisualCoverage(audit,queues,records);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report=await buildV7VisualCoverageReport();
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if (report.status !== 'PASS') process.exitCode=1;
}
