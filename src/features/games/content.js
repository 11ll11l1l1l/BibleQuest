const freezeQuestion = row => Object.freeze({...row, choices:Object.freeze([...row.choices])});

export const GAME_QUESTIONS = Object.freeze([
  {id:'q1',mode:'basic',book:'Genesis',level:1,q:'Who built the ark before the flood?',choices:['Abraham','Noah','Moses','David'],answer:1,ref:'Genesis 6:13–22',why:'God instructed Noah to build the ark before the flood.'},
  {id:'q2',mode:'basic',book:'Genesis',level:1,q:'Who was sold by his brothers and later became powerful in Egypt?',choices:['Joseph','Isaac','Samuel','Joshua'],answer:0,ref:'Genesis 37; 41',why:'Joseph was sold by his brothers and later rose to authority in Egypt.'},
  {id:'q3',mode:'basic',book:'Exodus',level:1,q:'Who led Israel out of Egypt?',choices:['Aaron','Moses','Joshua','Caleb'],answer:1,ref:'Exodus 3–14',why:'Moses was called to lead Israel out of Egypt.'},
  {id:'q4',mode:'basic',book:'1 Samuel',level:1,q:'Who defeated Goliath?',choices:['Saul','Jonathan','David','Samuel'],answer:2,ref:'1 Samuel 17',why:'David defeated Goliath with a sling and stone.'},
  {id:'q5',mode:'context',book:'1 Samuel',level:2,q:'Why was David confident when facing Goliath?',choices:['He had better armor','He trusted God who had delivered him before','He had more soldiers','Goliath was already wounded'],answer:1,ref:'1 Samuel 17:34–37,45–47',why:'David connected his confidence to God’s previous deliverance and God’s honor, not superior equipment.'},
  {id:'q6',mode:'basic',book:'Daniel',level:1,q:'Who was thrown into a den of lions?',choices:['Daniel','Jeremiah','Isaiah','Ezekiel'],answer:0,ref:'Daniel 6',why:'Daniel was put into the lions’ den after continuing to pray to God.'},
  {id:'q7',mode:'context',book:'Daniel',level:2,q:'What caused Daniel to be condemned to the lions’ den?',choices:['He refused to work','He kept praying to God despite the royal decree','He insulted the king','He left Babylon'],answer:1,ref:'Daniel 6:6–13',why:'Daniel continued his regular practice of prayer despite the decree.'},
  {id:'q8',mode:'basic',book:'Jonah',level:1,q:'Which prophet tried to flee from God’s command to go to Nineveh?',choices:['Jonah','Amos','Hosea','Micah'],answer:0,ref:'Jonah 1',why:'Jonah boarded a ship going away from Nineveh.'},
  {id:'q9',mode:'basic',book:'Matthew',level:1,q:'Where was Jesus born?',choices:['Nazareth','Jerusalem','Bethlehem','Capernaum'],answer:2,ref:'Matthew 2:1; Luke 2:4–7',why:'Matthew and Luke place Jesus’ birth in Bethlehem.'},
  {id:'q10',mode:'basic',book:'Matthew',level:1,q:'Who baptized Jesus?',choices:['Peter','John the Baptist','James','Andrew'],answer:1,ref:'Matthew 3:13–17',why:'Jesus came to John to be baptized in the Jordan.'},
  {id:'q11',mode:'context',book:'Matthew',level:2,q:'When Peter began sinking after walking on the water, what had changed?',choices:['The boat moved away','He became afraid when he noticed the wind','Jesus disappeared','The sea became dry'],answer:1,ref:'Matthew 14:28–31',why:'The passage says Peter became afraid when he saw the wind and then began to sink.'},
  {id:'q12',mode:'basic',book:'John',level:1,q:'Who did Jesus raise after he had been in the tomb?',choices:['Lazarus','Stephen','Barnabas','Zacchaeus'],answer:0,ref:'John 11',why:'Jesus called Lazarus out of the tomb.'},
  {id:'q13',mode:'basic',book:'Luke',level:1,q:'In Jesus’ parable, who stopped to help the injured traveler?',choices:['A priest','A Levite','A Samaritan','A soldier'],answer:2,ref:'Luke 10:25–37',why:'The Samaritan cared for the injured man after others passed by.'},
  {id:'q14',mode:'context',book:'Luke',level:2,q:'What question prompted the parable of the Good Samaritan?',choices:['Who is my neighbor?','Who is the greatest king?','Where is the temple?','When will Rome fall?'],answer:0,ref:'Luke 10:29',why:'The parable follows the question, “Who is my neighbor?”'},
  {id:'q15',mode:'basic',book:'Acts',level:1,q:'Who was traveling to Damascus when he encountered Jesus?',choices:['Paul (Saul)','Peter','Philip','Timothy'],answer:0,ref:'Acts 9:1–9',why:'Saul, later known as Paul, encountered Jesus on the road to Damascus.'},
  {id:'q16',mode:'context',book:'Acts',level:2,q:'After the Damascus-road encounter, what immediate limitation did Saul experience?',choices:['He could not hear','He could not speak','He could not see','He could not walk'],answer:2,ref:'Acts 9:8–9',why:'Saul was unable to see for three days.'},
  {id:'q17',mode:'basic',book:'Acts',level:1,q:'Who preached at Pentecost in Acts 2?',choices:['Peter','Thomas','Matthew','Barnabas'],answer:0,ref:'Acts 2:14–41',why:'Peter addressed the crowd after the coming of the Holy Spirit.'},
  {id:'q18',mode:'context',book:'Genesis',level:2,q:'What sign was given after the flood as part of God’s covenant?',choices:['A pillar of fire','A rainbow','A burning bush','A star'],answer:1,ref:'Genesis 9:8–17',why:'The rainbow is identified as the sign of the covenant after the flood.'},
  {id:'q19',mode:'basic',book:'Ruth',level:1,q:'Who chose to stay with Naomi and go with her?',choices:['Ruth','Esther','Miriam','Deborah'],answer:0,ref:'Ruth 1:16–18',why:'Ruth committed herself to Naomi and went with her.'},
  {id:'q20',mode:'basic',book:'Esther',level:1,q:'Which woman became queen and intervened for her people?',choices:['Esther','Ruth','Hannah','Martha'],answer:0,ref:'Esther 2–8',why:'Esther became queen and risked approaching the king on behalf of her people.'},
  {id:'q21',mode:'connection',book:'Genesis',level:3,q:'Which theme links Joseph’s story most directly with his statement near the end of Genesis?',choices:['God can bring good through intended evil','Kings never make mistakes','Wealth proves righteousness','Family conflict should be ignored'],answer:0,ref:'Genesis 50:20',why:'Joseph contrasts human intent for evil with God’s purpose for good.'},
  {id:'q22',mode:'context',book:'Mark',level:2,q:'When the disciples argued about who was greatest, what kind of response did Jesus emphasize?',choices:['Political influence','Being servant of all','Military strength','Family status'],answer:1,ref:'Mark 9:33–37',why:'Jesus reframed greatness around humility and service.'},
  {id:'q23',mode:'basic',book:'John',level:1,q:'Which disciple initially said he would not believe the resurrection without seeing evidence?',choices:['Thomas','Philip','Andrew','James'],answer:0,ref:'John 20:24–29',why:'Thomas expressed doubt until he encountered the risen Jesus.'},
  {id:'q24',mode:'context',book:'Luke',level:2,q:'In the prodigal son parable, who objected to the celebration for the returning son?',choices:['The father','The older brother','A servant','A neighbor'],answer:1,ref:'Luke 15:25–32',why:'The older brother became angry about the celebration.'}
].map(freezeQuestion));

export const GAME_MODES = Object.freeze([
  Object.freeze({id:'quick-recall', title:'Quick Recall', kicker:'10 mixed questions', description:'Recall people, events, and key context from across Scripture.'}),
  Object.freeze({id:'context-challenge', title:'Context Challenge', kicker:'Why, not just who', description:'Answer context and connection questions that require reading beyond isolated facts.'})
]);

export function buildGameRound(mode){
  if(mode==='quick-recall') return Object.freeze(GAME_QUESTIONS.slice(0,10));
  if(mode==='context-challenge') return Object.freeze(GAME_QUESTIONS.filter(row=>row.level>=2||row.mode==='context'||row.mode==='connection').slice(0,10));
  throw new Error('Unknown BibleQuest game mode.');
}
