export const SPIRITUAL_ITEMS = Object.freeze([
  Object.freeze({ id:'word', dimension:'Scripture', text:'I regularly read Scripture carefully enough to understand context, not only isolated verses.' }),
  Object.freeze({ id:'prayer', dimension:'Prayer', text:'Prayer is a real part of how I make decisions, confess, give thanks, and seek God.' }),
  Object.freeze({ id:'obedience', dimension:'Obedience', text:'When Scripture clearly confronts my behavior, I make concrete changes instead of only agreeing with it.' }),
  Object.freeze({ id:'love', dimension:'Love', text:'People close to me can see patience, kindness, forgiveness, and practical care in my behavior.' }),
  Object.freeze({ id:'service', dimension:'Service', text:'I use time, ability, or resources to serve others without needing recognition.' }),
  Object.freeze({ id:'community', dimension:'Community', text:'I am meaningfully connected to other believers who can encourage and correct me.' }),
  Object.freeze({ id:'integrity', dimension:'Integrity', text:'My private choices are broadly consistent with the faith I present publicly.' }),
  Object.freeze({ id:'witness', dimension:'Witness', text:'I can speak naturally about Christ and the gospel when an appropriate opportunity appears.' }),
  Object.freeze({ id:'wisdom', dimension:'Wisdom', text:'I slow down enough to seek biblical wisdom before reacting to difficult situations.' }),
  Object.freeze({ id:'stewardship', dimension:'Stewardship', text:'I treat money, work, body, time, and responsibilities as things entrusted to me by God.' }),
  Object.freeze({ id:'repentance', dimension:'Repentance', text:'I can admit wrong without protecting my pride, then seek forgiveness and correction.' }),
  Object.freeze({ id:'perseverance', dimension:'Perseverance', text:'When faith becomes difficult or costly, I continue rather than disengage.' })
]);

export const SPIRITUAL_GUIDES = Object.freeze({
  Scripture:'Read one complete paragraph or chapter daily and write one sentence about its context before application.',
  Prayer:'Use a simple pattern: praise, confession, thanks, requests, then one minute of quiet attention.',
  Obedience:'Choose one clear instruction from today’s passage and turn it into an action that can be completed within 24 hours.',
  Love:'Identify one person who needs patience, help, forgiveness, or attention and take one concrete step.',
  Service:'Do one useful act this week that benefits someone else and cannot easily be repaid.',
  Community:'Speak with a mature believer this week about one real struggle or decision instead of keeping faith private.',
  Integrity:'Name one private habit that conflicts with your convictions and add one practical boundary.',
  Witness:'Prepare a two-minute explanation of what you believe about Jesus and why it matters to you.',
  Wisdom:'Before one difficult choice, write the facts, relevant biblical principles, likely consequences, and counsel you should seek.',
  Stewardship:'Review one area—money, time, health, work, family—and choose one measurable improvement for this week.',
  Repentance:'When you recognize wrong, name it specifically, ask forgiveness without excuses, and repair what can be repaired.',
  Perseverance:'Choose a small faithful practice you will continue for seven days even when motivation is low.'
});

export const PERSONALITY_FACTORS = Object.freeze({
  E:Object.freeze({ name:'Extraversion', low:'You tend to recharge inwardly and may prefer depth over frequent social stimulation.', high:'You tend to gain energy from interaction and may initiate readily.', lowPractice:'Choose one intentional conversation instead of waiting for the perfect moment.', highPractice:'Practice listening long enough to understand before taking the lead.' }),
  A:Object.freeze({ name:'Agreeableness', low:'You may be direct, questioning, and comfortable challenging ideas.', high:'You may be compassionate, cooperative, and strongly attentive to harmony.', lowPractice:'Ask one curious question before stating your disagreement.', highPractice:'Pair kindness with a clear boundary when something needs to be addressed.' }),
  C:Object.freeze({ name:'Conscientiousness', low:'You may prefer flexibility and can resist rigid structure.', high:'You may naturally plan, organize, and persist toward goals.', lowPractice:'Define one small next action and a time to do it.', highPractice:'Leave room for grace, people, and changing circumstances instead of over-controlling the plan.' }),
  S:Object.freeze({ name:'Emotional Stability', low:'Stress and uncertainty may affect you quickly or intensely.', high:'You may stay relatively even-tempered under pressure.', lowPractice:'Name the emotion, pause, pray, then decide after the first wave passes.', highPractice:'Notice when other people need reassurance even if the situation feels manageable to you.' }),
  O:Object.freeze({ name:'Openness / Intellect', low:'You may prefer concrete, familiar, and practical approaches.', high:'You may enjoy ideas, imagination, reflection, and complexity.', lowPractice:'Explore one unfamiliar viewpoint or passage context before deciding.', highPractice:'Turn one idea into one concrete act of obedience instead of collecting more ideas.' })
});

export const PERSONALITY_ITEMS = Object.freeze([
  ['E1','E','I am the life of the party.',1],['A1','A','I sympathize with other people’s feelings.',1],['C1','C','I am always prepared.',1],['S1','S','I am relaxed most of the time.',1],['O1','O','I have a vivid imagination.',1],
  ['E2','E','I do not talk a lot.',-1],['A2','A','I sometimes insult people.',-1],['C2','C','I leave my belongings around.',-1],['S2','S','I get stressed out easily.',-1],['O2','O','I have difficulty understanding abstract ideas.',-1],
  ['E3','E','I feel comfortable around people.',1],['A3','A','I have a soft heart.',1],['C3','C','I pay attention to details.',1],['S3','S','I seldom feel blue.',1],['O3','O','I have excellent ideas.',1],
  ['E4','E','I keep in the background.',-1],['A4','A','I feel little concern for others.',-1],['C4','C','I make a mess of things.',-1],['S4','S','I worry about things.',-1],['O4','O','I am not interested in abstract ideas.',-1]
].map(([id,factor,text,key]) => Object.freeze({ id, factor, text, key })));

export const BIAS_TASKS = Object.freeze([
  Object.freeze({ id:'sunk', title:'Past cost vs. future value', scenario:'You paid for a course that is clearly not useful. Finishing it would consume time needed for an important responsibility. What should matter most now?', options:Object.freeze(['Finish mainly because the money was already spent.','Compare the future cost and benefit from today forward.','Continue mainly because stopping would feel embarrassing.']), best:1, signal:'Sunk-cost thinking', practice:'When a past cost cannot be recovered, ask: “If I had not already paid or invested, what would I choose now?”' }),
  Object.freeze({ id:'base', title:'Use the base rate', scenario:'A rare defect affects about 1 in 100 devices. A scanner catches most defects but also creates false alarms. Your device is flagged. What is the best first response?', options:Object.freeze(['Assume the scanner means the device is almost certainly defective.','Combine the scanner result with how rare the defect is before concluding.','Ignore the scanner because false alarms exist.']), best:1, signal:'Base-rate neglect', practice:'Before reacting to a dramatic signal, ask how common the event was before the new evidence appeared.' }),
  Object.freeze({ id:'confirm', title:'Challenge your own belief', scenario:'Your group believes a new Bible-study format improves retention. Which check is most useful?', options:Object.freeze(['Ask people who already love it for testimonials.','Compare later recall and actively look for cases where the format did not help.','Collect more positive comments about how engaging it feels.']), best:1, signal:'Confirmation bias', practice:'Write one piece of evidence that would change your mind before you search for more support.' }),
  Object.freeze({ id:'outcome', title:'Process vs. outcome', scenario:'Two leaders use the same careful process. One gets unlucky and the result is bad; the other gets lucky and the result is good. How should decision quality be judged?', options:Object.freeze(['Mostly by the final outcome.','Mostly by the process and information available at the time.','The leader with the good result necessarily made the better decision.']), best:1, signal:'Outcome bias', practice:'Review whether the process was sound before using the final result as proof that the decision was wise or foolish.' }),
  Object.freeze({ id:'frame', title:'Reframe the choice', scenario:'A choice sounds attractive when described as “90% success.” What is the most useful check?', options:Object.freeze(['Accept the positive framing because 90% sounds strong.','Also restate it as “10% failure” and see whether your judgment changes.','Ignore percentages and go with intuition.']), best:1, signal:'Framing effect', practice:'Restate important choices in both gain and loss language before deciding.' })
]);
