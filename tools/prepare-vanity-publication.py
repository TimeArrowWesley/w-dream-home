from pathlib import Path
from PIL import Image
import json,re
P=Path(__file__).resolve().parents[1];A=P/'成品圖集/20260914暗色現代工業';R=P/'調整紀錄/20261001全版本化妝桌VT02';T=P/'評估/20261001玻璃化妝桌VT01'
def save(p,s):p.write_text(s,encoding='utf8',newline='\n')
out=P/'assets/vanity';out.mkdir(exist_ok=True)
for src,dst in [('VT01-01_鏡子收起.png','vt02-closed.webp'),('VT01-02_鏡子展開.png','vt02-open.webp')]:
 with Image.open(T/src) as im:im.convert('RGB').save(out/dst,'WEBP',quality=90,method=6)
svg=(T/'尺寸示意.svg').read_text(encoding='utf8').replace('VT01｜','VT02｜').replace('V1 主臥原桌位 · 顧問試案／未採用','V0～V5 主臥 · 業主採用概念／尺寸待核')
save(out/'vt02-dimensions.svg',svg)
reg=json.loads((P/'version-registry.json').read_text(encoding='utf8'))['versions']
for v in reg:
 p=P/v['path'];s=p.read_text(encoding='utf8')
 for name in ['assets/ai-interiors/catalog.js','furniture-data.js','ai-views.js']:
  s=re.sub(re.escape(name)+r'\?v=[^"\s]+',name+'?v=20261001-vt02',s)
 save(p,s)
p=A/'index.html';s=p.read_text(encoding='utf8').replace('album-data.js?v=20261001-cp02','album-data.js?v=20261001-vt02')
s=s.replace('2026-10-01 CP02：V1～V5 電腦房模型與五張 AI 已更新，共用於25圖位；V0原案保留。六版共360圖位、217張獨立成品，V4／V5維持停用。其他空間圖片沿用前版。','2026-10-01 VT02：六版主臥換上玻璃展示化妝桌，9 張新 AI 更新 18 圖位；其他主臥角度來源相同保留。V1～V5 電腦房維持 CP02。全屋共 360 圖位、217 張獨立成品，V4／V5 維持停用。')
save(p,s)
p=P/'設計現況.html';s=p.read_text(encoding='utf8').replace('其餘區域延續 IR01／HR01','六版主臥採 VT02 玻璃展示化妝桌；其餘區域延續 IR01／HR01')
s=s.replace('<section><h2>目前成果</h2>','<section><h2>主臥玻璃展示化妝桌 VT02</h2><p>V0～V5 同步玻璃桌面、兩端香水格與下方雙抽屜、中央淺飾品盤與隱藏翻蓋鏡。鏡子先翻起再前拉，左右香水盤可獨立拉出。模型與 AI 的床、窗戶及其他櫃位保留；尺寸、坐姿及五金仍待核定。</p><p><a href="化妝桌設計.html">查看鏡子收放、尺寸與六版模型入口 ↗</a>。30 個主臥來源重新比對；9 張新 AI 更新 18 圖位，其餘 12 個來源相同保留。全屋其他 330 圖位延續前版。</p></section><section><h2>目前成果</h2>')
save(p,s)
# Keep the adopted trial preview from applying a second vanity over VT02.
p=T/'index.html';s=p.read_text(encoding='utf8').replace("trial=applyVanityTrial({T:w.THREE,V:w.HOME_VIEWER,c:w});","trial=w.HOME_VANITY?{state:k=>{for(const [key,value] of Object.entries({mirror:k!=='closed',stool:k!=='closed',drawer:k==='access',perfumeLeft:k==='access',perfumeRight:k==='access'}))w.HOME_BEDROOM.setFurniture(key,value);}}:applyVanityTrial({T:w.THREE,V:w.HOME_VIEWER,c:w});")
s=s.replace('獨立試案已載入；此操作不會改寫正式模型。','已採用為 VT02；此處操作使用正式模型的收放控制。');save(p,s)
p=P/'tools/finalize-home-album.py';s=p.read_text(encoding='utf8');anchor="browser_reports['20261001-cp02']='調整紀錄/20261001電競房CP02/瀏覽器核對.json'";s=s.replace(anchor,anchor+"\nbrowser_reports['20261001-vt02']='調整紀錄/20261001全版本化妝桌VT02/瀏覽器核對.json'");save(p,s)
p=P/'.github/publish-files.json';d=json.loads(p.read_text(encoding='utf8'));d['site']=sorted(set(d['site'])|{'化妝桌設計.html','assets/vanity/vt02-closed.webp','assets/vanity/vt02-open.webp','assets/vanity/vt02-dimensions.svg'}|{f'成品圖集/20260914暗色現代工業/{family}/{j["key"]}.webp' for j in json.loads((R/'jobs.json').read_text(encoding='utf8')) for family in ['images','models','thumbs']})
d['repositoryOnly']=sorted(set(d['repositoryOnly'])|{f'tools/{n}' for n in ['capture-vanity-vt02.cjs','verify-vanity-vt02.cjs','install-vanity-vt02.py','prepare-vanity-vt02.py','prepare-vanity-publication.py']});save(p,json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print('VT02 publication assets prepared')
