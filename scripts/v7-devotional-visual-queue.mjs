/**
 * V7 Lane A: deterministic devotional art handoff. A queue is NOT permission to
 * publish artwork or content. Only the audited visual manifest proves an image.
 */
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditV7VisualAssets } from './v7-visual-assets-audit.mjs';

const AGENTS = Object.freeze(Array.from({ length: 5 }, (_, n) => 'visual-agent-' + (n + 1)));
const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_ID = /^devotional\.[a-z0-9._-]+$/;

export function planV7DevotionalArtwork(contentFiles, auditedAssets = []) {
  if (!Array.isArray(contentFiles) || !Array.isArray(auditedAssets))
    throw new TypeError('Expected content files and approved visual assets');
  const byId = new Map();
  for (const { path, items } of contentFiles) {
    if (typeof path !== 'string' || !Array.isArray(items))
      throw new TypeError('Each devotional source requires a path and items');
    for (const item of items) {
      if (item.type !== 'devotional') continue;
      if (!CONTENT_ID.test(item.id) || byId.has(item.id))
        throw new Error('Invalid or duplicate devotional ID: ' + item.id);
      const allowed = Array.isArray(item.rights?.allowedUses) ? item.rights.allowedUses : [];
      const ownable = item.source?.kind === 'first_party'
        && item.rights?.status === 'verified'
        && allowed.includes('display') && allowed.includes('modify');
      byId.set(item.id, {
        id: item.id, title: String(item.sourceContent?.title || '').trim(),
        sourcePath: path, sourceRevision: item.revision || null,
        contentState: item.publicationState || 'unknown',
        contentReview: item.review?.status || 'unknown',
        sourceEligible: ownable,
        reason: ownable ? null : 'Unverified or non-first-party content: no automatic art assignment',
        topics: (item.taxonomyLinks || []).filter(t => t.kind === 'emotion' || t.kind === 'need')
          .map(t => t.id).slice(0, 4)
      });
    }
  }
  const matching = new Map();
  for (const asset of auditedAssets) {
    if (asset.contentType !== 'devotional') continue;
    if (!byId.has(asset.contentId))
      throw new Error('Audited art points to an unknown devotional: ' + asset.contentId);
    if (asset.visualRole !== 'devotional_cover')
      throw new Error('Unexpected devotional visual role: ' + asset.assetId);
    const existing = matching.get(asset.contentId) || [];
    existing.push(asset);
    matching.set(asset.contentId, existing);
  }
  const rows = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id, 'en'));
  // Stable assignment uses the full sorted eligible set, not the uncovered set.
  // Finishing one image must never reassign another worker's outstanding work.
  let eligibleIndex = 0;
  for (const row of rows) {
    const art = matching.get(row.id) || [];
    const complete = art.some(a => a.bundleStatus === 'complete');
    row.auditedMasterCount = art.length;
    row.auditedBundleComplete = complete;
    row.auditedAssetIds = art.map(a => a.assetId).sort();
    row.liveTextRequired = true;
    row.publishEligibleFromThisReport = false;
    if (!row.sourceEligible) {
      row.agentId = null;
      row.nextAction = 'hold_source_rights';
      continue;
    }
    row.agentId = AGENTS[eligibleIndex++ % AGENTS.length];
    row.nextAction = complete ? 'complete' : art.length
      ? 'complete_qa_and_derivatives' : 'create_clean_type_thumb';
  }
  const work = rows.filter(x => x.sourceEligible);
  return {
    schemaVersion: 1,
    status: 'planning_only_requires_separate_content_and_image_approval',
    summary: {
      devotionalItems: rows.length, eligibleForOriginalArtPlanning: work.length,
      withheldForRights: rows.length - work.length,
      auditedMasters: work.filter(x => x.auditedMasterCount > 0).length,
      completeBundles: work.filter(x => x.auditedBundleComplete).length,
      remainingArtAssignments: work.filter(x => x.nextAction !== 'complete').length
    },
    agents: AGENTS.map(agentId => ({
      agentId,
      tasks: work.filter(x => x.agentId === agentId),
      nextWork: work.find(x => x.agentId === agentId && x.nextAction !== 'complete') || null
    })),
    withheld: rows.filter(x => !x.sourceEligible)
  };
}

export async function buildV7DevotionalVisualQueue(root = DEFAULT_ROOT) {
  const audit = await auditV7VisualAssets(root);
  if (audit.status !== 'PASS' || !Array.isArray(audit.manifest?.assets))
    throw new Error('Refusing to plan from failed visual audit');
  const dir = join(root, 'content/v7/devotionals');
  const paths = (await readdir(dir)).filter(p => p.endsWith('.json')).sort();
  const files = await Promise.all(paths.map(async p => {
    const doc = JSON.parse(await readFile(join(dir, p), 'utf8'));
    if (!Array.isArray(doc.items)) throw new Error('Missing items in ' + p);
    return { path: 'content/v7/devotionals/' + p, items: doc.items };
  }));
  return planV7DevotionalArtwork(files, audit.manifest.assets);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(JSON.stringify(await buildV7DevotionalVisualQueue(), null, 2) + '\n');
  } catch (error) {
    console.error('V7 devotional visual queue: ' + error.message);
    process.exitCode = 1;
  }
}
