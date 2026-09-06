window.BQ2_DATA = (() => {
  const books = [
    ['Genesis','GEN',50],['Exodus','EXO',40],['Leviticus','LEV',27],['Numbers','NUM',36],['Deuteronomy','DEU',34],
    ['Joshua','JOS',24],['Judges','JDG',21],['Ruth','RUT',4],['1 Samuel','1SA',31],['2 Samuel','2SA',24],['1 Kings','1KI',22],['2 Kings','2KI',25],['1 Chronicles','1CH',29],['2 Chronicles','2CH',36],['Ezra','EZR',10],['Nehemiah','NEH',13],['Esther','EST',10],
    ['Job','JOB',42],['Psalms','PSA',150],['Proverbs','PRO',31],['Ecclesiastes','ECC',12],['Song of Songs','SNG',8],
    ['Isaiah','ISA',66],['Jeremiah','JER',52],['Lamentations','LAM',5],['Ezekiel','EZK',48],['Daniel','DAN',12],['Hosea','HOS',14],['Joel','JOL',3],['Amos','AMO',9],['Obadiah','OBA',1],['Jonah','JON',4],['Micah','MIC',7],['Nahum','NAM',3],['Habakkuk','HAB',3],['Zephaniah','ZEP',3],['Haggai','HAG',2],['Zechariah','ZEC',14],['Malachi','MAL',4],
    ['Matthew','MAT',28],['Mark','MRK',16],['Luke','LUK',24],['John','JHN',21],['Acts','ACT',28],['Romans','ROM',16],['1 Corinthians','1CO',16],['2 Corinthians','2CO',13],['Galatians','GAL',6],['Ephesians','EPH',6],['Philippians','PHP',4],['Colossians','COL',4],['1 Thessalonians','1TH',5],['2 Thessalonians','2TH',3],['1 Timothy','1TI',6],['2 Timothy','2TI',4],['Titus','TIT',3],['Philemon','PHM',1],['Hebrews','HEB',13],['James','JAS',5],['1 Peter','1PE',5],['2 Peter','2PE',3],['1 John','1JN',5],['2 John','2JN',1],['3 John','3JN',1],['Jude','JUD',1],['Revelation','REV',22]
  ].map(([name,code,chapters],i)=>({name,code,chapters,index:i}));

  const world = [
    {id:'creation',name:'Creation',icon:'✦',xp:0,books:['Genesis']},
    {id:'patriarchs',name:'Patriarchs',icon:'⛺',xp:80,books:['Genesis','Job']},
    {id:'exodus',name:'Exodus',icon:'🌊',xp:180,books:['Exodus','Leviticus','Numbers','Deuteronomy']},
    {id:'kingdom',name:'Kingdom',icon:'♛',xp:320,books:['Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles']},
    {id:'wisdom',name:'Wisdom',icon:'📜',xp:500,books:['Psalms','Proverbs','Ecclesiastes','Song of Songs']},
    {id:'prophets',name:'Prophets',icon:'🔥',xp:700,books:['Isaiah','Jeremiah','Ezekiel','Daniel','Hosea','Joel','Amos','Micah']},
    {id:'jesus',name:'Jesus',icon:'✝',xp:950,books:['Matthew','Mark','Luke','John']},
    {id:'church',name:'Early Church',icon:'🕊',xp:1250,books:['Acts']},
    {id:'letters',name:'Letters',icon:'✉',xp:1600,books:['Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','James','1 Peter','1 John','Revelation']}
  ];

  const dailyPassages = [
    {book:'John',code:'JHN',chapter:15,from:1,to:12,title:'Remain in Christ',prompt:'What does Jesus connect with lasting fruit?'},
    {book:'Matthew',code:'MAT',chapter:5,from:1,to:16,title:'Kingdom Character',prompt:'Which teaching challenges the way you normally respond?'},
    {book:'Luke',code:'LUK',chapter:10,from:25,to:37,title:'Love Your Neighbor',prompt:'Who is easy for you to overlook?'},
    {book:'Philippians',code:'PHP',chapter:2,from:1,to:11,title:'The Mind of Christ',prompt:'What does humility look like in one real situation today?'},
    {book:'James',code:'JAS',chapter:1,from:19,to:27,title:'Hear and Do',prompt:'Where do you need to move from hearing to doing?'},
    {book:'Romans',code:'ROM',chapter:12,from:1,to:21,title:'A Living Sacrifice',prompt:'What practical act of love can you do today?'},
    {book:'Psalms',code:'PSA',chapter:23,from:1,to:6,title:'The Shepherd',prompt:'Which line speaks most directly to your present situation?'},
    {book:'Proverbs',code:'PRO',chapter:3,from:1,to:12,title:'Trust the Lord',prompt:'What are you tempted to lean on instead of God?'},
    {book:'1 Corinthians',code:'1CO',chapter:13,from:1,to:13,title:'The Way of Love',prompt:'Which description of love is hardest to practice?'},
    {book:'Galatians',code:'GAL',chapter:5,from:13,to:26,title:'Walk by the Spirit',prompt:'Which fruit of the Spirit needs deliberate practice today?'}
  ];

  const transformItems = [
    {id:'word',dimension:'Scripture',text:'I regularly read Scripture carefully enough to understand context, not only isolated verses.'},
    {id:'prayer',dimension:'Prayer',text:'Prayer is a real part of how I make decisions, confess, give thanks, and seek God.'},
    {id:'obedience',dimension:'Obedience',text:'When Scripture clearly confronts my behavior, I make concrete changes instead of only agreeing with it.'},
    {id:'love',dimension:'Love',text:'People close to me can see patience, kindness, forgiveness, and practical care in my behavior.'},
    {id:'service',dimension:'Service',text:'I use time, ability, or resources to serve others without needing recognition.'},
    {id:'community',dimension:'Community',text:'I am meaningfully connected to other believers who can encourage and correct me.'},
    {id:'integrity',dimension:'Integrity',text:'My private choices are broadly consistent with the faith I present publicly.'},
    {id:'witness',dimension:'Witness',text:'I can speak naturally about Christ and the gospel when an appropriate opportunity appears.'},
    {id:'wisdom',dimension:'Wisdom',text:'I slow down enough to seek biblical wisdom before reacting to difficult situations.'},
    {id:'stewardship',dimension:'Stewardship',text:'I treat money, work, body, time, and responsibilities as things entrusted to me by God.'},
    {id:'repentance',dimension:'Repentance',text:'I can admit wrong without protecting my pride, then seek forgiveness and correction.'},
    {id:'perseverance',dimension:'Perseverance',text:'When faith becomes difficult or costly, I continue rather than disengage.'}
  ];

  const transformGuides = {
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
  };

  const quickActions = [
    {id:'reader',label:'Read the Bible',sub:'Full local Bible packs',route:'#/reader'},
    {id:'quiz',label:'Bible Quiz',sub:'Recall + context questions',route:'#/games'},
    {id:'world',label:'Bible World',sub:'See your journey',route:'#/world'},
    {id:'transform',label:'Transformation',sub:'Reflect and choose a next step',route:'#/transform'},
    {id:'together',label:'Play Together',sub:'Pass-and-play group quiz',route:'#/together'},
    {id:'kids',label:'Kids Games',sub:'Learning games for younger children',route:'#/kids'}
  ];

  return {books,world,dailyPassages,transformItems,transformGuides,quickActions};
})();
