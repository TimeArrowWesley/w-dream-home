from pathlib import Path
import json,hashlib,shutil
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923V1V4影音統一';A=P/'成品圖集/20260914暗色現代工業'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
jobs=read(R/'jobs.json');cs=read(R/'captures.json');q=read(R/'quality.json');keys={j['key'] for j in jobs}
assert read(R/'驗證.json')['passed'] and len(cs)==120
assert set(q['approved'])==keys and not q['pending']
provenance=[];fixes={}
for j in jobs:
 k=j['key'];final=Path(j['outputPath']);first=read(R/f'{k}-generation.json');attempts=[first]+[read(p) for p in sorted(R.glob(k+'-correction*.json'))]
 selected=next(x for x in reversed(attempts) if sha(Path(x['nativePath']))==sha(final));assert selected['modelHash']==j['modelHash']
 shutil.copy2(final,A/'originals'/f'{k}.png');shutil.copy2(j['modelPath'],A/'model'/f'{k}.png')
 (A/'prompts'/f'{k}.txt').write_text(first['prompt']+'\n',encoding='utf8')
 for i,x in enumerate(attempts[1:],1):
  p=A/'prompts'/f'{k}-correction{i:02}'
  p.with_suffix('.txt').write_text(x['prompt']+'\n',encoding='utf8');write(p.with_suffix('.json'),{'correction':x.get('correction','依來源模型校正AI偏差'),'aiPngSha256':sha(Path(x['nativePath']))})
 if len(attempts)>1:fixes[k]={'nativeAttempts':len(attempts),'finalPngSha256':sha(final)}
 provenance.append({**j,'selectedNativePath':selected['nativePath'],'finalPngSha256':sha(final),'attempts':attempts,'tool':'內建 image_gen'})
byview={e['key']:e for e in cs};byhash={j['modelHash']:j for j in jobs};m=read(R/'album-before.json');updated=[]
for e in m['entries']:
 c=byview.get(e['key'])
 if not c or not c['changed']:updated.append(e);continue
 j=byhash[c['modelHash']];shutil.copy2(R/c['model'],A/'model'/c['file'])
 updated.append({**c,'ai':f'originals/{j["key"]}.png','aiKey':j['key'],'status':'ai-reviewed','sharedWith':j['mappedViews'],'lastReviewed':'2026-09-23'})
m.update({'entries':updated,'modelRevision':'20260923-au01+bi01','imageRevision':'20260923-au01+bi01','imagesUpdatedAt':'2026-09-23'})
m['versionSources']['AU01']={'date':'2026-09-23','versions':['v1','v4'],'sourceFileSha256':{f:sha(P/f) for f in ['living-audio-unification.js','living-audio-finalize.js']},'basis':'Owner accepts open island-side space; V4 returns 45cm windowward, V1/V4 adopt shared V4 seat/front-speaker depth, rack-mounted small complete surround proposals and front/rear overhead rows. Dimensions/acoustics pending.','recapturedSlots':120,'newNativeAI':len(jobs),'updatedSlots':sum(c['changed'] for c in cs)}
write(A/'album-manifest.json',m)
current={e['aiKey'] for e in updated};oldq=read(A/'視覺核對.json');oldfix=read(A/'修正清單.json');allfix={k:v for k,v in oldfix.items() if k in current};allfix.update(fixes)
write(A/'視覺核對.json',{**oldq,'revision':m['imageRevision'],'reviewedFinalImages':sorted(current),'reviewedCorrections':sorted(allfix),'latestScope':'V1／V4各60來源視角比對，32個受影響AI重製並逐張核對；其餘來源相同保留。'})
write(A/'修正清單.json',allfix);write(R/'產圖紀錄.json',provenance)
print(json.dumps({'newAI':len(jobs),'updatedSlots':sum(c['changed'] for c in cs),'currentUnique':len(current)}))
