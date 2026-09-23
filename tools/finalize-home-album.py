"""Build provenance, validate image payloads, and write a self-contained album ZIP."""
from pathlib import Path
from PIL import Image
import json,hashlib,zipfile,csv,io
project=Path(__file__).resolve().parents[1]
root=project/'成品圖集/20260914暗色現代工業'
def read(name):return json.loads((root/name).read_text(encoding='utf8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
manifest=read('album-manifest.json');entries=manifest['entries'];keys=sorted({e['aiKey'] for e in entries})
assert len(entries)==300 and {e['version'] for e in entries}=={'v0','v1','v2','v3','v4'}
for v in ['v0','v1','v2','v3','v4']:
 assert len([e for e in entries if e['version']==v])==60
 for room in {e['room'] for e in entries}:assert len([e for e in entries if e['version']==v and e['room']==room])==5
checked=read('視覺核對.json');assert set(checked['reviewedFinalImages'])==set(keys)
fixes=read('修正清單.json');assert set(fixes)<=set(checked['reviewedCorrections'])
records=[]
for key in keys:
 source=root/'model'/f'{key}.png';original=root/'originals'/f'{key}.png'
 e=next(e for e in entries if e['aiKey']==key)
 assert sha(source)==e['modelHash'],key
 # Preserve the image tool's native canvas (occasionally 1535 x 1025), rather
 # than stretching an architectural image to fit a nominal output size.
 with Image.open(original) as native:
  native_size=native.size
  assert min(native_size)>=1000 and 1.45<native_size[0]/native_size[1]<1.55,(key,native_size)
  native.thumbnail((576,384),Image.Resampling.LANCZOS);thumb_size=native.size
 for family,size in [('images',native_size),('models',(1152,768)),('thumbs',thumb_size)]:
  f=root/family/f'{key}.webp'
  with Image.open(f) as im:im.load();assert im.size==size,(key,family,im.size)
  assert f.stat().st_mtime>=original.stat().st_mtime or family=='models',f'Stale export: {f}'
 history=[]
 for f in sorted((root/'prompts').glob(key+'-correction*.json')):
  rec=json.loads(f.read_text(encoding='utf8'))
  history.append({'instruction':rec['correction'],'prompt':f.with_suffix('.txt').read_text(encoding='utf8')})
 records.append({'key':key,'usedBy':[e['key'] for e in entries if e['aiKey']==key],'sourcePngSha256':sha(source),'aiOriginalPngSha256':sha(original),'aiWebpSha256':sha(root/'images'/f'{key}.webp'),'sourceWebpSha256':sha(root/'models'/f'{key}.webp'),'prompt':(root/'prompts'/f'{key}.txt').read_text(encoding='utf8'),'corrections':history,'review':'Manually inspected against source view; conceptual materials, not dimensional proof'})
provenance={'date':manifest.get('imagesUpdatedAt',manifest.get('capturedAt','2026-09-16'))[:10],'sourceRevision':manifest['modelRevision'],'imageRevision':manifest.get('imageRevision',manifest['modelRevision']),'versionSources':manifest.get('versionSources',{}),'sourceMethod':manifest['method'],'generationTool':'Built-in image_gen','viewSlots':len(entries),'uniqueImages':len(keys),'records':records}
(root/'生成紀錄.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
for e in entries:assert sha(root/'model'/e['file'])==e['modelHash'],e['key']
report=read('成品核對.json');report.pop('all144SourceHashesMatched',None);report.update({'allImagesDecoded':True,'allSourceHashesMatched':True,'correctionViews':len(fixes),'visualReview':'Each unique AI image reviewed; original model is authoritative for dimensions','browserVisualQA':False})
browser_reports={'20260923-bi01':'調整紀錄/20260923全版本霧黑工業/瀏覽器核對.json','20260923-au01+bi01':'調整紀錄/20260923V1V4影音統一/瀏覽器核對.json'}
if manifest.get('imageRevision') in browser_reports:
 browser_report=project/browser_reports[manifest['imageRevision']]
 if browser_report.exists():
  b=json.loads(browser_report.read_text(encoding='utf8'))
  report.update({'browserVisualQA':True,'browserScope':b['localChecks'],'browserLimitations':b['limits']})
(root/'成品核對.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
files=[root/n for n in ['index.html','album.css','album.js','album-data.js','使用說明.md','生成紀錄.json','成品核對.json']]
files += [root/folder/f'{key}.webp' for folder in ['images','models','thumbs'] for key in keys]
out=project/'成品圖集/W夢想之家_五版全屋AI圖集_精簡包.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:
  name=p.relative_to(root).as_posix()
  if name=='index.html':
   html=p.read_text(encoding='utf8').replace('../../index.html','index.html').replace('<a href="../../方案比較.html">五版格局比較 ↗</a>','<span>五版全屋 · 離線成品圖集</span>')
   html=html.replace('<a href="../../全版本複核.html">QA03 歷史複核與修改前後對照 ↗</a>','<span>歷史複核請至線上專案查看。</span>')
   html=html.replace('<a href="../../灰石全屋設計.html">灰石全屋設計與材質說明 ↗</a>','<span>GR06 灰石、灰棕木與光；完整設計說明請至線上專案查看。</span>')
   html=html.replace('<a href="../../霧黑工業全屋.html">BI01 霧黑工業全屋與更新前後對照 ↗</a>','<span>BI01 霧黑天花、中灰牆與灰棕木；完整前後對照請至線上專案查看。</span>')
   z.writestr(name,html)
  else:z.write(p,name)
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 assert len(z.namelist())==len(files)
 for name in z.namelist():assert not name.startswith('/') and '..' not in Path(name).parts
 print(json.dumps({'zip':str(out),'files':len(files),'MB':round(out.stat().st_size/1048576,2),'imagesDecoded':len(keys)*3,'sourceHashesVerified':len(entries)},ensure_ascii=False))
