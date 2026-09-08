const escapeRegex=value=>String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

function executableSource(source){
  return String(source||'')
    .split('\n')
    .filter(line=>!line.trimStart().startsWith('#'))
    .join('\n');
}

export function workflowInvokesNode(source,entry){
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
  return false;
}
