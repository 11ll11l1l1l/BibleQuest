import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

type Acceptance = Readonly<{
  accepted: true;
  acceptedAtJst: string;
  acceptedBy: string;
  rationale: string;
  residualRiskAcknowledged: true;
}>;

type Evidence = Readonly<{
  schemaVersion: number;
  targetRow: string;
  observedAtUtc: string;
  observedAtJst: string;
  builtInProtection: Readonly<{
    status: 'ENABLED' | 'DISABLED';
    evidenceClass: 'EXTERNAL-LIVE';
    source: string;
    finding: string;
    title: string;
    remediation: string;
  }>;
  firstPartyEquivalent: Readonly<{
    status: 'COMPLETE_FIRST_PARTY_ONLY';
    provider: string;
    kAnonymityPrefixLength: number;
    paddedResponses: boolean;
    failClosed: boolean;
    coveredPaths: readonly string[];
    residualRisk: string;
  }>;
  releaseOwnerAcceptance: Acceptance | null;
}>;

const root = new URL('../..', import.meta.url);
const read = (relative: string) => fs.readFileSync(new URL(relative, root), 'utf8');
const evidence = JSON.parse(read('docs/v6/V6_LEAKED_PASSWORD_ACCEPTANCE.json')) as Evidence;
const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');

function checklistChecked(row: string) {
  const open = '- [ ] ' + row;
  const checked = '- [x] ' + row;
  assert.notEqual(checklist.includes(open), checklist.includes(checked), row + ' must appear exactly once');
  return checklist.includes(checked);
}

test('first-party leaked-password equivalent stays complete and fail closed', () => {
  assert.equal(evidence.schemaVersion, 1);
  assert.equal(evidence.firstPartyEquivalent.status, 'COMPLETE_FIRST_PARTY_ONLY');
  assert.equal(evidence.firstPartyEquivalent.provider, 'HaveIBeenPwned Pwned Passwords range API');
  assert.equal(evidence.firstPartyEquivalent.kAnonymityPrefixLength, 5);
  assert.equal(evidence.firstPartyEquivalent.paddedResponses, true);
  assert.equal(evidence.firstPartyEquivalent.failClosed, true);
  assert.equal(evidence.firstPartyEquivalent.coveredPaths.length, 4);
  assert.match(evidence.firstPartyEquivalent.residualRisk, /directly is not covered|direct.*not covered/i);

  const signup = read('supabase/functions/bq-signup/index.ts');
  const reset = read('supabase/functions/bq-password-reset/index.ts');
  const session = read('src/app/session.js');
  const admin = read('supabase/functions/bq-admin-ops/index.ts');

  assert.match(signup, /await assertPasswordNotCompromised\(password\);[\s\S]*auth\.admin\.createUser/);
  assert.match(reset, /await assertPasswordNotCompromised\(password\);[\s\S]*auth\.admin\.updateUserById/);
  assert.match(session, /await passwordSafety\(next\);[\s\S]*auth\.updatePassword\(next\)/);

  const adminStart = admin.indexOf("if(action==='set_temp_password')");
  const adminEnd = admin.indexOf("if(action==='change_email')", adminStart);
  assert.ok(adminStart >= 0 && adminEnd > adminStart, 'missing Owner temporary-password action boundary');
  const adminBlock = admin.slice(adminStart, adminEnd);
  assert.match(adminBlock, /await assertPasswordNotCompromised\(password\)/);
  assert.ok(
    adminBlock.indexOf('await assertPasswordNotCompromised(password)') <
      adminBlock.indexOf('a.auth.admin.updateUserById(target,{password})'),
    'Owner password breach screening must precede Auth mutation',
  );

  const serverChecker = read('supabase/functions/_shared/password-security.ts');
  const browserChecker = read('src/security/password-breach.js');
  for (const source of [serverChecker, browserChecker]) {
    assert.match(source, /api\.pwnedpasswords\.com\/range\//);
    assert.match(source, /Add-Padding/);
    assert.match(source, /BQ_PASSWORD_BREACH_CHECK_UNAVAILABLE/);
    assert.match(source, /BQ_PASSWORD_COMPROMISED/);
  }
});

test('leaked-password acceptance row cannot pass on first-party screening alone', () => {
  assert.equal(evidence.targetRow, 'Leaked-password protection or supported equivalent is enabled/verified or explicitly accepted with rationale.');
  assert.equal(evidence.builtInProtection.evidenceClass, 'EXTERNAL-LIVE');
  assert.match(evidence.observedAtUtc, /^\d{4}-\d{2}-\d{2}T/);
  assert.match(evidence.observedAtJst, /\+09:00$/);
  assert.ok(evidence.builtInProtection.source.trim().length > 0);
  assert.ok(evidence.builtInProtection.remediation.startsWith('https://supabase.com/'));

  if (!checklistChecked(evidence.targetRow)) return;

  const builtInVerified = evidence.builtInProtection.status === 'ENABLED';
  const acceptance = evidence.releaseOwnerAcceptance;
  const residualAccepted = Boolean(
    acceptance?.accepted === true &&
    acceptance.residualRiskAcknowledged === true &&
    acceptance.acceptedBy.trim().length > 0 &&
    acceptance.rationale.trim().length >= 20 &&
    /\+09:00$/.test(acceptance.acceptedAtJst),
  );

  assert.ok(
    builtInVerified || residualAccepted,
    'leaked-password row requires verified project-level protection or explicit release-owner residual-risk acceptance',
  );
});
