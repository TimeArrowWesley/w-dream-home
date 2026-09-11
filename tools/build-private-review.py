"""Build the small public review page from verified geometry results."""
from pathlib import Path
import json, html

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / '調整紀錄/20260911全屋核對與主臥細節'
report = json.loads((OUT / '驗證.json').read_text(encoding='utf8'))
rows = [
 ('化妝台', '固定立鏡、椅凳、抽屜', '鏡子前拉35cm、雙側柔光；椅凳拉出48cm；飾品抽屜35cm行程、側面插座'),
 ('主臥櫃體', '材質與把手不一致', '床頭與化妝台統一深灰棕直紋木皮、橫向指拉；工作高度仍為70／75cm'),
 ('更衣收納', '東側雙吊掛為主', '保留長短衣；東側北段63cm抽屜櫃、薄包防塵櫃、上方季節包架、櫃內灯'),
 ('燈光', '日夜與一般補光', '日常／化妝／閱讀／投影／起夜；投影關閉主臥簾，更衣櫃燈獨立控制'),
 ('儲藏室', '模型為平開門', '依原圖拉門改外掛滑門，80cm開口；保留原開口位置'),
 ('使用狀態', '主要看靜態尺寸', '家具收放、滑鏡互鎖、步行站位避讓、通道阻擋及情境切換均加入檢查')
]
inventory = [
 ('全戶', '核對6根資料柱、6條主要隔牆；天花、樑與外框仍依既有設計基準。未宣稱逐段牆線完成施工放樣。'),
 ('主臥', '原190×75桌位已補化妝台；床與投影設備保留；原圖床頭小冰箱已由後續家具方案取代，沒有當成漏件恢復。'),
 ('更衣室', '窗前矮櫃、頂天櫃、管道間、滑鏡、三面衣櫃保留；本次細化抽屜和包包分區。'),
 ('雙人書房', '原圖書桌與鋼琴配置已改為已確認雙FUNTE桌、57吋螢幕和展示櫃；沒有恢复鋼琴。'),
 ('主浴／客浴', '浴缸、南側淋浴組、洗手台、鏡櫃與馬桶在模型中；沿用前次修正位置。'),
 ('儲藏室', '層架與暫置櫃保留；本次修正拉門。室內模型淨範圍約165×95cm。'),
 ('廚房／後陽台', '廚具依較新的立面與設備表，保留雙冰箱、洗碗、蒸烤、洗烘及室外機。後陽台由北側門通行；南段廚具背側門窗線型待立面核對，未新增不通的門。'),
 ('玄關', '掛衣、帽鉤、隨身包、鑰匙及少量鞋收納按各版既定方案保留。'),
 ('收藏區', 'V1／V2保留收藏室；V3／V4拆房改沿邊展示、深收納是刻意的方案差異。'),
 ('中島／客廳', '四版中島95cm高、設備分艙及影音配置保留；原曲線沙發及100吋TV由後續方案取代。')
]
use = [
 ('化妝椅凳', '收妥床側90cm；拉出後約55cm。', '使用時不是雙人通道；完成後收回。'),
 ('化妝台抽屜', '上抽前拉35cm；分格托盤與原有結構無新增相交。', '實際滑軌、承重與電線由木作放樣。'),
 ('更衣抽屜／滑鏡', '抽屜只做到L形轉角前，前拉35cm；互鎖避免相鄰家具同時使用。', '示意衣物不是實際收納容量保證。'),
 ('洗碗機', '沿既有60cm開門預留檢查：前方局部不是可同時通行的走道。', '以門板及E-number安裝圖核對；開門取碗時暫停穿行。'),
 ('冰箱／酒櫃', '機身外徑與現有設備艙維持；V2～V4在相對位置，開門作業區相互影響。', '尚未取得完整門開及抽屜拆卸包絡，不列為同時開門已通過。'),
 ('蒸烤箱', '位於北側高櫃，正面取盤位置保留。', '熱盤站位、向下開門深度待實品核對。'),
 ('Omni PRO座椅', '两張坐姿模型保留；原廠有160°後仰。', '完整躺倒長度和腳踏外徑未齊，沒有宣稱全躺已通過。'),
 ('海豚＋推車', '使用者確認整組收。現有層架最下格淨高45cm，不能照主機外徑直接認定可放。', '待整組推車最大寬×深×高，再安排落地停放和轉入路徑；未假造推車模型。')
]
def table(headers, data):
 return '<div class="scroll"><table><thead><tr>'+''.join('<th>'+html.escape(x)+'</th>' for x in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+html.escape(x)+'</td>' for x in row)+'</tr>' for row in data)+'</tbody></table></div>'
def pair(id, title):
 return '<h2>'+title+'</h2><div class="pair">'+''.join('<figure><img loading="lazy" src="'+mode+'-'+id+'.png" alt="'+title+'・'+label+'"><figcaption>'+label+'</figcaption></figure>' for mode,label in [('before','調整前'),('after','調整後')])+'</div>'
body = '''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>全屋核對與主臥生活細節｜W夢想之家</title><style>
*{box-sizing:border-box}body{margin:0;background:#101b1b;color:#e4ece6;font:16px/1.8 system-ui,sans-serif}main{max-width:1180px;padding:32px 24px;margin:auto}h1{font-size:30px}h2{font-size:23px;margin-top:40px}p{max-width:850px;color:#becdc4}a{color:#bfdbce}nav{display:flex;gap:12px;flex-wrap:wrap}nav a{padding:9px 15px;border:1px solid #53675c;border-radius:6px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:15px;border-bottom:1px solid #42544c;vertical-align:top}th{background:#263a32}td:first-child{min-width:140px}.scroll{overflow:auto}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:0;background:#22342d}img{width:100%;display:block}figcaption{padding:9px 14px}.note{border-left:3px solid #adc5b6;padding-left:16px}small{color:#b2c4ba}@media(max-width:760px){.pair{grid-template-columns:1fr}main{padding:22px 15px}h1{font-size:25px}}@media print{body{background:white;color:black}p,small{color:#333}nav{display:none}table{font-size:11px}figure{break-inside:avoid}}
</style><main><small>2026-09-11 · V1～V4 共用調整</small><h1>把主臥做成能使用的空間</h1><p>化妝、穿衣、閱讀與睡前照明加入實際操作；全屋固定家具按原圖及後續已確認版本核對。四版格局差異保留。</p><nav><a href="../../index.html?layout=v1&amp;uiRoom=bed">開啟主臥3D</a><a href="../../版本調整.html">四版調整清單</a><a href="../../家具清單.html">家具設備表</a></nav><p class="note">下方為實際模型的同角度離線幾何與底色圖，非AI想像圖。這組圖片不含GPU木紋、鏡面反射及真實光照；燈光功能請在3D內操作。</p>'''
body += table(['項目','調整前','調整後'],rows)
body += pair('vanity','化妝台：鏡子、抽屜與側邊插座')
body += '<figure><img loading="lazy" src="use-vanity.png" alt="鏡子拉近、椅凳與上抽拉出"><figcaption>使用狀態：椅凳與抽屜拉出。床側縮至55cm，使用完成請收回。</figcaption></figure>'
body += pair('bedroom','主臥：材質和橫向指拉一致')+pair('closet','更衣室：轉角前的分隔抽屜')
body += '<figure><img loading="lazy" src="use-closet.png" alt="更衣室上層分隔抽屜拉出"><figcaption>抽屜展開35cm；南側原衣櫃與滑鏡軌道保留。</figcaption></figure>'
body += '<p class="note">後續更新：依業主指示，儲藏室已改為可調式層架，原暫置矮櫃移除。<a href="../20260911儲藏室可調層架/index.html">查看可調層架配置</a>；以下為本次全屋核對當時的紀錄。</p><h2>使用時的空間</h2>'+table(['項目','核對結果','使用或確認事項'],use)
body += '<h2>原圖與後續方案逐區核對</h2>'+table(['區域','核對與差異'],inventory)
body += '<h2>驗證範圍</h2><p>四版保留13個導覽位置和24個設備實例。相對前一版，幾何差異限於主臥、更衣室與儲藏拉門區；家具平移每項檢查11個位置，未與固定物件相交。儲藏室關門阻擋、開門通行及步行者避讓均測試。</p><p>五種情境、窗簾聯動、按鈕狀態、四版頁面切換及靜止停止送出繪圖的程式行為已驗證。未在瀏覽器實測GPU幀率、噪音、反射或照度，也不取代現場放樣。</p><p><a href="驗證.json">檢查數據</a> · <a href="https://jp.libernovo.com/pages/libernovo-omni-pro-dynamic-ergonomic-chair">Omni PRO原廠角度資料</a> · <a href="https://www.lg.com/tw/refrigerators/side-by-side/gr-qplc82ss/">主冰箱原廠</a></p></main></html>'
body = body.replace('两張','兩張').replace('灯','燈').replace('恢复','恢復')
(OUT/'index.html').write_text(body,encoding='utf8')
print('Private-room review page written')
