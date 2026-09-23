"""Package GI01 review links and whitelist only the approved public deliverables."""
from pathlib import Path
import json,re
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923V4灰石工業校正'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
jobs=read(R/'jobs.json');old=read(R/'album-before.json');bykey={e['key']:e for e in old['entries']}
base='../../成品圖集/20260914暗色現代工業/';names={'entry':'玄關','living':'客廳','island':'中島','kitchen':'廚房回望','bed':'主臥回望','study':'雙人書房','collection':'收藏區','storage':'儲藏室回望'}
style='body{margin:0;background:#161c20;color:#e4e8eb;font:16px/1.75 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:34px 24px}h1{font-size:36px;line-height:1.25}a{color:#c2d6df}nav{display:flex;flex-wrap:wrap;gap:18px}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:35px}figure{margin:0}img{width:100%;display:block;aspect-ratio:3/2;object-fit:cover;background:#222}figcaption{font-size:14px;padding:6px}table{border-collapse:collapse;width:100%;margin:24px 0}td,th{border-bottom:1px solid #43505a;text-align:left;padding:12px}.note{padding:18px;background:#26333b;border-radius:10px}.palette{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.swatch{height:65px;border:1px solid #697073;margin-bottom:8px}select{padding:10px;font:inherit;background:#26333b;color:white}@media(max-width:800px){.row{grid-template-columns:1fr}h1{font-size:27px}.palette{grid-template-columns:repeat(2,1fr)}}'
html=[f'<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V4 GI01｜灰石現代工業</title><style>{style}</style><main><p>2026-09-23 · R02 格局／GI01 材質與燈光</p><h1>石墨櫃面、槍灰金屬，保留木地板的溫度。</h1><nav><a href="../../提案/南牆電視與開放中島/index.html?uiRoom=living">操作更新後 V4 模型</a><a href="../../AI寫實視角.html?version=v4&room=living&revision=v4gi01">V4 全屋 AI 圖集</a><a href="../../index.html">返回專案</a></nav><p class="note">本輪依業主同意，將 V4 的工業風特徵重新加強：公共區大面櫃體改為石墨灰、展示框與既有金屬收邊改為槍灰拉絲，雙人書房採中性功能光、展示與灰石洗牆分區控制。格局沿用已採用的 R02；材料實品與照明工程仍待深化。</p><div class="palette">']
for color,title in [('#363d41','石墨灰霧面櫃體'),('#747c82','槍灰拉絲金屬'),('#92918b','灰石與礦物灰牆'),('#706b64','灰棕木地板與點綴')]:html.append(f'<div><div class="swatch" style="background:{color}"></div>{title}</div>')
html.append('</div><table><tr><th>部位</th><th>GI01 處理</th><th>設計取捨</th></tr><tr><td>玄關／中島／深收納</td><td>大面木色改石墨灰，局部水平檯面與中島端板保留灰棕木。</td><td>櫃體量體更明確；以地板、檯面與自然光維持舒適度。</td></tr><tr><td>展示與雙人書房</td><td>槍灰拉絲框、灰色背板、九抽石墨櫃面。</td><td>靠霧面與金屬反射區分層次；不增加裝飾鐵件及清潔死角。</td></tr><tr><td>燈光</td><td>書房中性白功能光、較低的展示亮度、局部柔和石牆洗光。</td><td>電影情境關閉石牆洗光；滑桿是模擬比例，非照度或施工迴路。</td></tr><tr><td>配置與收納</td><td>R02 家具、門窗、櫃體尺寸、設備與兩張中島椅維持。</td><td>本次未以刪減收納換取風格。新增費用可能來自飾板、金屬實品與分區調光，待設計师詢價。</td></tr></table><p>V4 60 個來源角度重新比對，30 張受影響 AI 重製、30 張保留；每空間仍維持五角度。書房 D 的來源像素相同，但照明意向改變，因此也重製。AI 為概念效果，不作尺寸、光照計算或施工依據。</p><label>快速篩選空間 <select id="room"><option value="all">所有受影響角度</option>')
for room in dict.fromkeys(j['room'] for j in jobs):html.append(f'<option value="{room}">{names[room]}</option>')
html.append('</select></label>')
for j in jobs:
 before=bykey[j['viewKey']]['aiKey'];angle=bykey[j['viewKey']]['angle'];html.append(f'<section data-room="{j["room"]}"><h2>{names[j["room"]]} · {angle}</h2><div class="row">')
 for family,key,label in [('images',before,'更新前 AI（R02／GR06 歷史）'),('models',j['key'],'GI01 來源模型（格局對照）'),('images',j['key'],'GI01 新 AI 效果（概念示意）')]:
  u=base+family+'/'+key+'.webp';html.append(f'<figure><a href="{u}"><img src="{u}" loading="lazy" alt="{j["viewKey"]} {label}"></a><figcaption>{label}</figcaption></figure>')
 html.append('</div></section>')
html.append('<p>V0、V1、V3 模型與 AI 未變更；V2 保留為歷史。公仔款式、細部接縫、反射、外景及光照強度為 AI 示意。</p></main><script>document.getElementById("room").addEventListener("change",e=>{for(const s of document.querySelectorAll("section[data-room]"))s.hidden=e.target.value!=="all"&&s.dataset.room!==e.target.value;});</script></html>')
(R/'index.html').write_text(''.join(html).replace('設計师','設計師'),encoding='utf8')
p=P/'version-changes.js';s=p.read_text(encoding='utf8');data=json.loads(s[s.index('=')+1:].strip().rstrip(';'))
data['date']='2026-09-23';data['revision']='V4 R02格局／GI01灰石現代工業；V2停止深化';v=data['variants']['v4'];v['title']='V4 大中島 R02／GI01'
v['rows'][0]=['本版材質與照明 GI01','GR06灰棕木櫃比例偏高','公共區石墨櫃面、槍灰拉絲展示框、灰色內襯；保留灰石與灰棕人字地板。書房功能／展示／洗牆分區。','沿用R02全部幾何與收納；實品、光照與施工迴路待核。']
p.write_text("'use strict';\nwindow.HOME_VERSION_CHANGES="+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
for name in ['index.html','提案/原始格局/index.html','提案/旋轉電視與直線中島/index.html','提案/開放大中島/index.html','提案/南牆電視與開放中島/index.html']:
 p=P/name;s=p.read_text(encoding='utf8')
 for asset in ['viewer-ui.js','assets/ai-interiors/catalog.js','comfort-controls.js']:s=re.sub(re.escape(asset)+r'(?:\?[^"\s]*)?(?=")',asset+'?v=20260923-v4gi01',s)
 p.write_text(s,encoding='utf8')
p=P/'版本調整.html';s=p.read_text(encoding='utf8');s=re.sub(r'version-changes.js(?:\?[^"\s]*)?', 'version-changes.js?v=20260923-v4gi01',s);p.write_text(s,encoding='utf8')
manifest=read(P/'.github/publish-files.json');site={'v4-industrial-refinement.js','調整紀錄/20260923V4灰石工業校正/index.html'}
for j in jobs:
 for family in ['images','models','thumbs']:site.add(f'成品圖集/20260914暗色現代工業/{family}/{j["key"]}.webp')
assert all((P/x).exists() for x in site)
manifest['site']=list(dict.fromkeys(manifest['site']+sorted(site)))
manifest['repositoryOnly']=list(dict.fromkeys(manifest['repositoryOnly']+['tools/capture-v4-industrial.cjs','tools/verify-v4-industrial.cjs','tools/prepare-v4-industrial-ai.py','tools/install-v4-industrial.py','tools/publish-v4-industrial.py']))
write(P/'.github/publish-files.json',manifest)
print(json.dumps({'newPublicFiles':len(site),'privatePngsAndWorkingFiles':False},ensure_ascii=False))
