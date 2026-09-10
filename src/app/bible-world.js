export const BIBLE_WORLD_EXPLORED_THRESHOLD=60;

const REGIONS=Object.freeze([
  Object.freeze({key:'creation',icon:'🌍',title:'Creation & Beginnings',category:'Genesis',books:Object.freeze(['Genesis']),ref:Object.freeze({code:'GEN',chapter:1}),progress:mastery=>Math.min(100,(mastery.Genesis||0)*2)}),
  Object.freeze({key:'patriarchs',icon:'🏕️',title:'Patriarchs',category:'Genesis',books:Object.freeze(['Genesis']),ref:Object.freeze({code:'GEN',chapter:12}),progress:mastery=>Math.max(0,Math.min(100,((mastery.Genesis||0)-50)*2))}),
  Object.freeze({key:'exodus',icon:'🌊',title:'Exodus & Law',category:'Exodus',books:Object.freeze(['Exodus','Leviticus','Numbers','Deuteronomy']),ref:Object.freeze({code:'EXO',chapter:3}),progress:mastery=>mastery.Exodus||0}),
  Object.freeze({key:'kingdom',icon:'🏰',title:'Land & Kingdom',category:'History',books:Object.freeze(['Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther']),ref:Object.freeze({code:'1SA',chapter:16}),progress:mastery=>mastery.History||0}),
  Object.freeze({key:'wisdom',icon:'🎵',title:'Wisdom & Worship',category:'Wisdom',books:Object.freeze(['Job','Psalms','Proverbs','Ecclesiastes','Song of Songs']),ref:Object.freeze({code:'PSA',chapter:23}),progress:mastery=>mastery.Wisdom||0}),
  Object.freeze({key:'prophets',icon:'📜',title:'Prophets',category:'Prophets',books:Object.freeze(['Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Minor Prophets']),ref:Object.freeze({code:'ISA',chapter:6}),progress:mastery=>mastery.Prophets||0}),
  Object.freeze({key:'jesus',icon:'✝️',title:'Jesus & Gospels',category:'Gospels',books:Object.freeze(['Matthew','Mark','Luke','John']),ref:Object.freeze({code:'JHN',chapter:3}),progress:mastery=>mastery.Gospels||0}),
  Object.freeze({key:'church',icon:'🔥',title:'Acts & Early Church',category:'Acts',books:Object.freeze(['Acts']),ref:Object.freeze({code:'ACT',chapter:2}),progress:mastery=>mastery.Acts||0}),
  Object.freeze({key:'letters',icon:'✉️',title:'Letters & Revelation',category:'Letters',books:Object.freeze(['Romans through Revelation']),ref:Object.freeze({code:'ROM',chapter:12}),progress:mastery=>mastery.Letters||0})
]);

const clamp=value=>Math.max(0,Math.min(100,Number.isFinite(Number(value))?Number(value):0));
const worldError=(message,code)=>{const error=new Error(message);error.code=code;return error};

export function createBibleWorldService({adaptive,reader}={}){
  if(!adaptive?.getProfile||!reader?.setBook)throw new Error('Bible World requires Adaptive Learning and Reader owners.');

  function mastery(){
    const source=adaptive.getProfile()?.mastery;
    return source&&typeof source==='object'?source:{};
  }

  function build(){
    const evidence=mastery();
    const rows=REGIONS.map(region=>{
      const percent=Math.round(clamp(region.progress(evidence)));
      return Object.freeze({key:region.key,icon:region.icon,title:region.title,category:region.category,books:region.books,ref:region.ref,percent,explored:percent>=BIBLE_WORLD_EXPLORED_THRESHOLD,accessible:true});
    });
    const next=rows.find(row=>!row.explored)||rows[rows.length-1];
    return Object.freeze({threshold:BIBLE_WORLD_EXPLORED_THRESHOLD,nextKey:next.key,allExplored:rows.every(row=>row.explored),regions:Object.freeze(rows.map(row=>Object.freeze({...row,isNext:row.key===next.key})))});
  }

  function region(key){
    const row=build().regions.find(item=>item.key===String(key||''));
    if(!row)throw worldError('Bible World region was not found.','BQ_BIBLE_WORLD_REGION');
    return row;
  }

  function openRead(key){
    const row=region(key);
    reader.setBook(row.ref.code,row.ref.chapter);
    return Object.freeze({route:'reader',region:row});
  }

  function openReview(key){
    const row=region(key);
    return Object.freeze({route:'open-review',region:row});
  }

  return Object.freeze({snapshot:build,region,openRead,openReview,regions:REGIONS,threshold:BIBLE_WORLD_EXPLORED_THRESHOLD});
}
