#!/usr/bin/env python3
import json, re, tempfile, urllib.request, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PACKS=ROOT/'data'/'packs'
OUT=PACKS/'tagalog'
OUT.mkdir(parents=True,exist_ok=True)
URL='https://ebible.org/Scriptures/tglulb_usfm.zip'

BOOK_ORDER=['GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL','MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV']

NOTE_BLOCK=re.compile(r'\\(?:f|x)\b.*?\\(?:f|x)\*',re.S)
WORD=re.compile(r'\\w\s+([^|\\]+)(?:\|[^\\]*)?\\w\*')
MARKER=re.compile(r'\\[a-zA-Z0-9+_-]+\*?(?:\s+)?')

def clean(text):
    text=NOTE_BLOCK.sub('',text)
    text=WORD.sub(lambda m:m.group(1),text)
    text=MARKER.sub('',text)
    text=re.sub(r'\s+',' ',text).strip()
    return text

def parse_usfm(text):
    code=''; name=''; chapter=None; rows=[]; current=None
    def flush():
        nonlocal current
        if current and current['t'].strip():
            current['t']=clean(current['t'])
            if current['t']: rows.append(current)
        current=None
    for raw in text.replace('\r\n','\n').split('\n'):
        line=raw.strip()
        if not line: continue
        m=re.match(r'^\\id\s+([0-9A-Z]{3})',line,re.I)
        if m: code=m.group(1).upper(); continue
        m=re.match(r'^\\toc2\s+(.+)',line,re.I)
        if m and not name: name=clean(m.group(1)); continue
        m=re.match(r'^\\h\s+(.+)',line,re.I)
        if m and not name: name=clean(m.group(1)); continue
        m=re.match(r'^\\c\s+(\d+)',line)
        if m: flush(); chapter=int(m.group(1)); continue
        m=re.match(r'^\\v\s+([^\s]+)\s*(.*)',line)
        if m and chapter:
            flush(); vm=re.match(r'(\d+)',m.group(1));
            if vm: current={'c':chapter,'v':int(vm.group(1)),'t':m.group(2)}
            continue
        if current:
            # Keep poetry/paragraph continuation text but discard structural headings.
            if re.match(r'^\\(?:s|ms|mt|toc|rem|ide|usfm)\d*\b',line): continue
            current['t']+=' '+line
    flush(); return code,name,rows

def main():
    with tempfile.NamedTemporaryFile(suffix='.zip') as tmp:
        req=urllib.request.Request(URL,headers={'User-Agent':'BibleQuest-resource-builder'})
        with urllib.request.urlopen(req,timeout=120) as r:
            tmp.write(r.read()); tmp.flush()
        books={}
        with zipfile.ZipFile(tmp.name) as z:
            for member in z.namelist():
                if not member.lower().endswith(('.usfm','.sfm')): continue
                text=z.read(member).decode('utf-8-sig',errors='replace')
                code,name,rows=parse_usfm(text)
                if code in BOOK_ORDER and rows: books[code]=(name or code,rows)
    total=sum(len(v[1]) for v in books.values())
    if len(books)!=66 or total<30000:
        raise RuntimeError(f'Tagalog ULB validation failed: books={len(books)}, verses={total}')
    for p in OUT.glob('*.json'): p.unlink()
    metas=[]
    for code in BOOK_ORDER:
        name,rows=books[code]
        path=OUT/f'{code}.json'
        path.write_text(json.dumps(rows,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
        metas.append({'code':code,'name':name,'verses':len(rows),'path':f'data/packs/tagalog/{code}.json'})
    manifest_path=PACKS/'manifest.json'
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    manifest['tagalog_books']=metas
    manifest.setdefault('translations',{})['TGL']={
        'code':'TGL','name':'banal na Bibliya · Tagalog Unlocked Literal Bible','language':'Tagalog',
        'source':'eBible.org / Door43 World Missions Community','license':'CC BY-SA 4.0',
        'delivery':'on-demand per-book browser packs','source_url':URL
    }
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    (OUT/'ATTRIBUTION.md').write_text('# Tagalog Bible packs\n\n**banal na Bibliya / Tagalog Unlocked Literal Bible**. Copyright © 2018 Door43 World Missions Community. Source: eBible.org. Licensed under Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0). BibleQuest converts the upstream USFM into per-book JSON delivery packs without intentionally revising the Scripture wording.\n',encoding='utf-8')
    print(json.dumps({'tagalog_books':len(metas),'verses':total},indent=2))

if __name__=='__main__': main()
