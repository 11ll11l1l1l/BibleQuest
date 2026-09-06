export const DETECTIVE_MODE=Object.freeze({
  id:'character-detective',
  title:'Character Detective',
  kicker:'Who am I?',
  description:'Use Scripture-based clues to identify a Bible character, then check the reference.',
  entry:'detective'
});

export const DETECTIVES=Object.freeze([
  Object.freeze({id:'d1',clues:Object.freeze(['I was a shepherd.','I became king.','I defeated a giant.']),answer:'David',ref:'1 Samuel 16–17'}),
  Object.freeze({id:'d2',clues:Object.freeze(['My brothers sold me.','I interpreted dreams.','I became powerful in Egypt.']),answer:'Joseph',ref:'Genesis 37–41'}),
  Object.freeze({id:'d3',clues:Object.freeze(['I was a tax collector.','I climbed a tree to see Jesus.','Jesus came to my house.']),answer:'Zacchaeus',ref:'Luke 19:1–10'}),
  Object.freeze({id:'d4',clues:Object.freeze(['I was a queen.','I approached the king at great risk.','I acted to protect my people.']),answer:'Esther',ref:'Esther 4–8'}),
  Object.freeze({id:'d5',clues:Object.freeze(['I was a fisherman.','I walked briefly on water.','I preached at Pentecost.']),answer:'Peter',ref:'Matthew 14; Acts 2'})
]);
