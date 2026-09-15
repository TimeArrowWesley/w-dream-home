"""Register V0 runtime, drawings and tests in the explicit publication set."""
from pathlib import Path
import json,re,hashlib
R=Path(__file__).resolve().parents[1]
folder=R/'成品圖集/20260914暗色現代工業'
source_files=['design.js','model-data.js','equipment-models.js','bedroom-model.js','industrial-design.js','flooring.js','提案/原始格局/layout-spec.js','提案/原始格局/original-model.js']
source={'v0':{'capturedAt':'2026-09-15','basis':'格局.pdf original plan; shared current equipment and controls','sourceFileSha256':{f:hashlib.sha256((R/f).read_bytes()).hexdigest() for f in source_files}},'v1-v4':{'sourceRevision':'e028e0fe82eedefaacc6f0e1d037a924aef65de5','capturedAt':'2026-09-14/15','retained':True}}
for name in ['capture-manifest.json','album-manifest.json']:
 p=folder/name;d=json.loads(p.read_text(encoding='utf8'));d['versionSources']={**d.get('versionSources',{}),**source};p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
p=R/'.github/publish-files.json';d=json.loads(p.read_text(encoding='utf8'))
runtime=['index.html','layout-version.js','layout-spec.js','original-model.js','方案說明.html','V0-全屋格局.png','V0-全屋格局.webp']
repo=['layout-spec.json','核對/既有四版幾何基準.json','核對/V0模型驗證.json','核對/介面驗證.json']
for f in runtime:
 q='提案/原始格局/'+f
 if q not in d['site']:d['site'].append(q)
for q in ['提案/原始格局/'+f for f in repo]+['tools/'+f for f in ['export-original-plan.cjs','draw-original-plan.py','verify-original-layout.cjs','prepare-original-publication.py']]:
 if q not in d['repositoryOnly']:d['repositoryOnly'].append(q)
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
# Bust only the shared assets changed by V0, on each existing entry point.
for file in ['index.html','提案/原始格局/index.html','提案/旋轉電視與直線中島/index.html','提案/開放大中島/index.html','提案/南牆電視與開放中島/index.html']:
 p=R/file;s=p.read_text(encoding='utf8')
 for asset in ['design.js','tour.js','industrial-design.js','furniture-app.js','layout-version.js']:
  s=re.sub(r'(?<=src=")'+re.escape(asset)+r'(?:\?[^"\s]*)?(?=")',asset+'?v=20260915-v0',s)
 p.write_text(s,encoding='utf8',newline='\n')
print('Registered V0 runtime, drawings, verification and per-version source provenance.')
