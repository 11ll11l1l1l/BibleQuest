import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/v6-production-release-verify.yml', 'utf8');

const requireText = (needle, message) => {
  if (!workflow.includes(needle)) throw new Error(message);
};

const requirePattern = (pattern, message) => {
  if (!pattern.test(workflow)) throw new Error(message);
};

requireText('name: V6 Certified SHA Production Verification', 'Production verification workflow name drifted.');
requireText('workflow_dispatch:', 'Production verification must remain manually dispatched.');
requireText('candidate_sha:', 'Production verification must require an explicit candidate SHA.');
requireText('production_url:', 'Production verification must require an explicit production URL.');
requireText('default: https://mybiblequest.pages.dev', 'Production verification must default only to the canonical production origin.');

requirePattern(/\[\[ "\$\{BQ_RC_CANDIDATE_SHA\}" =~ \^\[0-9a-f\]\{40\}\$ \]\]/, 'Production verification must reject non-lowercase/non-40-character candidate SHAs.');
requireText('docs/v6/RC_CANDIDATE.json', 'Production verification must require the marker-only RC file.');
requireText('node scripts/v6-rc-candidate-marker.mjs --validate docs/v6/RC_CANDIDATE.json "${parent_sha}"', 'Production verification must validate the marker against the exact parent SHA.');
requireText('test "${#changed[@]}" -eq 1', 'Production verification must require a one-file RC delta.');
requireText('test "${changed[0]}" = "docs/v6/RC_CANDIDATE.json"', 'Production verification must require a marker-only RC delta.');

for (const workflowName of [
  'V6 RC Exact-SHA Automated Gate',
  'V6 Deployed Artifact Verification',
  'V6 Cloudflare Exact-SHA Preview Verification',
]) {
  requireText(workflowName, `Production verification no longer consumes required workflow evidence: ${workflowName}`);
}

for (const artifactPattern of [
  'v6-rc-exact-sha-evidence-${BQ_RC_CANDIDATE_SHA}',
  'v6-rc-certification-${BQ_RC_CANDIDATE_SHA}',
  'v6-cloudflare-preview-${BQ_RC_CANDIDATE_SHA}',
]) {
  requireText(artifactPattern, `Production verification no longer downloads exact candidate artifact: ${artifactPattern}`);
}

requireText("if(String(g.candidateSha||'').toLowerCase()!==sha)", 'Production verification must bind automated-gate evidence to the exact candidate SHA.');
requireText("if(String(c.candidateSha||'').toLowerCase()!==sha)", 'Production verification must bind certification evidence to the exact candidate SHA.');
requireText("if(String(p.sourceSha||'').toLowerCase()!==sha)", 'Production verification must bind Cloudflare preview evidence to the exact candidate SHA.');
requireText('pa!==a', 'Production verification must require preview and RC certification artifact digests to match.');
requireText('ci&&ci!==i', 'Production verification must require preview and certification integrity digests to match when both are present.');
requireText("u.hostname==='mybiblequest.pages.dev'", 'Production verification must reject the mutable production hostname as immutable-preview evidence.');
requireText("!u.hostname.endsWith('.mybiblequest.pages.dev')", 'Production verification must restrict preview evidence to the BibleQuest Pages project.');

requireText('BQ_EXPECTED_ARTIFACT_SHA256', 'Production verification must pass the certified aggregate artifact digest to byte verification.');
requireText('BQ_EXPECTED_INTEGRITY_SHA256', 'Production verification must pass the certified integrity-manifest digest to byte verification.');
requireText('node scripts/v6-deployment-verify.mjs > v6-production-deployment-evidence.json', 'Production verification must byte-verify production before promotion evidence.');
requireText('node scripts/v6-live-smoke.mjs', 'Production verification must run the exact-SHA production smoke.');

for (const smokeKind of [
  'html-shell',
  'exact-sha',
  'pwa-manifest',
  'route-shortcuts',
  'offline-cache-contract',
  'push-worker-contract',
]) {
  requireText(`'${smokeKind}'`, `Production verification smoke contract is missing ${smokeKind}.`);
}

requireText('schemaVersion:2', 'Production promotion evidence schema must remain versioned.');
requireText('cloudflareExactPreview', 'Production promotion evidence must retain the immutable preview workflow run ID.');
requireText('cloudflarePreview:cp', 'Production promotion evidence must retain immutable preview evidence.');
requireText('deployment:d', 'Production promotion evidence must retain production byte-verification evidence.');
requireText('smoke:s', 'Production promotion evidence must retain production smoke evidence.');

console.log('V6 production release-control static regression passed.');
