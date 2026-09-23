"""Build BI01 public comparison and whitelist reviewed deliverables only."""
from pathlib import Path
import json,re,html
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923全版本霧黑工業';A=P/'成品圖集/20260914暗色現代工業'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
jobs=read(R/'jobs.json');q=read(R/'quality-progress.json');assert set(q['approved'])=={j['key'] for j in jobs} and not q['pendingFixes']
current=read(A/'album-manifest.json');assert current['imageRevision']=='20260923-bi01'
old={e['key']:e for e in read(R/'album-before.json')['entries']}
names={'entry':'玄關','living':'客廳','island':'中島','kitchen':'廚房','bed':'主臥','closet':'更衣室','study':'雙人書房','collection':'收藏空間','bath1':'主浴','bath2':'客浴','storage':'儲藏室','back':'後陽台'}
versions=['V0 原始格局','V1 圓弧中島酒吧','V2 旋轉電視＋小中島（歷史）','V3 旋轉電視＋大中島','V4 大中島 R02']
base='成品圖集/20260914暗色現代工業/'
style='body{margin:0;background:#171b1e;color:#e7e9e8;font:16px/1.75 system-ui,sans-serif}main{max-width:1540px;margin:auto;padding:32px 24px}h1{font-size:38px;line-height:1.25}a{color:#c0d4db}nav{display:flex;flex-wrap:wrap;gap:20px}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:32px}figure{margin:0}img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:contain;background:#202528}figcaption{padding:7px;font-size:14px}.note{padding:20px;background:#282f33;border-radius:8px}.palette{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:24px 0}.swatch{height:65px;border:1px solid #60676a}.filters{display:flex;flex-wrap:wrap;gap:18px;align-items:center;position:sticky;top:0;padding:12px;background:#171b1ef2;z-index:2}select{background:#293238;color:white;padding:10px;font:inherit}table{width:100%;border-collapse:collapse;margin:24px 0}td,th{text-align:left;border-bottom:1px solid #465057;padding:12px}section[hidden]{display:none}@media(max-width:800px){.row{grid-template-columns:1fr}.palette{grid-template-columns:repeat(2,1fr)}h1{font-size:28px}}'
out=[f'<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BI01｜全版本霧黑現代工業</title><style>{style}</style><main><p>2026-09-23 · V0–V4 · BI01</p><h1>霧黑天花、中灰牆，讓灰石與木色更有層次。</h1><nav><a href="提案/南牆電視與開放中島/index.html?uiRoom=living">開啟 V4 模型</a><a href="AI寫實視角.html?version=v4&amp;room=living&amp;revision=bi01">全屋 AI 圖集</a><a href="index.html">返回專案</a></nav><p class="note">依業主採用的霧黑天花方向，五個版本同步更新牆、樑、天花與指定櫃面。保留各版格局、家具、門窗、設備、灰石位置及灰棕人字木地板。V2 仍為停止深化的歷史配置；這次換色不代表重新採用。</p><div class="palette">']
for color,label in [('#242628','霧黑天花與樑'),('#858986','中性中灰牆'),('#596062','深灰門框帶'),('#363d41','石墨櫃面'),('#706b64','灰棕木地板')]:out.append(f'<div><div class="swatch" style="background:{color}"></div>{label}</div>')
out.append('</div><table><tr><th>範圍</th><th>設計處理</th><th>保留與取捨</th></tr><tr><td>客廳、玄關、中島</td><td>黑天花連成完整上方背景，中灰牆與深灰門帶形成明暗層次；灰石留在既有主牆。</td><td>收納量與動線不因換色縮減。吸光增加，燈具配光及調光須由設計師另作照度與眩光檢核。</td></tr><tr><td>書房與展示</td><td>石墨櫃、槍灰框、局部灰色內襯，保留原工作燈及展示光位置。</td><td>依各版原櫃體和公仔位置呈現，電腦及收藏仍為空間主角。</td></tr><tr><td>主臥、更衣室</td><td>同樣採黑天花與中灰背景，保留灰棕木、布面及衣物層次。</td><td>木色與柔軟材質維持臥房舒適度。</td></tr><tr><td>衛浴、廚房、儲藏與後陽台</td><td>中灰牆、黑天花；既有灰磚、不鏽鋼、原廠設備及實用層架維持。</td><td>衛浴塗料、防潮與清潔規格、設備檢修及現場完工色樣仍待核定。</td></tr></table>')
out.append(f'<p>300 個圖位全部替換為本輪原生 AI 新圖，共 {len(jobs)} 張獨立成品；只有來源模型像素完全相同的圖位共用。每版 12 個空間、每區 5 個角度。下列依同一個模型相機比較。</p><p class="note">AI 為概念示意。窗外景色、公仔款式、接縫、反射與光照強度不能當作實品或施工證明；格局與尺寸仍以模型對照、核定圖說及現場複量為準。色碼為數位設計意向。</p><div class="filters"><label>版本 <select id="version">')
for i,name in enumerate(versions):out.append(f'<option value="v{i}"'+(' selected' if i==4 else '')+f'>{name}</option>')
out.append('</select></label><label>空間 <select id="room"><option value="all">全屋</option>')
for k,name in names.items():out.append(f'<option value="{k}"'+(' selected' if k=='living' else '')+f'>{name}</option>')
out.append('</select></label><span id="count" role="status"></span></div>')
for e in current['entries']:
 before=old[e['key']]['aiKey'];key=e['aiKey'];visible=e['version']=='v4' and e['room']=='living'
 out.append(f'<section data-version="{e["version"]}" data-room="{e["room"]}"'+('' if visible else ' hidden')+f'><h2>{e["version"].upper()} · {names[e["room"]]} · {e["angle"]}</h2><div class="row">')
 for family,k,label in [('images',before,'更新前 AI（歷史配色）'),('models',key,'BI01 來源模型'),('images',key,'BI01 新 AI（概念示意）')]:
  u=base+family+'/'+k+'.webp';out.append(f'<figure><a href="{u}" target="_blank" rel="noopener"><img src="{u}" loading="lazy" width="1152" height="768" alt="{e["key"]} {label}"></a><figcaption>{label}</figcaption></figure>')
 out.append('</div></section>')
out.append('</main><script>const v=document.getElementById("version"),r=document.getElementById("room");function filter(){let n=0;for(const s of document.querySelectorAll("section[data-version]")){s.hidden=s.dataset.version!==v.value||(r.value!=="all"&&s.dataset.room!==r.value);if(!s.hidden)n++;}document.getElementById("count").textContent=n+" 個角度";}v.addEventListener("change",filter);r.addEventListener("change",filter);filter();</script></html>')
(P/'霧黑工業全屋.html').write_text(''.join(out),encoding='utf8')
p=P/'version-changes.js';s=p.read_text(encoding='utf8');d=json.loads(s[s.index('=')+1:].strip().rstrip(';'));d['date']='2026-09-23';d['revision']='BI01全版本霧黑現代工業；V4沿用R02格局；V2停止深化'
for i in range(5):
 v=d['variants'][f'v{i}'];v['title']=versions[i]+'／BI01';v['rows']=[row for row in v['rows'] if row[0]!='全屋材質 BI01'];v['rows'].insert(0,['全屋材質 BI01','灰石風格與 V4 GI01 歷史配色','霧黑天花及樑、中灰牆、深灰門框帶、指定石墨櫃面；保留灰石及灰棕人字地板。','本版 60 圖位全部替換新 AI，來源模型及相機可對照。原格局、收納、設備不變；實品與施工待核。'])
p.write_text("'use strict';\nwindow.HOME_VERSION_CHANGES="+json.dumps(d,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
p=P/'版本調整.html';s=p.read_text(encoding='utf8');p.write_text(re.sub(r'version-changes.js(?:\?[^"\s]*)?','version-changes.js?v=20260923-bi01',s),encoding='utf8')
mf=read(P/'.github/publish-files.json');site={'black-industrial-design.js','霧黑工業全屋.html'}
for j in jobs:
 for family in ['images','models','thumbs']:site.add(f'{base}{family}/{j["key"]}.webp')
assert all((P/x).exists() for x in site)
mf['site']=list(dict.fromkeys(mf['site']+sorted(site)))
repo=['tools/capture-black-home.cjs','tools/prepare-black-ai.py','tools/manage-black-ai.py','tools/record-black-review.py','tools/prepare-black-models.py','tools/install-black-album.py','tools/publish-black-home.py','tools/document-black-home.py']
mf['repositoryOnly']=list(dict.fromkeys(mf['repositoryOnly']+repo));write(P/'.github/publish-files.json',mf)
print(json.dumps({'publicFilesAdded':len(site),'uniqueAI':len(jobs),'slots':len(current['entries']),'privateWorkExcluded':True}))
