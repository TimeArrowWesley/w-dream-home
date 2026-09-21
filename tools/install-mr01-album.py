"""Install reviewed MR01 image outputs, sharing only identical source pixels."""
from pathlib import Path
import json, shutil, hashlib
P=Path(__file__).resolve().parents[1]
R=P/'調整紀錄/20260921四版動線修正'
A=P/'成品圖集/20260914暗色現代工業'
def read(p): return json.loads(p.read_text(encoding='utf8'))
def write(p,o): p.write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
m=read(R/'album-before.json')
captures=read(R/'captures.json'); changed={e['key']:e for e in captures if e['changed']}
outputs=read(R/'ai-results-final.json'); jobs=read(R/'ai-jobs.json')
assert len(changed)==110 and len(outputs)==len(jobs)==80
byhash={j['modelHash']:j['key']+'-mr01' for j in jobs}
assert len(byhash)==80 and {o['key'] for o in outputs}=={j['key'] for j in jobs}
for e in m['entries']:
 if e['key'] not in changed: continue
 c=changed[e['key']]; src=R/'model'/c['file']; assert sha(src)==c['modelHash']
 e.update({k:c[k] for k in ['file','modelHash','triangles','p','t','fov','direction']})
 e.update({'model':'model/'+c['file'],'aiKey':byhash[c['modelHash']],'sourceRevision':'20260921-mr01'})
 shutil.copy2(src,A/'model'/c['file'])
for e in m['entries']: e['sharedWith']=[v['key'] for v in m['entries'] if v['aiKey']==e['aiKey']]
fixes=read(A/'修正清單.json'); checked=read(A/'視覺核對.json')
for o in outputs:
 key=o['key']+'-mr01'; src=Path(o['path']); assert src.is_file()
 shutil.copy2(src,A/'originals'/f'{key}.png')
 (A/'prompts'/f'{key}.txt').write_text(o['prompt'],encoding='utf8')
 if o.get('correction'):
  write(A/'prompts'/f'{key}-correction1.json',{'correction':o['correction']})
  (A/'prompts'/f'{key}-correction1.txt').write_text(o['correctionPrompt'],encoding='utf8')
  fixes[key]={'issue':'MR01 初稿視覺偏差','fix':o['correction'],'reviewed':True}
sources=['model-repairs.js','interaction.js','design.js','提案/旋轉電視與直線中島/design.js','equipment-models.js','furniture-data.js']
m.update({'capturedAt':'2026-09-21','modelRevision':'20260921-mr01'})
m['versionSources']['modelRepairMR01']={'date':'2026-09-21','baselineCommit':'82c09791d7977d655416f7ba9f548cf29feeebad','versions':['v1','v2','v3','v4'],'capturedSlots':152,'updatedSlots':sorted(changed),'newUniqueAI':80,'unchangedSlots':80,'sourceFileSha256':{f:sha(P/f) for f in sources},'basis':'MR01 consultant model proposal: entries, storage retrieval, V3 audio route, sliding shower glass, door geometry and hollow kitchen sink. V0 unchanged. Only identical model PNG pixels share images.'}
active=sorted({e['aiKey'] for e in m['entries']})
checked.update({'date':'2026-09-21','sourceRevision':'20260921-mr01','reviewedFinalImages':active,'reviewedCorrections':sorted(set(checked['reviewedCorrections'])|set(fixes)),'newlyGenerated':[o['key']+'-mr01' for o in outputs],'newlyCorrected':[o['key']+'-mr01' for o in outputs if o.get('correction')],'modelRepairMR01':{'sourceViewsInspected':152,'uniqueAIReviewed':80,'correctionsReviewed':24,'note':'AI is conceptual; minor styling, light intensity, glass reflections and exterior scenery are not dimensional or construction evidence.'}})
write(A/'album-manifest.json',m); write(A/'視覺核對.json',checked); write(A/'修正清單.json',fixes)
print(json.dumps({'slots':len(m['entries']),'changed':len(changed),'uniqueImages':len(active),'newAI':len(outputs)},ensure_ascii=False))
