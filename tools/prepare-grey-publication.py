"""Add the GR06 public deliverables without publishing private working files."""
from pathlib import Path
import json
P=Path(__file__).resolve().parents[1]
manifest=P/'.github/publish-files.json'
data=json.loads(manifest.read_text(encoding='utf8'))
album=P/'成品圖集/20260914暗色現代工業'
report=json.loads((album/'成品核對.json').read_text(encoding='utf8'))
assert report['complete'] and report['viewSlots']==300 and report['uniqueImages']==208
keys={e['aiKey'] for e in json.loads((album/'album-manifest.json').read_text(encoding='utf8'))['entries']}
site={'grey-stone-design.js','灰石全屋設計.html'}
site.update(f'成品圖集/20260914暗色現代工業/{family}/{key}.webp' for family in ['images','models','thumbs'] for key in keys)
assert all((P/x).is_file() for x in site)
data['site']=sorted(set(data['site'])|site)
repo={f'tools/{name}' for name in ['capture-five-room-views.cjs','capture-grey-home.cjs','verify-grey-home.cjs','prepare-grey-ai.py','install-grey-album.py','prepare-grey-publication.py']}
data['repositoryOnly']=sorted(set(data['repositoryOnly'])|repo)
manifest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'newPublicCandidates':len(site),'privateWorkingFilesIncluded':False}))
