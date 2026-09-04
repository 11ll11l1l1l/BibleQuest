#!/usr/bin/env python3
"""Build compact Hebrew/Greek context packs for BibleQuest.

The browser receives only the Strong-linked lexical fields needed for a book:
lemma, transliteration, morphology and brief gloss. It deliberately does not
copy the long Hebrew 'Meaning' field from TBESH because the upstream file
notes additional rights around that material.
"""
import html, json, re, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LIB=ROOT/'data'/'library'
OUT=ROOT/'data'/'packs'/'context'
OUT.mkdir(parents=True,exist_ok=True)
BSB=LIB/'bsb_bible_index.jsonl'
HEB='https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/TBESH%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Hebrew%20-%20STEPBible.org%20CC%20BY.txt'
GRK='https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/TBESG%20-%20Translators%20Brief%20lexicon%20of%20Extended%20Strongs%20for%20Greek%20-%20STEPBible.org%20CC%20BY.txt'
BOOK_ORDER=['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV']

def fetch(url):
    req=urllib.request.Request(url,headers={'User-Agent':'BibleQuest-context-builder'})
    with urllib.request.urlopen(req,timeout=120) as r:
        return r.read().decode('utf-8-sig',errors='replace')

def norm_strong(value):
    m=re.match(r'^([HG])(\d+)',str(value).strip(),re.I)
    return f'{m.group(1).upper()}{int(m.group(2))}' if m else ''

def clean(value,maxlen=180):
    value=re.sub(r'<[^>]+>',' ',html.unescape(str(value or '')))
    return re.sub(r'\s+',' ',value).strip()[:maxlen]

def parse_lexicon(text,lang):
    out={}
    prefix='H' if lang=='Hebrew' else 'G'
    for raw in text.splitlines():
        if not re.match(rf'^{prefix}\d+\t',raw): continue
        cols=raw.split('\t')
        if len(cols)<7: continue
        key=norm_strong(cols[0])
        if not key or key in out: continue
        lemma=clean(cols[3],90); translit=clean(cols[4],90); morph=clean(cols[5],60); gloss=clean(cols[6],120)
        if not any((lemma,translit,gloss)): continue
        out[key]={'strong':key,'language':lang,'lemma':lemma,'transliteration':translit,'morphology':morph,'gloss':gloss}
    return out

def main():
    if not BSB.exists(): raise RuntimeError('Missing data/library/bsb_bible_index.jsonl')
    lex={**parse_lexicon(fetch(HEB),'Hebrew'),**parse_lexicon(fetch(GRK),'Greek')}
    by_book={b:{'verses':{},'strongs':set()} for b in BOOK_ORDER}
    with BSB.open(encoding='utf-8') as f:
        for line in f:
            if not line.strip(): continue
            row=json.loads(line); code=row.get('b');
            if code not in by_book: continue
            strongs=[]
            for s in row.get('s') or []:
                n=norm_strong(s)
                if n and n in lex and n not in strongs: strongs.append(n)
            if strongs:
                by_book[code]['verses'][row['id']]=strongs
                by_book[code]['strongs'].update(strongs)
    metas=[]
    for p in OUT.glob('*.json'): p.unlink()
    for code in BOOK_ORDER:
        info=by_book[code]; used=sorted(info['strongs'],key=lambda x:(x[0],int(x[1:])))
        payload={'code':code,'source':'BSB Strong tags + STEPBible TBESH/TBESG','license':'BSB tags CC0; STEPBible lexical fields CC BY 4.0','verses':info['verses'],'lexicon':{k:lex[k] for k in used}}
        (OUT/f'{code}.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
        metas.append({'code':code,'tagged_verses':len(info['verses']),'lexemes':len(used),'path':f'data/packs/context/{code}.json'})
    (OUT/'manifest.json').write_text(json.dumps({'version':1,'books':metas,'source':'STEPBible TBESH/TBESG','license':'CC BY 4.0','note':'Brief lexical fields only; not an interlinear or theological interpretation.'},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    (OUT/'ATTRIBUTION.md').write_text('# Original-language context packs\n\nBibleQuest combines the **Strong’s identifiers carried by the BSB data** with brief lexical fields from **STEPBible TBESH (Hebrew) and TBESG (Greek)**. STEPBible data is credited to STEP Bible / Tyndale House Cambridge and licensed **CC BY 4.0**.\n\nBibleQuest packages lemma, transliteration, morphology, and brief gloss only. These tools show lexical context; they are not a word-for-word interlinear and do not determine the meaning of a verse by themselves.\n',encoding='utf-8')
    print(json.dumps({'books':len(metas),'lexicon_entries':len(lex),'tagged_verses':sum(x['tagged_verses'] for x in metas)},indent=2))

if __name__=='__main__': main()
