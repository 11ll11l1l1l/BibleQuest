const rows = [
  ['s1','David & Goliath','🪨','1 Samuel 17','1SA',17,[
    'Israel and the Philistines faced one another across the valley. A warrior named Goliath challenged Israel.',
    'David arrived while bringing supplies to his brothers and heard Goliath’s challenge.',
    'David remembered how God had delivered him while protecting his flock and offered to face Goliath.',
    'David went without Saul’s armor, taking his staff, sling, and stones.',
    'David struck Goliath with a stone from his sling, and Israel’s fear turned into pursuit.'
  ],'What best explains David’s confidence before the fight?',['His armor','His trust in God’s previous deliverance','His height','His military rank'],1,'1 Samuel 17:34–47'],
  ['s2','The Good Samaritan','🫶','Luke 10:25–37','LUK',10,[
    'An expert in the law asked Jesus what he must do to inherit eternal life.',
    'The discussion turned to the command to love God and love one’s neighbor.',
    'When the man asked, “Who is my neighbor?” Jesus told a story about an injured traveler.',
    'A priest and a Levite passed by, but a Samaritan stopped and cared for the man.',
    'Jesus ended by asking which person had acted as a neighbor.'
  ],'What was Jesus pressing the listener to do?',['Define fewer people as neighbors','Show mercy like the Samaritan','Avoid dangerous roads','Become an innkeeper'],1,'Luke 10:36–37'],
  ['s3','Daniel’s Choice','🦁','Daniel 6','DAN',6,[
    'Daniel had gained a reputation for faithful service in the kingdom.',
    'Officials who wanted to accuse him could not find ordinary corruption, so they targeted his religious practice.',
    'A decree was arranged that made prayer to anyone except the king illegal for a period of time.',
    'Daniel continued his regular prayers to God and was reported.',
    'He was placed in the lions’ den, but the story reports that God preserved him.'
  ],'What changed in Daniel’s prayer practice after the decree?',['He stopped completely','He prayed only in secret at night','He continued his regular practice','He prayed only to the king'],2,'Daniel 6:10'],
  ['s4','Joseph Chooses Integrity','🌾','Genesis 39','GEN',39,[
    'Joseph served in Potiphar’s household and was entrusted with substantial responsibility.',
    'Potiphar’s wife repeatedly pressured Joseph to sleep with her.',
    'Joseph refused, explaining both his responsibility to Potiphar and his unwillingness to sin against God.',
    'When she grabbed his garment, Joseph fled and left it behind.',
    'Joseph was falsely accused and imprisoned even though he had refused the wrongdoing.'
  ],'What makes Joseph’s decision especially difficult?',['He knew obedience guaranteed immediate reward','Integrity exposed him to serious personal cost','He had no responsibility in the household','He was free to leave Egypt whenever he wanted'],1,'Genesis 39:7–20'],
  ['s5','Ruth Stays','🌾','Ruth 1–4','RUT',1,[
    'Naomi urged Ruth and Orpah to return to their own families after the deaths of their husbands.',
    'Ruth chose to remain with Naomi and travel to Bethlehem.',
    'Ruth gathered leftover grain in the fields to provide food.',
    'Boaz noticed Ruth’s loyalty and treated her with protection and generosity.',
    'The story eventually places Ruth within the family line of David.'
  ],'Which theme is most visible in Ruth’s early choices?',['Avoiding all risk','Loyal commitment expressed through practical action','Seeking political authority','Demanding immediate repayment'],1,'Ruth 1:16–18; 2:2–12'],
  ['s6','Elijah on Mount Carmel','🔥','1 Kings 18','1KI',18,[
    'Israel was divided in worship during the reign of Ahab.',
    'Elijah challenged the prophets of Baal before the people.',
    'The prophets of Baal called out for hours without an answer.',
    'Elijah repaired the altar, prepared the sacrifice, and prayed.',
    'The account says fire consumed the offering, and the people responded by acknowledging the LORD.'
  ],'What was the public confrontation meant to expose?',['Which prophet could speak longest','The divided loyalty of the people','Whether rain was scientifically possible','Who controlled the royal army'],1,'1 Kings 18:20–39'],
  ['s7','Esther Risks the Audience','👑','Esther 4–7','EST',4,[
    'Mordecai informed Esther of the danger facing the Jewish people.',
    'Esther explained that approaching the king without being summoned could lead to death.',
    'She asked the community to fast and then chose to approach the king.',
    'Rather than blurting out the accusation immediately, Esther used banquets and timing before naming Haman’s plot.',
    'The king acted after Esther identified the threat.'
  ],'What combination appears in Esther’s response?',['Courage without planning','Planning without risk','Courage joined with timing and preparation','Avoiding involvement until others solved it'],2,'Esther 4:10–16; 5:1–8; 7:1–6'],
  ['s8','Peter Learns About Outsiders','🌍','Acts 10','ACT',10,[
    'Cornelius, a Gentile centurion, received instructions to send for Peter.',
    'Peter received a vision that challenged his assumptions about what was clean and unclean.',
    'Peter entered Cornelius’s household and acknowledged that God had shown him not to call a person impure or unclean.',
    'Peter preached about Jesus to those gathered.',
    'The Holy Spirit came upon the Gentile listeners, surprising the Jewish believers who had come with Peter.'
  ],'What major assumption is challenged in the chapter?',['That Peter should stop preaching','That God’s work was limited by ethnic boundary assumptions','That Cornelius was already an apostle','That Jerusalem no longer mattered'],1,'Acts 10:28,34–48'],
  ['s9','Paul and Silas in Philippi','⛓️','Acts 16','ACT',16,[
    'Paul and Silas were beaten and imprisoned after conflict in Philippi.',
    'At midnight they were praying and singing while other prisoners listened.',
    'An earthquake opened the doors and loosened the chains.',
    'The jailer feared the prisoners had escaped, but Paul called out that they were still there.',
    'The jailer then asked what he must do to be saved, and the household heard the message about the Lord.'
  ],'Which action most directly protects the jailer from a disastrous assumption?',['The earthquake','Paul calling out that the prisoners remained','The earlier public beating','The magistrates’ later apology'],1,'Acts 16:25–34'],
  ['s10','Jesus Washes the Disciples’ Feet','🫧','John 13','JHN',13,[
    'During the meal, Jesus rose, laid aside his outer garments, and began washing the disciples’ feet.',
    'Peter resisted the action because the role reversal seemed inappropriate to him.',
    'Jesus insisted that Peter needed to receive what he was doing.',
    'Afterward Jesus explained that the disciples called him Teacher and Lord correctly.',
    'He then used his own action as an example of humble service toward one another.'
  ],'Why is the scene more than a lesson in politeness?',['It links recognized authority with humble service','It abolishes every form of leadership','It teaches that only physical washing counts as service','It shows Peter was the leader because he resisted'],0,'John 13:12–17']
];

function freezeStory([id,title,emoji,book,readerCode,readerChapter,rawScenes,question,rawChoices,answer,reference]) {
  const scenes = Object.freeze([...rawScenes]);
  const choices = Object.freeze([...rawChoices]);
  const steps = Object.freeze([
    ...scenes.map((prompt,index)=>Object.freeze({id:`scene-${index+1}`,type:'content',prompt})),
    Object.freeze({id:'checkpoint',type:'choice',prompt:question,choices,answer,reference,feedback:Object.freeze({correct:'You followed the key idea.',incorrect:'Revisit the key moment.'})})
  ]);
  return Object.freeze({
    id,title,emoji,book,reader:Object.freeze({code:readerCode,chapter:readerChapter}),scenes,
    checkpoint:Object.freeze({question,choices,answer,reference}),
    definition:Object.freeze({id:`story-journey:${id}`,version:1,title,steps})
  });
}

export const STORY_JOURNEYS = Object.freeze(rows.map(freezeStory));

export function getStoryJourney(id) {
  const story = STORY_JOURNEYS.find(item=>item.id===String(id||''));
  if (!story) throw new Error(`Unknown Story Journey: ${id||'missing'}.`);
  return story;
}
