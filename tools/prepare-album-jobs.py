from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'成品圖集/20260914暗色現代工業'
manifest=json.loads((root/'capture-manifest.json').read_text(encoding='utf8'))
entries=sorted(manifest['entries'],key=lambda e:e['key'])
canonical={}
for e in entries:canonical.setdefault(e['modelHash'],e['key'])
jobs=[]
for e in entries:
 e['aiKey']=canonical[e['modelHash']]
 e['sharedWith']=[x['key'] for x in entries if x['modelHash']==e['modelHash']]
 if e['key']==e['aiKey']:
  jobs.append({'key':e['key'],'room':e['room'],'model':e['model'],'name':e['name'],'version':e['version'],'versionTitle':e['versionTitle'],'modelHash':e['modelHash'],'done':(root/'originals'/f"{e['key']}.png").exists(),'mappedViews':e['sharedWith']})
(root/'generation-jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
(root/'album-manifest.json').write_text(json.dumps({**manifest,'entries':entries},ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps({'slots':len(entries),'uniqueSourceViews':len(jobs),'done':sum(j['done'] for j in jobs),'next':[j['key'] for j in jobs if not j['done']][:20]},ensure_ascii=False))
