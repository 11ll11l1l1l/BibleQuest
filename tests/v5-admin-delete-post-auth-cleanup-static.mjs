import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../supabase/functions/bq-admin-ops/index.ts', import.meta.url), 'utf8');

function deleteBlock() {
  const start = source.indexOf("if(action==='delete_user')");
  const end = source.indexOf("if(action==='suspend_account'", start);
  assert.ok(start >= 0 && end > start, 'delete_user action block must remain discoverable');
  return source.slice(start, end);
}

test('delete_user keeps truthful durable audit ordering around Auth deletion', () => {
  const block = deleteBlock();
  const requested = block.indexOf("await auditRequired(a,u.id,target,'delete_account')");
  const prepared = block.indexOf("await audit(a,u.id,target,'delete_account',{stage:'prepared'})");
  const authDelete = block.indexOf('await a.auth.admin.deleteUser(target)');
  const terminal = block.indexOf("await audit(a,u.id,target,'delete_account',{accountDeleted:true})");

  assert.ok(requested >= 0, 'durable requested audit checkpoint is required');
  assert.ok(prepared > requested, 'prepared marker must follow requested checkpoint');
  assert.ok(authDelete > prepared, 'Auth deletion must follow prepared marker');
  assert.ok(terminal > authDelete, 'accountDeleted terminal evidence must follow successful Auth deletion');
});

test('pre-Auth destructive cleanup is narrowly bounded to ending owned shared sessions', () => {
  const block = deleteBlock();
  const authDelete = block.indexOf('await a.auth.admin.deleteUser(target)');
  assert.ok(authDelete > 0, 'Auth deletion must remain present');
  const beforeDelete = block.slice(0, authDelete);

  assert.match(beforeDelete, /from\('bible_shared_sessions'\)\.update\(\{status:'ended'/, 'owned shared sessions may be ended before account deletion');
  assert.match(beforeDelete, /\.eq\('created_by',target\)/, 'shared-session cleanup must be scoped to the target creator');

  const forbiddenPreDeleteMutations = [
    "from('bible_app_access').delete(",
    "from('bible_congregation_members').delete(",
    "from('bible_group_members').delete(",
    "from('bible_assignments').delete(",
    "from('bible_assignment_progress').delete(",
    "from('bible_notifications').delete(",
    "from('bible_push_subscriptions').delete(",
  ];
  for (const marker of forbiddenPreDeleteMutations) {
    assert.equal(beforeDelete.includes(marker), false, `pre-Auth cleanup must not expand to ${marker}`);
  }
});

test('delete audit detail remains privacy-safe', () => {
  const block = deleteBlock();
  const auditPath = block.slice(block.indexOf('await auditRequired'), block.indexOf("return json(req,{ok:true,deleted:true})"));
  assert.equal(/password|token|secret|service_role/i.test(auditPath), false, 'delete audit path must not introduce credential-bearing detail');
  assert.match(block, /\{stage:'prepared'\}/);
  assert.match(block, /\{accountDeleted:true\}/);
});
