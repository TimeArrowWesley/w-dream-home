"""Install GR06 only after all native AI candidates have passed visual review."""
from pathlib import Path
import json,hashlib,shutil,datetime
P=Path(__file__).resolve().parents[1]; R=P/'調整紀錄/20260922灰石全屋'; A=P/'成品圖集/20260914暗色現代工業'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
jobs=read(R/'jobs.json'); captures=read(R/'captures.json'); quality=read(R/'quality-progress.json')
keys={j['key'] for j in jobs}
assert len(keys)==208 and len(captures)==300
assert set(quality['approved'])==keys,sorted(keys-set(quality['approved']))
assert not quality.get('pendingFixes'),quality.get('pendingFixes')
history={key:[] for key in keys}
def collect(x):
 if isinstance(x,list):
  for y in x:collect(y)
 elif isinstance(x,dict):
  if x.get('key') in keys and x.get('outputPath'):
   output=Path(x['outputPath'])
   if output.exists():history[x['key']].append({**x,'hash':sha(output),'time':output.stat().st_mtime})
  elif 'value' in x:collect(x['value'])
for p in [R/'generated.json',*R.glob('batch*.json')]:collect(read(p))
for folder in ['model','originals','prompts']:(A/folder).mkdir(exist_ok=True)
corrections={}
for j in jobs:
 key=j['key']; final=R/'ai'/f'{key}.png'; finalhash=sha(final)
 records=sorted({x['hash']:x for x in history[key]}.values(),key=lambda x:x['time'])
 assert any(x['hash']==finalhash for x in records),f'No native provenance: {key}'
 selected=next(x for x in records if x['hash']==finalhash)
 shutil.copy2(R/'model'/f'{key}.png',A/'model'/f'{key}.png')
 shutil.copy2(final,A/'originals'/f'{key}.png')
 (A/'prompts'/f'{key}.txt').write_text(records[0]['prompt']+'\n',encoding='utf8')
 # The final selected record may be a localized edit; retain its full chain.
 for n,x in enumerate(records[1:records.index(selected)+1],1):
  stem=A/'prompts'/f'{key}-correction{n:02}'
  write(stem.with_suffix('.json'),{'correction':'對照同角度模型後重製／局部修正；保留原始生成提示。','aiPngSha256':x['hash']})
  stem.with_suffix('.txt').write_text(x['prompt']+'\n',encoding='utf8')
 if len(records)>1:corrections[key]={'nativeAttempts':len(records),'finalPngSha256':finalhash}
byhash={j['modelHash']:j for j in jobs}; entries=[]
for c in captures:
 j=byhash[c['modelHash']]; key=j['key']
 shutil.copy2(R/c['model'],A/'model'/c['file'])
 entries.append({**c,'ai':f'originals/{key}.png','aiKey':key,'status':'ai-reviewed','sharedWith':j['mappedViews'],'sourceRevision':'20260922-gr06','lastReviewed':'2026-09-22'})
old=read(A/'album-manifest.json')
sources={p:sha(P/p) for p in ['grey-stone-design.js','model-audit-repairs.js','model-repairs.js','design.js','提案/旋轉電視與直線中島/design.js','v1-r05-adjustments.js'] if (P/p).exists()}
manifest={**old,'capturedAt':'2026-09-22','modelRevision':'20260922-gr06','imageRevision':'20260922-gr06','imagesUpdatedAt':'2026-09-22','entries':entries}
manifest['versionSources']={**old.get('versionSources',{}),'GR06':{'date':'2026-09-22','sourceFileSha256':sources,'basis':'Gray stone focal surface, gray-brown herringbone floor; existing geometry retained. Five source cameras per room and version. Native AI shared only for identical source pixels.','viewSlots':300,'uniqueNativeAI':208}}
write(A/'album-manifest.json',manifest)
write(A/'視覺核對.json',{'revision':'20260922-gr06','reviewedFinalImages':sorted(keys),'reviewedCorrections':sorted(corrections),'scope':'逐一對照來源模型核對相機、開口、櫃體、設備及材料；AI 示意不能證明施工尺寸。'})
write(A/'修正清單.json',corrections)
print(json.dumps({'installedSlots':len(entries),'uniqueAI':len(keys),'correctedImages':len(corrections)},ensure_ascii=False))
