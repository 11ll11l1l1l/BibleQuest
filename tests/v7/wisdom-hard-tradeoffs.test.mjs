import { WISDOM_SITUATIONS, getWisdomSituation, localizeWisdomSituation } from '../../src/features/wisdom-situations/content.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
const ids=new Set();
let preferredLongest=0;
let preferredShortest=0;
for(const item of WISDOM_SITUATIONS){
  assert(!ids.has(item.id),`duplicate id ${item.id}`);ids.add(item.id);
  assert(item.difficulty===8,`${item.id} is not the new advanced difficulty`);
  assert(item.definition.version===2,`${item.id} old session version`);
  assert(item.scenario.length>=140&&!item.scenario.includes('undefined'),`${item.id} lacks a coherent contextual narrative`);
  assert(Array.isArray(item.basis)&&item.basis.length===4,`${item.id} lacks four defensible grounds`);
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
    assert(item.basis[i].trim().length>=35&&item.basis[i].trim().endsWith('.'),`${item.id} option ${i} lacks a concrete defense`);
    assert(!/^(people will criticize|you should|simply trust)/i.test(item.basis[i]),`${item.id} option ${i} substitutes moral slogans for facts`);
    assert(/^(?:you|your)(?: |$)/i.test(parts[4]),`${item.id} option ${i} does not impose a cost on the decision-maker`);
    assert(/Why a Christian could choose this:/.test(item.rationales[i])&&/Benefit:/.test(item.rationales[i])&&/First sacrifice:/.test(item.rationales[i])&&/Second sacrifice:/.test(item.rationales[i]),`${item.id} option ${i} explanation lacks all three consequences`);
  }
  for(const locale of ['tl','ceb']){
    const translated=localizeWisdomSituation(item,locale);
    assert(translated.options.length===4&&new Set(translated.options).size===4,`${item.id} ${locale} choices missing or duplicated`);
    assert(translated.basis.length===4&&translated.rationales.length===4,`${item.id} ${locale} missing justified choices`);
    assert(translated.scenario!==item.scenario&&translated.scenario.length>=85,`${item.id} ${locale} is not an authored translated scene`);
    assert(translated.why!==item.why&&translated.title,`${item.id} ${locale} missing translated explanations/title`);
    assert(translated.best===item.best&&translated.id===item.id,`${item.id} ${locale} canonical answer/index changed`);
    for(let i=0;i<4;i++){
      const parts=translated.options[i].match(/^(.+?)[.] Benefit: (.+?)[.] Cost 1: (.+?)[.] Cost 2: (.+?)[.]$/);
      assert(parts&&parts.slice(1).every(value=>value.trim().length>=6),`${item.id} ${locale}/${i} must contain an action, one gain and two losses`);
      assert(translated.options[i]!==item.options[i],`${item.id} ${locale}/${i} still uses an English choice`);
      assert(translated.basis[i].length>=30&&translated.basis[i]!==item.basis[i],`${item.id} ${locale}/${i} basis missing or untranslated`);
      assert(translated.rationales[i].includes(translated.basis[i]),`${item.id} ${locale}/${i} outcome and explanation misaligned`);
      assert(translated.rationales[i].includes(parts[2])&&translated.rationales[i].includes(parts[3])&&translated.rationales[i].includes(parts[4]),`${item.id} ${locale}/${i} omitted a consequence`);
    }
    const alternate=localizeWisdomSituation(item,locale==='tl'?'tl-PH':'ceb_PH');
    assert(alternate.scenario===translated.scenario,`${item.id} ${locale} locale variant mismatch`);
  }
}
assert(ids.size===72,'exactly 72 unique dilemmas required');
assert(preferredLongest>=12&&preferredLongest<=24,`longest answer remains an exploitable length clue (${preferredLongest}/72)`);
assert(preferredShortest>=12&&preferredShortest<=26,`shortest answer remains an exploitable length clue (${preferredShortest}/72)`);
assert(WISDOM_SITUATIONS.filter(x=>x.pack==='foundation').length===24,'foundation pack changed');
assert(WISDOM_SITUATIONS.filter(x=>x.pack==='advanced').length===24,'advanced pack changed');
assert(WISDOM_SITUATIONS.filter(x=>x.pack==='expert').length===24,'expert pack changed');
assert(getWisdomSituation('hw72').id==='hw72','last case missing');
console.log(`Hard wisdom structural QA passed: 72 cases, 288 choices with a concrete defense, one benefit and two meaningful costs; stored editorial option longest ${preferredLongest}/72, shortest ${preferredShortest}/72.`);

// Case-specific safeguarding, parity and least-attractive-choice regression guards.
const housing=getWisdomSituation('hw65');
for(const locale of ['en','tl','ceb']){
  const case65=localizeWisdomSituation(housing,locale);
  assert(case65.options[3].length>40&&case65.basis[3].length>30,`${locale} housing refusal must be a viable, specific alternative`);
  assert(case65.options[2].length>40,`${locale} hosting option must retain material costs`);
}
const safety=getWisdomSituation('hw32');
assert(!safety.options.some(option=>/bypass an? (interlock|safety control)/i.test(option)), 'No alternative may endorse bypassing mandatory safety protections');
const license=getWisdomSituation('hw57');
assert(!license.options.some(option=>/use the cracked copy/i.test(option)), 'No alternative may endorse pirated software');
const report=getWisdomSituation('hw53');
assert(report.options.length===4&&report.basis.every(reason=>reason.length>=35),'Safeguarding judgment needs four serious factual defenses');
assert(localizeWisdomSituation(housing,'fr')===housing,'Unsupported locale must not change canonical answer');
console.log('Wisdom localization QA passed: 72 aligned scenes × EN/TL/CEB, 864 options with 1 benefit/2 costs, 576 localized grounds.');
