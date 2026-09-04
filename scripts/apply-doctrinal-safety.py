#!/usr/bin/env python3
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKS = ROOT / 'data' / 'packs' / 'questions'
MANIFEST = ROOT / 'data' / 'packs' / 'manifest.json'
QUAR = ROOT / 'data' / 'quarantine' / 'questions'
QUAR.mkdir(parents=True, exist_ok=True)

TOPICS = [
    ('salvation', re.compile(r'\b(salvation|saved|justify|justified|justification|righteousness|works of the law|eternal life|condemnation|grace|faith)\b', re.I)),
    ('baptism', re.compile(r'\b(bapti[sz](?:e|ed|ing|m)|water baptism)\b', re.I)),
    ('holy-spirit', re.compile(r'\b(Holy Spirit|Spirit baptism|filled with the Spirit|tongues|speaking in tongues|spiritual gifts?)\b', re.I)),
    ('healing', re.compile(r'\b(heal(?:ed|ing)?|divine healing|sick(?:ness)?|anoint(?:ed|ing)?)\b', re.I)),
    ('communion', re.compile(r"\b(Lord(?:'s|’s) Supper|communion|Eucharist|bread and cup|body and blood)\b", re.I)),
    ('sanctification', re.compile(r'\b(sanctif(?:y|ied|ication)|holiness|holy life)\b', re.I)),
    ('election', re.compile(r'\b(predestin(?:ed|ation)|elect(?:ion|ed)?|chosen before|foreknow)\b', re.I)),
    ('security', re.compile(r'\b(eternal security|lose salvation|fall away|apostasy|once saved)\b', re.I)),
    ('end-times', re.compile(r'\b(rapture|tribulation|millennium|second coming|return of Christ|antichrist|mark of the beast|end times|last days)\b', re.I)),
    ('church-office', re.compile(r'\b(elder|pastor|bishop|deacon|women.*teach|women.*pastor|church authority)\b', re.I)),
    ('marriage-sexuality', re.compile(r'\b(marriage|divorce|remarry|adultery|sexual immorality|homosexual|same-sex|husband|wife)\b', re.I)),
    ('creation', re.compile(r'\b(six days|creation days|age of the earth|young earth|old earth)\b', re.I)),
    ('spiritual-warfare', re.compile(r'\b(demon|demons|deliverance|spiritual warfare|possess(?:ed|ion))\b', re.I)),
    ('giving', re.compile(r'\b(tith(?:e|es|ing)|prosperity|seed faith|financial blessing)\b', re.I)),
]

HIGH_RISK = [re.compile(x, re.I) for x in [
    r'\bwho is justified before God\b',
    r'\bwhat (?:must|should) (?:a person|someone|people|we) do (?:to|in order to) (?:be saved|receive eternal life|be justified|have sins forgiven)\b',
    r'\bhow (?:is|are) .* saved\b',
    r'\bwhat role do .* works .* justification\b',
    r'\bwhat do .* receive .* eternal life\b',
    r'\bforgiveness of (?:their|your|our) sins\b',
    r'\bwhat is required .* salvation\b',
    r'\bwhat evidence .* Holy Spirit\b',
    r'\bmust .* speak .* tongues\b',
    r'\bwill God heal\b',
    r'\bguarantee(?:d)? healing\b',
    r'\bwhen will .* rapture\b',
    r'\bwho can be .* pastor\b',
]]

TEXTUAL = [re.compile(x, re.I) for x in [
    r'\baccording to\b', r'\bwhat did (?:Jesus|Paul|Peter|John|Moses|David|the apostles?|the angel|God|the Lord)\b',
    r'\bwhat does (?:Paul|Peter|John|Jesus|the passage|the verse|the text) say\b', r'\bwhat happened\b', r'\bwho\b', r'\bwhere\b', r'\bwhen\b', r'\bwhich\b', r'\bhow many\b'
]]

CONTEXT_REFS = [re.compile(x, re.I) for x in [
    r'^Romans\s+2:', r'^Romans\s+9:', r'^Romans\s+11:', r'^Acts\s+2:38', r'^Acts\s+8:', r'^Acts\s+10:', r'^Acts\s+19:',
    r'^Hebrews\s+6:', r'^Hebrews\s+10:', r'^James\s+2:', r'^1 Corinthians\s+11:', r'^1 Corinthians\s+12:', r'^1 Corinthians\s+14:',
    r'^1 Timothy\s+2:', r'^1 Peter\s+3:21', r'^Revelation\s+20:'
]]

BOOK_NAMES = {
    'GEN':'Genesis','EXO':'Exodus','LEV':'Leviticus','NUM':'Numbers','DEU':'Deuteronomy','JOS':'Joshua','JDG':'Judges','RUT':'Ruth',
    '1SA':'1 Samuel','2SA':'2 Samuel','1KI':'1 Kings','2KI':'2 Kings','1CH':'1 Chronicles','2CH':'2 Chronicles','EZR':'Ezra','NEH':'Nehemiah',
    'EST':'Esther','JOB':'Job','PSA':'Psalms','PRO':'Proverbs','ECC':'Ecclesiastes','SNG':'Song of Songs','ISA':'Isaiah','JER':'Jeremiah',
    'LAM':'Lamentations','EZK':'Ezekiel','DAN':'Daniel','HOS':'Hosea','JOL':'Joel','AMO':'Amos','OBA':'Obadiah','JON':'Jonah','MIC':'Micah',
    'NAM':'Nahum','HAB':'Habakkuk','ZEP':'Zephaniah','HAG':'Haggai','ZEC':'Zechariah','MAL':'Malachi','MAT':'Matthew','MRK':'Mark',
    'LUK':'Luke','JHN':'John','ACT':'Acts','ROM':'Romans','1CO':'1 Corinthians','2CO':'2 Corinthians','GAL':'Galatians','EPH':'Ephesians',
    'PHP':'Philippians','COL':'Colossians','1TH':'1 Thessalonians','2TH':'2 Thessalonians','1TI':'1 Timothy','2TI':'2 Timothy','TIT':'Titus',
    'PHM':'Philemon','HEB':'Hebrews','JAS':'James','1PE':'1 Peter','2PE':'2 Peter','1JN':'1 John','2JN':'2 John','3JN':'3 John','JUD':'Jude','REV':'Revelation'
}

def classify(item, book_name):
    q = str(item.get('q',''))
    a = str(item.get('a',''))
    ref = str(item.get('r',''))
    full_ref = f'{book_name} {ref}'.strip()
    combined = f'{q} {a}'
    topics = [name for name, rx in TOPICS if rx.search(combined)]
    high = any(rx.search(q) for rx in HIGH_RISK)
    context_ref = any(rx.search(full_ref) for rx in CONTEXT_REFS)
    textual = any(rx.search(q) for rx in TEXTUAL)
    if high or (topics and not textual):
        return 'quarantine', topics
    if topics or context_ref:
        return 'context', topics
    return 'allow', []

stats = {'total':0,'allow':0,'context':0,'quarantine':0}
book_counts = {}
for path in sorted(PACKS.glob('*.json')):
    code = path.stem
    book = BOOK_NAMES.get(code, code)
    items = json.loads(path.read_text(encoding='utf-8'))
    safe, quarantine = [], []
    for item in items:
        stats['total'] += 1
        action, topics = classify(item, book)
        stats[action] += 1
        if action == 'quarantine':
            quarantine.append({**item, 'safety': {'action': action, 'topics': topics}})
        else:
            safe.append({**item, 'safety': {'action': action, 'topics': topics}})
    path.write_text(json.dumps(safe, ensure_ascii=False, separators=(',',':')) + '\n', encoding='utf-8')
    book_counts[code] = {'questions': len(safe), 'quarantined_questions': len(quarantine)}
    qpath = QUAR / path.name
    if quarantine:
        qpath.write_text(json.dumps(quarantine, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    elif qpath.exists():
        qpath.unlink()

if MANIFEST.exists():
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    for row in manifest.get('question_books', []):
        counts = book_counts.get(row.get('code'))
        if counts:
            row.update(counts)
    manifest['doctrinal_safety'] = {
        'version': 1,
        'policy': 'Scripture + CAMACOP alignment; sensitive imported questions screened before normal play',
        **stats
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, separators=(',',':')) + '\n', encoding='utf-8')

print(json.dumps(stats, indent=2))