const step=(label,code='',chapter=0)=>Object.freeze({label,code,chapter:Number(chapter)||0});

export const PERSONAL_CHALLENGE_TEMPLATES=Object.freeze([
  Object.freeze({
    key:'gospel7',title:'7-Day Gospel Challenge',type:'reading',days:7,
    desc:'One Gospel-focused reading and reflection each day.',
    steps:Object.freeze([step('Mark 1','MRK',1),step('Mark 2','MRK',2),step('Mark 4','MRK',4),step('Mark 5','MRK',5),step('Mark 8','MRK',8),step('Mark 10','MRK',10),step('Mark 15–16','MRK',15)])
  }),
  Object.freeze({
    key:'proverbs30',title:'30-Day Proverbs Challenge',type:'wisdom',days:30,
    desc:'A chapter of Proverbs most days, with one practical wisdom takeaway.',
    steps:Object.freeze(Array.from({length:30},(_,i)=>step('Proverbs '+(i+1),'PRO',i+1)))
  }),
  Object.freeze({
    key:'acts28',title:'Acts Month',type:'reading',days:28,
    desc:'Walk through the growth, conflicts, mission, and expansion of the early church.',
    steps:Object.freeze(Array.from({length:28},(_,i)=>step('Acts '+(i+1),'ACT',i+1)))
  }),
  Object.freeze({
    key:'couples7',title:'Couples Week',type:'couples',days:7,
    desc:'Seven short Christ-centered conversations and listening practices.',
    steps:Object.freeze(['Gratitude','Listen First','Prayer','Repair','Dreams','Service','Us & God'].map(label=>step(label)))
  }),
  Object.freeze({
    key:'family7',title:'Family Bible Night Week',type:'group',days:7,
    desc:'Seven simple family prompts mixing reading, discussion, and prayer.',
    steps:Object.freeze(['Creation','Courage','Wisdom','Kindness','Forgiveness','Service','Hope'].map(label=>step(label)))
  }),
  Object.freeze({
    key:'john21',title:'21 Days in John',type:'reading',days:21,
    desc:'Read one chapter of John each day and note what it shows about Jesus.',
    steps:Object.freeze(Array.from({length:21},(_,i)=>step('John '+(i+1),'JHN',i+1)))
  }),
  Object.freeze({
    key:'psalms14',title:'14 Days of Psalms',type:'prayer',days:14,
    desc:'Read, pray, and carry one line from a Psalm into the day.',
    steps:Object.freeze([1,8,16,23,27,34,46,63,84,91,103,121,130,139].map(chapter=>step('Psalm '+chapter,'PSA',chapter)))
  }),
  Object.freeze({
    key:'james5',title:'5 Days in James',type:'wisdom',days:5,
    desc:'Read one chapter each day and choose one concrete act of obedience.',
    steps:Object.freeze(Array.from({length:5},(_,i)=>step('James '+(i+1),'JAS',i+1)))
  }),
  Object.freeze({
    key:'prayer7',title:'7-Day Prayer Practice',type:'prayer',days:7,
    desc:'Build a simple Scripture-shaped prayer rhythm without chasing a score.',
    steps:Object.freeze(['Praise','Confession','Thanks','Needs','Others','Listen & Read','Review & Continue'].map(label=>step(label)))
  }),
  Object.freeze({
    key:'serve7',title:'7 Days of Quiet Service',type:'service',days:7,
    desc:'Practice one small act of Christlike service each day without needing recognition.',
    steps:Object.freeze(['Notice a need','Encourage someone','Help at home','Give time','Listen well','Serve your church/community','Reflect & continue'].map(label=>step(label)))
  })
]);

export const PERSONAL_CHALLENGE_TEMPLATE_BY_KEY=Object.freeze(Object.fromEntries(PERSONAL_CHALLENGE_TEMPLATES.map(template=>[template.key,template])));
