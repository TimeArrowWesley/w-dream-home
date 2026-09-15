from pathlib import Path
import json,re,subprocess,difflib
root=Path(__file__).resolve().parents[1]
folder='成品圖集/20260914暗色現代工業/'
manifest=json.loads((root/folder/'album-manifest.json').read_text(encoding='utf8'))
keys=sorted({e['aiKey'] for e in manifest['entries']})
for file in ['提案/原始格局/index.html','index.html','提案/旋轉電視與直線中島/index.html','提案/開放大中島/index.html','提案/南牆電視與開放中島/index.html']:
 p=root/file;s=p.read_bytes().decode('utf8')
 for asset in ['assets/ai-interiors/catalog.js','ai-views.js','viewer-ui.js']:
  s,n=re.subn(r'(?<=src=")'+re.escape(asset)+r'(?:\?[^"\s]*)?(?=")',asset+'?v=20260915-entry5',s)
  assert n==1,(file,asset,n)
 p.write_bytes(s.encode('utf8'))
p=root/'.github/publish-files.json';old=p.read_bytes().decode('utf8');data=json.loads(old)
removed=[s for s in data['site'] if s.endswith('.webp') and (s.startswith('assets/ai-interiors/') or (s.startswith(folder) and s.split('/')[-2] in ['images','models','thumbs'] and Path(s).stem not in keys))]
data['site']=[s for s in data['site'] if s not in removed]
needed=[folder+n for n in ['index.html','album.css','album.js','album-data.js','使用說明.md','生成紀錄.json','成品核對.json']]
needed += [folder+f'{f}/{k}.webp' for f in ['images','models','thumbs'] for k in keys]
data['site'] += [s for s in needed if s not in data['site']]
helpers=['capture-whole-home-album.cjs','album-contact-sheets.py','prepare-album-jobs.py','package-home-album.py','verify-home-album.cjs','finalize-home-album.py','prepare-album-publication.py']
data['repositoryOnly'] += ['tools/'+f for f in helpers if 'tools/'+f not in data['repositoryOnly']]
data['repositoryOnly'] += [folder+f for f in ['album-manifest.json','視覺核對.json','修正清單.json'] if folder+f not in data['repositoryOnly']]
new=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
a=old.splitlines(keepends=True);b=new.splitlines(keepends=True)
for tag,i,j,k,l in difflib.SequenceMatcher(None,[s.rstrip('\r\n') for s in a],[s.rstrip('\r\n') for s in b],autojunk=False).get_opcodes():
 if tag=='equal':b[k:l]=a[i:j]
p.write_bytes(''.join(b).encode('utf8'))
(root/folder/'舊圖停止發布.json').write_text(json.dumps(removed,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps({'newAlbumFiles':len(needed),'obsoletePublishedImages':removed,'helperTools':len(helpers)},ensure_ascii=False))
