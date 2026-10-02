import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PREDEPLOY_REQUIRED_WORKFLOWS } from './v6-rc-exact-sha-gate.mjs';

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;

function validatePredeployEvidence(predeploy, candidateSha, repository) {
  if (!predeploy || typeof predeploy !== 'object' || Array.isArray(predeploy)) {
    throw new Error('Pre-deployment RC evidence must be an object.');
  }
  if (predeploy.schemaVersion !== 1) {
    throw new Error('Pre-deployment RC evidence schemaVersion must be 1.');
  }
  if (String(predeploy.repository || '').trim() !== repository) {
    throw new Error('Pre-deployment RC evidence repository does not match the certification repository.');
  }
  if (String(predeploy.candidateSha || '').toLowerCase() !== candidateSha) {
    throw new Error('Pre-deployment evidence candidate SHA does not match the RC candidate.');
  }
  if (predeploy.profile !== 'predeploy') {
    throw new Error('Pre-deployment RC evidence must use the predeploy profile.');
  }
  if (!Array.isArray(predeploy.workflows)) {
    throw new Error('Pre-deployment RC evidence workflow list is missing.');
  }
  const names = predeploy.workflows.map(item => String(item?.workflow || '').trim());
  if (names.length !== PREDEPLOY_REQUIRED_WORKFLOWS.length
    || predeploy.requiredWorkflowCount !== PREDEPLOY_REQUIRED_WORKFLOWS.length) {
    throw new Error('Pre-deployment RC evidence does not contain the complete required workflow set.');
  }
  if (new Set(names).size !== names.length) {
    throw new Error('Pre-deployment RC evidence contains duplicate workflow records.');
  }
  for (const required of PREDEPLOY_REQUIRED_WORKFLOWS) {
    if (!names.includes(required)) {
      throw new Error(`Pre-deployment RC evidence is missing required workflow: ${required}`);
    }
  }
  for (const item of predeploy.workflows) {
    if (!Number.isInteger(item?.runId) || item.runId < 1) {
      throw new Error(`Pre-deployment RC evidence has invalid run ID for ${String(item?.workflow || '<missing>')}`);
    }
    if (!String(item?.url || '').startsWith('https://github.com/')) {
      throw new Error(`Pre-deployment RC evidence has invalid workflow URL for ${String(item?.workflow || '<missing>')}`);
    }
    if (!String(item?.completedAt || '').trim()) {
      throw new Error(`Pre-deployment RC evidence lacks completion time for ${String(item?.workflow || '<missing>')}`);
    }
  }
}

export async function assembleRcCertification({
  repository,
  candidateSha,
  predeployEvidencePath,
  deploymentEvidencePath,
  certifyingRunId,
  outputPath,
  now = () => new Date(),
} = {}) {
  const normalizedRepository = String(repository || '').trim();
  const normalizedSha = String(candidateSha || '').trim().toLowerCase();
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(normalizedRepository)) {
    throw new Error('RC certification requires repository in owner/name form.');
  }
  if (!SHA_PATTERN.test(normalizedSha)) {
    throw new Error('RC certification requires an exact 40-character candidate SHA.');
  }

  const [predeploy, deployment] = await Promise.all([
    readFile(String(predeployEvidencePath || ''), 'utf8').then(JSON.parse),
    readFile(String(deploymentEvidencePath || ''), 'utf8').then(JSON.parse),
  ]);

  validatePredeployEvidence(predeploy, normalizedSha, normalizedRepository);
  if (String(deployment?.sourceSha || '').toLowerCase() !== normalizedSha) {
    throw new Error('Deployment evidence source SHA does not match the RC candidate.');
  }
  if (!SHA256_PATTERN.test(String(deployment?.artifactSha256 || ''))) {
    throw new Error('Deployment evidence does not contain a valid artifact SHA-256.');
  }
  if (!SHA256_PATTERN.test(String(deployment?.integritySha256 || ''))) {
    throw new Error('Deployment evidence does not contain a valid integrity-manifest SHA-256.');
  }
  if (!Number.isInteger(deployment?.fileCount) || deployment.fileCount < 1) {
    throw new Error('Deployment evidence does not contain a valid verified file count.');
  }
  if (!Number.isInteger(deployment?.totalBytes) || deployment.totalBytes < 1) {
    throw new Error('Deployment evidence does not contain a valid verified byte count.');
  }
  if (!String(deployment?.deploymentOrigin || '').startsWith('https://')) {
    throw new Error('Deployment evidence does not contain a valid HTTPS deployment origin.');
  }

  const certification = Object.freeze({
    schemaVersion: 1,
    repository: normalizedRepository,
    candidateSha: normalizedSha,
    artifactSha256: String(deployment.artifactSha256).toLowerCase(),
    integritySha256: String(deployment.integritySha256).toLowerCase(),
    deploymentOrigin: String(deployment.deploymentOrigin),
    certifyingRunId: String(certifyingRunId || ''),
    verifiedAt: now().toISOString(),
    predeploy,
    deployment,
  });

  const json = JSON.stringify(certification, null, 2) + '\n';
  if (outputPath) await writeFile(outputPath, json, 'utf8');
  return certification;
}

const invokedAsCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsCli) {
  assembleRcCertification({
    repository: process.env.GITHUB_REPOSITORY,
    candidateSha: process.env.BQ_RC_CANDIDATE_SHA,
    predeployEvidencePath: process.env.BQ_RC_PREDEPLOY_EVIDENCE,
    deploymentEvidencePath: process.env.BQ_RC_DEPLOYMENT_EVIDENCE,
    certifyingRunId: process.env.GITHUB_RUN_ID,
    outputPath: process.env.BQ_RC_CERTIFICATION_OUTPUT,
  }).then(
    certification => process.stdout.write(JSON.stringify(certification, null, 2) + '\n'),
    error => {
      console.error(error?.stack || error);
      process.exitCode = 1;
    },
  );
}
