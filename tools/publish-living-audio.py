from pathlib import Path
import json,re
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923V1V4影音統一';A=P/'成品圖集/20260914暗色現代工業'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
jobs=read(R/'jobs.json');cs=read(R/'captures.json');current=read(A/'album-manifest.json');old={e['key']:e for e in read(R/'album-before.json')['entries']}
base='成品圖集/20260914暗色現代工業/'
out=['''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>V1／V4影音統一 AU01</title><style>body{margin:0;background:#171d1f;color:#e9ece8;font:16px/1.8 system-ui,sans-serif}main{max-width:1380px;margin:auto;padding:28px}h1{font-size:30px}a{color:#bcd3c4}table{width:100%;border-collapse:collapse;margin:22px 0}th,td{padding:12px;border:1px solid #424d50;text-align:left}th{background:#293236}.row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0;background:#252e30}img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:contain}figcaption{padding:8px}.filters{position:sticky;top:0;background:#1e292a;padding:12px;z-index:2}select{font:inherit;padding:6px;margin:0 18px 0 6px}section[hidden]{display:none}.note{color:#bec9c3}svg{width:100%;height:auto;max-width:900px;background:#222b2e} @media(max-width:760px){main{padding:14px}.row{grid-template-columns:1fr}table{font-size:13px}}</style><main>
<p><a href="index.html?layout=v1&uiRoom=living">V1 3D</a> · <a href="提案/南牆電視與開放中島/index.html?uiRoom=living">V4 3D</a> · <a href="AI寫實視角.html?version=v4&room=living&revision=au01">全屋AI圖集</a></p>
<h1>中島旁留空，沙發回靠窗側</h1><p>AU01｜2026-09-23｜V1、V4統一沙發與影音前後位置，沿用BI01霧黑天花、中灰牆與灰棕人字木。V4撤回先前向中島45cm的整組平移；中島、收納及固定門窗保持。兩版各16個受影響角度重製原生AI，其他來源相同保留。</p>
<h2>前後位置的取捨</h2><table><tr><th>比較</th><th>沿用V1深度</th><th>沿用V4深度（本輪採用）</th></tr><tr><td>主座比較點至螢幕前面</td><td>約397.2cm，83吋水平視角約26.2°</td><td>347.2cm，水平視角約29.8°；觀看畫面較大</td></tr><tr><td>前主喇叭中心方向</td><td>相對主座約18.5°，較窄</td><td>左右各約25°；主喇叭較離開背牆</td></tr><tr><td>沙發後方接近</td><td>背架後緣Y472</td><td>背架後緣Y522，留給書房側更大的接近區</td></tr><tr><td>空間與收納</td><td colspan="2">兩案不刪收納。此次V4中島檯緣X535至沙發側X797為262cm；窗側牆內面X1085至沙發側X1037為48cm，窗側只作窗簾與清潔接近。</td></tr><tr><td>施工與費用</td><td colspan="2">模型移位本身不代表新增工程報價；插座、喇叭線與四顆天花聲道須重新定位。後環繞短柱、承板、隔振、承重與音箱配搭需廠商深化，費用待報價。</td></tr></table>
<p class="note">以上全部為模型值。主座耳位比較採X917.5、Y600、離地105cm，尚未真人試坐；V1舊案以相同坐姿偏移推估Y550。距離量測至螢幕前面Y947.2。前置喇叭角度以箱體平面中心計算。不是現場完成面或聲學驗收。</p>
<p>採用依據：V4的主座距離與前置喇叭角度更適合作為本案影音深化起點；左右約25°落在<a href="https://www.dolby.com/siteassets/about/support/guide/setup-guides/5.1.4-overhead-speaker-placement/sell-sheet-5.1.4-mounted.pdf">Dolby家庭劇院位置圖</a>的前置建議區間。主喇叭背側至模型牆面約61cm，也比V1原本約5cm有更多擺位餘裕；<a href="https://ap.kef.com/en-my/blogs/news/tips-for-positioning-your-speakers-and-television">KEF擺位指引</a>要求留意背牆與側牆距離並透過試聽調整。本案靠窗側主喇叭仍較接近側界，不能宣稱完全符合所有理想擺位条件。</p>
<h2>統一後保留的待核事項</h2><p>後環繞採背架上的小型完整音箱候選，撤除V4舊嵌入式單體背腔示意；不是已選購Focal或核定其他品牌。主座後環繞方向約123°，仍需影音商按實際坐姿與音箱指向試聽，不能把通路通過當作聲學最佳。兩顆重低音沿前場位置試配，往客廳微移9cm留出約11cm模型背側線材空間；最後位置、延遲、相位與分頻待量測。</p><p>天空聲道重整為主座前後兩排，已按現有模型檢查避樑；現場樑下與埋深須複量。指定60cm通行包絡完成入口至書房、公共區至書房及V4兩席拉椅抽樣；48cm窗側不列為主要通道。</p>
<h2>32個受影響角度</h2><div class="filters"><label>版本<select id="version"><option value="v4">V4</option><option value="v1">V1</option></select></label><label>空間<select id="room"><option value="all">全部受影響空間</option><option value="living" selected>客廳</option><option value="entry">玄關</option><option value="island">中島</option><option value="bed">主臥回望</option><option value="study">雙人書房</option><option value="collection">展示／收藏</option><option value="storage">儲藏室回望</option></select></label><span id="count" role="status"></span></div>'''.replace('条件','條件')]
for e in current['entries']:
 if not e['aiKey'].endswith('-au01'):continue
 out.append(f'<section data-version="{e["version"]}" data-room="{e["room"]}" hidden><h3>{e["version"].upper()} · {e["name"]} · {e["angle"]}</h3><div class="row">')
 for family,k,label in [('images',old[e['key']]['aiKey'],'調整前AI（歷史位置）'),('models',e['aiKey'],'AU01來源模型'),('images',e['aiKey'],'AU01新AI（概念示意）')]:
  u=base+family+'/'+k+'.webp';out.append(f'<figure><a href="{u}"><img loading="lazy" src="{u}" alt="{e["key"]} {label}"></a><figcaption>{label}</figcaption></figure>')
 out.append('</div></section>')
out.append('''<p class="note">AI效果圖不作尺寸或施工依據；微小接縫、收藏造型、外景與反射為示意。正式幾何以AU01模型為準。</p></main><script>const v=document.getElementById('version'),r=document.getElementById('room');function filter(){let n=0;for(const s of document.querySelectorAll('section[data-version]')){s.hidden=s.dataset.version!==v.value||(r.value!=='all'&&s.dataset.room!==r.value);if(!s.hidden)n++;}document.getElementById('count').textContent=n+' 個角度';}v.addEventListener('change',filter);r.addEventListener('change',filter);filter();</script></html>''')
(P/'影音統一.html').write_text(''.join(out),encoding='utf8')
p=P/'version-changes.js';s=p.read_text(encoding='utf8');d=json.loads(s[s.index('=')+1:].strip().rstrip(';'));d['revision']='V1／V4 AU01影音統一；全版BI01材質'
for v in ['v1','v4']:
 x=d['variants'][v];x['title']=('V1 圓弧中島酒吧' if v=='v1' else 'V4 大中島')+'／AU01・BI01'
 x['rows']=[row for row in x['rows'] if row[0]!='影音統一 AU01']
 x['rows'].insert(0,['影音統一 AU01','兩版沙發與前後聲道各自試配；V4向中島側移45cm','V4回靠窗側；兩版共同主座距螢幕347.2cm，後環繞完整小型音箱背架試配，天空前後兩排。','中島旁留空；窗側48cm非主要通道。全部模型值，實品與聲學待核。'])
 for row in x['rows'][1:]:
  if row[0] in ['公共區比例 R02','後環繞 R02']:row[0]+='（歷史，由AU01取代）'
  row[:]=[t.replace('沿用R02全部幾何與收納','影音位置依AU01更新，其餘收納保持').replace('主座距螢幕約349','主座比較點至螢幕前面347.2cm（AU01模型值）') for t in row]
p.write_text("'use strict';\nwindow.HOME_VERSION_CHANGES="+json.dumps(d,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
for name in ['index.html','提案/原始格局/index.html','提案/旋轉電視與直線中島/index.html','提案/開放大中島/index.html','提案/南牆電視與開放中島/index.html']:
 p=P/name;s=p.read_text(encoding='utf8')
 for asset in ['viewer-ui.js','assets/ai-interiors/catalog.js','ai-views.js','furniture-data.js','black-industrial-design.js']:
  s=re.sub(re.escape(asset)+r'(?:\?[^"\s]*)?(?=")',asset+'?v=20260923-au01-final',s)
 p.write_text(s,encoding='utf8')
p=P/'版本調整.html';s=p.read_text(encoding='utf8');p.write_text(re.sub(r'version-changes.js(?:\?[^"\s]*)?','version-changes.js?v=20260923-au01',s),encoding='utf8')
mf=read(P/'.github/publish-files.json');site={'living-audio-unification.js','living-audio-finalize.js','影音統一.html'}
for j in jobs:
 for folder in ['images','models','thumbs']:site.add(base+folder+'/'+j['key']+'.webp')
assert all((P/x).exists() for x in site)
mf['site']=list(dict.fromkeys(mf['site']+sorted(site)));mf['repositoryOnly']=list(dict.fromkeys(mf['repositoryOnly']+[f'tools/{n}' for n in ['verify-living-audio.cjs','capture-living-audio.cjs','prepare-living-ai.py','install-living-audio.py','publish-living-audio.py']]))
write(P/'.github/publish-files.json',mf)
print(json.dumps({'newAI':len(jobs),'publicAdded':len(site)}))
