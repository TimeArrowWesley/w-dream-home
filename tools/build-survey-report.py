"""Build the public SV01 change report from measured runtime exports."""
from pathlib import Path
import json,shutil,html,csv
R=Path(__file__).resolve().parents[1]
OUT=R/'調整紀錄/20261106放樣尺寸SV01'
PUB=R/'assets/review-sv01';PUB.mkdir(parents=True,exist_ok=True)
versions=json.loads((R/'version-registry.json').read_text('utf8'))['versions']
reports=[json.loads((OUT/(v['id']+'-changes.json')).read_text('utf8')) for v in versions]
rows=[]
def row(room,item,a,b,basis='1103圖面標註',note=''):
 rows.append(dict(room=room,item=item,before=a,after=b,delta=round(b-a,2) if isinstance(a,(int,float)) and isinstance(b,(int,float)) else None,basis=basis,note=note))
for room,ow,od,nw,nd,note in [('主臥',480,282,480,280,'北牆內面向南2cm；此表為主要矩形段'),('主浴',380,191,375,183,'西內面−75→−72，東內面305→303；北內面292→295，南內面483→478'),('客浴',155,148,150,141,'西內面415→421，東內面570→571；北內面217→222，南內面365→363'),('電腦房',330,365,328,374,'西內面755→757；南側設計玻璃隔間北面365→374'),('廚房',210,462,212,462,'以實際模型牆內面量測；原舊文字215不是原模型淨寬'),('儲藏室',165,95,162,93,'西內面580→583；南內面365→363')]:
 row(room,'主要段淨寬',ow,nw,'標註鏈與牆線對位',note);row(room,'主要段淨深',od,nd,'標註鏈與牆線對位',note)
row('更衣室','北側兩隔牆間距',330,324,'依標註鏈與牆厚對位','非扣除柱、管道與衣櫃後的可用寬')
row('客廳','書房玻璃南面至南牆',580,573,'設計隔間隨放樣調整','玻璃南面375→382；圖面581量到374分界線，起點不同')
row('玄關','入戶結構門區',154.8,156,'圖面156','柱右面545.2→546；門區右緣700→702；右牆383與圖示384存在1cm端點疑點')
row('廚房','兩排檯面前緣名義距離',83.5,85.5,'模型實量／櫃體維持原尺寸','東側櫃體向東移2cm；現場五金與完成面另核')
row('主臥','結構樓板高度 CH',315,309,note='裝修天花仍275，不把CH當裝修淨高')
row('公共區','結構樓板高度 CH',315,310,note='裝修天花仍275；廚房設計天花240保持')
for room,item,a,b,n in [('主臥','北側梁底',245,238,'梁位同時對齊北牆'),('主臥','西側梁底',245,236,'舊梁誤在x0–45；新梁在x−90–−30'),('電腦房','北側梁底',245,238,''),('南側','周圈梁底',245,238,''),('走道／書房','橫梁底',245,258,'舊單段示意梁撤換為兩段，位置與寬度見完整構件表')]:row(room,item,a,b,note=n)
row('中央','縱梁底','原模型缺漏',238,note='x482–546，y82–880；梁寬與範圍由向量虛線對位')
row('主臥','舊東側示意梁','x380–405／梁底265','移除','最新圖無此梁位','以1103的中央縱梁與兩段橫梁取代舊假設')
row('更衣室','柱寬',95,101,'向量牆線對位','柱左緣485→482、右緣580→583')
row('玄關','南側柱寬',100.1,102,'圖面102','左緣445.1→444、右緣545.2→546')
row('客廳','窗間柱南北長度',70,83,'向量牆線對位','起點580→572、終點650→655')
row('更衣室','管道外包寬',60,81,'向量牆線對位','左緣555→546，右緣615→627')
row('更衣室','管道外包深',40,39,'向量牆線對位','起點80→82、終點120→121')
row('更衣室','柱下頂天櫃寬',61,64,'配合已校正管道的設計調整','外包x482–546，不能穿入管道間')
for room,top in [('入戶門',230),('客浴門洞',220),('儲藏室門洞',220)]:row(room,'門洞高度',215,top)
row('廚房門洞','門機上緣／封板起點',223,240,'圖面DH240','滑門玻璃及上吊軌同步加高；非玻璃片本身240')
row('入戶門','小門','實牆封住','恢復35.7cm可開啟門片','向量門扇對位','主門107cm名義寬保持，主門改向室內開啟')
row('主臥走道／書房','門頂封板上緣',245,275,'配合新梁位的設計收口','補齊舊門頂與新梁之間的缺口，與梁相接處為實心收口')
for q in reports[1]['summary']:
 for key,a in q['before'].items():
  b=q['after'].get(key)
  if b is None or a==b:continue
  labels={'width':'寬','sill':'窗台高','height':'窗洞高','top':'上緣','railCenter':'窗簾軌道中心高','x':'起點X','y':'起點Y'}
  row(q['room'],q['item']+'・'+labels.get(key,key),a,b,q['basis'],'V1基準；各版個別構件明細在下方')
# Expose every changed/removed/added component, including historical versions.
components=[]
for data in reports:
 for i,raw in enumerate(data['records']):
  r=dict(raw);r['id']=data['version']+'-'+str(i+1)
  for k in ['before','after','delta']:
   if r.get(k):r[k]={a:round(b,2) for a,b in r[k].items()}
  r['kind']='新增' if r.get('before') is None else '移除' if r.get('after') is None else '尺寸變更' if any(abs(r.get('delta',{}).get(k,0))>.04 for k in ['w','d','h']) else '移位'
  if r['name'].endswith(' / Mesh'):r['name']+='（原位置 '+','.join(str(r['before'][k]) for k in ['x','y','z'])+'）'
  components.append(r)
for v in versions:shutil.copy2(OUT/(v['id']+'-all.jpg'),PUB/(v['id']+'-plan.jpg'))
data={'revision':'20261106-SV01','source':'2026/11/03 放樣圖 P-03','unit':'cm','summary':rows,'versions':[{'id':v['id'],'name':v['name'] if 'name' in v else v.get('label',v['id']),'path':v['path']} for v in versions],'components':components,'limits':reports[1]['state']['limits']}
(PUB/'data.js').write_text('window.SURVEY_REPORT='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';',encoding='utf8',newline='\n')
with (OUT/'全室尺寸變更.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['空間','項目','原尺寸cm','新尺寸cm','增減cm','依據','說明']);w.writerows([[r[k] for k in ['room','item','before','after','delta','basis','note']] for r in rows])
page=r'''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>全室尺寸變更｜W夢想之家 SV01</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#151b1c;color:#e4e8e6;font:15px/1.65 system-ui,"Microsoft JhengHei"}main{max-width:1500px;margin:auto;padding:28px}h1{font-size:28px;margin:10px 0}h2{font-size:21px;margin-top:40px}a{color:#b7d9c9}p{max-width:1000px;color:#bfc9c5}nav,.filters{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.tag{color:#9bb8ab;font-size:12px;letter-spacing:.12em}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.cards a{display:block;background:#202829;border-radius:10px;overflow:hidden;text-decoration:none}.cards img{width:100%;display:block}.cards span{display:block;padding:10px}button,select,input{font:inherit;background:#293735;color:inherit;border:1px solid #60726b;border-radius:6px;padding:8px 12px}input{min-width:240px}button{cursor:pointer}.scroll{overflow:auto;border:1px solid #3d4a46;border-radius:8px;margin:14px 0}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #34403c;vertical-align:top}th{background:#26302e;position:sticky;top:0;white-space:nowrap}td.num{white-space:nowrap;font-variant-numeric:tabular-nums}.up{color:#a8d8c1}.down{color:#efc292}.note{border-left:3px solid #c5ac79;padding:8px 18px;background:#242b28}.muted{color:#a7b7ae;font-size:12px}.paging{display:flex;gap:15px;align-items:center}.compact{white-space:nowrap;font-size:12px}@media(max-width:760px){main{padding:18px}.cards{grid-template-columns:1fr 1fr}h1{font-size:24px}td,th{padding:8px}input{width:100%}}</style>
<main><nav><a href="index.html">← 開啟3D</a><span class="tag">SV01 · 1103 放樣校正</span></nav><h1>全室尺寸變更</h1><p>比較修改前的實際3D模型與依2026年11月3日放樣圖校正後的模型。單位全部為公分；正值代表增加／往東或南移，負值代表減少／往西或北移。V0～V5全部列入，V4、V5仍是停用歷史版本。</p>
<div class="note"><strong>標註尺寸、向量推估與設計調整分開列示。</strong><p>原圖的CH309／310是樓板高度；275cm裝修天花、240cm廚房天花仍屬設計設定。未標出的洞寬、牆厚、梁寬按向量牆線對位。南側156cm門區與384cm右牆的標註起點約差1cm，模型保留156門區、右段383cm，這一點仍需設計師確認。</p><p>冰箱、衛浴設備及已訂廚具維持產品尺寸。受梁影響的訂製櫃與門頂收口是配合新格局的設計調整。既有AI及舊Cycles圖尚未重製；靜態間接光與反射仍沿用，不能當成重新烘焙完成。</p></div>
<h2>主要尺寸與高度</h2><div class="filters"><button id="csvSummary">下載主要變更 CSV</button><span>所有版本共用的固定格局；櫃體範例以V1為基準。</span></div><div class="scroll"><table><thead><tr><th>空間</th><th>項目</th><th>修改前</th><th>修改後</th><th>增減</th><th>依據／說明</th></tr></thead><tbody id="summary"></tbody></table></div>
<h2>逐版完整構件明細</h2><p>所有尺寸或位置變動的牆、門框、櫃板、層板、設備與新增梁體均可查詢。地板及小地圖邊界同步跟隨房間調整；外包絡不變的局部輪廓變形不另計一筆構件。寬／深／高是關門狀態的模型外包絡；小於0.05cm的數值誤差不列為變更。非矩形物件的外包絡不代表內部可用尺寸，圖中未標註的數字也不是新增實測精度。</p><div class="filters"><select id="version"><option value="">全部版本</option></select><select id="room"><option value="">全部空間</option></select><select id="kind"><option value="">全部變更</option><option>尺寸變更</option><option>移位</option><option>新增</option><option>移除</option></select><input id="search" placeholder="搜尋櫃名、設備、牆或構件編號" aria-label="搜尋構件"><button id="csvAll">下載目前篩選 CSV</button></div><p id="count"></p><div class="scroll"><table><thead><tr><th>版本／空間</th><th>構件</th><th>類型</th><th>原 寬×深×高</th><th>新 寬×深×高</th><th>寬／深／高增減</th><th>X／Y／Z移位</th></tr></thead><tbody id="components"></tbody></table></div><div class="paging"><button id="prev">上一頁</button><span id="page"></span><button id="next">下一頁</button></div>
<h2>校正後的六版3D</h2><p>下列為實際網頁3D取景。點選圖片開啟對應版本。</p><div class="cards" id="versions"></div><p class="muted">座標原點沿用專案：X向東、Y向南，Z為離完成地坪高度。家具採購狀態未因本輪校正改變。完整檢查紀錄留在本機「調整紀錄／20261106放樣尺寸SV01」。</p></main><script src="assets/review-sv01/data.js"></script><script>
const D=SURVEY_REPORT,$=id=>document.getElementById(id),esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),num=n=>typeof n==='number'?Math.round(n*100)/100:n,sign=n=>n==null?'—':n>0?'+'+num(n):num(n);
$('summary').innerHTML=D.summary.map(r=>`<tr><td>${esc(r.room)}</td><td>${esc(r.item)}</td><td class="num">${esc(num(r.before))}</td><td class="num">${esc(num(r.after))}</td><td class="num ${r.delta>0?'up':r.delta<0?'down':''}">${esc(sign(r.delta))}</td><td>${esc(r.basis)}<div class="muted">${esc(r.note)}</div></td></tr>`).join('');
for(const v of D.versions){$('version').add(new Option(v.id.toUpperCase(),v.id));const a=document.createElement('a');a.href=v.path;a.innerHTML=`<img loading="lazy" src="assets/review-sv01/${v.id}-plan.jpg" alt="${v.id}校正後3D"><span>${esc(v.id.toUpperCase()+' · '+v.name)}</span>`;$('versions').append(a);}
for(const room of [...new Set(D.components.map(r=>r.room))].sort())$('room').add(new Option(room,room));let page=0,list=[],size=100;
const triple=(r,keys,delta=false)=>r?keys.map(k=>delta?sign(r[k]):num(r[k])).join(' / '):'—';
function render(){const q=$('search').value.trim().toLowerCase();list=D.components.filter(r=>(!$('version').value||r.version===$('version').value)&&(!$('room').value||r.room===$('room').value)&&(!$('kind').value||r.kind===$('kind').value)&&(!q||(r.name+' '+r.id+' '+r.sourceId).toLowerCase().includes(q)));page=Math.min(page,Math.max(0,Math.ceil(list.length/size)-1));$('count').textContent=`篩選結果 ${list.length.toLocaleString()} 項／完整紀錄 ${D.components.length.toLocaleString()} 項`;$('components').innerHTML=list.slice(page*size,(page+1)*size).map(r=>`<tr><td>${esc(r.version.toUpperCase())}<br>${esc(r.room)}</td><td>${esc(r.name)}<div class="muted">${esc(r.id)} · ${esc(r.sourceId||'新增／原始構件')}</div></td><td>${esc(r.kind)}</td><td class="compact">${esc(triple(r.before,['w','d','h']))}</td><td class="compact">${esc(triple(r.after,['w','d','h']))}</td><td class="compact">${esc(triple(r.delta,['w','d','h'],true))}</td><td class="compact">${esc(triple(r.delta,['x','y','z'],true))}</td></tr>`).join('');$('page').textContent=`${page+1} / ${Math.max(1,Math.ceil(list.length/size))}`;$('prev').disabled=page===0;$('next').disabled=(page+1)*size>=list.length;}
for(const id of ['version','room','kind','search'])$(id).addEventListener('input',()=>{page=0;render();});$('prev').onclick=()=>{page--;render();};$('next').onclick=()=>{page++;render();};
function csv(name,rows){const s='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n'),a=document.createElement('a'),url=URL.createObjectURL(new Blob([s],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('csvSummary').onclick=()=>csv('全室主要尺寸變更.csv',[['空間','項目','原尺寸cm','新尺寸cm','增減cm','依據','說明'],...D.summary.map(r=>[r.room,r.item,r.before,r.after,r.delta,r.basis,r.note])]);$('csvAll').onclick=()=>csv('全室構件尺寸變更.csv',[['版本','空間','編號','構件','類型','原寬','原深','原高','新寬','新深','新高','寬增減','深增減','高增減','X移位','Y移位','Z移位','說明'],...list.map(r=>[r.version,r.room,r.id,r.name,r.kind,...['w','d','h'].map(k=>r.before?.[k]),...['w','d','h'].map(k=>r.after?.[k]),...['w','d','h','x','y','z'].map(k=>r.delta?.[k]),r.reason])]);render();
</script></html>'''
(R/'全室尺寸變更.html').write_text(page,encoding='utf8',newline='\n')
print(json.dumps({'summaryRows':len(rows),'componentRows':len(components),'versions':len(versions)},ensure_ascii=False))
