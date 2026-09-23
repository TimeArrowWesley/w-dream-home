"""Build public change review and update the explicit publication allowlist."""
from pathlib import Path
import json,re
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923V4公共區更新';A=P/'成品圖集/20260914暗色現代工業'
def read(p):return json.loads(p.read_text(encoding='utf8'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
cs=read(R/'captures.json');jobs=read(R/'jobs.json');old=read(R/'album-before.json');bykey={e['key']:e for e in old['entries']}
base='../../成品圖集/20260914暗色現代工業/';names={'entry':'玄關','living':'客廳','island':'中島','bed':'主臥回望','study':'雙人書房','collection':'收藏區','storage':'儲藏室回望'}
style='body{margin:0;background:#141b1a;color:#e7ede9;font:16px/1.65 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:34px 24px}h1{font-size:34px}a{color:#bce4d3}nav{display:flex;flex-wrap:wrap;gap:18px}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:35px}figure{margin:0}img{width:100%;display:block;aspect-ratio:3/2;object-fit:cover;background:#222}figcaption{font-size:14px;padding:6px}table{border-collapse:collapse;width:100%;margin:24px 0}td,th{border-bottom:1px solid #43544f;text-align:left;padding:12px}.note{padding:18px;background:#243c32;border-radius:10px}@media(max-width:800px){.row{grid-template-columns:1fr}h1{font-size:27px}}'
html=[f'<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V4 R02｜公共區配置與AI更新</title><style>{style}</style><main><p>2026-09-23 · V4 R02 · 採用配置，工程待深化</p><h1>客廳與中島靠近，窗邊留出通行。</h1><nav><a href="../../提案/南牆電視與開放中島/index.html?uiRoom=living">操作更新後V4模型</a><a href="../../AI寫實視角.html?version=v4&room=living&revision=v4r02">V4完整AI圖集</a><a href="../../index.html">返回專案</a></nav><p class="note">業主採用V4本輪調整，V2停止深化並移到歷史版本。20張AI效果圖重製；V4仍維持每空間五角度，共60圖位。模型圖與AI圖明確區分；AI不作尺寸或施工依據。</p><table><tr><th>項目</th><th>原版</th><th>R02</th></tr><tr><td>中島檯緣至沙發側邊</td><td>262cm</td><td>217cm，客廳群向中島移45cm</td></tr><tr><td>沙發另一側至窗側牆內面</td><td>48cm</td><td>93cm，尚須扣窗簾及施工誤差</td></tr><tr><td>後環繞與餐椅</td><td>落地支架；餐椅預設隱藏</td><td>完整背腔示意改背架承托；兩席常態顯示</td></tr><tr><td>收納、固定條件</td><td>既有展示、深櫃、牆梁門窗</td><td>保持；實物容量與現場尺寸待核</td></tr></table><p>以上為模型名義尺寸，非整段淨寬。指定玄關到書房／廚房、窗邊及拉椅情境，以60cm包絡抽樣未檢出阻擋；聲學、背腔容積、固定及承重仍需專業深化。</p><h2>20個受影響角度：原AI／更新模型／新AI</h2>']
for c in cs:
 if not c['changed']:continue
 k=c['key']+'-v4r02';before=bykey[c['key']]['aiKey'];html.append(f'<h3>{names[c["room"]]} · {c["angle"]}</h3><div class="row">')
 for family,key,label in [('images',before,'更新前AI（歷史）'),('models',k,'R02來源模型（尺寸對照）'),('images',k,'R02新AI效果（概念示意）')]:
  u=base+family+'/'+key+'.webp';html.append(f'<figure><a href="{u}"><img src="{u}" loading="lazy" alt="{c["key"]} {label}"></a><figcaption>{label}</figcaption></figure>')
 html.append('</div>')
html.append('<p>其餘40個V4來源畫面逐一雜湊相同，保留原AI；V0、V1、V3模型與圖片不變。V2舊版保留作歷史，R01未採用餐檯試案未發布。窗外景色、收藏外觀、接縫與微小反射為AI示意。</p></main></html>')
(R/'index.html').write_text(''.join(html),encoding='utf8')
# Latest source data, without rewriting historical comparison diagrams.
p=P/'version-changes.js';s=p.read_text(encoding='utf8');data=json.loads(s[s.index('=')+1:].strip().rstrip(';'))
data['date']='2026-09-23';data['revision']='V4 R02公共區採用配置；V2停止深化'
v=data['variants']['v4'];v['title']='V4 大中島 R02'
v['rows'][0]=['本版材質設計','較早深色材質提案','沿用GR06灰石固定電視牆、石墨框、灰棕人字木地板與灰棕木櫃。','灰石集中在既有固定主景；材質、接縫、燈具仍待核。']
v['rows'][1]=['公共區比例 R02','中島至沙發262cm；沙發窗側48cm','客廳影音群向中島側移45cm；上述兩處改為217／93cm，兩張中島椅常態显示。','均模型名義尺寸；指定通行與拉椅抽樣通過，不等於現場／工程核定。']
v['rows'].insert(2,['後環繞 R02','落地支架壓縮書房門外轉彎','保留完整背腔示意，改由沙發背架短支承及承板承托。','背腔容積、固定、承重、隔振及聲學待設計師／廠商核對。'])
data['variants']['v2']['title']='V2 旋轉電視＋小中島（已停用）'
data['variants']['v2']['rows'].insert(0,['2026-09-23狀態','原收納優先候選','業主要求V2不要了，停止深化；本頁保留歷史原方案。','未採用本機R01新增餐檯與刪玄關櫃試案。'])
p.write_text("'use strict';\nwindow.HOME_VERSION_CHANGES="+json.dumps(data,ensure_ascii=False,indent=2).replace('显示','顯示')+';\n',encoding='utf8')
# Cache tokens for the changed common shell/catalog and the album data.
for name in ['index.html','提案/原始格局/index.html','提案/旋轉電視與直線中島/index.html','提案/開放大中島/index.html','提案/南牆電視與開放中島/index.html']:
 p=P/name;s=p.read_text(encoding='utf8')
 for asset in ['viewer-ui.js','assets/ai-interiors/catalog.js']:
  s=re.sub(re.escape(asset)+r'(?:\?[^"\s]*)?(?=")',asset+'?v=20260923-v4r02',s)
 p.write_text(s,encoding='utf8')
p=P/'版本調整.html';s=p.read_text(encoding='utf8');s=re.sub(r'version-changes.js(?:\?[^"\s]*)?', 'version-changes.js?v=20260923-v4r02',s);p.write_text(s,encoding='utf8')
manifest=read(P/'.github/publish-files.json')
site={'v4-public-adjustments.js','v4-public-finalize.js','調整紀錄/20260923V4公共區更新/index.html'}
for j in jobs:
 for family in ['images','models','thumbs']:site.add(f'成品圖集/20260914暗色現代工業/{family}/{j["key"]}.webp')
assert all((P/x).exists() for x in site)
manifest['site']=sorted(set(manifest['site'])|site)
manifest['repositoryOnly']=sorted(set(manifest['repositoryOnly'])|{'tools/capture-v4-public.cjs','tools/verify-v4-public.cjs','tools/prepare-v4-ai.py','tools/install-v4-public.py','tools/publish-v4-public.py'})
write(P/'.github/publish-files.json',manifest)
print(json.dumps({'newPublicFiles':len(site),'privatePngsAndWorkingFiles':False},ensure_ascii=False))
