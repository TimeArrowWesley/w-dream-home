"""Install reviewed IR01 native AI and repaired model sources; preserve prior assets."""
from pathlib import Path
import json,hashlib,shutil
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260924全版本模型修復';A=P/'成品圖集/20260914暗色現代工業'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
jobs=read(R/'jobs.json');q=read(R/'quality.json');keys={j['key'] for j in jobs}
assert read(R/'模型驗證.json')['passed']
assert set(q['approved'])==keys and not q['pending']
captures=[c for v in range(6) for c in read(R/f'captures-v{v}.json')]
assert len(captures)==360 and sum(c['changed'] for c in captures)==59 and len(jobs)==55
byjob={j['modelHash']:j for j in jobs};bycapture={c['key']:c for c in captures};provenance=[];fixes={}
for j in jobs:
 k=j['key'];final=Path(j['outputPath']);first=read(R/f'{k}-generation.json');attempts=[first]+[read(p) for p in sorted(R.glob(k+'-correction*.json'))]
 selected=next(x for x in reversed(attempts) if sha(Path(x['nativePath']))==sha(final));assert selected['modelHash']==j['modelHash']
 shutil.copy2(final,A/'originals'/f'{k}.png');shutil.copy2(j['modelPath'],A/'model'/f'{k}.png')
 (A/'prompts'/f'{k}.txt').write_text(first['prompt']+'\n',encoding='utf8')
 for i,x in enumerate(attempts[1:],1):
  p=A/'prompts'/f'{k}-correction{i:02}';p.with_suffix('.txt').write_text(x['prompt']+'\n',encoding='utf8');write(p.with_suffix('.json'),{'correction':x.get('correction','依來源模型校正AI偏差'),'aiPngSha256':sha(Path(x['nativePath']))})
 if len(attempts)>1:fixes[k]={'nativeAttempts':len(attempts),'finalPngSha256':sha(final)}
 provenance.append({**j,'selectedNativePath':selected['nativePath'],'finalPngSha256':sha(final),'attempts':attempts,'tool':'內建 image_gen'})
m=read(R/'album-before.json');updated=[]
for old in m['entries']:
 c=bycapture[old['key']]
 assert c['previousModelHash']==old['modelHash']
 if c['changed']:
  k=byjob[c['modelHash']]['key'];e={**old,**c,'ai':f'originals/{k}.png','aiKey':k,'status':'ai-reviewed','lastReviewed':'2026-09-24'}
  shutil.copy2(R/c['model'],A/'model'/c['file'])
 else:
  assert c['modelHash']==old['modelHash'];e={**old,'sourceRevision':'20260924-ir01','lastSourceCompared':'2026-09-24'}
 updated.append(e)
for e in updated:e['sharedWith']=[x['key'] for x in updated if x['aiKey']==e['aiKey']]
m.update(entries=updated,modelRevision='20260924-ir01',imageRevision='20260924-ir01',imagesUpdatedAt='2026-09-24')
m['versionSources']['IR01']={'date':'2026-09-24','sourceFileSha256':{f:sha(P/f) for f in ['island-shell-repairs.js','equipment-models.js','industrial-design.js']},'basis':'All V0–V5 including historical V4/V5. Repair incomplete island service skins while preserving robot entries, equipment and layouts; restore double-sided sink liners; separate TV glass from casing to prevent z-fighting. Model repair only; joinery, ventilation and plumbing details await professional construction review.','recapturedSlots':360,'newNativeAI':55,'updatedSlots':59,'sameSourceRetained':301}
write(A/'album-manifest.json',m)
current={e['aiKey'] for e in updated};oldq=read(A/'視覺核對.json');oldfix=read(A/'修正清單.json');allfix={k:v for k,v in oldfix.items() if k in current};allfix.update(fixes)
write(A/'視覺核對.json',{**oldq,'revision':m['imageRevision'],'reviewedFinalImages':sorted(current),'reviewedCorrections':sorted(allfix),'latestScope':'IR01六版360來源角度重新比對；55張原生AI逐圖核對、更新59圖位，其餘301圖位來源相同保留。'})
write(A/'修正清單.json',allfix);write(R/'產圖紀錄.json',provenance)
print(json.dumps({'newAI':55,'updatedSlots':59,'totalSlots':len(updated),'currentUnique':len(current)}))
