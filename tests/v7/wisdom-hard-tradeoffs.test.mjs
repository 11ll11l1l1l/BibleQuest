import { WISDOM_SITUATIONS, getWisdomSituation, localizeWisdomSituation } from '../../src/features/wisdom-situations/content.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const ids=new Set();
let preferredLongest=0;
let preferredShortest=0;
for(const item of WISDOM_SITUATIONS){
  assert(!ids.has(item.id),`duplicate id ${item.id}`);ids.add(item.id);
  assert(item.difficulty===8,`${item.id} is not the new advanced difficulty`);
  assert(item.definition.version===2,`${item.id} old session version`);
  assert(item.scenario.includes('DECISION CONSTRAINTS: '),`${item.id} lacks a binding context`);
  assert(item.options.length===4&&new Set(item.options).size===4,`${item.id} missing distinct paths`);
  assert(item.rationales.length===4&&item.refs.length,`${item.id} missing explanations or scripture`);
  const lengths=item.options.map(x=>x.length);
  const max=Math.max(...lengths),min=Math.min(...lengths);
  assert(max/min<=1.251,`${item.id} has a visible longest-answer length cue: ${lengths}`);
  if(lengths[item.best]===max)preferredLongest++;
  if(lengths[item.best]===min)preferredShortest++;
  for(let i=0;i<4;i++){
    const pattern=/^(.+?)[.] Benefit: (.+?)[.] Cost 1: (.+?)[.] Cost 2: (.+?)[.]$/;
    const parts=item.options[i].match(pattern);
    assert(parts&&parts.slice(1).every(value=>value.trim().length>=8),`${item.id} option ${i} must include an action, a real benefit and two distinct costs`);
    assert(parts[3]!==parts[4],`${item.id} option ${i} repeats the same cost`);
    assert(/^(you|your)\\b/i.test(parts[4]),`${item.id} option ${i} does not impose a cost on the decision-maker`);
    assert(/Benefit:/.test(item.rationales[i])&&/First sacrifice:/.test(item.rationales[i])&&/Second sacrifice:/.test(item.rationales[i]),`${item.id} option ${i} explanation lacks all three consequences`);
  }
  for(const locale of ['tl','ceb']){
    const translated=localizeWisdomSituation(item,locale);
    assert(translated.options.length===4,`${item.id} ${locale} answer count regressed`);
  }
}
assert(ids.size===72,'exactly 72 unique dilemmas required');
assert(preferredLongest>=12&&preferredLongest<=24,`longest answer remains an exploitable length clue (${preferredLongest}/72)`);
assert(preferredShortest>=12&&preferredShortest<=26,`shortest answer remains an exploitable length clue (${preferredShortest}/72)`);
assert(WISDOM_SITUATIONS.filter(x=>x.pack==='foundation').length===24,'foundation pack changed');
assert(WISDOM_SITUATIONS.filter(x=>x.pack==='advanced').length===24,'advanced pack changed');
assert(WISDOM_SITUATIONS.filter(x=>x.pack==='expert').length===24,'expert pack changed');
assert(getWisdomSituation('hw72').id==='hw72','last case missing');
console.log(`Hard wisdom editorial QA passed: 72 cases, 288 choices each with one benefit and two losses, longest editorial option ${preferredLongest}/72, shortest ${preferredShortest}/72.`);
