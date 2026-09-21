"""Build a review page from paired source views; keep historic source images intact."""
from pathlib import Path
from PIL import Image
import json, html, re
P=Path(__file__).resolve().parents[1]
R=P/'調整紀錄/20260921四版動線修正'
A=P/'成品圖集/20260914暗色現代工業'
snapshot=R/'album-before.json'
if not snapshot.exists(): snapshot.write_bytes((A/'album-manifest.json').read_bytes())
old={e['key']:e for e in json.loads(snapshot.read_text(encoding='utf8'))['entries']}
cards=[
 ('v1-entry-door5A','收藏室入口｜V1、V2','改雙聯滑門，門片疊收於短牆外側。收藏室原內開門取消；玄關櫃與中島不移位。有效開口78.8cm為模型值。'),
 ('v2-collection-A','行李轉出｜V2','左側60cm包櫃段提高櫃底至95cm，行李格取消室內櫃門。底部空間供行李轉出，不可再填滿箱子；也不是人員站立空間。'),
 ('v3-living-B','沙發背後通道｜V3','兩顆重低音移至前場，完整小型後環繞改背架承托。背架外緣至外牆內面名義90cm；已檢查兩端轉入，音箱與調音仍待選定。'),
 ('v3-living-A','前場設備｜V3','保留原尺寸的兩顆重低音，移到電視櫃前側。代價是前場器材更集中，聲學與線路須重新調整，不能只憑動線驗證決定音質。'),
 ('v1-bath1-A','主浴避撞｜四版共用','推薦濕區側滑淋浴玻璃，沿原固定玻璃收合，取消玻璃門向乾區的掃掠。入口門維持原開向，門板厚度校正至原門洞內；原名義73cm淋浴開口保留。'),
 ('v1-closet-B','櫃門取物｜四版共用','更衣室兩組受干涉櫃門、後陽台高櫃改雙片側移。保留封閉收納，單次開口約半櫃寬；大件物品須再核對。'),
 ('v1-storage-C','儲藏室拉門｜四版共用','拉門與軌道向走道移8cm，補側封縫，避開客浴門止口。保留原80cm名義門洞，局部突出量與五金須放樣。'),
 ('v1-kitchen-C','中空水槽｜四版共用','修正主廚房水槽的中空結構及上下板開孔。外徑沿用既有廚具清單78×45×28cm，槽內與開孔模板仍待廚具商確認。')]
(R/'compare').mkdir(exist_ok=True)
parts=[]
for key,title,note in cards:
 for kind,src in [('before',A/'model'/old[key]['file']),('after',R/'model'/f'{key}-mr01.png')]:
  with Image.open(src) as im: im.save(R/'compare'/f'{key}-{kind}.webp','WEBP',lossless=True,method=6)
 parts.append(f'<article><h2>{title}</h2><p>{note}</p><div class="pair">'+''.join(f'<figure><img loading="lazy" src="compare/{key}-{kind}.webp" alt="{title}｜{label}"><figcaption>{label}・相同模型視角</figcaption></figure>' for kind,label in [('before','修改前'),('after','MR01 修改後')])+'</div></article>')
def inline(s):return re.sub(r'\*\*(.+?)\*\*',r'<strong>\1</strong>',html.escape(s))
lines=(R/'修正說明.md').read_text(encoding='utf8').replace('房门','房門').splitlines()
body=[];intable=False
for line in lines:
 if line.startswith('|'):
  if re.match(r'^\|[\s:|-]+\|$',line):continue
  tag='td' if intable else 'th'
  if not intable:body.append('<div class="table"><table>');intable=True
  body.append('<tr>'+''.join(f'<{tag}>{inline(s.strip())}</{tag}>' for s in line.strip('|').split('|'))+'</tr>');continue
 if intable:body.append('</table></div>');intable=False
 if line.startswith('# '):continue
 if line.startswith('## '):body.append('<h2>'+inline(line[3:])+'</h2>')
 elif line.strip():body.append('<p>'+inline(line)+'</p>')
if intable:body.append('</table></div>')
intro='''<header><p class="eyebrow">W 夢想之家 · 2026.09.21 · MR01</p><h1>入口、取物與門片<br>四版動線修正</h1><p class="lead">先清出可連續使用的路線，再處理門片與櫃內取物。以下是顧問建議的模型試案，尚非核定施工圖。</p><nav><a href="../../index.html?layout=v1">V1 互動3D</a><a href="../../提案/旋轉電視與直線中島/index.html?layout=v2">V2 互動3D</a><a href="../../提案/開放大中島/index.html?layout=v3">V3 互動3D</a><a href="../../提案/南牆電視與開放中島/index.html?layout=v4">V4 互動3D</a><a href="../../AI寫實視角.html?version=v1">模型／AI 全屋圖集</a><a href="#details">完整取捨與尺寸</a></nav></header><section class="notice">V1 高玻璃櫃與外弧兩凳保留；四版固定牆、梁及窗洞保留；客浴 GB-R04 備品櫃、手機平台及抽取式纸盒保留。V0 保留本輪前幾何。所有尺寸皆為模型值，不能代替交屋實測。</section>'''
ai=['v3-living-B','v2-collection-A','v1-bath1-A','v1-kitchen-C']
aihtml='<section><h2>修正後 AI 概念示意</h2><p>AI 用於材質與光影溝通；配置和尺度請切回模型核對。窗外景色、反射、燈光強弱與五金細節均非現場承諾。</p><div class="pair">'+''.join(f'<figure><img loading="lazy" src="../../成品圖集/20260914暗色現代工業/images/{k}-mr01.webp" alt="{k} AI概念示意"><figcaption>{dict((c[0],c[1]) for c in cards)[k]}・AI 示意</figcaption></figure>' for k in ai)+'</div></section>'
css='''*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#111516;color:#e7e6df;font:16px/1.75 "Microsoft JhengHei",sans-serif}main{max-width:1440px;margin:auto;padding:44px 32px 100px}header{max-width:1000px;margin-bottom:36px}.eyebrow{color:#b8c9ba;font-size:13px;letter-spacing:.14em}h1{font-size:clamp(32px,5vw,48px);line-height:1.2;font-weight:500;letter-spacing:.02em}.lead{font-size:20px;color:#c2c8c3}nav{display:flex;gap:10px;flex-wrap:wrap}a{color:#d0e6d3}nav a{padding:8px 14px;border:1px solid #45524c;border-radius:5px;text-decoration:none}nav a:hover{background:#2a3830}.notice{padding:22px;background:#202925;border-left:3px solid #b6c7a0;color:#d0d8cd}article,section{margin:36px 0}h2{font-size:24px;line-height:1.4;font-weight:500}article p{max-width:1000px;color:#bdc5bf}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0;background:#202626;border-radius:6px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{padding:9px 14px;color:#c4cfc4;font-size:14px}.table{overflow-x:auto;margin:20px 0}table{border-collapse:collapse;width:100%;min-width:650px}td,th{padding:13px 16px;border:1px solid #3b4340;text-align:left;vertical-align:top}th{background:#26322b;color:#d4e6d5}td{color:#c5cbc7}#details{border-top:1px solid #526057;padding-top:20px}footer{border-top:1px solid #3d4541;padding-top:20px;color:#9da89f}@media(max-width:760px){main{padding:26px 16px}h1{font-size:34px}.pair{grid-template-columns:1fr}}'''
out='<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>四版動線修正 MR01</title><style>'+css+'</style><main>'+intro+''.join(parts)+aihtml+'<section id="details">'+''.join(body)+'</section><footer>來源：MR01 模型、相同相機的離線幾何擷取及 image_gen 示意。門片幾何檢查已完成；人體、五金承重、防水及施工仍須現場確認。</footer></main></html>'
(R/'index.html').write_text(out.replace('抽取式纸盒','抽取式紙盒'),encoding='utf8')
print('Review created: '+str(R/'index.html'))
