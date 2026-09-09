(() => {
  const MISSING='missing';

  function stableValue(value){
    if(Array.isArray(value))return value.map(stableValue);
    if(value&&typeof value==='object')return Object.keys(value).sort().reduce((out,key)=>{out[key]=stableValue(value[key]);return out},{});
    return value;
  }

  function fingerprint(value){
    if(value===undefined)return MISSING;
    const source=JSON.stringify(stableValue(value));
    let first=2166136261,second=0x9e3779b9;
    for(let index=0;index<source.length;index+=1){
      const code=source.charCodeAt(index);
      first=Math.imul(first^code,16777619);
      second=Math.imul(second^code,2246822519);
    }
    return `${source.length}:${(first>>>0).toString(16)}:${(second>>>0).toString(16)}`;
  }

  function baseline(state={}){
    return Object.keys(state).sort().reduce((out,key)=>{out[key]=fingerprint(state[key]);return out},{});
  }

  function reconcile(localState={},remoteState=null,baseFingerprints=null){
    const local=localState&&typeof localState==='object'?localState:{};
    const remote=remoteState&&typeof remoteState==='object'?remoteState:null;
    if(!remote)return {action:'push',state:local,conflicts:[]};
    const keys=[...new Set([...Object.keys(local),...Object.keys(remote),...Object.keys(baseFingerprints||{})])].sort();
    if(!baseFingerprints){
      const conflicts=keys.filter(key=>fingerprint(local[key])!==fingerprint(remote[key]));
      return conflicts.length?{action:'conflict',state:local,conflicts}:{action:'noop',state:local,conflicts:[]};
    }
    const merged={},conflicts=[];
    for(const key of keys){
      const localPrint=fingerprint(local[key]),remotePrint=fingerprint(remote[key]),basePrint=baseFingerprints[key]||MISSING;
      if(localPrint===remotePrint){if(local[key]!==undefined)merged[key]=local[key];continue}
      if(localPrint===basePrint){if(remote[key]!==undefined)merged[key]=remote[key];continue}
      if(remotePrint===basePrint){if(local[key]!==undefined)merged[key]=local[key];continue}
      conflicts.push(key);
    }
    if(conflicts.length)return {action:'conflict',state:local,conflicts};
    const mergedPrint=fingerprint(merged),localPrint=fingerprint(local),remotePrint=fingerprint(remote);
    if(mergedPrint===localPrint&&mergedPrint===remotePrint)return {action:'noop',state:merged,conflicts:[]};
    if(mergedPrint===remotePrint)return {action:'restore',state:merged,conflicts:[]};
    return {action:'push',state:merged,conflicts:[]};
  }

  window.BQProgressSyncPolicy=Object.freeze({baseline,fingerprint,reconcile});
})();
