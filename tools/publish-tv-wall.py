from pathlib import Path
import json,re,html
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260924電視牆統一';A=P/'成品圖集/20260914暗色現代工業'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
jobs=read(R/'jobs.json');before={e['key']:e for e in read(R/'album-before.json')['entries']}
base='成品圖集/20260914暗色現代工業/'
style=(P/'影音統一.html').read_text(encoding='utf8').split('<style>',1)[1].split('</style>',1)[0]
out=['<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V1／V4無上櫃電視牆 TW01</title><style>'+style+'</style><main>',
'<p><a href="index.html?uiRoom=living">V1 3D</a> · <a href="提案/南牆電視與開放中島/index.html?uiRoom=living">V4 3D</a> · <a href="AI寫實視角.html?version=v1&room=living&revision=tw01">最新AI圖集</a> · <a href="影音統一.html">AU01影音位置／歷史圖片</a></p>',
'<h1>電視牆統一無上櫃版型</h1><p>TW01｜2026-09-24｜業主採用V4整面灰石電視牆，V1移除電視上方整排收納櫃。灰石延伸至樑下、洗牆線燈移至牆頂。下方影音櫃、側邊電箱檢修、AU01沙發與音響位置、BI01霧黑工業材質保持。</p>',
'<table><tr><th>項目</th><th>修改前 V1</th><th>目前 V1／V4</th></tr><tr><td>電視主牆</td><td>中段灰石＋上方封閉櫃</td><td>連續灰石至樑下，無電視上櫃</td></tr><tr><td>光線</td><td>上櫃下方線燈</td><td>線燈移至石牆頂緣</td></tr><tr><td>收納取捨</td><td>315×35×75cm上櫃外廓</td><td>移除該排封閉收納；電箱檢修與下方影音櫃保留</td></tr></table>',
'<p class="note">模型量測：灰石左緣X760至右緣X1075，寬315cm；地面Z0至樑下Z245，高245cm；前後Y951至953，示意厚2cm。以上不是現場核定值，外廓不是櫃內有效容量；石材排版、材料厚度、承載固定與電箱檢修需設計師深化。V4原有無上櫃主牆保持；各版玄關與電箱細節沿原配置。</p>',
'<p>V1全60個來源角度重新比對：10個受影響角度原生AI重製、50個來源相同保留。其他版本維持原圖；全屋每空間仍5角度。</p><h2>10個受影響角度：舊AI／新模型／新AI</h2>']
for j in jobs:
 k=j['key'];old=before[j['viewKey']]['aiKey']
 out.append('<section><h3>'+html.escape(j['viewKey'])+'</h3><div class="row">')
 for folder,key,label in [('images',old,'修改前AI・含上櫃（歷史）'),('models',k,'TW01來源模型'),('images',k,'TW01新AI・無上櫃（概念示意）')]:
  u=base+folder+'/'+key+'.webp';out.append(f'<figure><a href="{u}"><img loading="lazy" src="{u}" alt="{j["viewKey"]} {label}"></a><figcaption>{label}</figcaption></figure>')
 out.append('</div></section>')
out.append('<p class="note">AI圖是材質與氛圍示意，不作尺寸或施工依據；主要配置以目前TW01／AU01模型為準。</p></main></html>')
(P/'電視牆統一.html').write_text(''.join(out),encoding='utf8',newline='\n')
p=P/'影音統一.html';s=p.read_text(encoding='utf8');banner='<p class="note" data-tw01>2026-09-24更新：V1主牆已依TW01移除電視上櫃；本頁保留AU01當時圖片，影音位置仍適用。<a href="電視牆統一.html">查看最新無上櫃電視牆與AI</a>。</p>'
if 'data-tw01' not in s:s=s.replace('<main>','<main>'+banner,1)
p.write_text(s,encoding='utf8',newline='\n')
p=P/'version-changes.js';s=p.read_text(encoding='utf8');d=json.loads(s[s.index('=')+1:].strip().rstrip(';'));d['revision']='V1 TW01無上櫃電視牆；V1／V4 AU01影音；BI01材質'
x=d['variants']['v1'];x['title']='V1 圓弧中島酒吧／TW01・AU01・BI01';x['rows']=[row for row in x['rows'] if row[0]!='無上櫃電視牆 TW01'];x['rows'].insert(0,['無上櫃電視牆 TW01','中段灰石，上方封閉櫃','移除電視上櫃；灰石至樑下，洗牆燈置頂，採V4主牆版型。','少一排315×35×75cm外廓上櫃；電箱與影音櫃保留。模型值，施工待核。'])
p.write_text("'use strict';\nwindow.HOME_VERSION_CHANGES="+json.dumps(d,ensure_ascii=False,indent=2)+';\n',encoding='utf8',newline='\n')
for name in ['index.html','提案/原始格局/index.html','提案/旋轉電視與直線中島/index.html','提案/開放大中島/index.html','提案/南牆電視與開放中島/index.html']:
 p=P/name;s=p.read_text(encoding='utf8')
 for asset in ['viewer-ui.js','assets/ai-interiors/catalog.js','ai-views.js','black-industrial-design.js','grey-stone-design.js']:
  s=re.sub(re.escape(asset)+r'(?:\?[^"\s]*)?(?=")',asset+'?v=20260924-tw01',s)
 p.write_text(s,encoding='utf8',newline='\n')
p=P/'版本調整.html';s=p.read_text(encoding='utf8');p.write_text(re.sub(r'version-changes.js(?:\?[^"\s]*)?','version-changes.js?v=20260924-tw01',s),encoding='utf8',newline='\n')
mf=read(P/'.github/publish-files.json');site={'tv-wall-unification.js','電視牆統一.html'}
for j in jobs:
 for folder in ['images','models','thumbs']:site.add(base+folder+'/'+j['key']+'.webp')
assert all((P/x).exists() for x in site)
mf['site']=list(dict.fromkeys(mf['site']+sorted(site)));mf['repositoryOnly']=list(dict.fromkeys(mf['repositoryOnly']+[f'tools/{n}' for n in ['capture-tv-wall.cjs','verify-tv-wall.cjs','install-tv-wall.py','publish-tv-wall.py']]))
write(P/'.github/publish-files.json',mf);print(json.dumps({'newAI':len(jobs),'publicAdded':len(site)}))
