export const TIMELINE_MODE=Object.freeze({
  id:'timeline-challenge',
  title:'Timeline',
  kicker:'Put events in order',
  description:'Reorder major Bible events into their chronological sequence, then check your timeline.',
  entry:'timeline'
});

export const TIMELINES=Object.freeze([
  Object.freeze({id:'t1',title:'Big Bible Story',items:Object.freeze(['Abraham leaves his homeland','Moses leads Israel from Egypt','David becomes king','Judah is exiled to Babylon','Jesus is born','Paul travels as a missionary'])}),
  Object.freeze({id:'t2',title:'Life of Jesus',items:Object.freeze(['Jesus is born in Bethlehem','Jesus is baptized by John','Jesus calls disciples','Jesus enters Jerusalem','Jesus is crucified','Jesus’ resurrection is proclaimed'])}),
  Object.freeze({id:'t3',title:'Genesis Journey',items:Object.freeze(['Creation','The flood','Call of Abraham','Birth of Isaac','Jacob’s family grows','Joseph rises in Egypt'])})
]);
