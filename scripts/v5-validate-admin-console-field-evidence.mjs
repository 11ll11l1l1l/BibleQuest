#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_ACTIONS = Object.freeze({
  force_sign_out: { severity: 'SAFE', confirmation: null },
  suspend: { severity: 'ELEVATED', confirmation: 'SUSPEND' },
  reactivate: { severity: 'SAFE', confirmation: null },
  temporary_password: { severity: 'ELEVATED', confirmation: null },
  recovery_email_change: { severity: 'CRITICAL', confirmation: 'CHANGE EMAIL' },
  delete_account: { severity: 'CRITICAL', confirmation: 'DELETE' },
});

const VALID_RESULTS = new Set(['PASS', 'FAIL', 'NOT_RUN']);
const VALID_EVIDENCE = new Set(['GUIDED_REAL_BACKEND', 'REAL_DEVICE']);

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateAdminConsoleFieldEvidence(document) {
  const errors = [];
  const blockers = [];

  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    return { valid: false, phaseReady: false, errors: ['evidence must be a JSON object'], blockers: [] };
  }

  if (!nonEmpty(document.integration_sha) || !/^[0-9a-f]{40}$/i.test(document.integration_sha)) {
    errors.push('integration_sha must be a full 40-character commit SHA');
  }
  if (!nonEmpty(document.executed_at)) errors.push('executed_at is required');
  if (!nonEmpty(document.environment)) errors.push('environment is required');
  if (!nonEmpty(document.operator)) errors.push('operator is required');

  if (!Array.isArray(document.actions)) {
    errors.push('actions must be an array');
    return { valid: false, phaseReady: false, errors, blockers };
  }

  const byAction = new Map();
  for (const entry of document.actions) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push('each action entry must be an object');
      continue;
    }
    if (!nonEmpty(entry.action)) {
      errors.push('each action entry requires action');
      continue;
    }
    if (byAction.has(entry.action)) {
      errors.push(`duplicate action evidence: ${entry.action}`);
      continue;
    }
    byAction.set(entry.action, entry);
  }

  for (const [action, contract] of Object.entries(REQUIRED_ACTIONS)) {
    const entry = byAction.get(action);
    if (!entry) {
      errors.push(`missing required action evidence: ${action}`);
      continue;
    }

    if (entry.severity !== contract.severity) {
      errors.push(`${action}: severity must be ${contract.severity}`);
    }
    if (!VALID_RESULTS.has(entry.result)) {
      errors.push(`${action}: result must be PASS, FAIL, or NOT_RUN`);
    }
    if (!VALID_EVIDENCE.has(entry.evidence_level)) {
      errors.push(`${action}: evidence_level must be GUIDED_REAL_BACKEND or REAL_DEVICE`);
    }
    if (!nonEmpty(entry.actor_role)) errors.push(`${action}: actor_role is required`);
    if (!nonEmpty(entry.target_kind)) errors.push(`${action}: target_kind is required`);
    if (!nonEmpty(entry.observed)) errors.push(`${action}: observed is required`);

    if (contract.confirmation && entry.confirmation !== contract.confirmation) {
      errors.push(`${action}: confirmation must record exact phrase ${contract.confirmation}`);
    }

    if (entry.result !== 'PASS') {
      blockers.push(`${action}: ${entry.result ?? 'UNKNOWN'}`);
    }
  }

  return {
    valid: errors.length === 0,
    phaseReady: errors.length === 0 && blockers.length === 0,
    errors,
    blockers,
  };
}

function runCli() {
  const evidencePath = process.argv[2];
  if (!evidencePath) {
    console.error('Usage: node scripts/v5-validate-admin-console-field-evidence.mjs <evidence.json>');
    process.exitCode = 2;
    return;
  }

  let document;
  try {
    document = JSON.parse(fs.readFileSync(path.resolve(evidencePath), 'utf8'));
  } catch (error) {
    console.error(`Unable to read evidence: ${error.message}`);
    process.exitCode = 2;
    return;
  }

  const result = validateAdminConsoleFieldEvidence(document);
  for (const error of result.errors) console.error(`ERROR: ${error}`);
  for (const blocker of result.blockers) console.error(`BLOCKER: ${blocker}`);

  if (result.phaseReady) {
    console.log('PASS: Admin Console field evidence contract is complete and phase-ready.');
    return;
  }

  console.error('FAIL: Admin Console field evidence is not phase-ready.');
  process.exitCode = 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) runCli();
