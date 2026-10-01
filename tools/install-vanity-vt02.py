"""Install reviewed native vanity AI images into their exact shared source slots."""
from pathlib import Path
import json,shutil,hashlib
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20261001全版本化妝桌VT02';A=P/'成品圖集/20260914暗色現代工業'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,o):p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
assert read(R/'模型驗證.json')['passed']
jobs=read(R/'jobs.json');q=read(R/'quality.json');assert set(q['approved'])=={j['key'] for j in jobs} and not q['pending']
m=read(R/'album-before.json');captures={e['key']:e for v in range(6) for e in read(R/f'captures-v{v}.json')};fixes=read(A/'修正清單.json');provenance=[]
for j in jobs:
 k=j['key'];job=q['images'][k];src=Path(job['nativePath']);model=R/j['source']
 assert len({captures[s]['modelHash'] for s in j['slots']})==1
 shutil.copy2(src,A/'originals'/f'{k}.png');shutil.copy2(model,A/'model'/f'{k}.png');shutil.copy2(R/'prompts'/f'{k}.txt',A/'prompts'/f'{k}.txt')
 for i,step in enumerate(job['corrections'],1):
  shutil.copy2(R/'prompts'/step['prompt'],A/'prompts'/f'{k}-correction{i:02}.txt')
  write(A/'prompts'/f'{k}-correction{i:02}.json',{'correction':step['reason'],'aiPngSha256':sha(src)})
 if job['corrections']:fixes[k]={'nativeAttempts':1+len(job['corrections']),'finalPngSha256':sha(src)}
 provenance.append({'key':k,**job,'nativeSha256':sha(src),'sourceSha256':sha(model),'sourceCamera':captures[j['slots'][0]],'usedBy':j['slots'],'tool':'Built-in image_gen'})
 for e in m['entries']:
  if e['key'] in j['slots']:
   c=captures[e['key']];e.update(previousAI=e['aiKey'],aiKey=k,ai=f'originals/{k}.png',file=f'{k}.png',model=f'model/{k}.png',modelHash=c['modelHash'],p=c['p'],t=c['t'],fov=c['fov'],direction=c['direction'],sourceRevision='20261001-vt02',status='ai-reviewed',lastReviewed='2026-10-01',captureState='Vanity mirror lid, jewelry and perfume trays closed; stool stowed. Exterior is a neutral placeholder, not a site view.')
for e in m['entries']:e['sharedWith']=[x['key'] for x in m['entries'] if x['aiKey']==e['aiKey']]
m.update(modelRevision='20261001-vt02',imageRevision='20261001-vt02',imagesUpdatedAt='2026-10-01')
m['versionSources']['VT02']={'date':'2026-10-01','sourceFileSha256':{f:sha(P/f) for f in ['vanity-display.js','vanity-display-finalize.js','bedroom-controls.js']},'basis':'Owner adopted glass-display vanity in all six bedrooms including history V4/V5. Existing footprint, walls, windows, bed and other furniture preserved. Glass tabletop, opaque closed mirror lid, shallow jewelry tray, two end perfume compartments with two drawers below each. Controls flip then pull the mirror and independently extend perfume trays.','recapturedSlots':30,'newNativeAI':9,'updatedSlots':18,'bedroomUnchangedSourceSlots':12,'otherRoomSlotsRetained':330,'limits':'Specified bedroom views and moving-mesh samples only; other rooms retain prior AI. Model dimensions, knee fit, glass support, hardware loads, outlet wiring and window-opening clearances require professional/site confirmation. Bottle proxies are illustrative; 20cm is a design allowance, not a verified universal maximum for 100mL bottles.'}
write(A/'album-manifest.json',m)
current={e['aiKey'] for e in m['entries']};fixes={k:v for k,v in fixes.items() if k in current};write(A/'修正清單.json',fixes)
review=read(A/'視覺核對.json');review.update(revision='20261001-vt02',reviewedFinalImages=sorted(current),reviewedCorrections=sorted(fixes),latestScope='VT02九張新原生AI逐圖對照：窗下玻璃桌、收妥鏡蓋、左右香水區與下方雙抽屜、原床與門口保持；三張窗景改為中性背景，V4門外誤畫衣物校正。更新六版18個主臥圖位，另12個主臥來源相同保留，330個其他房間圖位沿用前版。');write(A/'視覺核對.json',review);write(R/'產圖紀錄.json',provenance)
print(json.dumps({'newAI':9,'updatedSlots':18,'totalSlots':len(m['entries']),'uniqueImages':len(current)}))
