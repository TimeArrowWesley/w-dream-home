from pathlib import Path
import json,hashlib,shutil
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260924版本重編與V3';A=P/'成品圖集/20260914暗色現代工業'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
jobs=read(R/'jobs.json');cs=read(R/'captures-v3.json');q=read(R/'quality.json');keys={j['key'] for j in jobs}
assert read(R/'驗證.json')['passed'] and len(cs)==60
assert set(q['approved'])==keys and not q['pending']
provenance=[];fixes={}
for j in jobs:
 k=j['key'];final=Path(j['outputPath']);first=read(R/f'{k}-generation.json');attempts=[first]+[read(p) for p in sorted(R.glob(k+'-correction*.json'))]
 selected=next(x for x in reversed(attempts) if sha(Path(x['nativePath']))==sha(final));assert selected['modelHash']==j['modelHash']
 shutil.copy2(final,A/'originals'/f'{k}.png');shutil.copy2(j['modelPath'],A/'model'/f'{k}.png')
 (A/'prompts'/f'{k}.txt').write_text(first['prompt']+'\n',encoding='utf8')
 for i,x in enumerate(attempts[1:],1):
  p=A/'prompts'/f'{k}-correction{i:02}';p.with_suffix('.txt').write_text(x['prompt']+'\n',encoding='utf8');write(p.with_suffix('.json'),{'correction':x.get('correction','依來源模型校正AI偏差'),'aiPngSha256':sha(Path(x['nativePath']))})
 if len(attempts)>1:fixes[k]={'nativeAttempts':len(attempts),'finalPngSha256':sha(final)}
 provenance.append({**j,'selectedNativePath':selected['nativePath'],'finalPngSha256':sha(final),'attempts':attempts,'tool':'內建 image_gen'})
m=read(R/'album-before.json');registry=read(P/'version-registry.json');mapping=registry['legacyMap'];versions={v['id']:v for v in registry['versions']};updated=[]
for e in m['entries']:
 v=mapping[e['version']];updated.append({**e,'version':v,'key':v+e['key'][2:],'versionTitle':versions[v]['name'],'legacyVersion':e['version'],'legacyKey':e['key']})
byhash={e['modelHash']:e for e in updated};byjob={j['modelHash']:j for j in jobs}
for c in cs:
 k=byjob[c['modelHash']]['key'] if c['modelHash'] in byjob else byhash[c['modelHash']]['aiKey']
 shutil.copy2(R/c['model'],A/'model'/c['file'])
 updated.append({**c,'versionTitle':versions['v3']['name'],'ai':f'originals/{k}.png','aiKey':k,'status':'ai-reviewed','lastReviewed':'2026-09-24','legacyVersion':'v4','basis':'原V4固定電視與開放收藏區＋V1圓弧中島及頂天雙面玻璃櫃'})
assert len(updated)==360 and len({e['key'] for e in updated})==360
for e in updated:e['sharedWith']=[x['key'] for x in updated if x['aiKey']==e['aiKey']]
m.update({'entries':updated,'modelRevision':'20260924-vn01','imageRevision':'20260924-vn01','imagesUpdatedAt':'2026-09-24','currentVersionRegistry':'version-registry.json'})
m['versionSources']['VN01']={'date':'2026-09-24','legacyMap':mapping,'sourceFileSha256':{f:sha(P/f) for f in ['version-registry.json','hybrid-arc-island.js','hybrid-arc-adjustments.js','提案/南牆電視與圓弧中島/layout-version.js']},'basis':'New public V2=oldV4, V4=oldV2(discontinued), V5=oldV3; V3 combines oldV4 base with exact V1 arc island, full-height double-sided glass and two outside stools. Physical dimensions and construction details pending. Legacy versionSources and asset filenames preserve their historical identifiers.','recapturedSlots':60,'newNativeAI':len(jobs),'addedSlots':60,'sameSourceRetained':60-len(jobs)}
write(A/'album-manifest.json',m)
current={e['aiKey'] for e in updated};oldq=read(A/'視覺核對.json');oldfix=read(A/'修正清單.json');allfix={k:v for k,v in oldfix.items() if k in current};allfix.update(fixes)
write(A/'視覺核對.json',{**oldq,'revision':m['imageRevision'],'reviewedFinalImages':sorted(current),'reviewedCorrections':sorted(allfix),'latestScope':'版本重編並新增V3，共360圖位；新增V3全60來源角度，19張原生AI逐圖核對，41張來源像素完全相同保留。'})
write(A/'修正清單.json',allfix);write(R/'產圖紀錄.json',provenance)
print(json.dumps({'newAI':len(jobs),'addedSlots':60,'totalSlots':len(updated),'currentUnique':len(current)}))
