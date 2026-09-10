import fs from 'node:fs';
import {workflowInvokesNode} from './v3-workflow-contract.mjs';
const failures=[],fail=message=>failures.push(message),read=file=>fs.readFileSync(file,'utf8');
const required=['AVATAR_VAULT_V3.md','FEATURE_INVENTORY_V3.md','src/engines/avatar-vault.js','src/app/avatar-vault.js','src/features/avatar-vault/index.js','src/core/api.js','src/app/leaderboards.js','src/features/leaderboards/index.js','src/features/progress/index.js','src/app/bootstrap.js','src/core/storage.js','supabase/migrations/20260910_avatar_vault_visibility.sql','tests/v3-avatar-vault-edge.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #82 Avatar Vault file: ${file}`);
if(!failures.length){
  const contract=read('AVATAR_VAULT_V3.md'),engine=read('src/engines/avatar-vault.js'),service=read('src/app/avatar-vault.js'),ui=read('src/features/avatar-vault/index.js'),api=read('src/core/api.js'),leaderboardService=read('src/app/leaderboards.js'),leaderboardUi=read('src/features/leaderboards/index.js'),progressUi=read('src/features/progress/index.js'),bootstrap=read('src/app/bootstrap.js'),storage=read('src/core/storage.js'),migration=read('supabase/migrations/20260910_avatar_vault_visibility.sql'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml'),psychometricsEngine=read('src/engines/psychometrics.js'),personalityProfile=read('src/app/personality-profile.js');

  for(const forbidden of['window.BQ','localStorage','sessionStorage','createClient','progress.record','document.'])if(engine.includes(forbidden))fail(`Avatar Vault engine leaked an external owner: ${forbidden}`);
  for(const token of['export const STYLES','starter','sakura','lantern','flame','crown','scholar','scroll','shepherd','couple','community','world','kitsune','moon','fuji','tea','needsOwner','available:','export function findStyle','export function unlockedIds','export function iconFor'])if(!engine.includes(token))fail(`Avatar Vault engine missing catalog/unlock contract: ${token}`);
  const availableTrue=(engine.match(/available:\s*true/g)||[]).length,availableFalse=(engine.match(/available:\s*false/g)||[]).length;
  if(availableTrue!==5)fail(`Avatar Vault v1 must expose exactly 5 available styles, found ${availableTrue}.`);
  if(availableFalse!==10)fail(`Avatar Vault v1 must explicitly defer exactly 10 styles, found ${availableFalse}.`);

  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','document.','router.navigate'])if(service.includes(forbidden))fail(`Avatar Vault service bypasses verified owners: ${forbidden}`);
  for(const token of['avatar-vault:','privateStorage.read','privateStorage.write','api.avatarVault','session.getState','progress?.getState','BQ_AVATAR_VAULT_LOCKED','synced'])if(!service.includes(token))fail(`Avatar Vault service missing lifecycle/persistence contract: ${token}`);

  for(const forbidden of['localStorage','sessionStorage','createClient','@supabase','location.assign','history.'])if(ui.includes(forbidden))fail(`Avatar Vault UI bypasses verified owners: ${forbidden}`);
  for(const token of['data-avatar-select','data-avatar-back','vault.load','vault.select','vault.getState'])if(!ui.includes(token))fail(`Avatar Vault UI missing presentation contract: ${token}`);

  for(const token of["const avatarVault = Object.freeze","avatarVault","bible_avatar_cosmetics","bible_congregation_members').update({avatar}","LEADERBOARD_DIRECTORY_FIELDS"])if(!api.includes(token))fail(`API boundary missing #82 contract: ${token}`);

  if(!leaderboardService.includes('normalizeAvatar'))fail('Leaderboards service must sanitize avatar into ranked directory rows.');
  if(!leaderboardUi.includes('iconFor'))fail('Leaderboards presentation must render the equipped avatar icon via the engine.');

  if(!progressUi.includes('onAvatarVault')||!progressUi.includes('data-open-avatar-vault'))fail('Grow page missing Avatar Vault entry point.');

  for(const token of['createAvatarVaultService','avatarVaultPage',"'avatar-vault':()=>avatarVaultPage","onAvatarVault:()=>router.navigate('avatar-vault')"])if(!bootstrap.includes(token))fail(`Bootstrap missing Avatar Vault composition: ${token}`);

  for(const token of["const PRIVATE_PREFIX = 'private.'",'export const privateStorage'])if(!storage.includes(token))fail('Avatar Vault private-storage prerequisite missing.');

  if(!/add column if not exists avatar/.test(migration))fail('Migration must add the avatar column additively (add column if not exists).');
  if(!/members self avatar update/.test(migration))fail('Migration must add the missing self-update RLS policy for bible_congregation_members.');

  if(psychometricsEngine.includes('avatar-vault')||personalityProfile.includes('avatar-vault'))fail('#81 Psychometrics/Personality Profile must not absorb the #82 Avatar Vault engine.');

  for(const token of['browse; select; persist; render fallback','available:true','needsOwner','bible_congregation_members','self-update RLS','v1 scope decision'])if(!contract.includes(token))fail(`Avatar Vault contract missing recovered boundary: ${token}`);

  const row=n=>inventory.split('\n').find(line=>line.startsWith(`| ${n} |`))||'';
  if(!/\| (Not started|Implemented|Verified|Regression-tested) \|/.test(row(82)))fail('Inventory #82 Avatar Vault must use a valid lifecycle state.');

  for(const test of['scripts/validate-v3-avatar-vault.mjs','tests/v3-avatar-vault-edge.mjs'])if(!workflowInvokesNode(workflow,test))fail(`Accumulated workflow missing #82 regression: ${test}`);
}
if(failures.length){failures.forEach(item=>console.error(`- ${item}`));process.exit(1)}
console.log('BibleQuest v3 Avatar Vault architecture/provenance boundary passed.');
