"""Build the static finish review from the researched references and model views."""
from pathlib import Path
import json
from html import escape as e

root = Path(__file__).resolve().parents[1]
data = json.loads((root/'industrial-references.json').read_text(encoding='utf8'))
folder = '調整紀錄/20260911工業材質層次'
variants = [
    ('圓弧中島酒吧＋玄關矮櫃', '黑石弧吧 × 煙燻胡桃木', 'index.html',
     '黑色細脈紋石材成為吧台主角；弧形櫃皮以深胡桃木紋與細槽紋理包覆。透明展示玻璃與細黑骨架保留通透感。',
     '均一灰檯面與灰木外皮', '黑色脈紋石面、可辨識木色的弧形外皮', '01、08、16、21'),
    ('旋轉電視＋小中島', '拉絲銀 × 灰脈紋皂石', '提案/旋轉電視與直線中島/index.html',
     '小中島外側改銀色拉絲不鏽鋼，搭灰脈紋檯面。旋轉電視使用黑化鋼板雲紋，影音上板以深木銜接全屋收納。',
     '中島與電視組都偏灰黑', '銀色中島側面、灰脈紋石面、黑化鋼電視組', '01、03、13、17'),
    ('旋轉電視＋大中島', '銀白深脈紋 × 深木酒廊', '提案/開放大中島/index.html',
     '大中島用銀白底深脈紋石材，成為深色空間裡的明確焦點。社交側深木細槽，朝冰箱的設備門面為霧黑；旋轉電視為黑化鋼。',
     '石墨灰大中島，櫃身與檯面分界弱', '銀白脈紋檯面、深木社交側、霧黑工作門片', '01、03、05、18'),
    ('大中島', '深礦石 × 黑玻影音牆', '提案/南牆電視與開放中島/index.html',
     '中島使用深色礦石層理，搭深木外側。南牆電視背景改反射黑玻，與深木影音上板、黑化鋼細框共同構成客廳重點。',
     '灰色檯面與灰色電視背景', '深礦石檯面、反射黑玻電視背景、深木影音櫃', '06、16、20、22'),
]

def fig(file, caption, eager=False):
    return f'<figure><img src="{folder}/{file}.png" width="740" height="480" loading="{"eager" if eager else "lazy"}" alt="{e(caption)}"><figcaption>{e(caption)}</figcaption></figure>'

sections = []
for number, (title, concept, entry, desc, before, after, refs) in enumerate(variants, 1):
    link = entry + f'?layout=v{number}&amp;uiRoom=island&amp;lighting='
    sections.append(f'''<article class="version" id="v{number}">
      <div class="section-heading"><div><span class="eyebrow">V{number} · {e(title)}</span><h2>{e(concept)}</h2></div><a class="button" href="{link}daily">進入本版 3D ↗</a></div>
      <p class="description">{e(desc)}</p><div class="comparison"><p><small>調整前</small>{e(before)}</p><p><small>這次改為</small>{e(after)}</p></div>
      <div class="pair">{fig(f'before-v{number}-island',f'V{number} 中島｜調整前')}{fig(f'after-v{number}-island',f'V{number} 中島｜本次修改',number==1)}</div>
      <details class="more"><summary>展開公共區同角度比較</summary><div class="pair">{fig(f'before-v{number}',f'V{number} 公共區｜調整前')}{fig(f'after-v{number}',f'V{number} 公共區｜本次修改')}</div></details>
      <div class="version-foot"><a href="{link}bar">進入酒吧情境 ↗</a><a href="#references">主要借鑑案例：{refs}</a></div>
    </article>''')

cards = []
for number, case in enumerate(data['cases'],1):
    cards.append(f'''<article class="reference"><div class="ref-number">{number:02d}<small>{e(case['type'])}</small></div><div><h3><a href="{e(case['url'])}" target="_blank" rel="noopener noreferrer">{e(case['name'])} ↗</a></h3><small>{e(case['designer'])}</small><p>{e(case['feature'])}</p><p class="application"><strong>用在本案</strong>{e(case['apply'])}</p></div></article>''')

html = '''<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>22 個案例，四版材質重整｜W 夢想之家</title>
<style>
:root{color-scheme:dark;--bg:#121615;--panel:#202523;--line:#414944;--ink:#eceee9;--muted:#b5bdb5;--accent:#c7d8cd}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:85px}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.8 system-ui,"Microsoft JhengHei",sans-serif}main{max-width:1240px;margin:auto;padding:0 28px}a{color:inherit;text-underline-offset:4px}a:hover{color:white}a:focus-visible,summary:focus-visible{outline:2px solid #d5e9db;outline-offset:5px}h1,h2,h3,p{margin:0}h1{font-size:clamp(30px,4.5vw,52px);line-height:1.3;font-weight:550;letter-spacing:.015em;margin:16px 0 22px}h2{font-size:clamp(24px,3vw,31px);font-weight:550;line-height:1.45;margin:8px 0}h3{font-size:18px;font-weight:600;line-height:1.5}.eyebrow{font-size:12px;letter-spacing:.12em;color:var(--accent)}small{font-size:12px;color:var(--muted)}.top{display:flex;justify-content:space-between;padding:22px 0;border-bottom:1px solid var(--line);font-size:13px}.top a{text-decoration:none}.hero{padding:56px 0 36px}.hero p{max-width:820px;font-size:18px;color:var(--muted)}.hero strong{color:var(--ink);font-weight:500}.jump{position:sticky;top:0;z-index:2;background:#121615f5;display:flex;gap:6px;flex-wrap:wrap;padding:13px 0;border-bottom:1px solid var(--line);backdrop-filter:blur(10px)}.jump a{padding:7px 15px;border:1px solid var(--line);border-radius:3px;text-decoration:none;font-size:14px}.jump a:hover{background:var(--panel)}.principles{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:35px 0}.principles div{border-top:2px solid #8b998d;padding-top:12px}.principles p{font-size:14px;color:var(--muted);margin-top:9px}.palette{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:35px}.swatch{height:75px;border:1px solid #616860;margin-bottom:7px}.palette p{font-size:13px}.palette small{display:block;font-size:11px}.version,.shared,#references,.lighting{padding:40px 0;border-top:1px solid var(--line)}.section-heading{display:flex;justify-content:space-between;gap:24px;align-items:center}.button{flex-shrink:0;border:1px solid #84948a;border-radius:4px;padding:9px 16px;text-decoration:none;font-size:14px;background:#29332d}.description{max-width:900px;color:var(--muted);margin:12px 0 20px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0;background:var(--panel);border:1px solid #383f3a}img{width:100%;height:auto;display:block}figcaption{font-size:13px;padding:10px 14px;color:#d5dbd3}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:15px 0}.comparison p{font-size:14px}.comparison small{display:block}.comparison p:first-child{color:var(--muted)}.more{margin-top:18px}summary{cursor:pointer;color:var(--accent);padding:10px 0}.more .pair{padding-top:10px}.version-foot{display:flex;justify-content:space-between;gap:15px;margin-top:15px;font-size:13px;color:var(--muted)}.shared .pair{margin-top:20px}.lighting-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:25px}.lighting-grid p{padding:19px;background:var(--panel);font-size:14px}.lighting-grid strong{display:block;font-size:18px;font-weight:500}.lighting-grid span{display:block;color:var(--muted)}.references-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:28px;margin-top:25px}.reference{display:flex;gap:17px;padding:24px 0;border-top:1px solid var(--line)}.ref-number{min-width:32px;font-size:24px;line-height:1.3;color:#c5d3c8}.ref-number small{font-size:10px;display:block;max-width:36px;margin-top:10px}.reference h3 a{text-decoration:none}.reference p{font-size:13px;color:var(--muted);margin-top:9px}.reference .application{color:var(--ink)}.application strong{display:block;color:#a5bdad;font-size:11px;letter-spacing:.08em}.note{font-size:13px;color:var(--muted);border-left:2px solid #84968b;padding:8px 15px;margin:25px 0}footer{border-top:1px solid var(--line);padding:28px 0 45px;font-size:13px;color:var(--muted)}footer p{margin-top:12px}.footerlinks{display:flex;gap:20px;flex-wrap:wrap}@media(max-width:760px){main{padding:0 18px}.hero{padding-top:32px}.section-heading{display:block}.button{display:inline-block;margin-top:10px}.principles{grid-template-columns:1fr;gap:18px}.palette{grid-template-columns:repeat(3,1fr)}.pair,.references-grid,.lighting-grid{grid-template-columns:1fr}.version-foot{display:block}.version-foot a{display:block;margin-top:8px}.jump a{padding:5px 10px}.hero p{font-size:16px}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
</style></head><body><main>
<div class="top"><a href="index.html">W 夢想之家</a><a href="方案比較.html">四版格局比較 ↗</a></div>
<header class="hero"><span class="eyebrow">MATERIAL STUDY · 2026.09.11</span><h1>黑、木、石與金屬，<br>各自有表情。</h1><p>從 <strong>22 個案例</strong>重新整理現代工業風的材料關係。四版保留深色基調，以木紋、石脈、金屬光澤和織物拉開層次；日常看得清楚，夜晚可以調成酒吧氛圍。</p></header>
<nav class="jump" aria-label="材質頁章節"><a href="#v1">V1 弧形酒吧</a><a href="#v2">V2 小中島</a><a href="#v3">V3 旋轉大中島</a><a href="#v4">V4 大中島</a><a href="#shared">全屋共用</a><a href="#references">22 個案例 ↗</a></nav>
<section class="principles" aria-label="設計原則"><div><h3>深淺有主次</h3><p>牆面留中階礦物灰，櫃體沉下來；石材或银色金屬集中在中島，形成公共區焦點。</p></div><div><h3>粗細有差別</h3><p>手抹牆面、開放木孔、拉絲金屬、反射黑玻與編織地毯，各自使用不同紋理與反光。</p></div><div><h3>材質跟著用途走</h3><p>水槽和廚房操作面用銀色金屬；收納、吧台社交面用深木；展示維持清玻璃。</p></div></section>
<section class="palette" aria-label="材質配搭示意"><div><div class="swatch" style="background:repeating-linear-gradient(90deg,#463d32,#6b5947 4px,#4b4034 7px)"></div><p>深煙燻木</p><small>玄關、木櫃、地板</small></div><div><div class="swatch" style="background:repeating-linear-gradient(0deg,#929997,#c3c8c5 1px,#a8afab 2px)"></div><p>銀色拉絲</p><small>V2 中島、水槽、廚櫃</small></div><div><div class="swatch" style="background:linear-gradient(120deg,#151b1b,#39413f,#1b2120)"></div><p>黑化鋼板</p><small>電視機構與細框</small></div><div><div class="swatch" style="background:linear-gradient(145deg,#1f2322 40%,#7a7c72 41%,#242827 43%,#434946)"></div><p>脈紋石材</p><small>依版本分配深淺</small></div><div><div class="swatch" style="background:linear-gradient(120deg,#080f10 30%,#65706f 47%,#11191a 55%)"></div><p>反射黑玻</p><small>V4 電視背景、櫃門</small></div><div><div class="swatch" style="background:repeating-linear-gradient(0deg,#676c66,#868b83 1px,#737970 3px)"></div><p>銀灰織物</p><small>沙發、床品、地毯</small></div></section>
<p class="note">前後圖使用相同模型、視角與固定光線的離線渲染，已帶入程序紋理。圖中未模擬即時反射、凹凸與實際燈光；完整材質以各版即時 3D 呈現，GPU 外觀尚待實機驗收。上方小色票為材質搭配示意。</p>
''' + '\n'.join(sections) + '''
<section class="shared" id="shared"><span class="eyebrow">ONE HOME, CONSISTENT DETAILS</span><h2>從入口到私領域，材料接得起來</h2><p class="description">玄關、主臥化妝台與床邊木作共用深胡桃木紋；公共區地坪為深煙燻木色。廚房局部銀色收納門、書房展示櫃木內襯與銀灰織品，提供清楚的質地差異。</p><div class="pair">''' + fig('after-entry','玄關｜深木櫃與細骨料玄武岩大板磚，沿用齊平收邊') + fig('after-bedroom','主臥｜深木收納、灰白床品與柔和礦物牆面') + fig('after-kitchen','廚房｜銀色拉絲收納門，配黑框玻璃門及礦物牆面') + fig('after-study','書房｜黑框清玻璃、深木展示內襯與收納') + '''</div></section>
<section class="lighting"><span class="eyebrow">LIGHTING</span><h2>同一套深色材質，兩種生活節奏</h2><p class="description">各版「設備控制」→「燈光與窗簾」→「室內白光與情境」。照明亮度、光色和展示重點光可分別調整；主臥情境仍獨立。</p><div class="lighting-grid"><p><strong>日常 · 4000 K</strong><span>清楚的中性光，分辨石紋、木色與收藏。</span></p><p><strong>酒吧 · 2400 K</strong><span>一般照明預設 14%，展示重點光保留 32%。</span></p><p><strong>依活動調整</strong><span>另有用餐、電影、遊戲與夜間；RGB 獨立控制。</span></p></div><p class="note">這些是 3D 情境設定；不是燈具的現場照度或配光量測。畫面曝光與室內照明分開。</p></section>
<section id="references"><span class="eyebrow">22 REFERENCE PROJECTS</span><h2>案例來源與本案採用的細節</h2><p class="description">21 個住宅／Loft，加上 1 個旅館酒吧案例。每個名稱連至原專案與圖集；下列應用是本案的設計判斷，並非原設計師的建議。</p><details><summary>資料閱讀範圍</summary><p class="note">''' + e(data['method']) + '''</p></details><div class="references-grid">''' + '\n'.join(cards) + '''</div></section>
<footer><div class="footerlinks"><a href="版本調整.html">各版調整項目</a><a href="家具清單.html">家具設備清單</a><a href="industrial-references.json">22 案資料</a><a href="設計方向.md">設計方向與交接</a><a href="調整紀錄/20260911工業材質層次/驗證.json">模型檢查紀錄</a></div><p>保留四版格局、既有設備與互動。本次新增 6 張小型共用程序貼圖，沒有增加装飾模型或動畫迴圈。前後图為目前程式產生的檢視圖；舊 AI 圖仍屬更新前參考。</p></footer>
</main></body></html>
'''
(root/'材質調整.html').write_text(html.replace('银','銀').replace('装','裝').replace('图','圖'), encoding='utf8')
print('Built material review with', len(data['cases']), 'linked references and four model comparisons.')
