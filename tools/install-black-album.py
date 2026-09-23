"""Install BI01 only after all native AI images have been individually reviewed."""
from pathlib import Path
import json,hashlib,shutil
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923全版本霧黑工業';A=P/'成品圖集/20260914暗色現代工業'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
jobs=read(R/'jobs.json');captures=read(R/'captures.json');quality=read(R/'quality-progress.json');keys={j['key'] for j in jobs}
assert len(captures)==300 and len(keys)==len(jobs)
assert set(quality['approved'])==keys,sorted(keys-set(quality['approved']))
assert not quality['pendingFixes'],quality['pendingFixes']
history={k:[] for k in keys}
for p in sorted(R.glob('batch*.json')):
 if p.name.endswith('-jobs.json'):continue
 for row in read(p):
  if row.get('key') in keys and row.get('nativePath'):
   source=Path(row['nativePath']);assert source.exists();history[row['key']].append({**row,'sha256':sha(source)})
for key,attempts in history.items():
 # Recovery and aggregate records can point at the same native output. Keep
 # each actual generation once, in creation order rather than batch-name order.
 unique={x['nativePath']:x for x in attempts}
 history[key]=sorted(unique.values(),key=lambda x:Path(x['nativePath']).stat().st_mtime)
corrections={};provenance=[]
for j in jobs:
 key=j['key'];final=Path(j['outputPath']);finalsha=sha(final);attempts=history[key];selected=next(x for x in reversed(attempts) if x['sha256']==finalsha)
 assert selected['modelHash']==j['modelHash'],f'AI derived from obsolete model: {key}'
 for directory in ['model','originals','prompts']:(A/directory).mkdir(exist_ok=True)
 shutil.copy2(j['modelPath'],A/'model'/f'{key}.png');shutil.copy2(final,A/'originals'/f'{key}.png')
 (A/'prompts'/f'{key}.txt').write_text(attempts[0]['prompt']+'\n',encoding='utf8')
 for i,x in enumerate(attempts[1:attempts.index(selected)+1],1):
  prefix=A/'prompts'/f'{key}-correction{i:02}'
  write(prefix.with_suffix('.json'),{'correction':x.get('correction','對照來源模型後修正生成錯誤'),'aiPngSha256':x['sha256']})
  prefix.with_suffix('.txt').write_text(x['prompt']+'\n',encoding='utf8')
 if len(attempts)>1:corrections[key]={'nativeAttempts':len(attempts),'finalPngSha256':finalsha}
 provenance.append({'key':key,'mappedViews':j['mappedViews'],'selectedNativePath':selected['nativePath'],'finalPath':str(final),'modelHash':j['modelHash'],'finalPngSha256':finalsha,'tool':'內建 image_gen','attempts':attempts})
byhash={j['modelHash']:j for j in jobs};entries=[]
for c in captures:
 j=byhash[c['modelHash']];shutil.copy2(R/c['model'],A/'model'/c['file'])
 entries.append({**c,'ai':f'originals/{j["key"]}.png','aiKey':j['key'],'status':'ai-reviewed','sharedWith':j['mappedViews'],'sourceRevision':'20260923-bi01','lastReviewed':'2026-09-23'})
old=read(R/'album-before.json')
sources={p:sha(P/p) for p in ['black-industrial-design.js','grey-stone-design.js','v4-industrial-refinement.js','model-audit-repairs.js','model-repairs.js','v4-public-adjustments.js','v4-public-finalize.js']}
manifest={**old,'capturedAt':'2026-09-23','modelRevision':'20260923-bi01','imageRevision':'20260923-bi01','imagesUpdatedAt':'2026-09-23','entries':entries}
manifest['versionSources']={**old.get('versionSources',{}),'BI01':{'date':'2026-09-23','sourceFileSha256':sources,'basis':'Accepted matte-black ceiling, medium-gray walls, graphite joinery, gray stone and gray-brown herringbone. All five layouts retained; all 300 AI slots replaced with newly generated and reviewed images.','viewSlots':300,'uniqueNativeAI':len(jobs)}}
write(A/'album-manifest.json',manifest);write(A/'視覺核對.json',{'revision':'20260923-bi01','reviewedFinalImages':sorted(keys),'reviewedCorrections':sorted(corrections),'scope':'每個獨立AI對照來源檢視主要配置、材質及設備；細紋、外景、反射為示意，非施工或照度核定'})
write(A/'修正清單.json',corrections);write(R/'產圖紀錄.json',provenance)
print(json.dumps({'installedSlots':len(entries),'uniqueAI':len(jobs),'corrected':len(corrections)},ensure_ascii=False))
