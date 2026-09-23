from pathlib import Path
import json,hashlib,shutil
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923V4灰石工業校正';A=P/'成品圖集/20260914暗色現代工業'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
jobs=read(R/'jobs.json');captures=read(R/'captures.json');quality=read(R/'quality.json')
assert len(jobs)==30 and len(captures)==60
assert set(quality['approved'])=={j['key'] for j in jobs} and not quality['pending']
history=[]
for p in sorted(R.glob('batch-*.json')):history.extend(read(p))
for j in jobs:
 k=j['key'];src=R/'ai'/f'{k}.png';h=sha(src);attempts=[x for x in history if x['key']==k];chosen=next(x for x in reversed(attempts) if sha(Path(x['outputPath']))==h)
 assert h==quality['sha256'][k]
 shutil.copy2(src,A/'originals'/f'{k}.png');shutil.copy2(j['modelPath'],A/'model'/f'{k}.png')
 (A/'prompts'/f'{k}.txt').write_text(attempts[0]['prompt']+'\n',encoding='utf8')
 if len(attempts)>1:
  (A/'prompts'/f'{k}-correction01.txt').write_text(chosen['prompt']+'\n',encoding='utf8')
  write(A/'prompts'/f'{k}-correction01.json',{'correction':'GI01逐圖核對後局部修正；以R02配置及GI01來源材質／光色為準。','aiPngSha256':h})
manifest=read(R/'album-before.json');bykey={c['key']:c for c in captures};new=[]
for e in manifest['entries']:
 if e['version']!='v4' or not bykey[e['key']]['changed']:new.append(e);continue
 c=bykey[e['key']];k=e['key']+'-v4gi01';shutil.copy2(R/c['model'],A/'model'/c['file'])
 new.append({**c,'ai':f'originals/{k}.png','aiKey':k,'status':'ai-reviewed','sharedWith':[e['key']],'lastReviewed':'2026-09-23'})
manifest.update({'entries':new,'modelRevision':'20260923-v4r02-gi01+other-versions-retained','imageRevision':'20260923-v4gi01+retained','imagesUpdatedAt':'2026-09-23'})
manifest['versionSources']['V4-GI01']={'date':'2026-09-23','basis':'Owner accepted gray-stone modern industrial refinement: graphite cabinet fronts, brushed gunmetal details and zoned lighting. R02 geometry retained.','sourceFileSha256':{f:sha(P/f) for f in ['v4-industrial-refinement.js','comfort-controls.js']},'recapturedV4Slots':60,'newAI':30,'retainedV4Slots':30,'lightingOnlyRecapture':['v4-study-D'],'limits':'Source rasterizer omits physical lighting; study-D explicitly regenerated for lighting despite identical pixels.'}
write(A/'album-manifest.json',manifest)
keys={e['aiKey'] for e in new};q=read(A/'視覺核對.json');q.update({'revision':manifest['imageRevision'],'reviewedFinalImages':sorted(keys),'latestScope':'V4全60圖位比對；30張GI01原生AI逐圖核對，其餘30圖位保持。書房D來源像素相同，但照明意向改變仍重製。'})
fixes={k:v for k,v in read(A/'修正清單.json').items() if k in keys}
for j in jobs:
 attempts=[x for x in history if x['key']==j['key']]
 if len(attempts)>1:fixes[j['key']]={'nativeAttempts':len(attempts),'finalPngSha256':sha(R/'ai'/f"{j['key']}.png")}
q['reviewedCorrections']=sorted(set(q.get('reviewedCorrections',[]))|set(fixes));write(A/'視覺核對.json',q);write(A/'修正清單.json',fixes)
print(json.dumps({'slots':len(new),'newAI':30,'V4retained':30,'uniqueAI':len(keys)},ensure_ascii=False))
