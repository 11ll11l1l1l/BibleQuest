import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(
  new URL('../../supabase/functions/bq-journey-group/index.ts', import.meta.url),
  'utf8',
);

function actionBlock(action: string, endToken: string): string {
  const start = source.indexOf(`if(action==='${action}')`);
  const end = source.indexOf(endToken, start + 1);
  assert.ok(start >= 0, `${action} action must exist`);
  assert.ok(end > start, `${action} action must have a bounded source block`);
  return source.slice(start, end);
}

test('Journey Group rotate-code revalidates active congregation membership', () => {
  const block = actionBlock('rotate_code', "if(action==='leave')");
  assert.match(block, /select\('id,owner_id,congregation_id,active'\)/);
  assert.match(block, /\.eq\('active',true\)/);
  assert.match(block, /activeMembership\(admin,groupRes\.data\.congregation_id,user\.id\)/);
  assert.match(block, /Active congregation membership required/);

  const membershipCheck = block.indexOf('activeMembership(');
  const update = block.indexOf(".update({invite_code_hash");
  assert.ok(membershipCheck >= 0 && update > membershipCheck,
    'congregation membership must be revalidated before invite-code mutation');
});

test('Journey Group encouragement revalidates congregation membership before service-role insert', () => {
  const block = actionBlock('encourage', "return json({error:'Unsupported action'");
  assert.match(block, /select\('id,congregation_id'\)/);
  assert.match(block, /activeMembership\(admin,group\.data\.congregation_id,user\.id\)/);
  assert.match(block, /Active congregation membership required/);

  const congregationCheck = block.indexOf('activeMembership(');
  const groupCheck = block.indexOf("from('bible_group_members')");
  const insert = block.indexOf("from('bible_group_encouragements').insert");
  assert.ok(congregationCheck >= 0 && groupCheck > congregationCheck,
    'active congregation membership must precede group-membership authorization');
  assert.ok(insert > groupCheck,
    'service-role encouragement insert must occur only after both tenant and group authorization');
});
