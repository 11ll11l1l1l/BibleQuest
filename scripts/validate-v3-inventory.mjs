import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const inventoryPath=path.join(root,'FEATURE_INVENTORY_V3.md');
const failures=[];
const fail=message=>failures.push(message);

if(!fs.existsSync(inventoryPath))fail('Missing FEATURE_INVENTORY_V3.md.');

if(!failures.length){
  const inventory=fs.readFileSync(inventoryPath,'utf8');
  const rows=inventory.split('\n').filter(line=>/^\|\s*\d+\s*\|/.test(line));
  const allowed=new Set(['Not started','Implemented','Verified','Regression-tested']);
  const counts={
    'Regression-tested':0,
    'Verified':0,
    'Implemented':0,
    'Not started':0
  };

  if(rows.length!==100)fail(`Feature inventory must contain exactly 100 numbered capability rows; found ${rows.length}.`);

  rows.forEach((line,index)=>{
    const columns=line.split('|').slice(1,-1).map(value=>value.trim());
    const number=Number(columns[0]);
    const status=columns[4];
    if(number!==index+1)fail(`Feature inventory row sequence error at position ${index+1}; found ${columns[0]}.`);
    if(!allowed.has(status))fail(`Invalid v3 status on row ${columns[0]}: ${status}.`);
    else counts[status]+=1;
  });

  const expectedHeaders={
    'Regression-tested':counts['Regression-tested'],
    'Verified':counts.Verified,
    'Implemented':counts.Implemented,
    'Not started':counts['Not started']
  };

  for(const [label,count] of Object.entries(expectedHeaders)){
    const match=inventory.match(new RegExp(`- \\*\\*${label}:\\*\\* (\\d+)`));
    if(!match)fail(`Inventory summary is missing ${label}.`);
    else if(Number(match[1])!==count)fail(`Inventory summary ${label}=${match[1]} but numbered rows compute ${count}.`);
  }

  const totalMatch=inventory.match(/- \*\*Total old-version capabilities:\*\* (\d+)/);
  if(!totalMatch)fail('Inventory summary is missing Total old-version capabilities.');
  else if(Number(totalMatch[1])!==rows.length)fail(`Inventory summary total=${totalMatch[1]} but numbered rows compute ${rows.length}.`);

  const sum=Object.values(counts).reduce((total,value)=>total+value,0);
  if(sum!==100)fail(`Inventory status counts must sum to 100; computed ${sum}.`);

  const scriptsDir=path.join(root,'scripts');
  for(const entry of fs.readdirSync(scriptsDir,{withFileTypes:true})){
    if(!entry.isFile()||!/^validate-v3-.*\.mjs$/.test(entry.name)||entry.name==='validate-v3-inventory.mjs')continue;
    const text=fs.readFileSync(path.join(scriptsDir,entry.name),'utf8');
    if(/\*\*Regression-tested:\*\*|\*\*Verified:\*\*|\*\*Not started:\*\*/.test(text))fail(`Global inventory totals must be owned only by validate-v3-inventory.mjs; duplicate guard found in ${entry.name}.`);
  }
}

if(failures.length){for(const item of failures)console.error(`- ${item}`);process.exit(1)}
console.log('BibleQuest v3 inventory ledger validation passed.');
