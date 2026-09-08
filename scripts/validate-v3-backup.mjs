import fs from 'node:fs';
import path from 'node:path';

const failures=[];const fail=message=>failures.push(message);const read=file=>fs.readFileSync(file,'utf8');
const required=['BACKUP_IMPORT_V3.md','FEATURE_INVENTORY_V3.md','src/core/storage.js','src/app/backup.js','src/app/bootstrap.js','src/features/backup/index.js','src/features/more/index.js','tests/v3-backup-edge.mjs','tests/v3-backup-smoke.mjs','.github/workflows/v3-regression.yml'];
for(const file of required)if(!fs.existsSync(file))fail(`Missing #100 backup file: ${file}`);

function jsFiles(dir){if(!fs.existsSync(dir))return[];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const target=path.join(dir,entry.name);return entry.isDirectory()?jsFiles(target):entry.isFile()&&target.endsWith('.js')?[target]:[]})}

if(!failures.length){
  const storage=read('src/core/storage.js'),owner=read('src/app/backup.js'),ui=read('src/features/backup/index.js'),bootstrap=read('src/app/bootstrap.js'),more=read('src/features/more/index.js'),contract=read('BACKUP_IMPORT_V3.md'),inventory=read('FEATURE_INVENTORY_V3.md'),workflow=read('.github/workflows/v3-regression.yml');
  for(const item of['exportPortableEntries','replacePortableEntries','resetPortableEntries','isPortableName','device-id',"auth.",'rollback'])if(!storage.includes(item))fail(`Storage boundary missing #100 contract: ${item}`);
  for(const item of["FORMAT = 'biblequest-v3-local-backup'",'VERSION = 1','exportBackup','importBackup','resetLocalState','storage.exportPortableEntries','storage.replacePortableEntries','storage.resetPortableEntries'])if(!owner.includes(item))fail(`Backup owner missing #100 contract: ${item}`);
  if(/localStorage|sessionStorage|authStorage|createClient|fetch\s*\(/.test(owner))fail('Backup orchestration must not bypass storage/auth/API ownership.');
  if(/localStorage|sessionStorage|authStorage|storage\./.test(ui))fail('Backup UI must not access persistence directly.');
  if(!bootstrap.includes('createBackupService')||!bootstrap.includes("backup:()=>backupPage")||!bootstrap.includes('location.reload()'))fail('Bootstrap must wire the single backup owner, route, and post-apply rehydration reload.');
  if(!more.includes('data-open-backup'))fail('More page must expose the backup controls entry.');
  for(const file of jsFiles('src')){
    if(file==='src/core/storage.js')continue;
    if(/\blocalStorage\b|\bsessionStorage\b/.test(read(file)))fail(`Direct browser storage use outside storage owner: ${file}`);
  }
  for(const statement of['`biblequest.v3.auth.*` is excluded','`biblequest.v3.device-id` is excluded and preserved','If a storage write fails','reloads BibleQuest'])if(!contract.includes(statement))fail(`Backup contract missing boundary: ${statement}`);
  if(!inventory.includes('| 100 | Backup/export/import/reset | Yes | Clean | Not started | export; reset; import; schema validation; corrupt backup |'))fail('#100 must remain Not started until the complete functional gate passes.');
  for(const total of['**Regression-tested:** 60','**Verified:** 1','**Not started:** 39'])if(!inventory.includes(total))fail(`Inventory totals changed before #100 verification: ${total}`);
  for(const test of['node scripts/validate-v3-backup.mjs','node tests/v3-backup-edge.mjs','node tests/v3-backup-smoke.mjs'])if(!workflow.includes(test))fail(`Accumulated workflow missing #100 regression: ${test}`);
}
if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 Backup/export/import/reset architecture boundary passed.');
