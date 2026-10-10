#!/usr/bin/env python3
"""One-off, source-SHA-locked V7 Tempted TYPE repair. Never modify CLEAN/THUMB."""
from __future__ import annotations
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw, ImageFont, features

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / "public/v7/images/emotion"
CLEAN = P / "bqv7-emotion-temptation-01.webp"
THUMB = P / "bqv7-emotion-temptation-01-thumbnail.webp"
OUT = P / "bqv7-emotion-temptation-01-with-text-en.webp"
RECORD = ROOT / "data/v7/visual-assets/records/bqv7-emotion-temptation-01-derivatives.json"
FONT = Path("/usr/share/fonts/truetype/noto/NotoSerif-Regular.ttf")
CLEAN_SHA = "51bc3448770b8b69677db1e58c1a40f941506742777a583fbf85c3b462c5b675"
THUMB_SHA = "96d2c67d3cef5d8b1e1285fa33d976516c5cc6ff9ab9cb0892c2ba93e514234f"
TAXONOMY_BLOB = "e64366970838d62c11ea602dd606e0acfe5b0cb2"
LABEL, REFERENCE = "Tempted", "1 Corinthians 10:13"

def digest(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def measurement(file: Path) -> dict:
    b=file.read_bytes()
    with Image.open(file) as i:
        i.load()
        assert i.format=="WEBP"
        w,h=i.size
    return {"imagePath": "/"+str(file.relative_to(ROOT/"public")).replace("\\","/"),
            "format":"webp","width":w,"height":h,
            "fileBytes":len(b),"sha256":digest(b)}

def run():
    assert features.check("webp")
    assert FONT.is_file(), "Noto Serif SIL OFL required"
    assert digest(CLEAN.read_bytes())==CLEAN_SHA, "CLEAN drift"
    assert digest(THUMB.read_bytes())==THUMB_SHA, "THUMB drift"
    with Image.open(CLEAN) as im:
        clean=im.convert("RGB")
    assert clean.size==(1024,1024)
    canvas=Image.new("RGB",(1024,1280),(21,32,44))
    canvas.paste(clean.crop((0,0,1024,940)),(0,340))
    draw=ImageDraw.Draw(canvas)
    titlefont=ImageFont.truetype(str(FONT),90)
    reffont=ImageFont.truetype(str(FONT),43)
    draw.text((110,130),LABEL,font=titlefont,fill=(248,242,232))
    assert draw.textbbox((110,130),LABEL,font=titlefont)[2]<916
    draw.text((110,242),REFERENCE,font=reffont,fill=(230,195,146))
    assert draw.textbbox((110,242),REFERENCE,font=reffont)[2]<916
    draw.line([(108,323),(916,323)],fill=(205,175,130),width=2)
    canvas.save(OUT,"WEBP",quality=92,method=6)
    meta=measurement(OUT)
    assert meta["width"]==1024 and meta["height"]==1280
    j=json.loads(RECORD.read_text(encoding="utf-8"))
    assert j.get("sourceMasterAssetId")=="bqv7-emotion-temptation-01"
    j["assetId"]="bqv7-emotion-temptation-01-derivatives"
    j["status"]="candidate_real_webp_type_independent_browser_qa_pending"
    j["variants"]=[{
        "kind":"TYPE","locale":"en",**meta,
        "embeddedWording":{"label":LABEL,"scriptureReference":REFERENCE,"scriptureTextIncluded":False},
        "focalPoint":{"x":0.57,"y":0.56},
        "cropIntent":"4:5 text-safe top heading and original CLEAN below",
        "altText":"A commuter hesitates over a found wallet on a train. English title: Tempted. Reference: 1 Corinthians 10:13.",
        "typography":{"method":"Pillow true WebP export from immutable CLEAN",
                      "fontFamily":"Noto Serif Regular","fontLicense":"SIL OFL 1.1",
                      "fontFilesDistributed":False,"sourceCleanSha256":CLEAN_SHA},
        "qa":{"imageDecoded":True,"dimensionsMeasured":True,"sha256Measured":True,
              "wordingFromTaxonomy":True,"referenceOnly":True,
              "independentVisualQA":"pending","actualBuiltAppBrowserQA":"pending",
              "productionReady":False}
    }]
    j["wordingEvidence"]={"sourcePath":"src/features/library/emotion-taxonomy.js",
                           "sourceBlobSha":TAXONOMY_BLOB,"canonicalEmotionId":"tempted",
                           "locale":"en","exactLabel":LABEL,"reference":REFERENCE,
                           "scriptureTextIncluded":False}
    j["generation"]={"derivativeMethod":"One new WebP English TYPE composited from existing generated CLEAN using licensed rasterized Noto Serif glyphs",
                      "sourceCleanSha256":CLEAN_SHA,"existingThumbSha256":THUMB_SHA}
    j["qc"]={"realWebP":True,"typeLabelCorrected":True,
             "sourceCleanSHAUnchanged":CLEAN_SHA,"sourceThumbSHAUnchanged":THUMB_SHA,
             "independentVisualQA":"pending",
             "builtAppBrowserQA":"pending","servedByteSHA":"pending",
             "productionReady":False}
    RECORD.write_text(json.dumps(j,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    assert digest(CLEAN.read_bytes())==CLEAN_SHA
    assert digest(THUMB.read_bytes())==THUMB_SHA
    print("TEMPTATION_TYPE_REAL_WEBP_PASS",meta)
    print("No approval: browser/rights/context/release independently pending.")

if __name__=="__main__":
    run()
