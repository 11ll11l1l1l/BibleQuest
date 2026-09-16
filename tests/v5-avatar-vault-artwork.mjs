import assert from 'node:assert/strict';
import fs from 'node:fs';

const engine=fs.readFileSync('src/engines/avatar-vault.js','utf8');
const page=fs.readFileSync('src/features/avatar-vault/index.js','utf8');
const sprite=fs.readFileSync('assets/avatar-vault-icons.svg','utf8');

const mappings=[
  ['starter','🌱'],['sakura','🌸'],['lantern','🏮'],['flame','🔥'],['crown','👑'],
  ['scholar','🎓'],['scroll','📜'],['shepherd','🐑'],['couple','💞'],['community','⛪'],
  ['world','🌏'],['kitsune','🦊'],['moon','🌙'],['fuji','🗻'],['tea','🍵']
];

for(const [id,glyph] of mappings){
  assert.ok(engine.includes(`id: '${id}', icon: '${glyph}'`),`engine must preserve ${id} state token`);
  assert.ok(page.includes(`'${id}'`),`Avatar Vault presentation must recognize style id ${id}`);
  assert.ok(sprite.includes(`<symbol id="${id}"`),`Avatar Vault sprite must provide exact style artwork for ${id}`);
}
assert.ok(sprite.includes('<symbol id="lock"'),'Avatar Vault sprite must provide lock artwork for locked styles');
assert.match(page,/data-avatar-art=\"\$\{art\}\" aria-hidden=\"true\"/,'avatar artwork must remain decorative');
assert.match(page,/assets\/avatar-vault-icons\.svg#\$\{art\}/,'Avatar Vault must render the existing sprite by stable style id');
assert.match(page,/esc\(style\.name\)/,'style name must remain independently visible');
assert.match(page,/esc\(state\.selected\.name\)/,'selected style name must remain independently visible');
assert.doesNotMatch(page,/style\.icon|selected\.icon/,'legacy engine glyph tokens must not be the normal Avatar Vault visual presentation');

console.log('v5 Avatar Vault exact artwork mapping + independent text: PASS');
