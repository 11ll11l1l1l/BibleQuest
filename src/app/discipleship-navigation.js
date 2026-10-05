import { parseBibleReference } from '../core/bible.js';
const ROUTES = new Set(['one-to-one-pair','one-to-one-track','one-to-one-module','one-to-one-lesson']);
const FIELDS = ['pairId','trackId','moduleId','revisionId','stepId'];
export function discipleshipRoute({routeKey,...context}) {
  if(!ROUTES.has(routeKey))throw new TypeError('Unsupported discipleship route.');
  const params=new URLSearchParams();
  for(const key of FIELDS)if(context[key])params.set(key,String(context[key]));
  if(routeKey==='one-to-one-pair'&&context.pairId){params.delete('pairId');params.set('id',context.pairId);}
  return params.size?`${routeKey}?${params}`:routeKey;
}
export function lessonReaderRoute(ref,context) {
  const text=typeof ref==='string'?ref:ref?.ref;
  let parsed;
  if(typeof text==='string')parsed=parseBibleReference(text);
  else {
    const start=ref?.verseStart??ref?.verse??1,end=ref?.verseEnd??start;
    if(!Number.isInteger(ref?.chapter)||!Number.isInteger(start)||!Number.isInteger(end))throw new TypeError('A canonical Scripture reference is required.');
    parsed=parseBibleReference(`${ref?.book} ${ref.chapter}:${start}-${end}`);
  }
  if(!parsed)throw new TypeError('A canonical Scripture reference is required.');
  const {book,chapter}=parsed,verse=parsed.verseStart??1;
  if(!context?.pairId||!context?.revisionId||!context?.stepId)throw new TypeError('Lesson return identity is required.');
  const params=new URLSearchParams({book:book.code,chapter:String(chapter),verse:String(verse),returnTo:'one-to-one-lesson'});
  for(const key of FIELDS)if(context[key])params.set(key,String(context[key]));
  return `reader?${params}`;
}
export function lessonReaderContext(params) {
  if(params.get('returnTo')!=='one-to-one-lesson')return null;
  const context=Object.fromEntries(FIELDS.map(key=>[key,params.get(key)||'']));
  if(!context.pairId||!context.revisionId||!context.stepId)return null;
  const ref={book:params.get('book'),chapter:Number(params.get('chapter')),verseStart:Number(params.get('verse'))};
  lessonReaderRoute(ref,context);
  return Object.freeze({...ref,back:discipleshipRoute({routeKey:'one-to-one-lesson',...context})});
}
