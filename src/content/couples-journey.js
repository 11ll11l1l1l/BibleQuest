export const COUPLES_JOURNEY_SCALE=Object.freeze([
  Object.freeze({value:1,label:'Rarely / never'}),
  Object.freeze({value:2,label:'Seldom'}),
  Object.freeze({value:3,label:'Sometimes'}),
  Object.freeze({value:4,label:'Often'}),
  Object.freeze({value:5,label:'Almost always'})
]);

export const COUPLES_JOURNEY_DOMAINS=Object.freeze([
  Object.freeze({id:'listening',label:'Listening & understanding'}),
  Object.freeze({id:'repair',label:'Repair & respect'}),
  Object.freeze({id:'connection',label:'Connection & teamwork'}),
  Object.freeze({id:'safety',label:'Faith, boundaries & safety'})
]);

export const COUPLES_JOURNEY_ITEMS=Object.freeze([
  {id:'heard',domain:'listening',label:'Kapag nagsasalita ako, nararamdaman kong pinapakinggan ako bago sumagot ang asawa ko.'},
  {id:'curiosity',domain:'listening',label:'Kaya naming magtanong para umintindi bago agad mag-defend o magbigay ng solution.'},
  {id:'honesty',domain:'listening',label:'Safe akong magsabi ng concern, need, o disappointment nang hindi ko kailangang hulaan ang “tamang” sagot.'},
  {id:'repair',domain:'repair',label:'Kapag may conflict, bumabalik kami para mag-repair kaysa iwasan lang ang issue nang matagal.'},
  {id:'respect',domain:'repair',label:'Kahit disagree, iniiwasan namin ang insulto, contempt, panlalait, at character attack.'},
  {id:'pause',domain:'repair',label:'Kapag kailangan ng pause, kaya naming huminto at bumalik sa usapan sa malinaw na oras.'},
  {id:'team',domain:'connection',label:'Pakiramdam ko magkakampi kami sa decisions, responsibilities, at problems.'},
  {id:'warmth',domain:'connection',label:'May regular warmth, affection, friendship, o lightness sa ordinary days namin.'},
  {id:'appreciation',domain:'connection',label:'Napapansin at nasasabi namin ang appreciation sa effort ng isa’t isa.'},
  {id:'faithGrace',domain:'safety',label:'Ginagamit namin ang faith at Scripture para lumago at magbigay ng grace, hindi para manalo sa argument.'},
  {id:'boundaries',domain:'safety',label:'Nirerespeto namin ang malinaw na personal boundaries at “no” ng isa’t isa.'},
  {id:'safety',domain:'safety',label:'Hindi ako natatakot sa reaction ng asawa ko dahil sa threats, coercion, stalking, violence, o punishment.'}
].map(item=>Object.freeze(item)));

export const COUPLES_JOURNEY_LEVELS=Object.freeze([
  {id:'growing-together',rank:1,label:'Growing Together',min:52,max:60,summary:'Communication is generally warm, respectful, repair-oriented, and collaborative.',next:'Keep strengthening what already works with gratitude, listening, and shared practices.'},
  {id:'mostly-connected',rank:2,label:'Mostly Connected',min:43,max:51,summary:'You have a solid base with some recurring communication gaps worth practicing deliberately.',next:'Choose one recurring gap and practice listening before problem-solving.'},
  {id:'mixed-signals',rank:3,label:'Mixed Signals',min:34,max:42,summary:'Connection and strain alternate. Slowing the conversation down can make understanding easier.',next:'Use Listen First and discuss one issue at a time before moving into solutions.'},
  {id:'strained-connection',rank:4,label:'Strained Connection',min:25,max:33,summary:'Misunderstanding or unresolved conflict may be happening often enough that repair needs more structure.',next:'Prioritize respectful pauses, accurate mirroring, and one observable repair step.'},
  {id:'rebuild-carefully',rank:5,label:'Rebuild Carefully',min:12,max:24,summary:'Communication may be frequently disconnected or reactive. Small safe habits matter more than solving everything at once.',next:'Start with safety, respect, and one small listening or repair behavior at a time.'}
].map(item=>Object.freeze(item)));

export const COUPLES_JOURNEY_SAFETY_ITEM_ID='safety';
