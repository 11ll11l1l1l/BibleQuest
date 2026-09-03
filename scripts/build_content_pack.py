#!/usr/bin/env python3
import csv, json, os, re, shutil, subprocess, sys, tempfile, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "library"
OUT.mkdir(parents=True, exist_ok=True)
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
}

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
        run(["git","-C",str(dest),"sparse-checkout","set",*sparse])
    return dest

def dump_jsonl(path, rows):
    n=0
    with path.open("w",encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row,ensure_ascii=False,separators=(",",":"))+"\n")
            n+=1
    return n

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
    else: files=list(repo.rglob("*.md"))
    for p in sorted(set(files)):
        if p.name.upper() in {"README.MD","LICENSE.MD"}: continue
        text=p.read_text(encoding="utf-8",errors="replace").strip()
        if not text: continue
        m=re.search(r"^#\s+(.+)$",text,re.M)
        title=m.group(1).strip() if m else p.stem.replace("-"," ").replace("_"," ").title()
        yield {"resource":resource,"version":version,"id":p.stem,"title":title,"markdown":text,"source_file":str(p.relative_to(repo))}

def download(url, path):
    print("download",url,flush=True)
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"BibleQuest-resource-builder"})
        with urllib.request.urlopen(req,timeout=90) as r, path.open("wb") as f:
            shutil.copyfileobj(r,f)
        return True
    except Exception as e:
        print("optional download failed:",url,e,file=sys.stderr)
        return False

manifest={"generated_by":"BibleQuest content pack","sources":{},"files":{}}
try:
    bsb=clone("bsb",SOURCES["bsb"],["vector-db/index-pd","base/headings.jsonl","base/paragraphs.jsonl","VERSION.json","ATTRIBUTION.md","LICENSE-CC0.md"])
    bible_src=bsb/"vector-db/index-pd/bible-index.jsonl"
    shutil.copy2(bible_src,OUT/"bsb_bible_index.jsonl")
    for fname in ["headings.jsonl","paragraphs.jsonl"]:
        src=bsb/"base"/fname
        if src.exists(): shutil.copy2(src,OUT/f"bsb_{fname}")
    manifest["sources"]["bsb"]={**SOURCES["bsb"],"commit":subprocess.check_output(["git","-C",str(bsb),"rev-parse","HEAD"],text=True).strip()}
    manifest["files"]["bsb_bible_index.jsonl"]={"purpose":"Full BSB verse text + Strong's + public-domain cross references/topics/glosses","license":"CC0"}

    tq=clone("tq",SOURCES["tq"])
    n=dump_jsonl(OUT/"translation_questions.jsonl",compact_questions(tq,"unfoldingWord Translation Questions","v90"))
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

    step=clone("step",SOURCES["step"],None)
    tipnr=next((p for p in step.rglob("*.txt") if "TIPNR" in p.name),None)
    if tipnr:
        shutil.copy2(tipnr,OUT/"stepbible_tipnr.txt")
        manifest["files"]["stepbible_tipnr.txt"]={"purpose":"Biblical people/places/proper names, relations and references","license":"CC BY 4.0"}

    geo=clone("geo",SOURCES["geo"])
    ancient=geo/"data"/"ancient.jsonl"
    if ancient.exists():
        shutil.copy2(ancient,OUT/"bible_places.jsonl")
        manifest["files"]["bible_places.jsonl"]={"purpose":"Biblical place coordinates and identifiers","license":"CC BY 4.0"}

    translations=OUT/"translations"; translations.mkdir(exist_ok=True)
    if download("https://ebible.org/engwebu/engwebu_html.zip",translations/"web_updated_html.zip"):
        manifest["files"]["translations/web_updated_html.zip"]={"purpose":"Secondary English Bible translation","license":"Public Domain"}
    if download("https://ebible.org/tglulb/tglulb_html.zip",translations/"tagalog_ulb_html.zip"):
        manifest["files"]["translations/tagalog_ulb_html.zip"]={"purpose":"Tagalog Bible translation pack","license":"Door43 open-license family; preserve source attribution"}

    for name,cfg in SOURCES.items():
        repo=TMP/name
        if repo.exists() and name not in manifest["sources"]:
            try: commit=subprocess.check_output(["git","-C",str(repo),"rev-parse","HEAD"],text=True).strip()
            except Exception: commit=None
            manifest["sources"][name]={**cfg,"commit":commit}

    (OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (OUT/"ATTRIBUTION.md").write_text("""# BibleQuest external data attribution\n\n- Berean Standard Bible / BSB data: public-domain (CC0) components as marked by BSB Publishing.\n- unfoldingWord Translation Questions, Translation Notes, Translation Words, Open Bible Stories and OBS Translation Questions: CC BY-SA 4.0; source: unfoldingWord / Door43.\n- STEPBible TIPNR proper-names data: CC BY 4.0; credit STEP Bible / Tyndale House Cambridge.\n- OpenBible geocoding data: CC BY 4.0.\n- World English Bible Updated: public domain, distributed by eBible.org.\n- Tagalog ULB: Door43 World Missions Community; retain upstream license/copyright notices.\n\n`manifest.json` records pinned resource versions/commits used for each build.\n""",encoding="utf-8")
    print(json.dumps(manifest,indent=2))
finally:
    shutil.rmtree(TMP,ignore_errors=True)
