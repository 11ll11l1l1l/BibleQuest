#!/usr/bin/env python3
import csv, json, re, shutil, subprocess, sys, tempfile, urllib.request, zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "library"
PACKS = ROOT / "data" / "packs"
OUT.mkdir(parents=True, exist_ok=True)
if PACKS.exists():
    shutil.rmtree(PACKS)
(PACKS / "questions").mkdir(parents=True, exist_ok=True)
(PACKS / "bible").mkdir(parents=True, exist_ok=True)
TMP = Path(tempfile.mkdtemp(prefix="biblequest-content-"))

SOURCES = {
    "bsb": {"url":"https://github.com/BSB-publishing/bsb-data-output.git", "ref":"main", "license":"CC0 / mixed documented upstream"},
    "tq": {"url":"https://git.door43.org/unfoldingWord/en_tq.git", "ref":"v90", "license":"CC BY-SA 4.0"},
    "tn": {"url":"https://git.door43.org/unfoldingWord/en_tn.git", "ref":"v90", "license":"CC BY-SA 4.0"},
    "tw": {"url":"https://git.door43.org/unfoldingWord/en_tw.git", "ref":"v90", "license":"CC BY-SA 4.0"},
    "obs": {"url":"https://git.door43.org/unfoldingWord/en_obs.git", "ref":"v9", "license":"CC BY-SA 4.0"},
    "obs_tq": {"url":"https://git.door43.org/unfoldingWord/en_obs-tq.git", "ref":"v10", "license":"CC BY-SA 4.0"},
    "step": {"url":"https://github.com/STEPBible/STEPBible-Data.git", "ref":"master", "license":"CC BY 4.0"},
    "geo": {"url":"https://github.com/openbibleinfo/Bible-Geocoding-Data.git", "ref":"main", "license":"CC BY 4.0"},
    "xrefs": {"url":"https://a.openbible.info/data/cross-references.zip", "ref":"current", "license":"CC BY"},
}

BOOKS = [
("GEN","Genesis"),("EXO","Exodus"),("LEV","Leviticus"),("NUM","Numbers"),("DEU","Deuteronomy"),
("JOS","Joshua"),("JDG","Judges"),("RUT","Ruth"),("1SA","1 Samuel"),("2SA","2 Samuel"),("1KI","1 Kings"),("2KI","2 Kings"),
("1CH","1 Chronicles"),("2CH","2 Chronicles"),("EZR","Ezra"),("NEH","Nehemiah"),("EST","Esther"),("JOB","Job"),("PSA","Psalms"),
("PRO","Proverbs"),("ECC","Ecclesiastes"),("SNG","Song of Songs"),("ISA","Isaiah"),("JER","Jeremiah"),("LAM","Lamentations"),
("EZK","Ezekiel"),("DAN","Daniel"),("HOS","Hosea"),("JOL","Joel"),("AMO","Amos"),("OBA","Obadiah"),("JON","Jonah"),
("MIC","Micah"),("NAM","Nahum"),("HAB","Habakkuk"),("ZEP","Zephaniah"),("HAG","Haggai"),("ZEC","Zechariah"),("MAL","Malachi"),
("MAT","Matthew"),("MRK","Mark"),("LUK","Luke"),("JHN","John"),("ACT","Acts"),("ROM","Romans"),("1CO","1 Corinthians"),
("2CO","2 Corinthians"),("GAL","Galatians"),("EPH","Ephesians"),("PHP","Philippians"),("COL","Colossians"),("1TH","1 Thessalonians"),
("2TH","2 Thessalonians"),("1TI","1 Timothy"),("2TI","2 Timothy"),("TIT","Titus"),("PHM","Philemon"),("HEB","Hebrews"),
("JAS","James"),("1PE","1 Peter"),("2PE","2 Peter"),("1JN","1 John"),("2JN","2 John"),("3JN","3 John"),("JUD","Jude"),("REV","Revelation")]
BOOK_NAMES = dict(BOOKS)
BOOK_CODES = {name: code for code, name in BOOKS}
CODE_RE = re.compile(r"(?<![A-Z0-9])(" + "|".join(re.escape(c) for c,_ in BOOKS) + r")(?![A-Z0-9])", re.I)

def run(args, cwd=None):
    print("+", " ".join(map(str,args)), flush=True)
    subprocess.run(args, cwd=cwd, check=True)

def clone(name, cfg, sparse=None):
    dest = TMP / name
    cmd = ["git","clone","--depth","1","--branch",cfg["ref"]]
    if sparse:
        cmd += ["--filter=blob:none","--sparse"]
    cmd += [cfg["url"], str(dest)]
    run(cmd)
    if sparse:
        run(["git","-C",str(dest),"sparse-checkout","set","--skip-checks",*sparse])
    return dest

def dump_jsonl(path, rows):
    n=0
    with path.open("w",encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row,ensure_ascii=False,separators=(",",":"))+"\n")
            n+=1
    return n

def dump_json(path, value):
    path.write_text(json.dumps(value,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")

def iter_tsv(repo):
    for p in sorted(repo.rglob("*.tsv")):
        try:
            with p.open(encoding="utf-8-sig",newline="") as f:
                reader=csv.DictReader(f,delimiter="\t")
                for row in reader:
                    if row: yield p,row
        except UnicodeDecodeError:
            continue

def compact_questions(repo, resource, version):
    for p,row in iter_tsv(repo):
        q=(row.get("Question") or row.get("question") or "").strip()
        a=(row.get("Response") or row.get("Answer") or row.get("response") or "").strip()
        if not q: continue
        yield {"resource":resource,"version":version,"reference":(row.get("Reference") or "").strip(),"id":(row.get("ID") or "").strip(),"question":q,"answer":a,"tags":(row.get("Tags") or "").strip(),"source_file":str(p.relative_to(repo))}

def compact_notes(repo, version):
    for p,row in iter_tsv(repo):
        note=(row.get("OccurrenceNote") or row.get("Note") or row.get("note") or "").strip()
        if not note: continue
        yield {"resource":"unfoldingWord Translation Notes","version":version,"reference":(row.get("Reference") or "").strip(),"id":(row.get("ID") or "").strip(),"quote":(row.get("Quote") or row.get("GLQuote") or "").strip(),"note":note,"support_reference":(row.get("SupportReference") or "").strip(),"tags":(row.get("Tags") or "").strip(),"source_file":str(p.relative_to(repo))}

def markdown_articles(repo, resource, version, roots=None):
    files=[]
    if roots:
        for r in roots:
            q=repo/r
            if q.exists(): files += list(q.rglob("*.md"))
    else:
        files=list(repo.rglob("*.md"))
    for p in sorted(set(files)):
        if p.name.upper() in {"README.MD","LICENSE.MD"}: continue
        text=p.read_text(encoding="utf-8",errors="replace").strip()
        if not text: continue
        m=re.search(r"^#\s+(.+)$",text,re.M)
        title=m.group(1).strip() if m else p.stem.replace("-"," ").replace("_"," ").title()
        yield {"resource":resource,"version":version,"id":p.stem,"title":title,"markdown":text,"source_file":str(p.relative_to(repo))}

def iter_bsb_documents(path):
    if path.suffix == ".jsonl":
        with path.open(encoding="utf-8") as f:
            for line in f:
                line=line.strip()
                if line:
                    yield json.loads(line)
    else:
        yield json.loads(path.read_text(encoding="utf-8"))

def normalize_bsb_book(raw):
    raw=str(raw).strip()
    up=raw.upper().replace(" ","")
    if up in BOOK_NAMES: return up
    for code,name in BOOKS:
        if raw.lower()==name.lower(): return code
    return raw

def bsb_verses(repo):
    display=repo/"base"/"display"
    paths=sorted(list(display.glob("*/*.json"))+list(display.glob("*/*.jsonl")))
    for p in paths:
        book=normalize_bsb_book(p.parent.name)
        m=re.search(r"(\d+)$",p.stem)
        if not m: continue
        chapter=int(m.group(1))
        for data in iter_bsb_documents(p):
            structure=data.get("structure",{}) or {}
            for verse_s,tokens in sorted((data.get("eng") or {}).items(),key=lambda kv:int(kv[0])):
                text=[]; strongs=[]
                for token in tokens:
                    if not token: continue
                    text.append(str(token[0]))
                    if len(token)>1 and isinstance(token[1],str) and token[1] and token[1] not in strongs:
                        strongs.append(token[1])
                verse=int(verse_s)
                row={"id":f"{book}.{chapter}.{verse}","b":book,"c":chapter,"v":verse,"t":"".join(text),"s":strongs}
                if verse_s in structure: row["structure"]=structure[verse_s]
                elif str(verse) in structure: row["structure"]=structure[str(verse)]
                yield row

def infer_book_code(source_file):
    text=str(source_file).upper().replace("_","-").replace("/","-")
    m=CODE_RE.search(text)
    if m: return m.group(1).upper()
    return None

def build_browser_question_packs(rows):
    grouped=defaultdict(list)
    for row in rows:
        code=infer_book_code(row.get("source_file",""))
        if not code: continue
        grouped[code].append({"id":row.get("id","") or f"{code}-{len(grouped[code])+1}","r":row.get("reference",""),"q":row.get("question",""),"a":row.get("answer","")})
    books=[]
    for code,name in BOOKS:
        items=grouped.get(code,[])
        if not items: continue
        dump_json(PACKS/"questions"/f"{code}.json",items)
        books.append({"code":code,"name":name,"questions":len(items),"path":f"data/packs/questions/{code}.json"})
    return books

def build_browser_bible_packs(verses):
    grouped=defaultdict(list)
    for row in verses:
        grouped[row["b"]].append({"c":row["c"],"v":row["v"],"t":row["t"]})
    books=[]
    ordered=[c for c,_ in BOOKS]+sorted(k for k in grouped if k not in BOOK_NAMES)
    for code in ordered:
        items=grouped.get(code,[])
        if not items: continue
        dump_json(PACKS/"bible"/f"{code}.json",items)
        books.append({"code":code,"name":BOOK_NAMES.get(code,code),"verses":len(items),"path":f"data/packs/bible/{code}.json"})
    return books

def download(url, path, required=False):
    print("download",url,flush=True)
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"BibleQuest-resource-builder"})
        with urllib.request.urlopen(req,timeout=120) as r, path.open("wb") as f:
            shutil.copyfileobj(r,f)
        return True
    except Exception as e:
        print(("required" if required else "optional"),"download failed:",url,e,file=sys.stderr)
        if required: raise
        return False

manifest={"generated_by":"BibleQuest content pack","sources":{},"files":{}}
pack_manifest={"version":1,"strategy":"on-demand per-book browser packs","question_source":"unfoldingWord Translation Questions v90 / CC BY-SA 4.0","bible_source":"BSB public-domain data / CC0","question_books":[],"bible_books":[]}
try:
    bsb=clone("bsb",SOURCES["bsb"],["base/display","base/headings.jsonl","base/paragraphs.jsonl","base/concordance","base/proper-names","base/geography","VERSION.json","ATTRIBUTION.md","LICENSE-CC0.md"])
    verse_rows=list(bsb_verses(bsb))
    n=dump_jsonl(OUT/"bsb_bible_index.jsonl",verse_rows)
    if n < 30000:
        raise RuntimeError(f"BSB verse validation failed: expected >30000 verses, generated {n}")
    pack_manifest["bible_books"]=build_browser_bible_packs(verse_rows)
    for fname in ["headings.jsonl","paragraphs.jsonl"]:
        src=bsb/"base"/fname
        if src.exists(): shutil.copy2(src,OUT/f"bsb_{fname}")
    concord=bsb/"base"/"concordance"/"strongs-to-verses.jsonl"
    if concord.exists(): shutil.copy2(concord,OUT/"bsb_strongs_to_verses.jsonl")
    manifest["sources"]["bsb"]={**SOURCES["bsb"],"commit":subprocess.check_output(["git","-C",str(bsb),"rev-parse","HEAD"],text=True).strip()}
    manifest["files"]["bsb_bible_index.jsonl"]={"rows":n,"purpose":"Full BSB verse text + Strong's identifiers, normalized for BibleQuest","license":"CC0"}
    if concord.exists(): manifest["files"]["bsb_strongs_to_verses.jsonl"]={"purpose":"Strong's-to-verse concordance","license":"CC0"}

    tq=clone("tq",SOURCES["tq"])
    tq_rows=list(compact_questions(tq,"unfoldingWord Translation Questions","v90"))
    n=dump_jsonl(OUT/"translation_questions.jsonl",tq_rows)
    pack_manifest["question_books"]=build_browser_question_packs(tq_rows)
    manifest["files"]["translation_questions.jsonl"]={"rows":n,"license":"CC BY-SA 4.0"}

    tn=clone("tn",SOURCES["tn"])
    n=dump_jsonl(OUT/"translation_notes.jsonl",compact_notes(tn,"v90"))
    manifest["files"]["translation_notes.jsonl"]={"rows":n,"license":"CC BY-SA 4.0"}

    tw=clone("tw",SOURCES["tw"])
    n=dump_jsonl(OUT/"translation_words.jsonl",markdown_articles(tw,"unfoldingWord Translation Words","v90",["bible"]))
    manifest["files"]["translation_words.jsonl"]={"rows":n,"license":"CC BY-SA 4.0"}

    obs=clone("obs",SOURCES["obs"])
    n=dump_jsonl(OUT/"open_bible_stories.jsonl",markdown_articles(obs,"Open Bible Stories","v9",["content"]))
    manifest["files"]["open_bible_stories.jsonl"]={"rows":n,"license":"CC BY-SA 4.0"}

    obsq=clone("obs_tq",SOURCES["obs_tq"])
    n=dump_jsonl(OUT/"open_bible_story_questions.jsonl",compact_questions(obsq,"Open Bible Stories Translation Questions","v10"))
    manifest["files"]["open_bible_story_questions.jsonl"]={"rows":n,"license":"CC BY-SA 4.0"}

    step=clone("step",SOURCES["step"],["Proper Nouns"])
    tipnr=next((p for p in step.rglob("*.txt") if "TIPNR" in p.name),None)
    if tipnr:
        shutil.copy2(tipnr,OUT/"stepbible_tipnr.txt")
        manifest["files"]["stepbible_tipnr.txt"]={"purpose":"Biblical people/places/proper names, relations and references","license":"CC BY 4.0"}

    geo=clone("geo",SOURCES["geo"])
    ancient=geo/"data"/"ancient.jsonl"
    if ancient.exists():
        shutil.copy2(ancient,OUT/"bible_places.jsonl")
        manifest["files"]["bible_places.jsonl"]={"purpose":"Biblical place coordinates and identifiers","license":"CC BY 4.0"}

    xzip=TMP/"cross_references.zip"
    if download(SOURCES["xrefs"]["url"],xzip):
        with zipfile.ZipFile(xzip) as z:
            member=next((n for n in z.namelist() if n.lower().endswith(".txt")),None)
            if member:
                with z.open(member) as src,(OUT/"cross_references.txt").open("wb") as dst: shutil.copyfileobj(src,dst)
                manifest["files"]["cross_references.txt"]={"purpose":"OpenBible Bible cross-reference graph","license":"CC BY"}

    translations=OUT/"translations"; translations.mkdir(exist_ok=True)
    if download("https://ebible.org/engwebu/engwebu_html.zip",translations/"web_updated_html.zip"):
        manifest["files"]["translations/web_updated_html.zip"]={"purpose":"Secondary English Bible translation","license":"Public Domain"}
    if download("https://ebible.org/tglulb/tglulb_html.zip",translations/"tagalog_ulb_html.zip"):
        manifest["files"]["translations/tagalog_ulb_html.zip"]={"purpose":"Tagalog Bible translation pack","license":"Preserve Door43/eBible upstream attribution and license notice"}

    for name,cfg in SOURCES.items():
        repo=TMP/name
        if repo.exists() and name not in manifest["sources"]:
            try: commit=subprocess.check_output(["git","-C",str(repo),"rev-parse","HEAD"],text=True).strip()
            except Exception: commit=None
            manifest["sources"][name]={**cfg,"commit":commit}
        elif name not in manifest["sources"]:
            manifest["sources"][name]=cfg

    (OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (OUT/"ATTRIBUTION.md").write_text("""# BibleQuest external data attribution\n\n- Berean Standard Bible / BSB data: public-domain (CC0) components as marked by BSB Publishing.\n- unfoldingWord Translation Questions, Translation Notes, Translation Words, Open Bible Stories and OBS Translation Questions: CC BY-SA 4.0; source: unfoldingWord / Door43.\n- STEPBible TIPNR proper-names data: CC BY 4.0; credit STEP Bible / Tyndale House Cambridge.\n- OpenBible geocoding and cross-reference data: CC BY; credit OpenBible.info.\n- World English Bible Updated: public domain, distributed by eBible.org.\n- Tagalog ULB: Door43 World Missions Community; retain the upstream copyright/license notices distributed with the pack.\n\n`manifest.json` records pinned resource versions/commits used for each build.\n""",encoding="utf-8")
    dump_json(PACKS/"manifest.json",pack_manifest)
    (PACKS/"ATTRIBUTION.md").write_text("""# BibleQuest browser pack attribution\n\nBible verse packs are generated from BSB public-domain/CC0 data. Question/answer recall decks are generated from unfoldingWord Translation Questions v90 and retain the CC BY-SA 4.0 license. These browser packs are reduced delivery formats of the source datasets; they are not new translations or independent theological authorities.\n""",encoding="utf-8")
    print(json.dumps(manifest,indent=2))
    print(json.dumps({"browser_pack_question_books":len(pack_manifest["question_books"]),"browser_pack_bible_books":len(pack_manifest["bible_books"])},indent=2))
finally:
    shutil.rmtree(TMP,ignore_errors=True)
