const CLASSIFICATIONS=Object.freeze({
  TEXTUAL_FACT:'TEXTUAL_FACT',
  PASSAGE_CONTEXT:'PASSAGE_CONTEXT',
  INTERPRETIVE_OR_DOCTRINAL:'INTERPRETIVE_OR_DOCTRINAL'
});
const ACTIONS=Object.freeze({ALLOW:'allow',CONTEXT:'context',NEUTRAL:'neutral',QUARANTINE:'quarantine'});

const TOPICS=Object.freeze([
  Object.freeze(['salvation',/\b(justif(?:y|ied|ication)|works of the law|eternal life|redemption|forgiveness of sins?|saved from (?:sin|wrath|condemnation))\b/i]),
  Object.freeze(['baptism',/\b(bapti[sz](?:e|ed|ing|m)|water baptism)\b/i]),
  Object.freeze(['holy-spirit',/\b(Holy Spirit|Spirit baptism|bapti[sz](?:ed|m) (?:with|in) the (?:Holy )?Spirit|filled with the (?:Holy )?Spirit|speaking in tongues|spiritual gifts?)\b/i]),
  Object.freeze(['healing',/\b(divine healing|heal(?:ed|ing)|miraculous healing)\b/i]),
  Object.freeze(['communion',/\b(Lord(?:'s|’s) Supper|communion|Eucharist|bread and cup|body and blood)\b/i]),
  Object.freeze(['sanctification',/\b(sanctif(?:y|ied|ication)|holy life)\b/i]),
  Object.freeze(['election',/\b(predestin(?:ed|ation)|elect(?:ion|ed)?|chosen before|foreknow)\b/i]),
  Object.freeze(['security',/\b(eternal security|lose salvation|fall away|apostasy|once saved)\b/i]),
  Object.freeze(['end-times',/\b(rapture|millennium|second coming|return of Christ|antichrist|mark of the beast|end times|last days)\b/i]),
  Object.freeze(['church-office',/\b(elder|pastor|bishop|deacon|women.*teach|women.*pastor|women.*elder|church authority)\b/i]),
  Object.freeze(['marriage-sexuality',/\b(marriage|divorce|remarry|adultery|sexual immorality|homosexual|same-sex)\b/i]),
  Object.freeze(['creation',/\b(six days|creation days|age of the earth|young earth|old earth)\b/i]),
  Object.freeze(['spiritual-warfare',/\b(demon|demons|demonic|spiritual warfare|possess(?:ed|ion))\b/i]),
  Object.freeze(['giving',/\b(tith(?:e|es|ing)|prosperity gospel|seed faith|financial blessing)\b/i])
]);

const HIGH_RISK_PATTERNS=Object.freeze([
  /\bwho is justified before God\b/i,
  /\bhow (?:is|are) (?:a person|someone|one|people|we|believers?|Christians?) (?:saved|justified)\b/i,
  /\bwhat (?:must|should) (?:a person|someone|people|we|believers?|Christians?) do (?:to|in order to) (?:be saved|receive eternal life|be justified|have sins forgiven)\b/i,
  /\bwhat role do .* works .* justification\b/i,
  /\bwhat is required .* salvation\b/i,
  /\bis bapti[sz]m (?:necessary|required|essential) (?:for|to) (?:salvation|be saved)\b/i,
  /\bmust .* be bapti[sz]ed .* (?:saved|salvation)\b/i,
  /\bwhat evidence .* Holy Spirit\b/i,
  /\bis speaking in tongues .* (?:evidence|required|necessary)\b/i,
  /\bmust .* speak .* tongues\b/i,
  /\bdoes God always heal\b/i,
  /\bis (?:divine )?healing guaranteed\b/i,
  /\b(?:enough|more) faith .* guarantee .* heal/i,
  /\bcan (?:a )?(?:believer|Christian|person) lose (?:his|her|their)?\s*salvation\b/i,
  /\bonce saved.*always saved\b/i,
  /\bwhen will .* rapture\b/i,
  /\b(?:pre|mid|post)[- ]?tribulation rapture\b/i,
  /\bwho can be .* pastor\b/i,
  /\bcan women (?:be|serve as) (?:pastors?|elders?|bishops?)\b/i,
  /\bis (?:same-sex|homosexual) marriage .* (?:biblical|permitted|sin)\b/i,
  /\bmust Christians? tithe\b/i,
  /\bis tithing required\b/i,
  /\bdoes giving .* guarantee .* (?:wealth|prosperity|blessing)\b/i,
  /\bhow old is the earth according to (?:the Bible|Scripture)\b/i
]);

const CONTEXT_REQUIRED_REFS=Object.freeze([
  /^Romans\s+2:/i,/^Romans\s+9:/i,/^Romans\s+11:/i,
  /^Acts\s+2:38/i,/^Acts\s+8:/i,/^Acts\s+10:/i,/^Acts\s+15:/i,/^Acts\s+16:(?:30(?:-31)?|31)/i,/^Acts\s+19:/i,/^Acts\s+22:16/i,
  /^Hebrews\s+6:/i,/^Hebrews\s+10:/i,/^James\s+2:/i,
  /^1 Corinthians\s+11:/i,/^1 Corinthians\s+12:/i,/^1 Corinthians\s+14:/i,
  /^1 Timothy\s+2:/i,/^1 Peter\s+3:21/i,/^Revelation\s+20:/i
]);

const CONTEXT_NOTES=Object.freeze({
  default:'Read this answer as a statement about the cited passage, not as a complete doctrine by itself. Check the surrounding verses and the wider teaching of Scripture before drawing a universal conclusion.',
  salvation:'Read salvation passages in the flow of the whole argument. BibleQuest does not turn one quiz answer into a complete doctrine of salvation.',
  baptism:'Keep baptism passages tied to their cited context. A passage-level recall answer is not presented as a complete doctrine of baptism or salvation.',
  'holy-spirit':'Narratives and statements about the Holy Spirit remain tied to their passage. BibleQuest does not infer a universal requirement from one event or isolated line.',
  healing:'Healing passages remain tied to their context. BibleQuest does not use a quiz answer to promise that healing is guaranteed by enough faith.',
  communion:'Lord’s Supper passages remain tied to their cited context rather than being used to settle disputed sacramental questions in quiz play.',
  sanctification:'Sanctification passages remain tied to context and are not scored as a measure of a person’s spiritual standing.',
  election:'Election and predestination passages remain close to their biblical context; ordinary quiz play does not force one disputed theological system.',
  security:'Warning and assurance passages are taught in context; isolated quiz answers do not settle disputed eternal-security questions.',
  'end-times':'Return-of-Christ passages remain tied to Scripture without turning disputed timelines into scored doctrine.',
  'church-office':'Church leadership passages remain in context and are not used to impose a local-church policy through quiz scoring.',
  'marriage-sexuality':'Marriage and sexuality passages are sensitive teaching material and require context rather than isolated slogans.',
  creation:'Creation passages are taught from the biblical text without turning disputed scientific chronology into a scored doctrine.',
  'spiritual-warfare':'Biblical accounts of spiritual conflict are taught as Scripture without turning narrative details into universal techniques.',
  giving:'Giving passages are taught without prosperity guarantees or claims that giving mechanically produces material blessing.'
});

const clean=value=>String(value??'').trim();
const unique=list=>Object.freeze([...new Set(list.filter(Boolean))]);
const freezeSafety=row=>Object.freeze({...row,topics:unique(row.topics||[])});
const fullReference=item=>{
  const raw=clean(item?.r||item?.ref||item?.reference);
  const book=clean(item?.bookName);
  return book&&raw&&!raw.toLowerCase().startsWith(book.toLowerCase())?`${book} ${raw}`:raw;
};
const contextNote=topics=>CONTEXT_NOTES[topics?.[0]]||CONTEXT_NOTES.default;

export function classifyDoctrinalContent(item={}){
  const q=clean(item.q||item.question||item.prompt),a=clean(item.a||item.answerText||item.why||item.explanation),r=fullReference(item),combined=`${q} ${a}`;
  const topics=TOPICS.filter(([,pattern])=>pattern.test(combined)).map(([name])=>name);
  if(HIGH_RISK_PATTERNS.some(pattern=>pattern.test(q)))return freezeSafety({action:ACTIONS.QUARANTINE,classification:CLASSIFICATIONS.INTERPRETIVE_OR_DOCTRINAL,topics,reason:'Question can be read as a universal or disputed doctrine claim without sufficient context.',contextNote:''});
  if(topics.length||CONTEXT_REQUIRED_REFS.some(pattern=>pattern.test(r)))return freezeSafety({action:ACTIONS.CONTEXT,classification:CLASSIFICATIONS.PASSAGE_CONTEXT,topics,reason:'Keep with explicit passage framing and a context notice.',contextNote:contextNote(topics)});
  return freezeSafety({action:ACTIONS.ALLOW,classification:CLASSIFICATIONS.TEXTUAL_FACT,topics:[],reason:'Direct factual or textual recall.',contextNote:''});
}

export function reviewAuthoredBinary(item={},options={}){
  const evaluated=classifyDoctrinalContent(item);
  if(evaluated.action===ACTIONS.QUARANTINE)throw new Error(`${options.label||'BibleQuest scored content'} is doctrinally ambiguous and cannot enter binary scoring.`);
  const forceContext=options.contextual===true&&evaluated.action===ACTIONS.ALLOW;
  return freezeSafety({...evaluated,reviewed:true,action:forceContext?ACTIONS.CONTEXT:evaluated.action,classification:forceContext?CLASSIFICATIONS.PASSAGE_CONTEXT:evaluated.classification,reason:forceContext?'Question requires passage-level interpretation rather than isolated factual recall.':evaluated.reason,contextNote:forceContext?CONTEXT_NOTES.default:evaluated.contextNote});
}

export function reviewNeutralContent(item={},options={}){
  const evaluated=classifyDoctrinalContent(item),topics=evaluated.topics||[];
  return freezeSafety({action:ACTIONS.NEUTRAL,classification:CLASSIFICATIONS.INTERPRETIVE_OR_DOCTRINAL,topics,reviewed:true,reason:options.reason||'Interpretive or applied-wisdom content is presented as reflection/assessment rather than binary doctrine.',contextNote:evaluated.contextNote||CONTEXT_NOTES.default});
}

export function reviewImportedRecall(item={}){
  const declared=clean(item?.safety?.action).toLowerCase(),evaluated=classifyDoctrinalContent(item);
  if(!['allow','context','quarantine'].includes(declared))return freezeSafety({action:ACTIONS.QUARANTINE,classification:CLASSIFICATIONS.INTERPRETIVE_OR_DOCTRINAL,topics:evaluated.topics,reviewed:true,reason:'Imported question is missing a recognized safety action; fail closed.',contextNote:''});
  if(declared==='quarantine'||evaluated.action===ACTIONS.QUARANTINE)return freezeSafety({...evaluated,action:ACTIONS.QUARANTINE,reviewed:true,reason:declared==='quarantine'?'Imported source marks this question quarantined.':evaluated.reason,contextNote:''});
  if(declared==='context'||evaluated.action===ACTIONS.CONTEXT)return freezeSafety({...evaluated,action:ACTIONS.CONTEXT,classification:CLASSIFICATIONS.PASSAGE_CONTEXT,topics:[...(item?.safety?.topics||[]),...evaluated.topics],reviewed:true,reason:'Imported question requires explicit passage context.',contextNote:contextNote([...(item?.safety?.topics||[]),...evaluated.topics])});
  return freezeSafety({...evaluated,action:ACTIONS.ALLOW,classification:CLASSIFICATIONS.TEXTUAL_FACT,topics:[],reviewed:true,contextNote:''});
}

export function assertBinaryScorable(item={},label='BibleQuest scored content'){
  const safety=item?.safety;
  if(!safety||safety.reviewed!==true||![ACTIONS.ALLOW,ACTIONS.CONTEXT].includes(safety.action)||![CLASSIFICATIONS.TEXTUAL_FACT,CLASSIFICATIONS.PASSAGE_CONTEXT].includes(safety.classification))throw new Error(`${label} has not passed doctrinal-safety review.`);
  if(!fullReference(item))throw new Error(`${label} requires an explicit Scripture reference before binary scoring.`);
  if(safety.action===ACTIONS.CONTEXT&&!clean(safety.contextNote))throw new Error(`${label} requires a context notice.`);
  return safety;
}

export function assertNeutralAssessment(item={},label='BibleQuest interpretive content'){
  const safety=item?.safety;
  if(!safety||safety.reviewed!==true||safety.action!==ACTIONS.NEUTRAL||safety.classification!==CLASSIFICATIONS.INTERPRETIVE_OR_DOCTRINAL)throw new Error(`${label} must remain a reviewed neutral assessment.`);
  return safety;
}

export const DOCTRINAL_SAFETY=Object.freeze({
  version:3,
  authority:'Scripture first; secondary study resources are not doctrinal authorities.',
  classifications:CLASSIFICATIONS,
  actions:ACTIONS,
  contextNotes:CONTEXT_NOTES
});
