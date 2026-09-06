(() => {
  const STORE='biblequest_transformation_v1';
  const FACTORS=['E','A','C','S','O'];
  const isObject=v=>Boolean(v&&typeof v==='object'&&!Array.isArray(v));
  const finite=v=>Number.isFinite(Number(v));
  const validPersonalityResult=result=>{
    if(!isObject(result)||!isObject(result.scores))return false;
    return FACTORS.every(k=>{
      const s=result.scores[k];
      return isObject(s)&&finite(s.mean)&&finite(s.raw)&&finite(s.index)&&typeof s.band==='string';
    });
  };
  const validBiasResult=result=>isObject(result)&&isObject(result.binary)&&finite(result.resistance)&&finite(result.accuracy)&&finite(result.meanConfidence)&&finite(result.gap);

  function sanitize(){
    try{
      let raw;
      let changed=false;
      try{raw=JSON.parse(localStorage.getItem(STORE)||'{}')}catch{raw={};changed=true}
      const data=isObject(raw)?{...raw}:{};
      if(!isObject(raw))changed=true;
      if(!isObject(data.personalityAnswers)){data.personalityAnswers={};changed=true}
      if(!isObject(data.biasAnswers)){data.biasAnswers={};changed=true}
      if(!isObject(data.calibration)){data.calibration={};changed=true}
      if(!Array.isArray(data.history)){data.history=[];changed=true}
      if(data.personalityResult&&!validPersonalityResult(data.personalityResult)){data.personalityResult=null;changed=true}
      if(data.biasResult&&!validBiasResult(data.biasResult)){data.biasResult=null;changed=true}
      if(changed)localStorage.setItem(STORE,JSON.stringify(data));
      return {ok:true,repaired:changed,state:data};
    }catch{
      return {ok:false,repaired:false,reason:'Device storage is unavailable'};
    }
  }

  window.BQTransformStateGuard={sanitize,validPersonalityResult,validBiasResult};
  sanitize();
})();