"""Install five reviewed native AI images into the 25 V1–V5 study slots."""
from pathlib import Path
import json,shutil,hashlib,re
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20261001電競房CP02';A=P/'成品圖集/20260914暗色現代工業'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
assert read(R/'模型驗證.json')['passed']
jobs=read(R/'quality.json');assert jobs['approved']==list('ABCDE') and not jobs['pending']
m=read(R/'album-before.json');captures={e['key']:e for v in range(1,6) for e in read(R/f'captures-v{v}.json')};fixes=read(A/'修正清單.json');provenance=[]
for a in 'ABCDE':
 k=f'study-{a}-cp02';job=jobs['images'][a];src=Path(job['nativePath']);model=R/'model'/f'v1-study-{a}-cp02.png'
 assert len({e['modelHash'] for e in captures.values() if e['angle']==a})==1
 shutil.copy2(src,A/'originals'/f'{k}.png');shutil.copy2(model,A/'model'/f'{k}.png');shutil.copy2(R/'prompts'/f'CP02-{a}.txt',A/'prompts'/f'{k}.txt')
 corrections=[]
 for i,step in enumerate(job['corrections'],1):
  shutil.copy2(R/'prompts'/step['prompt'],A/'prompts'/f'{k}-correction{i:02}.txt')
  write(A/'prompts'/f'{k}-correction{i:02}.json',{'correction':step['reason'],'aiPngSha256':sha(src)})
  corrections.append(step)
 if corrections:fixes[k]={'nativeAttempts':1+len(corrections),'finalPngSha256':sha(src)}
 provenance.append({'key':k,**job,'nativeSha256':sha(src),'sourceSha256':sha(model),'sourceCamera':captures[f'v1-study-{a}'],'tool':'Built-in image_gen'})
 for e in m['entries']:
  if e['room']=='study' and e['version']!='v0' and e['angle']==a:
   c=captures[e['key']];e.update(previousAI=e['aiKey'],aiKey=k,ai=f'originals/{k}.png',file=f'{k}.png',model=f'model/{k}.png',modelHash=c['modelHash'],p=c['p'],t=c['t'],fov=c['fov'],direction=c['direction'],sourceRevision='20261001-cp02',status='ai-reviewed',lastReviewed='2026-10-01',captureState='Existing study privacy-glass display ON; unchanged doors outside frame. Exterior neutral placeholder.')
for e in m['entries']:e['sharedWith']=[x['key'] for x in m['entries'] if x['aiKey']==e['aiKey']]
m.update(modelRevision='20261001-cp02',imageRevision='20261001-cp02',imagesUpdatedAt='2026-10-01')
m['versionSources']['CP02']={'date':'2026-10-01','sourceFileSha256':{f:sha(P/f) for f in ['study-cyberpunk.js','study-cyberpunk-finalize.js','rgb-lighting.js']},'basis':'Owner-approved cyberpunk study in V1–V5; V0 original preserved. Existing desks, room openings and version-specific door types retained. Shared six drawers, manga display, opaque upper storage, graphite desk wall, cyan/magenta LEDs and PC appearance. Five shared model camera renders checked pixel-identical across five variants. Gallery uses existing privacy-glass display state; no fictional exterior view.','recapturedSlots':25,'newNativeAI':5,'updatedSlots':25,'otherSlotsRetained':335,'limits':'Other room AI views remain their prior revisions, including any older study glimpses through glazing. This is a study-only gallery update, not a revalidation of all 360 views. Book capacity, shelf loads and construction remain unverified.'}
write(A/'album-manifest.json',m)
current={e['aiKey'] for e in m['entries']};fixes={k:v for k,v in fixes.items() if k in current};write(A/'修正清單.json',fixes)
q=read(A/'視覺核對.json');q.update(revision='20261001-cp02',reviewedFinalImages=sorted(current),reviewedCorrections=sorted(fixes),latestScope='CP02五張原生AI逐圖對照新模型，修正窗框、椅子代理、玻璃隔間與主機位置偏差；更新V1～V5共25個書房圖位。其他335圖位沿用前版，沒有重新全屋驗收。');write(A/'視覺核對.json',q);write(R/'產圖紀錄.json',provenance)
print(json.dumps({'newAI':5,'updatedSlots':25,'totalSlots':len(m['entries']),'uniqueImages':len(current)}))
