import { NEO_FACETS, NEO_DOMAINS } from './neo-content.js';
import { VIA_STRENGTHS, RSE_ITEMS } from './via-content.js';

const flattenNeo=()=>Object.freeze(NEO_FACETS.flatMap(([facet,domain,facetName,items])=>items.map(([text,key],index)=>Object.freeze({id:`${facet}_${index+1}`,facet,domain,facetName,text,key}))));
const flattenVia=()=>Object.freeze(VIA_STRENGTHS.flatMap(([strength,name,items])=>items.map(([text,key],index)=>Object.freeze({id:`${strength}_${index+1}`,strength,name,text,key}))));
const flattenRse=()=>Object.freeze(RSE_ITEMS.map(([text,key],index)=>Object.freeze({id:`R${index+1}`,text,key})));

export const NEO_ITEMS=flattenNeo();
export const VIA_ITEMS=flattenVia();
export const ROSENBERG_ITEMS=flattenRse();

export const PSYCHOMETRICS_SOURCES=Object.freeze([
  'International Personality Item Pool (IPIP)',
  'Johnson (2014) IPIP-NEO-120',
  'Bluemke, Partsch, Saucier & Lechner (2021) IPIP-VIA-R',
  'Morris Rosenberg Self-Esteem Scale / University of Maryland'
]);

export const PSYCHOMETRICS_DEFINITIONS=Object.freeze({
  neo:Object.freeze({id:'ipip-neo-120',label:'Deep Personality — IPIP-NEO-120',items:NEO_ITEMS,facets:NEO_FACETS,domains:NEO_DOMAINS,total:120,pageSize:10}),
  via:Object.freeze({id:'ipip-via-r-96',label:'Character Strengths — IPIP-VIA-R',items:VIA_ITEMS,strengths:VIA_STRENGTHS,total:96,pageSize:8}),
  rse:Object.freeze({id:'rosenberg-self-esteem-10',label:'Rosenberg Self-Esteem Scale',items:ROSENBERG_ITEMS,total:10,pageSize:5})
});

export const PSYCHOMETRICS_SAFETY=Object.freeze({
  general:'These assessments describe self-reported tendencies. They are not clinical diagnoses, employment-selection tests, moral rankings, measures of salvation, doctrine, spiritual maturity, calling, God’s approval, or human worth.',
  values:'The historical IPIP Values/Openness facet includes political and moral-content wording. Its score is not a verdict on politics, biblical orthodoxy, holiness, or theological faithfulness.',
  spirituality:'The VIA Spirituality / Religiousness scale is a psychological self-report construct, not a measure of salvation, doctrine, faithfulness, or Christian maturity.',
  depression:'The retained Depression facet name is a personality/self-report construct, not a diagnosis of depression or another mental-health condition.',
  scoring:'Scripture or Christian reflection is downstream interpretation only and never changes item keys, psychometric scores, bands, or response-quality checks.'
});
