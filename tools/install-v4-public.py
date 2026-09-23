"""Install reviewed native AI and maintain V4 source/image/version correspondence."""
from pathlib import Path
import json,hashlib,shutil,re
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923V4公共區更新';A=P/'成品圖集/20260914暗色現代工業'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
cs=read(R/'captures.json');jobs=read(R/'jobs.json');quality=read(R/'quality.json')
assert len(cs)==60 and len(jobs)==20
assert set(quality['approved'])=={j['key'] for j in jobs} and not quality['pending']
history=[]
for p in [R/'generated.json',*sorted(R.glob('batch-*.json'))]:history.extend(read(p))
history=[h for h in history if Path(h['outputPath']).exists()]
for j in jobs:
 k=j['key'];src=R/'ai'/f'{k}.png';h=sha(src)
 attempts=[x for x in history if x['key']==k];selected=next(x for x in reversed(attempts) if sha(Path(x['outputPath']))==h)
 shutil.copy2(src,A/'originals'/f'{k}.png');shutil.copy2(j['modelPath'],A/'model'/f'{k}.png')
 (A/'prompts'/f'{k}.txt').write_text(attempts[0]['prompt']+'\n',encoding='utf8')
 if len(attempts)>1:
  (A/'prompts'/f'{k}-correction01.txt').write_text(selected['prompt']+'\n',encoding='utf8')
  write(A/'prompts'/f'{k}-correction01.json',{'correction':'V4 R02逐圖比對後修正窗面、設備或材質誤判；以來源模型為準。','aiPngSha256':h})
manifest=read(R/'album-before.json');bykey={c['key']:c for c in cs};new=[]
for e in manifest['entries']:
 if e['version']!='v4' or not bykey[e['key']]['changed']:new.append(e);continue
 c=bykey[e['key']];k=e['key']+'-v4r02';shutil.copy2(R/c['model'],A/'model'/c['file'])
 new.append({**c,'ai':f'originals/{k}.png','aiKey':k,'status':'ai-reviewed','sharedWith':[e['key']],'lastReviewed':'2026-09-23'})
manifest.update({'entries':new,'modelRevision':'20260923-v4r02+gr06-retained','imageRevision':'20260923-v4r02+gr06-retained','imagesUpdatedAt':'2026-09-23'})
manifest['versionSources']['V4-R02']={'date':'2026-09-23','basis':'Owner accepted 45cm living group shift, rack-supported rear enclosure proxies and two island stools; V2 retired to history. Dimensions/engineering remain to verify.','sourceFileSha256':{f:sha(P/f) for f in ['v4-public-adjustments.js','v4-public-finalize.js']},'recapturedV4Slots':60,'newAI':20,'unchangedV4Slots':40}
write(A/'album-manifest.json',manifest)
keys={e['aiKey'] for e in new};q=read(A/'視覺核對.json');q.update({'revision':manifest['imageRevision'],'reviewedFinalImages':sorted(keys),'latestScope':'V4全部60個模型取景比對；20張更新AI逐圖核對，40張來源相同保留。'})
fixes=read(A/'修正清單.json');fixes={k:v for k,v in fixes.items() if k in keys}
for j in jobs:
 attempts=[h for h in history if h['key']==j['key']]
 if len(attempts)>1:fixes[j['key']]={'nativeAttempts':len(attempts),'finalPngSha256':sha(R/'ai'/f"{j['key']}.png")}
q['reviewedCorrections']=sorted(set(q.get('reviewedCorrections',[]))|set(fixes));write(A/'視覺核對.json',q);write(A/'修正清單.json',fixes)
print(json.dumps({'slots':len(new),'uniqueAI':len(keys),'newAI':len(jobs),'V4retained':40},ensure_ascii=False))
