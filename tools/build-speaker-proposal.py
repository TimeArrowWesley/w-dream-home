"""Four source-based 2D speaker layouts; presentation only, no live model changes."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, math, html, base64, io

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'提案/20260914喇叭配置'
FONT='C:/Windows/Fonts/msjh.ttc'; BOLD='C:/Windows/Fonts/msjhbd.ttc'
INK='#23313a'; MUTED='#67747c'; BG='#f5f7f7'
COLORS={'front':'#167d71','surround':'#7956a3','top':'#237fb7','sub':'#b47720'}
NAMES={'L':'左主聲道','R':'右主聲道','C':'中置','SL':'左環繞','SR':'右環繞','TFL':'左前天空','TFR':'右前天空','TRL':'左後天空','TRR':'右後天空','SW1':'重低音 1','SW2':'重低音 2'}
TITLES=['圓弧中島酒吧＋玄關矮櫃','旋轉電視＋小中島','旋轉電視＋大中島','大中島']

def point(id,x,y,h,mount,where,dx=0,dy=0):
    category='top' if id.startswith('T') else 'sub' if id.startswith('SW') else 'surround' if id in ('SL','SR') else 'front'
    return dict(id=id,name=NAMES[id],x=x,y=y,h=h,mount=mount,where=where,category=category,labelOffset=[dx,dy])

def proposal(v):
    rotating=v in (2,3); cy=583 if v==3 else 560
    ear=[950,cy,105] if rotating else [917.5,550 if v==1 else 600,105]
    if rotating:
        rows=[point('L',750,cy+103,110,'頂板吊架','電視客廳側・圖面下',-40,16),point('R',750,cy-103,110,'頂板吊架','電視客廳側・圖面上',-40,-16),point('C',659.35,cy,32,'固定櫃開放艙','電視下方；朝沙發',-56,0),point('SL',986,cy+103,120,'沙發背緣吊桿','沙發後方・圖面下',12,44),point('SR',986,cy-103,120,'沙發背緣吊桿','沙發後方・圖面上',12,-44)]
        yy=[cy+88,cy-88]
        rows += [point('TFL',800,yy[0],272.8,'天花嵌入','沙發前方・圖面下',0,0),point('TFR',800,yy[1],272.8,'天花嵌入','沙發前方・圖面上',0,0),point('TRL',1050,yy[0],272.8,'天花嵌入','沙發後方・圖面下',24,0),point('TRR',1050,yy[1],272.8,'天花嵌入','沙發後方・圖面上',24,0)]
        sub=[[799,800],[1040,814]] if v==2 else [[1030,449],[1030,717]]
    else:
        yy=495 if v==1 else 545
        rows=[point('L',1062,944,105,'南牆裝修層嵌入','電視左方・圖面右',10,43),point('R',773,944,105,'南牆裝修層嵌入','電視右方・圖面左',-8,43),point('C',917.5,920,32,'固定櫃開放艙','電視下方；朝沙發',0,-46),point('SL',1020,yy,120,'沙發背緣吊桿','靠窗側背角',16,-32),point('SR',812,yy,120,'沙發背緣吊桿','靠中島側背角',-16,-32)]
        fy=700 if v==1 else 775; by=415 if v==1 else 425
        rows += [point('TFL',1005,fy,272.8,'天花嵌入','沙發前方・圖面右'),point('TFR',830,fy,272.8,'天花嵌入','沙發前方・圖面左'),point('TRL',1005,by,272.8,'天花嵌入','沙發後方・圖面右'),point('TRR',830,by,272.8,'天花嵌入','沙發後方・圖面左')]
        sub=[[788,837],[1057,820]] if v==1 else [[788,929],[1055,929]]
    rows += [point('SW1',*sub[0],0,'保留 SVS 落地','沿用現有位置',-40 if not rotating else -50,-20 if v==4 else 0),point('SW2',*sub[1],0,'保留 SVS 落地','沿用現有位置',40 if not rotating else 46,-20 if v==4 else 15)]
    if v==2:
        for q in rows:
            if q['id']=='SR':q['y']=480
            if q['id']=='SL':q['y']=686
    if v==3:
        for q in rows:
            if q['id']=='SR':q['labelOffset']=[-50,0]
            if q['id']=='SL':q['labelOffset']=[-50,15]
    notes=(['左右主聲道整合南牆裝修層；牆內背腔另設計。','中置保留開放艙，抬高至中心 H32，向主座上仰。','環繞吊桿位於沙發背緣；不以落地玻璃承重。'] if not rotating else ['左右主聲道由頂板承重吊架固定；中心 H110。','喇叭固定朝沙發，不隨電視轉向中島。','紫色環繞降到 H120，位於沙發背緣。'])
    return dict(version=f'V{v}',title=TITLES[v-1],rotating=rotating,listener=ear,tv=[647,cy] if rotating else [917.5,948.6],speakers=rows,notes=notes,status='2D 討論提案；尚未套用 3D 或確認安裝結構',sourceCommit=json.loads((OUT/f'source-v{v}.json').read_text())['sourceCommit'])

class Canvas:
    def __init__(self,w,h):
        self.w=w;self.h=h;self.im=Image.new('RGB',(w,h),BG);self.d=ImageDraw.Draw(self.im)
        self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="Microsoft JhengHei,sans-serif"><rect width="100%" height="100%" fill="{BG}"/>']
    def text(self,x,y,t,size=22,color=INK,bold=False,anchor='start'):
        f=ImageFont.truetype(BOLD if bold else FONT,size);w=self.d.textlength(t,font=f)
        self.d.text((x-(w/2 if anchor=='middle' else w if anchor=='end' else 0),y),t,font=f,fill=color,anchor='lt')
        self.svg.append(f'<text x="{x}" y="{y+size*.9}" font-size="{size}" fill="{color}" font-weight="{700 if bold else 400}" text-anchor="{anchor}">{html.escape(t)}</text>')
    def rect(self,x,y,w,h,c,stroke=None,lw=1):
        self.d.rectangle((x,y,x+w,y+h),fill=c,outline=stroke,width=round(lw))
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c or "none"}" stroke="{stroke or "none"}" stroke-width="{lw}"/>')
    def line(self,points,c=INK,lw=2,dash=False):
        if dash:
            for a,b in zip(points,points[1:]):
                n=max(1,math.ceil(math.dist(a,b)/8))
                for i in range(0,n,2):self.d.line([(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n) for j in (i,min(n,i+1))],fill=c,width=round(lw))
        else:self.d.line(points,fill=c,width=round(lw))
        pts=' '.join(f'{x:.1f},{y:.1f}' for x,y in points)
        self.svg.append(f'<polyline points="{pts}" fill="none" stroke="{c}" stroke-width="{lw}"'+(' stroke-dasharray="8 8"' if dash else '')+'/>')
    def circle(self,x,y,r,c=None,stroke=None,lw=2):
        self.d.ellipse((x-r,y-r,x+r,y+r),fill=c,outline=stroke,width=round(lw))
        self.svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c or "none"}" stroke="{stroke or "none"}" stroke-width="{lw}"/>')
    def image(self,im,x,y):
        self.im.paste(im,(round(x),round(y)));b=io.BytesIO();im.save(b,format='PNG',optimize=True)
        self.svg.append(f'<image x="{x}" y="{y}" width="{im.width}" height="{im.height}" xlink:href="data:image/png;base64,{base64.b64encode(b.getvalue()).decode()}"/>')
    def save(self,stem):
        self.im.save(OUT/(stem+'.png'),optimize=True)
        (OUT/(stem+'.svg')).write_bytes(('\n'.join(self.svg+['</svg>'])).encode())

def base_plan(source,w,h,box):
    x0,y0,x1,y1=box;s=min(w/(x1-x0),h/(y1-y0));im=Image.new('RGB',(w,h),'#ffffff');d=ImageDraw.Draw(im)
    p=lambda x,y:((x-x0)*s,(y-y0)*s)
    for z,g,*xy in source['triangles']:
        if max(xy[::2])<x0 or min(xy[::2])>x1 or max(xy[1::2])<y0 or min(xy[1::2])>y1:continue
        g=g if z<2 else max(163,g-17)
        d.polygon([p(*xy[i:i+2]) for i in (0,2,4)],fill=(g,g+min(2,255-g),g+min(3,255-g)))
    for x,y,ww,dd in source['walls']:
        if ww*dd<.5:continue
        a,b=p(x,y),p(x+ww,y+dd);d.rectangle((*a,*b),fill='#899197')
    # Windows are identified by the retained plan edges, not bearing surfaces for speakers.
    for a,b in [((1085,375),(1085,580)),((1085,650),(1085,880))]:d.line([p(*a),p(*b)],fill='#79a9b9',width=max(2,round(s*3)))
    return im,s

def arrow(d,a,b,color=INK,lw=3):
    d.line([a,b],color,lw);angle=math.atan2(b[1]-a[1],b[0]-a[0]);r=12
    d.line([(b[0]-r*math.cos(angle-.5),b[1]-r*math.sin(angle-.5)),b,(b[0]-r*math.cos(angle+.5),b[1]-r*math.sin(angle+.5))],color,lw)

def diagram(config):
    v=int(config['version'][1]);source=json.loads((OUT/f'source-v{v}.json').read_text());d=Canvas(2040,1520)
    d.text(42,28,f"{config['version']}  {config['title']}",38,bold=True)
    d.text(44,85,'喇叭不占獨立腳架位置｜5.2.4 配置提案',26)
    d.text(1995,37,'W 夢想之家',23,anchor='end');d.text(1995,79,'2026.09.14 · 2D 討論稿',18,MUTED,anchor='end')
    for x,key,label in [(45,'front','前方 L／C／R'),(340,'surround','耳平環繞 SL／SR'),(690,'top','天空 4 顆'),(960,'sub','重低音 2 顆・保留落地')]:
        d.circle(x+9,146,9,COLORS[key]);d.text(x+28,133,label,20)
    x0,y0=150,330;ox,oy=40,190;w,h=1280,884
    im,s=base_plan(source,w,h,(x0,y0,1135,1010));d.image(im,ox,oy);d.rect(ox,oy,w,h,None,'#d4dadd',1)
    p=lambda x,y:(ox+(x-x0)*s,oy+(y-y0)*s)
    def contour(points):d.line([p(*q) for q in points+[points[0]]],'#88969d',2)
    if v==1:
        import re
        raw=(ROOT/'design.js').read_text(encoding='utf8')
        island=json.loads(re.search(r'const IS=(\{.*?\}),is=new T.Shape',raw).group(1))
        contour(island['north']+list(reversed(island['south'])))
        contour([[404.8,468.1],[664.8,468.1],[664.8,498.1],[404.8,498.1]])
    else:
        xx,yy,ww,dd=(434,464,81,189) if v==2 else (425,480,95,300) if v==3 else (425,480,110,280)
        contour([[xx,yy],[xx+ww,yy],[xx+ww,yy+dd],[xx,yy+dd]])
    if config['rotating']:contour([[900,464],[995,464],[995,704],[835,704],[835,620],[900,620]])
    else:
        sy=490 if v==1 else 540
        contour([[797,sy],[1037,sy],[1037,sy+160],[949,sy+160],[949,sy+95],[797,sy+95]])
    def room(x,y,t):
        a,b=p(x,y);width=max(90,len(t)*20+18);d.rect(a-width/2,b-13,width,31,'#ffffff');d.text(a,b-11,t,20,MUTED,anchor='middle')
    for x,y,t in [(253,674,'廚房'),(470,370,'客浴'),(655,340,'儲藏室'),(907,357,'雙人書房'),(603,938,'入戶'),(928,770 if not config['rotating'] else 814,'客廳')]:room(x,y,t)
    room(475,555 if v==1 else 610,'圓弧中島' if v==1 else '小中島' if v==2 else '大中島')
    room(369,838,'收藏室' if v<3 else '開放展示／收納')
    if config['rotating']:
        cx,cy=config['tv'];d.circle(*p(cx,cy),97.5*s,None,'#b96d6a',2);room(cx,cy-130,'旋轉電視')
        a,b=p(cx-95,cy+122);d.text(a,b,'紅圈：電視轉動範圍',16,'#a45754')
    else:
        a,b=p(760,934);d.line([p(760,940),p(1075,940)],COLORS['front'],5)
        room(917.5,983,'南牆固定電視')
    ear=config['listener'];ep=p(*ear[:2]);tv=config['tv'];vec=(tv[0]-ear[0],tv[1]-ear[1]);length=math.hypot(*vec)
    for q in config['speakers']:
        if q['id'] in ('L','R'):d.line([p(q['x'],q['y']),ep],'#a4b8b1',2,True)
    d.circle(*ep,10,INK);arrow(d,ep,(ep[0]+vec[0]/length*76,ep[1]+vec[1]/length*76),INK)
    d.text(ep[0]+14,ep[1]+16,'主座',19,INK,True)
    # Symbols are enlarged for identification; the small dot/cross is the actual center.
    for q in config['speakers']:
        x,y=p(q['x'],q['y']);dx,dy=q['labelOffset'];lx,ly=x+dx,y+dy;co=COLORS[q['category']]
        d.line([(x-6,y),(x+6,y)],co,2);d.line([(x,y-6),(x,y+6)],co,2)
        if dx or dy:d.line([(x,y),(lx,ly)],co,2)
        if q['category']=='sub':
            d.rect(x-18*s,y-19.75*s,36*s,39.5*s,'#f3e2c7',co,2)
        elif q['id'] in ('L','R'):
            d.rect(x-5*s,y-7.75*s,10*s,15.5*s,co) if config['rotating'] else d.rect(x-12*s,y-4*s,24*s,8*s,co)
        if q['category']=='top':
            d.circle(lx,ly,25,'#ffffff',co,3);d.text(lx,ly-10,q['id'],19,co,True,'middle')
        else:
            bw=55 if q['category']=='sub' else 44;d.rect(lx-bw/2,ly-20,bw,40,co);d.text(lx,ly-11,q['id'],20,'#ffffff',True,'middle')
    d.text(55,1090,'L／R 以主座面向電視為準；十字為落點，色塊是放大標記，藍圈為天花投影。',20,MUTED)
    # Explicit installation diagram prevents interpreting hung speakers as ceiling channels.
    d.rect(430,1150,890,290,'#e9eeee');d.text(454,1167,'懸空怎麼固定？',23,bold=True)
    d.line([(470,1216),(890,1216)],INK,7);d.text(909,1204,'結構頂板承重',19)
    d.line([(566,1216),(566,1280)],COLORS['surround'],5)
    d.rect(552,1280,28,53,COLORS['surround']);d.text(607,1280,'環繞中心 H120，降到坐姿耳邊',19)
    d.rect(525,1350,145,54,'#bec7cc');d.rect(651,1318,19,74,'#a8b5bd')
    d.circle(751,1333,12,None,INK);d.line([(751,1345),(751,1383)],INK,3)
    d.line([(566,1306),(733,1333)],COLORS['surround'],2,True)
    d.text(695,1397,'靠沙發背緣；底下沒有獨立腳座',18,MUTED)
    d.text(454,1425,'吊架形式需原廠／結構確認；主聲道吊架另核承重與防撞。',16,MUTED)
    mini,_=base_plan(source,335,248,(-230,-20,1210,1045));d.image(mini,45,1174)
    d.text(45,1134,'全屋位置索引',22,bold=True)
    for q in config['speakers']:
        mx=45+(q['x']+230)*335/1440;my=1174+(q['y']+20)*335/1440
        d.circle(mx,my,3,COLORS[q['category']])
    # All eleven channels, separately listed with installation and height.
    tx=1370;d.text(tx,188,'11 個位置，逐顆對照',27,bold=True)
    d.text(tx,232,'H＝喇叭中心離完成地面；單位 cm',18,MUTED)
    for i,q in enumerate(config['speakers']):
        yy=277+i*61;co=COLORS[q['category']]
        d.rect(tx,yy,620,58,'#ffffff' if i%2==0 else '#eef2f3')
        d.rect(tx+8,yy+9,53,33,co);d.text(tx+34.5,yy+15,q['id'],17,'#ffffff',True,'middle')
        d.text(tx+75,yy+5,q['name'],21,bold=True)
        d.text(tx+75,yy+32,q['mount'],17,MUTED)
        d.text(1974,yy+8,'落地' if q['category']=='sub' else f"H{q['h']:g}",18,co,True,'end')
        d.text(1974,yy+33,q['where'],16,MUTED,anchor='end')
    d.text(tx,982,'這版的調整重點',24,bold=True)
    for i,note in enumerate(config['notes']):d.text(tx,1024+i*34,note.replace('主声','主聲'),18)
    d.rect(tx,1142,620,112,'#f0e7d7');d.text(tx+15,1156,'兩顆重低音仍保留落地',22,COLORS['sub'],True)
    d.text(tx+15,1193,'本輪先取消兩支落地 Q7 與兩座環繞腳架。',18)
    d.text(tx+15,1224,'若改嵌牆低音，需另設背腔、隔振與功放位置。',18)
    d.text(tx,1282,'圖面已核對：每版 5＋2＋4＝11 個喇叭位置。',18,bold=True)
    d.text(tx,1314,'底圖取自目前 3D 幾何；灰階僅用於辨認格局。',17,MUTED)
    if v==1:d.text(tx,1350,'V1 左右主聲道約 ±20°；受南牆可用寬度限制。',17,'#9b6640')
    elif config['rotating']:d.text(tx,1350,'吊掛位置仍占空中體積，不能當成完全無障礙。',17,'#9b6640')
    else:d.text(tx,1350,'左右主聲道約 ±23°；以現有主座為基準。',17,MUTED)
    d.line([(40,1467),(1995,1467)],'#cdd6d9',1)
    d.text(44,1483,'位置提案，尚未更動 3D。安裝點、天花管線、音場與背腔須依現場條件確認。',17,MUTED)
    d.text(1995,1483,f'{v:02d} / 04',17,MUTED,anchor='end')
    d.save(f'V{v}-喇叭配置')

def build_page(configs):
    buttons=''.join(f'<button type="button" data-v="{i}" aria-pressed="{str(i==1).lower()}">V{i} {c["title"]}</button>' for i,c in enumerate(configs,1))
    figures=''.join(f'<figure id="v{i}" {"" if i==1 else "hidden"}><a href="V{i}-喇叭配置.png" target="_blank"><img src="V{i}-喇叭配置.png" width="2040" height="1520" alt="V{i} {c["title"]}，11個喇叭完整位置與安裝方式" {"" if i==1 else "loading=lazy"}></a><figcaption><a href="V{i}-喇叭配置.png" download>下載 V{i} PNG</a><a href="V{i}-喇叭配置.svg" download>下載可放大 SVG</a></figcaption></figure>' for i,c in enumerate(configs,1))
    rows=''.join(f'<tr><td>{c["version"]}</td><td>{q["id"]} {q["name"]}</td><td>{q["x"]:g}, {q["y"]:g}</td><td>{q["h"]:g}</td><td>{q["mount"]}</td><td>{q["where"]}</td></tr>' for c in configs for q in c['speakers'])
    page=f'''<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>四版喇叭配置提案｜W夢想之家</title>
<style>*{{box-sizing:border-box}}body{{margin:0;background:#10171b;color:#e2e9eb;font-family:system-ui,"Microsoft JhengHei",sans-serif}}main{{max-width:1800px;margin:auto;padding:28px}}h1{{font-size:clamp(25px,3vw,38px);margin:10px 0}}p{{color:#b8c8cc;line-height:1.7}}nav{{display:flex;gap:9px;flex-wrap:wrap;margin:24px 0}}button{{padding:13px 18px;border:1px solid #50616b;border-radius:8px;background:#202b32;color:inherit;cursor:pointer;font:inherit}}button[aria-pressed=true]{{background:#bcd6cf;color:#173c33;border-color:#bcd6cf}}figure{{margin:0}}figure[hidden]{{display:none}}img{{width:100%;height:auto;border-radius:10px}}a{{color:#8fccc4}}figcaption{{display:flex;gap:24px;padding:16px 0}}aside{{padding:16px 22px;background:#242f36;border-radius:10px;margin:22px 0;line-height:1.8}}details{{margin:22px 0}}summary{{cursor:pointer;padding:12px}}.table{{overflow:auto}}table{{border-collapse:collapse;min-width:900px;width:100%}}td,th{{text-align:left;padding:10px;border-bottom:1px solid #3a454b}}footer{{line-height:1.9;margin-top:30px}}@media(max-width:650px){{main{{padding:14px}}nav button{{font-size:14px}}}}@media print{{body{{background:white;color:black}}nav,figcaption,details,footer,aside{{display:none}}figure[hidden]{{display:block}}figure{{break-after:page}}}}</style>
<main><a href="../../index.html">← 回到 3D 設計</a><h1>每個版本，每一顆喇叭的位置</h1><p>四張 2D 圖各有 11 個位置：左右主聲道＋中置＋兩顆環繞＋四顆天空＋兩顆重低音。<br>點圖可開啟原尺寸；這是待討論的擺位提案，現有 3D 尚未更換設備。</p><nav aria-label="版本">{buttons}</nav>{figures}
<aside><strong>先取消四個獨立落地腳座位置。</strong>兩顆 SVS 重低音仍保留落地，圖中為橘色 SW1／SW2。<br>落地玻璃不能當承重牆，因此紫色環繞使用頂板吊桿，降到沙發耳邊；藍色天空聲道仍在天花板。V2／V3 綠色主聲道也需獨立承重吊架，固定朝沙發。<br>V1／V4 的嵌入式主聲道需要另外設計裝修層及背腔；不在結構牆直接挖洞。中置仍為開放櫃提案，最終選型需一併核對前方三聲道搭配。</aside>
<details><summary>全部 44 個位置與高度表</summary><p>座標沿目前模型：X 向圖面右、Y 向圖面下；單位 cm。H 為中心高度，SW 的 0 表示底部落地。符號有放大，十字落點才是配置中心。</p><div class="table"><table><thead><tr><th>版本</th><th>聲道</th><th>X, Y</th><th>H</th><th>安裝</th><th>位置</th></tr></thead><tbody>{rows}</tbody></table></div></details>
<footer>產品方向與依據：<a href="https://ca.kef.com/products/ci3160rlm">KEF 嵌牆主聲道</a> · <a href="https://www.focal.com/products/on-wall-302">Focal 薄型壁掛產品</a> · <a href="https://www.dolby.com/siteassets/technologies/dolby-atmos/atmos-installation-guidelines-121318_r3.1.pdf">Dolby 家用聲道配置指引</a><br>吊架是本案安裝設計方向，並非宣稱 Focal 原廠允許直接吊掛；最終承重構造、機種與原廠安裝條件需核對。天空位置尚須協調樑、吊隱冷氣及檢修孔。<br>2026-09-14 · <a href="位置表.json">下載位置資料</a> · <a href="四版總覽.png">查看四版總覽圖</a></footer></main>
<script>for(const b of document.querySelectorAll('[data-v]'))b.addEventListener('click',()=>{{document.querySelectorAll('[data-v]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelectorAll('figure').forEach(x=>x.hidden=x.id!=='v'+b.dataset.v);}});</script></html>'''
    (OUT/'index.html').write_bytes(page.encode())

configs=[proposal(v) for v in range(1,5)]
for c in configs:
    ids=[q['id'] for q in c['speakers']]
    assert len(ids)==11 and len(set(ids))==11 and set(ids)==set(NAMES)
    for q in c['speakers']:assert 150<=q['x']<=1135 and 330<=q['y']<=1010
    labels=[]
    for q in c['speakers']:
        s=1280/985;x=(q['x']-150)*s+q['labelOffset'][0];y=(q['y']-330)*s+q['labelOffset'][1]
        w=50 if q['category']=='top' else 55 if q['category']=='sub' else 44;h=50 if q['category']=='top' else 40
        box=(x-w/2,y-h/2,x+w/2,y+h/2)
        for id,other in labels:assert min(box[2],other[2])-max(box[0],other[0])<=0 or min(box[3],other[3])-max(box[1],other[1])<=0, f'{c["version"]} labels overlap: {q["id"]} and {id}'
        labels.append((q['id'],box))
    if c['rotating']:
        for q in c['speakers']:
            if q['id'] in ('L','R'):assert math.hypot(q['x']-c['tv'][0],q['y']-c['tv'][1])-10>97.5
    diagram(c)
(OUT/'位置表.json').write_bytes((json.dumps(dict(date='2026-09-14',units='cm',purpose='2D speaker-location proposal only',versions=configs),ensure_ascii=False,indent=2)+'\n').encode())
build_page(configs)
# Four public-area maps, large enough to identify all channels without the schedules.
ov=Canvas(2080,1620);ov.text(38,25,'四版喇叭位置總覽',34,bold=True);ov.text(2040,34,'44 個位置・每版 5.2.4',22,MUTED,anchor='end')
for x,key,label in [(42,'front','綠：前方 L／C／R'),(430,'surround','紫：耳平環繞 SL／SR'),(870,'top','藍：天花天空聲道'),(1250,'sub','橘：重低音 SW1／SW2（保留落地）')]:
    ov.circle(x+7,83,7,COLORS[key]);ov.text(x+25,73,label,18)
for i,c in enumerate(configs):
    x=32+(i%2)*1030;y=102+(i//2)*748
    ov.text(x,y,f"{c['version']} {c['title']}",24,bold=True)
    im=Image.open(OUT/f"{c['version']}-喇叭配置.png").crop((40,185,1322,1090));im=im.resize((1005,710),Image.Resampling.LANCZOS);ov.image(im,x,y+34)
ov.im.save(OUT/'四版總覽.png',optimize=True)
print('Built 4 PNG + 4 SVG + overview + interactive version index; 44 unique version/channel pairs.')
