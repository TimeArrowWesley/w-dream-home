"""Prepare IR01 website assets without publishing private work files."""
from pathlib import Path
import json,re
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260924全版本模型修復';A=P/'成品圖集/20260914暗色現代工業';prefix=A.relative_to(P).as_posix()+'/'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
def write(p,s):p.write_text(s,encoding='utf8',newline='\n')
m=read(A/'album-manifest.json');assert m['imageRevision']=='20260924-ir01'
jobs=read(R/'jobs.json');registry=read(P/'version-registry.json')['versions'];rooms={'entry':'玄關','living':'客廳','island':'中島','bed':'主臥','study':'雙人書房','collection':'收藏區','storage':'儲藏室'}
rows=[]
for j in jobs:
 used=[e['key'] for e in m['entries'] if e['aiKey']==j['key']]
 rows.append({'key':j['key'],'version':j['version'],'title':j['version'].upper()+'・'+rooms[j['room']]+'・'+j['angle'],'used':used,'room':j['room'],'before':prefix+'images/'+j['previousAI']+'.webp','model':prefix+'models/'+j['key']+'.webp','after':prefix+'images/'+j['key']+'.webp'})
html='''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>W夢想之家｜IR01 全版本模型修復</title><style>body{margin:0;background:#111919;color:#dde7e1;font:16px/1.65 system-ui}main{max-width:1480px;margin:auto;padding:28px}a{color:#c4d8ce}h1{font-size:32px;margin:16px 0}p{max-width:980px;color:#b6c6bf}.toolbar{position:sticky;top:0;background:#111919;padding:12px 0;z-index:2}select{padding:10px;background:#26332e;color:white;border:1px solid #526158;border-radius:6px;margin-right:10px}article{border-top:1px solid #354039;padding:18px 0}.images{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0}img{width:100%;aspect-ratio:3/2;object-fit:contain;background:#090d0c}figcaption,small{color:#aebeb6}.tag{font-size:14px;color:#c6dace}h2{font-size:20px}@media(max-width:800px){.images{grid-template-columns:1fr}main{padding:16px}}</style><main><a href="index.html">← 返回全屋模型</a> · <a href="AI寫實視角.html">完整AI圖集</a><div class="tag">2026.09.24 / IR01 / V0–V5</div><h1>中島封板、水槽內壁與電視表面修復</h1><p>修復圓弧／小中島操作側缺面、檢修區裸露，以及水槽內壁消失、電視表面重疊造成的破裂條紋。保留六版格局、設備位置、掃地機入口及黑天花風格；V4、V5仍屬停用歷史版本。</p><p>重新比對全屋360個來源視角，55張原生AI重製並更新59圖位；301圖位來源相同保留。下方舊AI僅供比對，中央是修復後的模型來源，右側為本輪AI示意。模型材質與AI光影不同，尺寸及工程依核定圖說與現場確認。</p><p>已檢查新增封板與指定家電的干涉、檢修門開關、水槽雙面材質及電視面板分離；這不是全連續視角或施工驗證。</p><div class="toolbar"><label>版本 <select id="version"><option value="">全部版本</option>__VERSIONS__</select></label><label>空間 <select id="room"><option value="">全部空間</option>__ROOMS__</select></label><span id="count"></span></div><div id="cards"></div></main><script>const rows=__DATA__;const v=document.querySelector('#version'),r=document.querySelector('#room');function render(){const list=rows.filter(x=>(!v.value||x.used.some(key=>key.startsWith(v.value+'-')))&&(!r.value||x.room===r.value));document.querySelector('#count').textContent=list.length+' 張重製圖';document.querySelector('#cards').innerHTML=list.map(x=>'<article><h2>'+x.title+'</h2><small>對應圖位：'+x.used.join('、')+'</small><div class="images">'+[['before','修復前 AI（歷史）'],['model','修復後 3D 模型'],['after','本輪原生 AI（示意）']].map(([key,label])=>'<figure><a href="'+x[key]+'" target="_blank" rel="noopener"><img loading="lazy" src="'+x[key]+'" alt="'+x.title+' '+label+'"></a><figcaption>'+label+'</figcaption></figure>').join('')+'</div></article>').join('')}v.onchange=r.onchange=render;render();</script></html>'''
html=html.replace('__DATA__',json.dumps(rows,ensure_ascii=False)).replace('__VERSIONS__',''.join(f'<option value="{v["id"]}">{v["id"].upper()}{"（已停用）" if v.get("history") else ""}</option>' for v in registry)).replace('__ROOMS__',''.join(f'<option value="{k}">{n}</option>' for k,n in rooms.items()))
write(P/'模型修復.html',html+'\n')
p=A/'index.html';s=p.read_text(encoding='utf8').replace('五個格局','六個版本').replace('<b>05</b>格局版本','<b>06</b>格局版本')
s=re.sub(r'<p class="hint">2026-09-24 VN01：.*?</p>','<p class="hint">2026-09-24 IR01：六版360圖位；模型修復後重製55張AI、更新59圖位。V4、V5均保留於停用歷史；材質沿用BI01。</p>',s)
if '模型修復.html' not in s:s=s.replace('<nav id="versions"','<p class="hint"><a href="../../模型修復.html">IR01 全版本模型修復與AI前後對照 ↗</a></p>\n <nav id="versions"')
s=re.sub(r'album-data.js\?v=[^"\s]*','album-data.js?v=20260924-ir01',s);write(p,s)
for v in registry:
 p=P/v['path'];s=p.read_text(encoding='utf8')
 for asset in ['assets/ai-interiors/catalog.js','ai-views.js','viewer-ui.js','black-industrial-design.js']:
  s,n=re.subn(r'(?<=src=")'+re.escape(asset)+r'(?:\?[^"\s]*)?(?=")',asset+'?v=20260924-ir01',s);assert n==1,(v['id'],asset,n)
 write(p,s)
p=P/'.github/publish-files.json';data=read(p)
needed=['模型修復.html','island-shell-repairs.js']+[prefix+f'{family}/{j["key"]}.webp' for j in jobs for family in ['images','models','thumbs']]
data['site'] += [f for f in needed if f not in data['site']]
for f in ['capture-island-repairs.cjs','verify-island-repairs.cjs','install-island-repairs.py','publish-island-repairs.py']:
 if 'tools/'+f not in data['repositoryOnly']:data['repositoryOnly'].append('tools/'+f)
write(p,json.dumps(data,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'comparisonRows':len(rows),'newPublishedAssets':len(needed),'versions':len(registry)}))
