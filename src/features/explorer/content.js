const item=(value)=>Object.freeze({...value,clues:Object.freeze([...value.clues]),reader:Object.freeze({...value.reader})});

export const EXPLORER_ITEMS=Object.freeze([
  item({id:'person-abraham',kind:'person',name:'Abraham',clues:['Left his homeland after God’s call','Father of Isaac','Connected to God’s covenant promise'],refs:'Genesis 12; 15; 22',place:'Canaan',reader:{code:'GEN',chapter:12}}),
  item({id:'person-joseph',kind:'person',name:'Joseph',clues:['Received dreams when young','Was sold by his brothers','Rose to authority in Egypt'],refs:'Genesis 37–50',place:'Egypt',reader:{code:'GEN',chapter:37}}),
  item({id:'person-moses',kind:'person',name:'Moses',clues:['Raised near Pharaoh’s household','Encountered God at a burning bush','Led Israel out of Egypt'],refs:'Exodus 2–20',place:'Egypt / Sinai',reader:{code:'EXO',chapter:3}}),
  item({id:'person-ruth',kind:'person',name:'Ruth',clues:['A Moabite widow','Stayed with Naomi','Became part of David’s family line'],refs:'Ruth 1–4',place:'Moab / Bethlehem',reader:{code:'RUT',chapter:1}}),
  item({id:'person-david',kind:'person',name:'David',clues:['Shepherd and musician','Defeated Goliath','Became king of Israel'],refs:'1 Samuel 16–17; 2 Samuel',place:'Bethlehem / Jerusalem',reader:{code:'1SA',chapter:16}}),
  item({id:'person-elijah',kind:'person',name:'Elijah',clues:['Prophet during Ahab’s reign','Confronted prophets of Baal','Associated with Mount Carmel'],refs:'1 Kings 17–19',place:'Israel / Carmel',reader:{code:'1KI',chapter:18}}),
  item({id:'person-esther',kind:'person',name:'Esther',clues:['A Jewish woman who became queen','Mordecai was her relative and adviser','Risked approaching the king'],refs:'Esther 2–8',place:'Susa',reader:{code:'EST',chapter:4}}),
  item({id:'person-peter',kind:'person',name:'Peter',clues:['A fisherman','One of Jesus’ twelve disciples','Preached publicly in Acts 2'],refs:'Gospels; Acts 1–12',place:'Galilee / Jerusalem',reader:{code:'ACT',chapter:2}}),
  item({id:'person-paul',kind:'person',name:'Paul',clues:['Previously persecuted believers','Encountered Jesus on the road to Damascus','Carried the gospel across many cities'],refs:'Acts 9–28',place:'Damascus / Mediterranean',reader:{code:'ACT',chapter:9}}),
  item({id:'person-priscilla',kind:'person',name:'Priscilla',clues:['Worked alongside Aquila','Met Paul in Corinth','Helped explain the way of God to Apollos'],refs:'Acts 18',place:'Corinth / Ephesus',reader:{code:'ACT',chapter:18}}),
  item({id:'place-bethlehem',kind:'place',name:'Bethlehem',clues:['Connected with Ruth and David','A town in Judah','Jesus was born here'],refs:'Ruth 1; 1 Samuel 16; Matthew 2',place:'Judah',reader:{code:'MAT',chapter:2}}),
  item({id:'place-jerusalem',kind:'place',name:'Jerusalem',clues:['David made it his royal city','The temple stood here','Central to Jesus’ final week and Acts 2'],refs:'2 Samuel 5; Gospels; Acts 2',place:'Judah',reader:{code:'ACT',chapter:2}}),
  item({id:'place-damascus',kind:'place',name:'Damascus',clues:['Ancient Syrian city','Saul traveled toward it to arrest believers','His encounter with Jesus changed his mission'],refs:'Acts 9',place:'Syria',reader:{code:'ACT',chapter:9}}),
  item({id:'place-corinth',kind:'place',name:'Corinth',clues:['Paul stayed and worked here','Priscilla and Aquila lived here','Two New Testament letters bear its church’s name'],refs:'Acts 18; 1–2 Corinthians',place:'Achaia',reader:{code:'ACT',chapter:18}}),
  item({id:'place-ephesus',kind:'place',name:'Ephesus',clues:['Paul spent extended ministry time here','Connected with a major public disturbance in Acts','One New Testament letter addresses believers here'],refs:'Acts 19; Ephesians',place:'Asia Minor',reader:{code:'ACT',chapter:19}})
]);

export const EXPLORER_BY_ID=Object.freeze(Object.fromEntries(EXPLORER_ITEMS.map(row=>[row.id,row])));
export const EXPLORER_BY_KIND=Object.freeze({
  person:Object.freeze(EXPLORER_ITEMS.filter(row=>row.kind==='person')),
  place:Object.freeze(EXPLORER_ITEMS.filter(row=>row.kind==='place'))
});
