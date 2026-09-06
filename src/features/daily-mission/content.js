export const DAILY_PASSAGES = Object.freeze([
  Object.freeze({ book:'John', code:'JHN', chapter:15, from:1, to:12, title:'Remain in Christ', prompt:'What does Jesus connect with lasting fruit?', retrieve:Object.freeze({ q:'In John 15, what picture does Jesus use for Himself?', choices:Object.freeze(['The true vine','The city gate','The mustard seed','The lampstand']), answer:0, ref:'John 15:1', why:'Jesus says, “I am the true vine,” and describes His Father as the vinedresser.' }) }),
  Object.freeze({ book:'Matthew', code:'MAT', chapter:5, from:1, to:16, title:'Kingdom Character', prompt:'Which teaching challenges the way you normally respond?', retrieve:Object.freeze({ q:'In Matthew 5:13, what does Jesus call His disciples?', choices:Object.freeze(['Salt of the earth','Kings of the earth','Judges of Israel','Builders of the temple']), answer:0, ref:'Matthew 5:13', why:'Jesus calls His disciples the salt of the earth before also describing them as light.' }) }),
  Object.freeze({ book:'Luke', code:'LUK', chapter:10, from:25, to:37, title:'Love Your Neighbor', prompt:'Who is easy for you to overlook?', retrieve:Object.freeze({ q:'Who stopped and cared for the wounded man in Jesus’ story?', choices:Object.freeze(['A Samaritan','A priest','A Levite','A Roman centurion']), answer:0, ref:'Luke 10:33–35', why:'The Samaritan had compassion, treated the man’s wounds, and arranged continued care.' }) }),
  Object.freeze({ book:'Philippians', code:'PHP', chapter:2, from:1, to:11, title:'The Mind of Christ', prompt:'What does humility look like in one real situation today?', retrieve:Object.freeze({ q:'According to Philippians 2, whose mindset are believers told to have?', choices:Object.freeze(['Christ Jesus','Caesar','Moses alone','The philosophers']), answer:0, ref:'Philippians 2:5', why:'Paul tells believers to have the same mindset that was in Christ Jesus.' }) }),
  Object.freeze({ book:'James', code:'JAS', chapter:1, from:19, to:27, title:'Hear and Do', prompt:'Where do you need to move from hearing to doing?', retrieve:Object.freeze({ q:'James says believers should be doers of what?', choices:Object.freeze(['The word','Their own plans','Public opinion','Signs and wonders']), answer:0, ref:'James 1:22', why:'James warns against hearing the word without putting it into practice.' }) }),
  Object.freeze({ book:'Romans', code:'ROM', chapter:12, from:1, to:21, title:'A Living Sacrifice', prompt:'What practical act of love can you do today?', retrieve:Object.freeze({ q:'Romans 12:1 urges believers to present their bodies as what?', choices:Object.freeze(['A living sacrifice','A public monument','A royal offering','A hidden treasure']), answer:0, ref:'Romans 12:1', why:'Paul appeals to believers to present their bodies as a living, holy sacrifice acceptable to God.' }) }),
  Object.freeze({ book:'Psalms', code:'PSA', chapter:23, from:1, to:6, title:'The Shepherd', prompt:'Which line speaks most directly to your present situation?', retrieve:Object.freeze({ q:'Psalm 23 begins, “The LORD is my…” what?', choices:Object.freeze(['Shepherd','Judge','Teacher','Messenger']), answer:0, ref:'Psalm 23:1', why:'Psalm 23 opens with the confession that the LORD is the psalmist’s shepherd.' }) }),
  Object.freeze({ book:'Proverbs', code:'PRO', chapter:3, from:1, to:12, title:'Trust the Lord', prompt:'What are you tempted to lean on instead of God?', retrieve:Object.freeze({ q:'Proverbs 3:5 says not to lean on what?', choices:Object.freeze(['Your own understanding','Your neighbor','Your work','Your possessions']), answer:0, ref:'Proverbs 3:5', why:'The passage says to trust in the LORD with all your heart and not lean on your own understanding.' }) }),
  Object.freeze({ book:'1 Corinthians', code:'1CO', chapter:13, from:1, to:13, title:'The Way of Love', prompt:'Which description of love is hardest to practice?', retrieve:Object.freeze({ q:'At the end of 1 Corinthians 13, which is called the greatest?', choices:Object.freeze(['Love','Faith','Hope','Knowledge']), answer:0, ref:'1 Corinthians 13:13', why:'Faith, hope, and love remain, and Paul says the greatest of these is love.' }) }),
  Object.freeze({ book:'Galatians', code:'GAL', chapter:5, from:13, to:26, title:'Walk by the Spirit', prompt:'Which fruit of the Spirit needs deliberate practice today?', retrieve:Object.freeze({ q:'Which of these is named as fruit of the Spirit in Galatians 5?', choices:Object.freeze(['Self-control','Pride','Jealousy','Rivalry']), answer:0, ref:'Galatians 5:22–23', why:'The fruit of the Spirit includes love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.' }) })
]);

function serialFor(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
  if (!match) throw new Error('Daily Journey requires a YYYY-MM-DD civil date.');
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const stamp = Date.UTC(year, month - 1, day);
  const check = new Date(stamp);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new Error('Daily Journey civil date is invalid.');
  return Math.floor(stamp / 86400000);
}

export function selectDailyPassage(dateKey) {
  const serial = serialFor(dateKey);
  const index = ((serial % DAILY_PASSAGES.length) + DAILY_PASSAGES.length) % DAILY_PASSAGES.length;
  return DAILY_PASSAGES[index];
}

export function buildDailyMissionDefinition(dateKey) {
  const passage = selectDailyPassage(dateKey);
  const reference = `${passage.book} ${passage.chapter}:${passage.from}–${passage.to}`;
  return Object.freeze({
    id: `daily-mission:${dateKey}`,
    version: 1,
    title: `Daily Journey · ${passage.title}`,
    steps: Object.freeze([
      Object.freeze({ id:'retrieve', type:'choice', prompt:passage.retrieve.q, choices:passage.retrieve.choices, answer:passage.retrieve.answer, reference:passage.retrieve.ref, feedback:Object.freeze({ correct:passage.retrieve.why, incorrect:passage.retrieve.why }) }),
      Object.freeze({ id:'context', type:'confirm', prompt:`Read ${reference} in the Bible Reader. Notice who is speaking, who is listening, and what comes before and after the key lines.`, reference, feedback:Object.freeze({ response:'Passage reading confirmed.' }) }),
      Object.freeze({ id:'learn', type:'confirm', prompt:passage.prompt, reference, feedback:Object.freeze({ response:'Connection reviewed.' }) }),
      Object.freeze({ id:'apply', type:'text', prompt:'Write one concrete action you can take today because of this passage.', reference, maxLength:1200, feedback:Object.freeze({ response:'Action saved.' }) }),
      Object.freeze({ id:'reflect', type:'text', prompt:'Write one sentence you want to remember from today’s journey.', reference, maxLength:1200, feedback:Object.freeze({ response:'Reflection saved.' }) })
    ])
  });
}
