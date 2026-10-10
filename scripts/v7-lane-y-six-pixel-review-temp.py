#!/usr/bin/env python3
"""Source-hash locked Lane Y candidate review, no mutation or approval."""
import hashlib,io,json,subprocess
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ENTRIES=[{"pr":1493,"id":"joy","branch":"v7/lane-y-joy-webp-rebase-20261010","sha":"b405eb7ade97589a7cfaa75bea76fb81fdb32796"},{"pr":1497,"id":"anxiety-worry","branch":"v7/lane-y-anxiety-raster-repair-20261010","sha":"376209a14d7abe69133f2304f63c02f41eb0a84e"},{"pr":1498,"id":"rejection","branch":"v7/lane-y-rejection-raster-repair-20261010","sha":"d9b672bc575234d83128ca6164b052f5bd629a62"},{"pr":1499,"id":"temptation","branch":"v7/lane-y-temptation-type-webp-20261010","sha":"d276ab2ddc0201c60e146548bf33c6e114fa3940"},{"pr":1500,"id":"spiritual-dryness-distance","branch":"v7/lane-y-spiritual-dryness-webp-20261010","sha":"be9a93ea1992dcee8ff37f0c0f48737dfa9fa813"},{"pr":1502,"id":"hurt-betrayal","branch":"v7/lane-y-hurt-betrayal-isolated-webps-20261010","sha":"0677a9f30efafd8b20be5ea1c8e3db8b7369a9d7"}]
OUT=Path('artifacts/v7/lane-y-six-pixel-review')
OUT.mkdir(parents=True,exist_ok=True)
REPORT=[]
SHEET=Image.new('RGB',(840,len(ENTRIES)*330),'#e8e8e8')
draw=ImageDraw.Draw(SHEET)
def git(*args): return subprocess.check_output(['git',*args])
for i,e in enumerate(ENTRIES):
    name=e['id']; sha=e['sha']; remote='refs/remotes/origin/'+e['branch']
    subprocess.run(['git','fetch','--no-tags','--depth=1','origin',
                    '+refs/heads/'+e['branch']+':'+remote],check=True,stdout=subprocess.DEVNULL)
    found=git('rev-parse',remote).decode().strip()
    if found!=sha: raise SystemExit(f'HEAD CHANGED for {name}: {found} != {sha}')
    asset='bqv7-emotion-'+name+'-01'
    def get(path):
        return git('show',sha+':'+path)
    master=json.loads(get('data/v7/visual-assets/records/'+asset+'.json'))
    try:
        record=json.loads(get('data/v7/visual-assets/records/'+asset+'-derivatives.json'))
    except subprocess.CalledProcessError: record=master
    allvar=record.get('variants',[])
    if record!=master and allvar and not any(v.get('kind')=='CLEAN' for v in allvar):
        allvar=[{'kind':'CLEAN','imagePath':master.get('imagePath'),'sha256':master.get('sha256'),
                 'fileBytes':master.get('fileBytes'),'width':master.get('width'),'height':master.get('height')}]+allvar
    row={'PR':e['pr'],'id':name,'headSha':sha,'recordPrimary':record.get('imagePath'),
         'recordFormat':record.get('format'),'QAStatus':record.get('status'),
         'masterHash':master.get('sha256'),'variants':[],'flags':[]}
    y=i*330
    draw.text((10,y+5),f"#{e['pr']} {name} | {sha[:10]}",fill='#111')
    for k,kind in enumerate(['CLEAN','TYPE','THUMB']):
        v=next((x for x in allvar if x.get('kind')==kind),None)
        if not v:
            row['flags'].append('MISSING_'+kind);continue
        path='public'+v['imagePath']; blob=get(path)
        digest=hashlib.sha256(blob).hexdigest()
        im=Image.open(io.BytesIO(blob))
        im.load()
        dims=(im.width,im.height)
        problems=[]
        if im.format.lower()!=str(v.get('format','')).lower():problems.append('FORMAT')
        if digest!=v.get('sha256'):problems.append('HASH')
        if len(blob)!=v.get('fileBytes'):problems.append('BYTES')
        if list(dims)!=[v.get('width'),v.get('height')]:problems.append('DIMENSIONS')
        if kind=='TYPE' and v.get('locale')!='en':problems.append('TYPE_LOCALE')
        suffix={'CLEAN':'clean','TYPE':'type','THUMB':'thumb'}[kind]
        (OUT/(name+'-'+suffix+'.webp')).write_bytes(blob)
        for width in ([320,390,430,800] if kind=='TYPE' else ([100,320] if kind=='THUMB' else [320])):
            dest=OUT/(name+'-'+suffix+'-'+str(width)+'.png')
            im.resize((width,round(im.height*width/im.width)),Image.Resampling.LANCZOS).save(dest)
        targetW=245 if kind!='THUMB' else 133
        tile=im.convert('RGB');tile.thumbnail((targetW,270))
        x=[12,285,585][k]
        SHEET.paste(tile,(x,y+45))
        draw.text((x,y+315),kind,fill='#111')
        row['variants'].append({'kind':kind,'sha256':digest,'bytes':len(blob),
             'format':im.format,'width':dims[0],'height':dims[1],
             'issues':problems,'declaredSha256':v.get('sha256'),'path':path})
        row['flags']+= [kind+'_'+p for p in problems]
    if record.get('imagePath','').endswith('.svg'):
        row['flags'].append('RETIRED_SVG_PRIMARY_PATH')
    if record.get('imagePath') and record.get('imagePath')!=master.get('imagePath') and record.get('imagePath') not in [v.get('imagePath') for v in allvar]:
        row['flags'].append('PRIMARY_NOT_A_REAL_VARIANT')
    REPORT.append(row)
SHEET.save(OUT/'internal_qa_contact_sheet.png')
(OUT/'report.json').write_text(json.dumps(REPORT,indent=2)+'\n')
for entry in REPORT: print(json.dumps({'PR':entry['PR'],'id':entry['id'],'flags':entry['flags'],'assets':len(entry['variants'])}))
