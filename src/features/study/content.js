function freezeStudy(study){
  const steps=study.definition.steps.map(step=>{
    const frozen={...step};
    if(step.choices)frozen.choices=Object.freeze([...step.choices]);
    if(step.feedback)frozen.feedback=Object.freeze({...step.feedback});
    return Object.freeze(frozen);
  });
  return Object.freeze({
    ...study,
    passage:Object.freeze({...study.passage}),
    definition:Object.freeze({...study.definition,steps:Object.freeze(steps)})
  });
}

export const GUIDED_STUDIES=Object.freeze([
  freezeStudy({
    id:'good-samaritan',
    title:'Who Is My Neighbor?',
    kicker:'JESUS · LOVE IN ACTION',
    description:'Study the Good Samaritan by moving from context and observation to meaning, reflection, and one concrete response.',
    duration:'8–12 min',
    passage:{code:'LUK',chapter:10,from:25,to:37,label:'Luke 10:25–37'},
    definition:{
      id:'study.good-samaritan',version:1,title:'Who Is My Neighbor?',steps:[
        {id:'passage',type:'content',prompt:'Read Luke 10:25–37 slowly. Notice the question that begins the conversation, the people who encounter the wounded man, and the question Jesus asks at the end.',reference:'Luke 10:25–37'},
        {id:'context',type:'content',prompt:'Context: an expert in the law asks Jesus about eternal life and then asks, “Who is my neighbor?” Jesus answers with a story that shifts attention from defining the minimum boundary of a neighbor to becoming a person who shows mercy.',reference:'Luke 10:25–37'},
        {id:'observe',type:'choice',prompt:'At the end of Jesus’ story, which person is identified by what he did for the wounded man?',choices:['The person who had the highest status','The person who showed mercy','The person who knew the road best','The person who asked the first question'],answer:1,reference:'Luke 10:36–37',feedback:{correct:'Yes. Jesus directs attention to the one who acted with mercy.',incorrect:'Review Jesus’ final question and the answer in verses 36–37.'}},
        {id:'meaning',type:'content',prompt:'Meaning: love of neighbor is not merely a category we define. In Jesus’ example, mercy crosses social boundaries, costs time and resources, and becomes visible through action.',reference:'Luke 10:33–37'},
        {id:'reflect',type:'text',prompt:'Who is one person or group you find easy to overlook? What may prevent you from seeing their need clearly?',maxLength:1800,reference:'Luke 10:33–37',feedback:{response:'Reflection saved. The goal is honest attention, not a spiritual score.'}},
        {id:'respond',type:'text',prompt:'Write one realistic act of mercy, help, listening, generosity, or presence you can practice this week.',maxLength:1200,reference:'Luke 10:37',feedback:{response:'Your concrete response is saved.'}},
        {id:'finish',type:'confirm',prompt:'I have reviewed the passage, my reflection, and the concrete response I wrote.',reference:'Luke 10:37',feedback:{response:'Study ready to complete.'}}
      ]
    }
  }),
  freezeStudy({
    id:'abide-and-bear-fruit',
    title:'Abide and Bear Fruit',
    kicker:'JESUS · JOHN 15',
    description:'Trace Jesus’ picture of the vine and branches and connect abiding, obedience, love, and lasting fruit.',
    duration:'8–12 min',
    passage:{code:'JHN',chapter:15,from:1,to:17,label:'John 15:1–17'},
    definition:{
      id:'study.abide-and-bear-fruit',version:1,title:'Abide and Bear Fruit',steps:[
        {id:'passage',type:'content',prompt:'Read John 15:1–17. Watch for repeated ideas: remain/abide, fruit, love, commandments, joy, and friendship.',reference:'John 15:1–17'},
        {id:'context',type:'content',prompt:'Context: these words belong to Jesus’ final teaching to his disciples before the crucifixion. The image of vine and branches emphasizes continuing dependence on Jesus rather than independent spiritual performance.',reference:'John 13–17'},
        {id:'observe',type:'choice',prompt:'In the vine-and-branches picture, what is the branch called to do in order to bear fruit?',choices:['Separate itself from the vine','Remain in the vine','Compete with the other branches','Produce fruit without dependence'],answer:1,reference:'John 15:4–5',feedback:{correct:'Correct. The branch bears fruit by remaining connected to the vine.',incorrect:'Re-read verses 4–5 and notice the repeated language of remaining/abiding.'}},
        {id:'meaning',type:'content',prompt:'Meaning: fruitfulness is presented as the result of continuing relationship with Christ. The passage then connects that relationship with prayer, obedience, love, joy, and loving one another.',reference:'John 15:4–17'},
        {id:'reflect',type:'text',prompt:'Which part of your present routine most helps you remain attentive to Christ? Which part most easily pulls your attention away?',maxLength:1800,reference:'John 15:4–10',feedback:{response:'Reflection saved. This response is private local study data at this stage.'}},
        {id:'respond',type:'text',prompt:'Write one small practice for the next seven days that can help you remain in Christ and express love toward another person.',maxLength:1200,reference:'John 15:9–17',feedback:{response:'Your practical response is saved.'}},
        {id:'finish',type:'confirm',prompt:'I have reviewed the passage and chosen a practical response rather than treating the study as information only.',reference:'John 15:1–17',feedback:{response:'Study ready to complete.'}}
      ]
    }
  }),
  freezeStudy({
    id:'faith-that-acts',
    title:'Faith That Acts',
    kicker:'JAMES · LIVING FAITH',
    description:'Study James 2 on the relationship between claimed faith, practical care, and visible obedience.',
    duration:'8–12 min',
    passage:{code:'JAS',chapter:2,from:14,to:26,label:'James 2:14–26'},
    definition:{
      id:'study.faith-that-acts',version:1,title:'Faith That Acts',steps:[
        {id:'passage',type:'content',prompt:'Read James 2:14–26. Note the repeated contrast between saying, believing, and doing. Pay special attention to the practical example involving a brother or sister lacking necessities.',reference:'James 2:14–26'},
        {id:'context',type:'content',prompt:'Context: James addresses communities tempted to separate confession from conduct. Earlier in the letter he calls believers to be doers of the word and warns against favoritism; this section continues that concern.',reference:'James 1:22–27; 2:1–26'},
        {id:'observe',type:'choice',prompt:'What practical example does James use to challenge words that are not accompanied by helpful action?',choices:['A traveler choosing a route','A person lacking clothing and daily food','A teacher preparing a lesson','A farmer selling a field'],answer:1,reference:'James 2:15–16',feedback:{correct:'Correct. James uses a concrete unmet need to expose the weakness of words without action.',incorrect:'Review James 2:15–16 and identify the need described there.'}},
        {id:'meaning',type:'content',prompt:'Meaning: James does not praise action as a way to boast. He challenges a claim to faith that remains barren and invisible when obedience and mercy are required. His examples show faith becoming evident through action.',reference:'James 2:14–26'},
        {id:'reflect',type:'text',prompt:'Where is there a gap between something you say you value as a Christian and what your recent actions show?',maxLength:1800,reference:'James 2:14–18',feedback:{response:'Reflection saved. The purpose is examination and response, not condemnation or ranking.'}},
        {id:'respond',type:'text',prompt:'Choose one specific act this week that makes an existing conviction visible through obedience, mercy, generosity, reconciliation, or service.',maxLength:1200,reference:'James 2:18',feedback:{response:'Your practical response is saved.'}},
        {id:'finish',type:'confirm',prompt:'I have connected the passage to one concrete action rather than leaving the study at agreement alone.',reference:'James 2:14–26',feedback:{response:'Study ready to complete.'}}
      ]
    }
  })
]);

export function getGuidedStudy(id){
  const key=String(id||'').trim();
  const study=GUIDED_STUDIES.find(item=>item.id===key);
  if(!study)throw new Error('Unknown Guided Study.');
  return study;
}
