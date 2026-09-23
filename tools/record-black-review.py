from pathlib import Path
import json,argparse
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923全版本霧黑工業'
p=argparse.ArgumentParser();p.add_argument('--approve',default='');p.add_argument('--batch');p.add_argument('--reject',default='');a=p.parse_args()
q=json.loads((R/'quality-progress.json').read_text(encoding='utf8'));approved=set(q['approved'])
keys=a.approve.split(',') if a.approve else []
if a.batch:keys+=[j['key'] for j in json.loads((R/f'batch{a.batch}.json').read_text(encoding='utf8'))]
for k in keys:approved.add(k);q['pendingFixes'].pop(k,None)
if a.reject:
 for pair in a.reject.split('|'):
  k,reason=pair.split('=',1);q['pendingFixes'][k]=reason;approved.discard(k)
q['approved']=sorted(approved)
(R/'quality-progress.json').write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'approved':len(approved),'pendingFixes':len(q['pendingFixes'])}))
