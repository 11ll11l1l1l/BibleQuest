export const MEMORY_MODE=Object.freeze({id:'kids-memory-match',title:'Memory Meadow',kicker:'Age 3+ · Memory',description:'Match the animal friends with fewer flips. Phones use six pairs; wider screens use eight.',entry:'memory'});

export const MEMORY_ICONS=Object.freeze(['🦊','🐼','🐸','🐵','🦁','🐰','🐯','🐨']);

export function memoryStars(moves){
  const count=Number(moves);
  if(!Number.isSafeInteger(count)||count<0)throw new Error('Memory move count is invalid.');
  return Math.max(2,Math.min(5,6-Math.floor(count/4)));
}
