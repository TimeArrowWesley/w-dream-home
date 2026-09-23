from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,shutil,argparse
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923全版本霧黑工業'
parser=argparse.ArgumentParser();parser.add_argument('--batch');parser.add_argument('--version');parser.add_argument('--count',type=int,default=12);parser.add_argument('--keys');args=parser.parse_args()
read=lambda p:json.loads(p.read_text(encoding='utf8'))
records=[]
for p in sorted(R.glob('batch*.json')):
 if p.name.endswith('-jobs.json'):continue
 for r in read(p):
  if not r.get('nativePath'):continue
  src=Path(r['nativePath']);dest=Path(r['outputPath']);dest.parent.mkdir(exist_ok=True)
  if not dest.exists() or src.stat().st_mtime>dest.stat().st_mtime:shutil.copy2(src,dest)
  records.append(r)
jobs=read(R/'jobs.json');done={r['key'] for r in records}
if args.batch:
 selected=[j for j in jobs if (args.keys and j['key'] in args.keys.split(',')) or (not args.keys and j['key'] not in done and (not args.version or j['version']==args.version))][:args.count]
 (R/f'batch{args.batch}-jobs.json').write_text(json.dumps(selected,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',20)
 for start in range(0,len(selected),6):
  canvas=Image.new('RGB',(1728,816),'#202226');d=ImageDraw.Draw(canvas)
  for i,j in enumerate(selected[start:start+6]):
   x=i%3*576;y=i//3*408
   with Image.open(j['modelPath']) as im:canvas.paste(im.resize((576,384)),(x,y+24))
   d.text((x+5,y),j['key'],font=font,fill='white')
  canvas.save(R/f'batch{args.batch}-sources-{start//6+1}.jpg',quality=95)
  photo=Image.new('RGB',(1728,816),'#202226');pd=ImageDraw.Draw(photo)
  for i,j in enumerate(selected[start:start+6]):
   x=i%3*576;y=i//3*408
   with Image.open(j.get('priorAiPath',j['modelPath'])) as im:photo.paste(im.resize((576,384)),(x,y+24))
   pd.text((x+5,y),j['key']+' BEFORE',font=font,fill='white')
  photo.save(R/f'batch{args.batch}-before-{start//6+1}.jpg',quality=95)
 print(json.dumps({'batch':args.batch,'selected':[j['key'] for j in selected],'copied':len(done),'remaining':len(jobs)-len(done)},ensure_ascii=False))
else:print(json.dumps({'copied':len(done),'remaining':len(jobs)-len(done)},ensure_ascii=False))
