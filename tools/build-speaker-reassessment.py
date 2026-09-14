"""Source-plan feasibility study. Dimensions are candidates, not installation approval."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, math, html, base64, io

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'提案/20260914喇叭配置'
FONT='C:/Windows/Fonts/msjh.ttc'; BOLD='C:/Windows/Fonts/msjhbd.ttc'
INK='#24343c'; MUTED='#65747c'; BG='#f5f7f7'
COLORS={'front':'#176f64','surround':'#7654a1','top':'#227da6','sub':'#a06a1e'}
exec(compile((ROOT/'tools/speaker-plan-drawing.py').read_text(encoding='utf8'),'speaker-plan-drawing.py','exec'))

SOURCES=[
 ('Dolby 5.1.4 家庭劇院配置圖','https://www.dolby.com/siteassets/about/support/guide/setup-guides/5.1.4-overhead-speaker-placement/sell-sheet-5.1.4-mounted.pdf'),
 ('Dolby 家庭劇院安裝指南，第 5–8 頁','https://www.dolby.com/siteassets/technologies/dolby-atmos/atmos-installation-guidelines-121318_r3.1.pdf'),
 ('KEF：壁掛、家具安置與空間取捨','https://us.kef.com/blogs/news/mount-up-on-wall-home-theater-solutions'),
 ('KEF Q4 Meta：原廠壁掛 LCR','https://tw.kef.com/products/q4-meta'),
 ('KEF T301：60×14×3.5cm 封閉箱體','https://ap.kef.com/products/t301-satellite-speakers'),
 ('KEF T301c：同系列中置','https://ap.kef.com/products/t301c-centre-channel-speaker'),
 ('Focal Dôme Flax：桌面／壁面／天花安裝','https://www.focal.com/products/dome-flax'),
 ('Focal Dôme Flax：原廠尺寸表','https://dam.focal-naim.com/m/2f1c7ebd174a2e15/original/FP_DomeFlax_10_GB-pdf.pdf'),
 ('KEF 嵌入喇叭背腔容量表','https://images.salsify.com/image/upload/s--bZ-2H1bL--/ef7178dd21cf9ce0933c1dadcb864a0a25b7329b.pdf'),
 ('KEF Ci3160RLM：開孔、安裝深度與背腔','https://ca.kef.com/products/ci3160rlm'),
 ('SVS：重低音位置與聆聽位置','https://www.svsound.com/blogs/subwoofer-setup-and-tuning/75365187-the-art-of-subwoofer-placement'),
]
TITLES=['圓弧中島酒吧＋玄關矮櫃','旋轉電視＋小中島','旋轉電視＋大中島','大中島']

def speaker(id,x,y,z,mount,reference,dx=0,dy=0):
    cat='top' if id.startswith('T') else 'sub' if id.startswith('SW') else 'surround' if id in ('SL','SR') else 'front'
    return dict(id=id,x=x,y=y,h=z,category=cat,mount=mount,reference=reference,labelOffset=[dx,dy],status='conditional candidate; not in live 3D')

def build_config(v):
    rot=v in (2,3); cy=560 if v==2 else 583
    ear=[950,570 if v==2 else 583,105] if rot else [917.5,590 if v==1 else 600,105]
    tv=[647,cy] if rot else [917.5,948.6]
    cab=[995,464,25,240] if rot else [775,505 if v==1 else 515,285,25]
    if rot:
        av=[619.5,cy-95,115,195]
        rows=[speaker('L',734.5,cy+93,105,'固定影音櫃端板','T301 尺寸參照；原廠壁掛',30,10),
              speaker('R',734.5,cy-88,105,'固定影音櫃端板','T301 尺寸參照；原廠壁掛',30,-10),
              speaker('C',734.5,cy,60,'固定櫃中央開放面','T301c 同系列；向主座上仰',-55,0),
              speaker('SL',1007.5,690,105,'沙發背櫃檯面','Dôme 原廠桌面方式；朝主座',-43,24),
              speaker('SR',1007.5,477,105,'沙發背櫃檯面','Dôme 原廠桌面方式；朝主座',-43,-24)]
        for id,x,y,z in [('TFL',790,cy+87.5,272.8),('TFR',790,cy-87.5,272.8),('TRL',1062.5,cy+87.5,235),('TRR',1062.5,cy-87.5,235)]:
            rows.append(speaker(id,x,y,z,'樑下表面安裝*' if id.startswith('TR') else '天花嵌入', 'Dôme 原廠短座；指向主座' if id.startswith('TR') else 'Ci160QR；另核對天花背腔',20 if x>1000 else 0,0))
        subs=[[799,800],[1040,814]] if v==2 else [[1030,439],[1030,729]]
        notes=['影音櫃由 200×55 改為約 195×115cm。',
               '深度增加 60cm，形成完整影音家具。',
               '端板承接窄身主喇叭；不是獨立腳架。',
               '沙發背櫃深 25cm；窗簾側餘約 58cm。',
               '後天空改樑下短座；不可在樑內挖孔。',
               '電視轉向中島，只作次要觀看。']
        clear=dict(sofaToAV=100.5,northOfAV=av[1]-375,southOfAV=(753 if v==2 else 805)-(av[1]+av[3]),curtainService=58.1)
    else:
        av=None
        rows=[speaker('L',1060,940.8,105,'南牆原廠壁掛','Q4 Meta 尺寸參照',10,35),
              speaker('R',775,940.8,105,'南牆原廠壁掛','Q4 Meta 尺寸參照',-10,35),
              speaker('C',917.5,903,32,'南側影音櫃開放艙','Q6 尺寸參照；上仰對準主座',0,35),
              speaker('SL',1047.5,cab[1]+12.5,105,'沙發背櫃檯面','Dôme 原廠桌面方式；朝主座',25,-30),
              speaker('SR',787.5,cab[1]+12.5,105,'沙發背櫃檯面','Dôme 原廠桌面方式；朝主座',-25,-30)]
        for id,x,y in [('TFL',1015,770 if v==1 else 785),('TFR',820,770 if v==1 else 785),('TRL',1015,435),('TRR',820,435)]:
            rows.append(speaker(id,x,y,272.8,'天花嵌入','Ci160QR；位置避開已建模樑／風口'))
        subs=[[788,837],[1057,820]] if v==1 else [[788,929],[1055,929]]
        if v==4:
            rows[0]['labelOffset']=[28,47];rows[1]['labelOffset']=[-28,47]
        notes=[('沙發朝電視移 40cm，前聲道約 ±22°。' if v==1 else '沙發維持；前聲道約 ±23°。'),
               'Q4 壁掛為尺寸參照，電箱維修面保留。',
               '若升級嵌壁式，另做有背腔的裝修層。',
               '沙發背櫃約 285×25cm，兩端放環繞。',
               '四天空另排；不是沿用舊圖的四個點。',
               '中置前方無玻璃，俯仰後外形要複核。']
        clear=dict(rearAisle=cab[1]-375,curtainService=18.1)
    for i,(x,y) in enumerate(subs):
        rows.append(speaker('SW'+str(i+1),x,y,0,'地面候選／待量測','SVS 原箱；不密封在玻璃櫃',-40 if i==0 else 40,-22 if v==4 else 10))
    length=math.dist(ear[:2],tv);u=[(tv[i]-ear[i])/length for i in (0,1)]
    for q in rows:
        delta=[q['x']-ear[0],q['y']-ear[1]];along=sum(delta[i]*u[i] for i in (0,1));cross=u[0]*delta[1]-u[1]*delta[0]
        q['azimuthAbs']=round(math.degrees(math.atan2(abs(cross),along)),2)
        q['sideElevation']=round(math.degrees(math.atan2(q['h']-ear[2],abs(along))),2)
        q['planDistance']=round(math.hypot(*delta),1)
    return dict(version=f'V{v}',title=TITLES[v-1],rotating=rot,listener=ear,tv=tv,rearCabinet=cab,avCabinet=av,speakers=rows,notes=notes,clearances=clear,sourceCommit=json.loads((OUT/f'source-v{v}.json').read_text())['sourceCommit'],status='有條件的配置候選；不是聲學實測或施工定案；未套用3D',sofaMove=[0,40] if v==1 else [0,0])

def measure_checks(configs):
    result=[]
    for c in configs:
        for q in c['speakers']:
            if q['id'] in ('L','R'):assert 22<=q['azimuthAbs']<=30,(c['version'],q)
            if q['id'] in ('SL','SR'):assert 110<=q['azimuthAbs']<=120,(c['version'],q)
            if q['category']=='top':assert 30<=q['sideElevation']<=55,(c['version'],q)
        # The compact surround sample has a real manufacturer's 14.4 x 14.3 cm body.
        # Use its full diagonal at every yaw, and keep it on the 25 cm countertop.
        r=math.hypot(14.4,14.3)/2
        x,y,w,d=c['rearCabinet']
        for q in c['speakers']:
            if q['category']=='surround':
                assert x<=q['x']-r and q['x']+r<=x+w and y<=q['y']-r and q['y']+r<=y+d
        if c['rotating']:
            # Actual T301 body + 2 cm backing panel, NOT an arbitrary speaker box.
            for q in c['speakers']:
                if q['id'] in ('L','R'):
                    gap=math.hypot(q['x']-3.5-2-c['tv'][0],abs(q['y']-c['tv'][1])-7)-97.5
                    assert gap>10
            assert all(c['clearances'][k]>=90 for k in ('sofaToAV','northOfAV','southOfAV'))
        # Existing model's eastern beam is x1040..1085, soffit245, top315.
        # Recessed candidates must not extend into it; surface candidates sit beneath it.
        for q in c['speakers']:
            if q['category']!='top':continue
            if q['h']>260:assert q['x']+11.73<1040
            else:assert q['h']+9<245 and 1040<q['x']-9 and q['x']+9<1085
        result.append(dict(version=c['version'],angles={q['id']:q['azimuthAbs'] for q in c['speakers'] if q['category'] in ('front','surround')},heightAngles={q['id']:q['sideElevation'] for q in c['speakers'] if q['category']=='top'},clearances=c['clearances']))
    return dict(scope='角度、候選外形與指定靜態淨距；不代表聲學、結構、全部門扇／家具操作已通過',versions=result,limitations=['主座以模型坐姿耳高105cm暫估；各座位仍須複核。','未做聲壓、指向頻響、混響、駐波與實測校正。','樑體是模型代理，不能當結構施工圖。','新櫃門、抽盤、電箱維修、管線及完整承重仍待細設。','圖上高度是聲軸目標，選型後以實物單體與支架基準定位。'])

def plan(c):
    d=Canvas(1800,1410);v=int(c['version'][1])
    d.text(38,26,f"{c['version']}  {c['title']}",35,bold=True)
    d.text(40,83,'正常聲道配置重評｜有條件的候選方案 · 尚未套用 3D',23)
    d.text(1760,39,'2026.09.14 · 修訂 B',20,MUTED,anchor='end')
    for x,cat,t in [(42,'front','前方 L/C/R'),(295,'surround','耳平 SL/SR'),(560,'top','天空四聲道'),(850,'sub','重低音候選')]:
        d.circle(x+8,139,8,COLORS[cat]);d.text(x+24,126,t,20)
    ox,oy=35,177;x0,y0=370,335;w,h=1050,906
    src=json.loads((OUT/f'source-v{v}.json').read_text());im,s=base_plan(src,w,h,(x0,y0,1110,974));d.image(im,ox,oy)
    p=lambda x,y:(ox+(x-x0)*s,oy+(y-y0)*s)
    def rect(b,fill,stroke=None):
        a=p(b[0],b[1]);d.rect(*a,b[2]*s,b[3]*s,fill,stroke,2)
    def contour(points,color=INK,dash=False):d.line([p(*q) for q in points+[points[0]]],color,3,dash)
    # Furniture with mass and visible support. No ceiling rods for the listener layer.
    rect(c['rearCabinet'],'#d5e5dc','#326654')
    if c['avCabinet']:
        rect(c['avCabinet'],'#d5e5dc','#326654')
        a=p(*c['tv']);d.circle(*a,97.5*s,None,'#9a8878',2)
        d.line([p(c['tv'][0],c['tv'][1]-92.35),p(c['tv'][0],c['tv'][1]+92.35)],'#354d52',7)
        d.text(*p(c['tv'][0]-13,c['tv'][1]-77),'TV',17,INK,anchor='end')
        d.text(*p(641,c['tv'][1]+25),'旋轉範圍',16,MUTED,anchor='middle')
        contour([[900,464],[995,464],[995,704],[835,704],[835,620],[900,620]])
        d.text(*p(615,855),'玄關',21,INK)
        # Highlight the beam over the rear speakers without disguising it as a wall.
        rect([1040,375,45,505],None,'#a5a9a9')
        d.text(*p(1075,590),'樑',16,MUTED,anchor='middle')
    else:
        sy=530 if v==1 else 540
        sofa=[[797,sy],[1037,sy],[1037,sy+160],[949,sy+160],[949,sy+95],[797,sy+95]]
        if v==1:
            # A solid footprint covers the old top-view sofa; original boundary stays dashed.
            old=[[797,490],[1037,490],[1037,650],[949,650],[949,585],[797,585]]
            contour(old,'#a0a9ac',True)
        for b in [[797,sy,240,95],[949,sy+95,88,65]]:rect(b,'#e2e6e6')
        contour(sofa)
        if v==1:
            arrow(d,p(870,540),p(870,580),'#55776a',3);d.text(*p(843,545),'移40',16,'#55776a')
    # Accurate model window line, not an invented wall speaker substrate.
    for a,b in [((1085,375),(1085,580)),((1085,650),(1085,880))]:d.line([p(*a),p(*b)],'#408c9d',4)
    a=p(*c['listener'][:2]);tv=p(*c['tv']);arrow(d,a,tv,'#8b969b',2)
    d.circle(*a,10,'#24343c');d.text(a[0]-12,a[1]+16,'主座',17,INK,anchor='end')
    for q in c['speakers']:
        x,y=p(q['x'],q['y']);co=COLORS[q['category']]
        if q['category'] in ('front','surround'):
            d.line([(x,y),a],co,1,True)
        if q['category']=='sub':
            d.rect(x-18*s,y-19.75*s,36*s,39.5*s,None,co,2)
        elif q['category']=='surround':d.circle(x,y,10.15*s,None,co,2)
        elif q['category']=='top':d.circle(x,y,(9 if q['h']<260 else 11.73)*s,None,co,2)
        else:d.circle(x,y,5,co)
        dx,dy=q['labelOffset'];xx,yy=x+dx,y+dy
        if dx or dy:d.line([(x,y),(xx,yy)],co,1)
        ww=58 if len(q['id'])>2 else 42
        d.rect(xx-ww/2,yy-14,ww,28,'#ffffff',co,1);d.text(xx,yy-12,q['id'],18,co,True,'middle')
    d.text(45,1098,'綠色實體＝新增／重做的櫃體；圖面單位 cm。',22,'#326654',True)
    d.text(45,1135,'標記是聲軸候選位置；機種尺寸用於驗算，不是採購定案。',20,MUTED)
    d.text(45,1174,'窗旁喇叭由背櫃承托、指向主座；沒有掛在沙發或玻璃上。',20)
    if c['rotating']:
        lines=['固定影音櫃加深 60cm；若不接受這個體積，就不採此方案。',
               '只以沙發方向校正；轉動時，圈內不當通道。',
               '* 後天空 H235 是樑下短座目標；位置與支架待結構複核。']
    else:
        lines=['南牆前方三聲道整合；背櫃使用約 25cm 深的地面空間。',
               '四顆天空與耳平層分開；前方黑玻、展示玻璃避開出聲面。',
               '重低音僅標示待量測候選，不因對稱或靠邊就認定低頻最佳。']
    for i,t in enumerate(lines):d.text(45,1218+i*38,t,20)
    rx=1125
    d.text(rx,182,'實際代價與必要條件',27,bold=True)
    for i,t in enumerate(c['notes']):d.text(rx,230+i*37,t,20)
    d.line([(rx,470),(1760,470)],'#ccd5d8',1)
    d.text(rx,492,'聲道       角度／高度          安裝形式',21,bold=True)
    for i,q in enumerate(c['speakers']):
        y=538+i*37
        d.text(rx,y,q['id'],21,COLORS[q['category']],True)
        val=(f"{q['sideElevation']:.0f}°仰角 / H{q['h']:g}" if q['category']=='top' else '待低頻量測' if q['category']=='sub' else f"{q['azimuthAbs']:.0f}° / H{q['h']:g}")
        d.text(rx+77,y,val,19);d.text(rx+300,y,q['mount'],18)
    d.line([(rx,976),(1760,976)],'#ccd5d8',1)
    d.text(rx,997,'靜態淨距（依模型）',23,bold=True)
    if c['rotating']:
        z=c['clearances'];texts=[f"影音櫃 → 貴妃端：{z['sofaToAV']:g}cm",f"影音櫃北／南：{z['northOfAV']:g} / {z['southOfAV']:g}cm",'背櫃 → 窗簾：約 58cm（非主要走道）']
    else:texts=[f"背櫃 → 北側界面：約 {c['clearances']['rearAisle']:g}cm",'櫃端 → 窗簾：約 18cm（不作通道）','电箱維修面不改成聲學背腔。'.replace('电','電')]
    for i,t in enumerate(texts):d.text(rx,1040+i*38,t,20)
    d.text(rx,1190,'通過角度 ≠ 完成影音設計',23,'#995429',True)
    for i,t in enumerate(['仍須核對各座位遮擋、支架、完整櫃門操作、', '指向頻響、目標聲壓及實測低頻。', '不把新增櫃體的占地說成「零占地」。']):d.text(rx,1230+i*34,t,19,MUTED)
    d.save(c['version']+'-喇叭配置')

def detail():
    d=Canvas(1500,900)
    sy=lambda h:710-h*1.75
    d.text(38,26,'撤回低吊桿｜V3 正常安裝方式的分層示意',34,bold=True)
    d.text(40,81,'耳平環繞由家具承托；天空喇叭留在高處。非施工剖面，水平距離為示意。',21)
    d.text(45,146,'原提案取消：1m 以上長桿垂掛至 H135',24,'#a54f44',True)
    d.text(805,146,'候選修正：背櫃 + 原廠短座天空',24,'#326654',True)
    for left in (55,810):
        d.line([(left,710),(left+610,710)],INK,4)
        d.line([(left,sy(275)),(left+610,sy(275))],INK,6)
        d.rect(left+20,sy(45),275,45*1.75,'#d4dddd');d.rect(left+245,sy(84),50,84*1.75,'#a6b7ba')
    d.line([(500,sy(275)),(500,sy(150))],'#a54f44',6);d.rect(482.5,sy(150),35,30*1.75,'#a54f44')
    d.line([(470,310),(550,390)],'#a54f44',7);d.line([(550,310),(470,390)],'#a54f44',7)
    d.text(390,sy(120)+18,'H135，取消',22,'#a54f44',True)
    d.rect(1160,sy(95),25*1.75,95*1.75,'#d5e5dc','#326654',3)
    d.line([(1182,sy(95)),(1182,sy(98))],'#7654a1',5)
    d.line([(1170,sy(95)),(1194,sy(95))],'#7654a1',3)
    d.circle(1182,sy(105),7.2*1.75,'#7654a1');d.line([(1182,sy(105)),(1015,sy(105))],'#7654a1',2,True)
    d.text(1230,sy(105)-12,'耳平約 H105',21,'#7654a1',True)
    d.text(1110,738,'背櫃約 H95／深25cm',20,'#326654',True)
    d.rect(1250,sy(275),155,30*1.75,'#aeb6b7')
    d.line([(1325,sy(245)),(1325,sy(242))],'#227da6',4)
    d.circle(1325,sy(235),7.2*1.75,'#227da6');d.line([(1325,sy(235)),(1015,sy(105))],'#227da6',2,True)
    d.text(1138,352,'樑下原廠短座；天空約 H235',19,'#227da6',True)
    d.text(1120,204,'模型樑底 H245',19,MUTED)
    d.text(40,800,'支撐家具仍有占地；短座只給原廠允許天花安裝的型號，不能把重力掛孔壁掛款直接倒吊。',22)
    d.text(40,843,'原 H135 長桿圖已撤回。新的圖只表示設計方向與安裝層次，沒有宣稱 3D／施工已完成。',21,MUTED)
    d.save('V3-環繞位置修正')

def page(configs,checks):
    links=''.join(f'<li><a href="{u}" target="_blank" rel="noreferrer">{html.escape(n)}</a></li>' for n,u in SOURCES)
    cards=''.join(f'<article id="v{i+1}"><h2>{c["version"]} {c["title"]}</h2><p>{"需要改造較厚的固定影音家具，屬於保留旋轉功能的折衷。" if c["rotating"] else "適合優先發展固定電視牆與家具整合音響。"}</p><a href="{c["version"]}-喇叭配置.png"><img src="{c["version"]}-喇叭配置.png" alt="{c["version"]} 正常配置的有條件候選圖" loading="lazy"></a><p><a href="{c["version"]}-喇叭配置.svg">SVG 放大圖</a> · <a href="{c["version"]}-喇叭配置.png">PNG 圖</a></p></article>' for i,c in enumerate(configs))
    (OUT/'index.html').write_text('''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>四版影音配置重評｜W 夢想之家</title><style>
    *{box-sizing:border-box}body{margin:0;background:#111719;color:#e2e9e9;font:17px/1.8 system-ui,"Microsoft JhengHei",sans-serif}main{max-width:1280px;margin:auto;padding:35px 28px}h1{font-size:clamp(27px,4vw,40px);line-height:1.4}h2{font-size:26px;margin-top:36px}a{color:#a9d9cb}p{max-width:1040px}nav{position:sticky;top:0;background:#1d282b;padding:13px 20px;display:flex;gap:22px;flex-wrap:wrap;z-index:1}img{width:100%;height:auto;display:block;background:#f5f7f7;border-radius:8px}.notice{border-left:5px solid #d79478;background:#2a2321;padding:18px 24px}.table{overflow:auto}table{border-collapse:collapse;width:100%;min-width:750px}td,th{text-align:left;vertical-align:top;padding:15px;border-bottom:1px solid #394447}th{background:#253236}article{padding-top:10px;scroll-margin-top:80px}.tag{color:#bfdacf}li{margin:8px 0}footer{margin-top:40px;color:#a9b6b9}.small{font-size:15px;color:#b0bdbf}.choice{background:#1d2c29;padding:18px 24px}</style>
    <nav><a href="../../index.html">回 3D 設計</a><a href="#v1">V1</a><a href="#v2">V2</a><a href="#v3">V3</a><a href="#v4">V4</a><a href="#sources">原廠依據</a></nav><main>
    <p class="tag">2026.09.14 · 重新評估 / 修訂 B</p><h1>先決定正確聲場，再設計支撐它的空間</h1>
    <div class="notice"><strong>先前的長吊桿配置已撤回。</strong>把環繞吊到 H135、或者把前方喇叭掛在旋轉電視兩側的低處，雖然可能避開某個家具投影，並沒有完成合理的室內影音設計。舊的 44 點配置表、四版圖和 V3 高度圖已由本次重評取代。</div>
    <div class="choice"><p><strong>我的優先建議：V4，其次 V1，採固定電視牆整合前聲道，搭配沙發背櫃上的小型環繞；V2、V3 則必須接受影音櫃變厚，才能保留旋轉電視又取消獨立主喇叭腳架。</strong></p><p>如果旋轉版的底櫃必須保持原本 55cm 深、地面完全不增加家具，也不接受前方喇叭占位，這幾項要求目前不能一起滿足正常的離散 L/C/R 配置。我不會再用一組懸空的圖面圓點宣稱已解決。</p></div>
    <h2>採用的正常配置基準</h2><p>以主座面向電視為 0°，前方 L/R 約 ±22–30°；5 聲道的 SL/SR 約 ±110–120°，聲軸靠近坐姿耳高。四天空另成一層，側視配置仰角約 30–55°。這些是家庭劇院目標區間，不是所有座位都會同時達到的角度；耳高 105cm 是本案模型假設，不是原廠規定。</p><p class="small">依據：<a href="'''+SOURCES[0][1]+'''">Dolby 5.1.4 圖</a>、<a href="'''+SOURCES[1][1]+'''">家庭劇院安裝指南</a>。天空與耳平層必須分開；全部改天花會犧牲正確的高度分離。</p>
    <h2>重新檢查後，真正的衝突</h2><ul>
    <li><strong>V1 看得較遠：</strong>南牆可用聲道中心間距約 285cm，原主座下前方左右各約 20°。候選方案把沙發朝電視移約 40cm，才到約 22°；V4 原主座約 23°。</li>
    <li><strong>V2／V3 前後都缺乏適合直接壁掛的實牆：</strong>前方是旋轉電視，後方是落地窗。圖中補的是完整固定影音家具和沙發背櫃，不是掛玻璃或另插兩根吊桿。</li>
    <li><strong>旋轉電視不會帶著聲場轉向：</strong>本方案以沙發為主要電影位置。轉向中島時是次要觀看，不宣稱兩面都有正確的 5.2.4；若兩面都要求劇院定位，就需要另外的揚聲器組、路由與校正設計。</li>
    <li><strong>原 Ci160QR 背盒不足：</strong>模型 28×12×30cm 連外部體積都只有 10.08L。KEF 表列 Ci160QR 合理低頻的最低背腔為 13L、理想為 25.5L；扣除板材、單體後更不夠。因此不再沿用那個裸單體加小背盒的環繞做法。<a href="'''+SOURCES[8][1]+'''">原廠容量表</a></li>
    <li><strong>旋轉版後天空與樑體衝突：</strong>模型東側 x1040–1085 是樑、樑底 H245。舊提案把靠窗天空當成 H273 的普通嵌入位置，未成立。新候選改為約 H235 的原廠樑下表面短座，仍屬天空聲道；樑體代理須與實際結構核對，不能直接挖樑。</li></ul>
    <h2>四版如何取捨</h2><div class="table"><table><thead><tr><th>版本</th><th>正常解法</th><th>必須接受的改動</th><th>判斷</th></tr></thead><tbody>
    <tr><td>V1 圓弧中島酒吧＋玄關矮櫃</td><td>南牆壁掛／有背腔的嵌壁 LCR；沙發背櫃承托環繞；四天空重排。</td><td>沙發朝電視約 40cm；新增 285×25cm 背櫃。</td><td>可優先發展；仍要控制後方動線與中置高度。</td></tr>
    <tr><td>V2 旋轉電視＋小中島</td><td>窄身 LCR 固定到影音家具；背櫃環繞；後天空用原廠短座。</td><td>影音櫃約 195×115cm，較原櫃加深 60cm；背櫃 240×25cm。</td><td>代價最大；若想保留輕薄立屏，不推薦硬做此方案。</td></tr>
    <tr><td>V3 旋轉電視＋大中島</td><td>同 V2，拆收藏室讓櫃前後通路較有餘裕。</td><td>同樣需要較厚的影音櫃與背櫃；靠窗重低音候選微移讓開背櫃。</td><td>比 V2 寬裕，但不等於旋轉電視的音響限制消失。</td></tr>
    <tr><td>V4 大中島</td><td>南牆整合前方三聲道；背櫃環繞；四天空另排。</td><td>新增 285×25cm 背櫃；保留電箱可開啟的維修面。</td><td>四版中最適合兼顧乾淨外觀與完整聲場。</td></tr></tbody></table></div>
    <h2>原廠安裝方式與選型方向</h2><p>固定南牆的候選圖以 <a href="'''+SOURCES[3][1]+'''">KEF Q4 Meta</a> 的 40×25×14.2cm 壁掛箱體驗算；要更高規格，可研究 Ci3160RLM 類型，但 99mm 是安裝深度，還需要合理背腔、承重及裝修面，不能拿一片 10cm 薄板當完整音箱。其原廠容量表列合理／理想最低背腔為 30／60L。</p><p>旋轉版為了保留南北通路，圖面以 <a href="'''+SOURCES[4][1]+'''">T301 的 60×14×3.5cm</a> 窄身封閉箱體與同系列 T301c 中置驗算，使用原廠壁掛方式固定在影音櫃端板。這是證明安裝與空間形式的樣本，<strong>不代表薄型喇叭在動態、最大音量、低頻上等同 Q7 Meta</strong>。若要求更大聲壓，喇叭尺寸和家具要重新配套，不能只換一個名稱。</p><p>沙發背櫃可承托 <a href="'''+SOURCES[6][1]+'''">Focal Dôme Flax 類型</a> 的完整小型音箱，採原廠桌面方式、指向主座；其原廠另允許天花安裝，可作樑下天空安裝形式的參照。此處只評估形式與外形，前方三聲道優先同系列，環繞與天空的音色、指向及輸出能力仍須一起選定。</p>
    <h2>外觀和聲學一起處理</h2><p>前牆以黑化金屬框與可拆的聲學布面整合喇叭，黑玻保留在不擋出聲與維修的位置；沙發背櫃用連續黑色檯面與深色木收納形成家具，兩端小音箱可見、可調方向。出聲面不封木板或玻璃。窗簾、局部吸音天花與織物控制玻璃反射；吸音處理與隔音是不同工作。</p><p>背櫃仍會使用 25cm 深的地面；旋轉版背櫃到窗簾約 58cm，只是窗簾維護空間，不是主走道。圖上的走道值是指定模型邊界的靜態值，不能替代門片、抽盤與家具使用狀態的完整核對。</p>
    <h2>兩顆重低音不按對稱外觀定案</h2><p>橘色 SW1／SW2 是候選位置，尚未證實低頻最佳。V3 為讓開背櫃，原靠窗兩箱分別向北約 10cm、向南約 12cm；這只是解開外形碰撞。應先比較各候選在主座與旁座的頻率響應，再調距離、分頻、相位與電平。<a href="'''+SOURCES[10][1]+'''">SVS 配置說明</a></p><p>如果重低音也要完全離開地面，應另評估專用嵌壁低音與背箱、擴大機、隔振和檢修；本次沒有把既有 SVS 塞进封閉展示櫃或吊起來。</p>
    '''+cards+'''<h2>V3 高度示意：用正常的支撐方式分開兩層</h2><img src="V3-環繞位置修正.png" alt="撤回低吊桿；家具承托耳平環繞，樑下短座只給天空聲道">
    <h2>目前完成到哪裡</h2><p>已完成四版主座角度重算、上述櫃體占地與指定靜態淨距、原廠安裝形式和背腔資料核對，並撤回舊吊桿圖。<strong>尚未改動即時 3D。</strong>這組候選不是聲學模擬、結構定案或施工圖；也沒有宣稱每個座位、全部櫃門／抽盤、所有設備均已完成驗證。</p><p>保留四天空的旋轉版，須確認樑下原廠短座的安裝與指向；若無法成立，改評估兩顆正確定位的天空聲道，不把後天空塞進樑體。後續選型必須包含主座及旁座的聆聽高度、指向、目標音量和低頻量測。</p><p><a href="位置表.json">候選座標與角度</a> · <a href="重評核對.json">核對範圍與限制</a> · <a href="四版總覽.png">四版總覽</a></p>
    <h2 id="sources">原廠來源</h2><ol>'''+links+'''</ol><footer>模型座標：X 向圖面右、Y 向圖面下；H 為完成地面以上的聲軸目標。數值按模型計算，非現場丈量。圖面背景由實際模型投影產生；本次提案改動只在候選覆圖中表示。</footer></main></html>'''.replace('塞进','塞進'),encoding='utf8',newline='\n')

configs=[build_config(v) for v in range(1,5)]
checks=measure_checks(configs)
for c in configs:plan(c)
detail();page(configs,checks)
payload=dict(date='2026-09-14',revision='B',units='cm',purpose='conditional feasibility candidates; replaces WITHDRAWN long-pendant proposal',liveModelChanged=False,versions=configs,sources=[dict(title=n,url=u) for n,u in SOURCES])
for name,obj in [('位置表.json',payload),('重評核對.json',checks)]:
    (OUT/name).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
overview=Image.new('RGB',(1800,1450),BG);dd=ImageDraw.Draw(overview)
dd.text((30,18),'四版正常配置重評｜綠色是新增家具，有空間代價',font=ImageFont.truetype(BOLD,31),fill=INK)
for i,c in enumerate(configs):
    im=Image.open(OUT/(c['version']+'-喇叭配置.png')).resize((880,689),Image.Resampling.LANCZOS)
    overview.paste(im,(10+(i%2)*900,62+(i//2)*690))
overview.save(OUT/'四版總覽.png',optimize=True)
print(json.dumps(checks,ensure_ascii=False,indent=2))
