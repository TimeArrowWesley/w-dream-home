from pathlib import Path
from PIL import Image
import json,sys
project=Path(__file__).resolve().parents[1]
root=project/'成品圖集/20260914暗色現代工業'
manifest=json.loads((root/'album-manifest.json').read_text(encoding='utf8'))
draft='--draft' in sys.argv
names={'entry':'玄關','living':'客廳','island':'中島','kitchen':'廚房','bed':'主臥','closet':'更衣室','study':'雙人書房','collection':'收藏室','bath1':'主浴','bath2':'客浴','storage':'儲藏室','back':'後陽台'}
titles=['原始格局','圓弧中島酒吧＋玄關矮櫃','旋轉電視＋小中島','旋轉電視＋大中島','大中島']
jobs={e['aiKey'] for e in manifest['entries']}
missing=[key for key in sorted(jobs) if not (root/'originals'/f'{key}.png').exists()]
if missing and not draft:raise SystemExit('Missing AI originals: '+', '.join(missing))
for folder in ['images','models','thumbs']:(root/folder).mkdir(exist_ok=True)
def convert(src,dst,thumb=False,lossless=False):
 if dst.exists() and dst.stat().st_mtime>=src.stat().st_mtime:return
 with Image.open(src) as im:
  im=im.convert('RGB')
  if thumb:im.thumbnail((576,384),Image.Resampling.LANCZOS)
  im.save(dst,'WEBP',quality=84 if thumb else 90,lossless=lossless,method=6)
for key in sorted(jobs):
 convert(root/'model'/f'{key}.png',root/'models'/f'{key}.webp',lossless=True)
 ai=root/'originals'/f'{key}.png'
 if ai.exists():
  convert(ai,root/'images'/f'{key}.webp')
  convert(ai,root/'thumbs'/f'{key}.webp',thumb=True)
entries=[]
for e in manifest['entries']:
 key=e['aiKey']
 if key in missing:continue
 entries.append({'key':e['key'],'version':e['version'],'room':e['room'],'angle':e['angle'],'model':f'models/{key}.webp','ai':f'images/{key}.webp','thumb':f'thumbs/{key}.webp','sourceKey':key,'sourceHash':e['modelHash'],'camera':{'position':e['p'],'target':e['t'],'fov':e['fov'],'heading':round(e['direction'],2)}})
order={r:i for i,r in enumerate(names)}
entries.sort(key=lambda e:(e['version'],order[e['room']],e['angle']))
data={'date':'2026-09-15','sourceRevision':manifest['modelRevision'],'versionSources':manifest.get('versionSources',{}),'method':manifest['method'],'generation':'Built-in image_gen; each unique source view individually edited','complete':not missing,'uniqueImages':len(jobs)-len(missing),'versions':[{'id':f'v{i}','name':n} for i,n in enumerate(titles)],'rooms':[{'id':r,'name':n} for r,n in names.items()],'entries':entries}
(root/'album-data.js').write_text('window.HOME_ALBUM='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8',newline='\n')
report={'complete':not missing,'viewSlots':len(entries),'uniqueImages':data['uniqueImages'],'remaining':missing,'versions':{f'v{i}':sum(e['version']==f'v{i}' for e in entries) for i in range(5)},'displayBytes':sum(p.stat().st_size for folder in ['images','models','thumbs'] for p in (root/folder).glob('*.webp'))}
(root/'成品核對.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
if '--install' in sys.argv:
 if missing:raise SystemExit('Cannot install a partial album')
 prefix='成品圖集/20260914暗色現代工業/'
 catalog={}
 for v in ['v0','v1','v2','v3','v4']:
  catalog[v]=[{'id':e['key'],'room':e['room'],'label':('貓房' if v=='v0' and e['room']=='collection' else '書房・電子琴' if v=='v0' and e['room']=='study' else '開放收藏收納' if e['room']=='collection' and v in ['v3','v4'] else names[e['room']])+'・方向 '+e['angle'],'src':prefix+e['ai'],'modelSrc':prefix+e['model'],'thumb':prefix+e['thumb']} for e in entries if e['version']==v]
 (project/'assets/ai-interiors/catalog.js').write_text('/* 2026-09-15: current source model, 3 directions per room. Shared images require identical source pixels. */\nwindow.HOME_AI_PHOTOS='+json.dumps(catalog,ensure_ascii=False,indent=2)+';\n',encoding='utf8',newline='\n')
 html=(root/'index.html').read_text(encoding='utf8')
 for f in ['album.css','album-data.js','album.js','使用說明.md']:html=html.replace('"'+f+'"','"'+prefix+f+'"')
 html=html.replace('../../index.html','index.html').replace('../../方案比較.html','方案比較.html')
 (project/'AI寫實視角.html').write_text(html,encoding='utf8',newline='\n')
print(json.dumps(report,ensure_ascii=False))
