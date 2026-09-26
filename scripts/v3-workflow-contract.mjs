import fs from 'node:fs';

const escapeRegex=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

function executableSource(source){
  return String(source||'')
    .split('\n')
    .filter(line=>!line.trimStart().startsWith('#'))
    .join('\n');
}


function localActionSources(source,visited){
  const workflow=executableSource(source);
  const sources=[];
  const localActions=/^\s*uses:\s*["']?(\.\/\.github\/actions\/[A-Za-z0-9._\/-]+)["']?\s*$/gm;
  for(const match of workflow.matchAll(localActions)){
    const reference=match[1];
    if(reference.split('/').includes('..')||visited.has(reference))continue;
    visited.add(reference);
    const relative=reference.slice(2);
    for(const filename of ['action.yml','action.yaml']){
      const url=new URL('../'+relative+'/'+filename,import.meta.url);
      if(!fs.existsSync(url))continue;
      sources.push(fs.readFileSync(url,'utf8'));
      break;
    }
  }
  return sources;
}
function workflowInvokesNodeInternal(source,entry,visited){
  if(typeof entry!=='string'||!entry||/\s/.test(entry))return false;
  const workflow=executableSource(source);
  const target=escapeRegex(entry);
  const direct=new RegExp(`(?:^|[;\\s])(?:timeout\\s+\\S+\\s+)?node\\s+["']?${target}["']?(?=\\s|;|$)`,'m');
  if(direct.test(workflow))return true;

  const loops=/\bfor\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([^;]+);\s*do\s+([^;]+);\s*done\b/g;
  for(const match of workflow.matchAll(loops)){
    const [,variable,rawEntries,body]=match;
    const entries=rawEntries.trim().split(/\s+/).map(value=>value.replace(/^["']|["']$/g,''));
    if(!entries.includes(entry))continue;
    const name=escapeRegex(variable);
    const variableNode=new RegExp(`(?:^|\\s)(?:timeout\\s+\\S+\\s+)?node\\s+(?:["']\\$${name}["']|\\$${name}|["']\\$\\{${name}\\}["']|\\$\\{${name}\\})(?=\\s|$)`);
    if(variableNode.test(body))return true;
  }
  for(const actionSource of localActionSources(workflow,visited)){
    if(workflowInvokesNodeInternal(actionSource,entry,visited))return true;
  }
  return false;
}

export function workflowInvokesNode(source,entry){
  if(typeof entry!=='string'||!entry||/\s/.test(entry))return false;
  return workflowInvokesNodeInternal(source,entry,new Set());
}
