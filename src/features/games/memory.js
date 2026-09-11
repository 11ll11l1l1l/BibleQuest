export const KIDS_MEMORY_MODE=Object.freeze({id:'kids-memory-match',title:'Memory Meadow',kicker:'KIDS · MEMORY',description:'Match silly animal friends with fewer flips.',age:3,skill:'Memory'});
export const KIDS_MEMORY_ICONS=Object.freeze(['🦊','🐼','🐸','🐵','🦁','🐰','🐯','🐨']);
export const KIDS_MEMORY_DELAYS=Object.freeze({match:350,mismatch:650});

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function memoryLayout(width){
  const value=Number(width);
  if(!Number.isFinite(value)||value<=0)throw new Error('Memory Meadow requires a valid viewport width.');
  return Object.freeze(value<420?{pairs:6,columns:3}:{pairs:8,columns:4});
}

export function memoryReward(moves){
  const value=Number(moves);
  if(!Number.isSafeInteger(value)||value<1)throw new Error('Memory Meadow moves must be a positive integer.');
  const stars=clamp(6-Math.floor(value/4),2,5);
  return Object.freeze({stars,coins:stars*4});
}

export function buildMemoryDeck(width,random=Math.random){
  if(typeof random!=='function')throw new Error('Memory Meadow shuffle requires a random source.');
  const layout=memoryLayout(width),values=[...KIDS_MEMORY_ICONS.slice(0,layout.pairs),...KIDS_MEMORY_ICONS.slice(0,layout.pairs)];
  for(let index=values.length-1;index>0;index--){
    const sample=Number(random());
    if(!Number.isFinite(sample)||sample<0||sample>=1)throw new Error('Memory Meadow random source returned an invalid value.');
    const swap=Math.floor(sample*(index+1));
    [values[index],values[swap]]=[values[swap],values[index]];
  }
  return Object.freeze({pairs:layout.pairs,columns:layout.columns,cards:Object.freeze(values.map((icon,index)=>Object.freeze({id:`memory-card-${index+1}`,icon,open:false,done:false})))});
}
