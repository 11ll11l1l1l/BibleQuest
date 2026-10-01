import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;

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

  if (String(predeploy?.candidateSha || '').toLowerCase() !== normalizedSha) {
    throw new Error('Pre-deployment evidence candidate SHA does not match the RC candidate.');
  }
  if (String(deployment?.sourceSha || '').toLowerCase() !== normalizedSha) {
    throw new Error('Deployment evidence source SHA does not match the RC candidate.');
  }
  if (!SHA256_PATTERN.test(String(deployment?.artifactSha256 || ''))) {
    throw new Error('Deployment evidence does not contain a valid artifact SHA-256.');
  }
  if (!String(deployment?.deploymentOrigin || '').startsWith('https://')) {
    throw new Error('Deployment evidence does not contain a valid HTTPS deployment origin.');
  }

  const certification = Object.freeze({
    schemaVersion: 1,
    repository: normalizedRepository,
    candidateSha: normalizedSha,
    artifactSha256: String(deployment.artifactSha256).toLowerCase(),
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
