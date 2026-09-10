"""Dimensioned V3 concept drawings from the retained V2 model. No 3D mutation."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, math, html

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '提案/開放大中島'
OUT.mkdir(parents=True, exist_ok=True)
DATA = json.loads((ROOT/'調整紀錄/20260910設備整合/幾何驗證.json').read_text())['variants']['v2']
FONT = 'C:/Windows/Fonts/msjh.ttc'
BOLD = 'C:/Windows/Fonts/msjhbd.ttc'
INK, MUTED, FLOOR, WALL, GREEN, RED = '#263b39', '#687b76', '#eeeae2', '#686f6b', '#287b6d', '#ba6250'

class Drawing:
    def __init__(self,w,h):
        self.im=Image.new('RGB',(w,h),'#f6f5ef');self.d=ImageDraw.Draw(self.im)
        self.svg=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" font-family="Microsoft JhengHei, sans-serif"><rect width="100%" height="100%" fill="#f6f5ef"/>']
    def rect(self,x,y,w,h,fill,stroke=None,lw=1):
        self.d.rectangle((x,y,x+w,y+h),fill=fill,outline=stroke,width=max(1,round(lw)))
        self.svg.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{fill or "none"}" stroke="{stroke or "none"}" stroke-width="{lw}"/>')
    def line(self,pts,color=INK,lw=1,dash=False):
        if dash:
            for a,b in zip(pts,pts[1:]):
                dist=math.dist(a,b);n=max(1,math.ceil(dist/7))
                for i in range(0,n,2):self.d.line([(a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n) for j in (i,min(n,i+1))],fill=color,width=round(lw))
        else:self.d.line(pts,fill=color,width=max(1,round(lw)))
        self.svg.append('<polyline points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in pts)+f'" fill="none" stroke="{color}" stroke-width="{lw}"'+(' stroke-dasharray="7 7"' if dash else '')+'/>')
    def poly(self,pts,fill,stroke=None,lw=1):
        self.d.polygon(pts,fill=fill);self.line(pts+[pts[0]],stroke or fill,lw)
        self.svg.append('<polygon points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in pts)+f'" fill="{fill}"/>')
    def circle(self,x,y,r,fill,stroke=None,lw=1):
        self.d.ellipse((x-r,y-r,x+r,y+r),fill=fill,outline=stroke,width=max(1,round(lw)))
        self.svg.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r:.2f}" fill="{fill or "none"}" stroke="{stroke or "none"}" stroke-width="{lw}"/>')
    def text(self,x,y,text,size=18,color=INK,bold=False,anchor='start'):
        font=ImageFont.truetype(BOLD if bold else FONT,size);width=self.d.textlength(text,font=font)
        xx=x-width/2 if anchor=='middle' else x-width if anchor=='end' else x
        self.d.text((xx,y),text,font=font,fill=color,anchor='lt')
        self.svg.append(f'<text x="{x:.2f}" y="{y+size*.88:.2f}" font-size="{size}" fill="{color}" text-anchor="{anchor}" font-weight="{700 if bold else 400}">{html.escape(text)}</text>')
    def save(self,name):
        self.im.save(OUT/(name+'.png'),optimize=True)
        (OUT/(name+'.svg')).write_text('\n'.join(self.svg+['</svg>']),encoding='utf8')

def plan(d,ox,oy,s,x0=-230,y0=-30,new=False,full=False):
    p=lambda x,y:(ox+(x-x0)*s,oy+(y-y0)*s)
    def rect(x,y,w,h,c,stroke=None,lw=1):d.rect(*p(x,y),w*s,h*s,c,stroke,lw)
    def line(pts,c=INK,lw=1,dash=False):d.line([p(*q) for q in pts],c,lw,dash)
    def label(x,y,t,size=16,c=INK):d.text(*p(x,y),t,size,c,anchor='middle')
    def circ(x,y,r,c,stroke=None):d.circle(*p(x,y),r*s,c,stroke)
    def dim(x1,y1,x2,y2,t,dx=0,dy=0):
        a,b=p(x1,y1),p(x2,y2);d.line([a,b],GREEN,1.5)
        for x,y in (a,b):d.line([(x-4,y-4),(x+4,y+4)],GREEN,1.5)
        mx=(a[0]+b[0])/2+dx;my=(a[1]+b[1])/2+dy
        width=max(48,len(t)*10);d.rect(mx-width/2-3,my-1,width+6,21,'#f6f5ef')
        d.text(mx,my,t,15,GREEN,True,'middle')
    outline=[(-110,-15),(1185,-15),(1185,315),(1085,315),(1085,580),(1185,580),(1185,650),(1085,650),(1085,880),(1185,880),(1185,970),(445,970),(-210,970),(-210,415),(-90,415),(-90,85),(-110,85)]
    if full:d.poly([p(*q) for q in outline],FLOOR)
    else:rect(195,360,905,615,FLOOR)
    if new:rect(220,735,495,220,'#dde9de')
    for w in DATA['walls']:
        if w['z']>100 or w['h']<1:continue
        x,y,ww,dd=w['x'],w['y'],w['w'],w['d']
        if not full and (y<360 or x<195 or x>1100):continue
        if new and abs(x-435)<1 and abs(y-875)<1:continue
        rect(x,y,ww,dd,WALL)
    # Furnishings retained in both comparisons. Measurements are model coordinates, cm.
    rect(230,499,85,91.2,'#adbbb8',INK);label(272.5,530,'冰箱',15)
    rect(900,464,95,240,'#c4b8a2',INK);rect(835,620,65,84,'#c4b8a2',INK)
    for y in [469,547,625]:rect(906,y,82,71,'#dfd5bf',MUTED)
    rect(842,627,49,68,'#dfd5bf',MUTED)
    label(953,728,'原沙發保留',14)
    rect(619.5,460,55,200,'#596d69',INK)
    line([(647,463),(647,657)],'#132826',5);label(675,415,'旋轉電視',16)
    label(675,437,'與影音底櫃',14)
    circ(647,560,97.5,None,GREEN)
    rect(754.15,465.25,31.7,31.5,'#293d3b');rect(754.15,623.25,31.7,31.5,'#293d3b')
    circ(819,549,31,'#988b78',INK);label(819,580,'茶几',13)
    rect(781,780.25,36,39.5,'#3f4b48');rect(1022,794.25,36,39.5,'#3f4b48')
    rect(760,915,315,40,'#b2c9c3',INK);label(915,928,'原客廳展示櫃保留',13)
    rect(690,915,70,40,'#c4b8a2',INK)
    line([(210,625),(210,745)],'#65a5b6',5);label(282,680,'廚房電動玻璃門',13)
    if full:
        rect(100,10,180,200,'#d1c6b1',INK);rect(111,26,70,32,'#ebe4d8');rect(195,26,70,32,'#ebe4d8')
        rect(755,10,55,285,'#b7aea0',INK);rect(880,280,170,65,'#b7aea0',INK)
        rect(-75,423,130,60,'#b7c6c1',INK);circ(-10,448,15,'#f8f7f0',MUTED)
        # Bath location correction also appears on the context plan.
        x,y=p(247,390);d.d.ellipse((x-35*s,y-75.5*s,x+35*s,y+75.5*s),fill='#f7f7f1',outline=INK,width=2)
        d.svg.append(f'<ellipse cx="{x}" cy="{y}" rx="{35*s}" ry="{75.5*s}" fill="#f7f7f1" stroke="{INK}"/>')
        rect(166,476,28,7,GREEN);line([(180,477),(180,451)],GREEN,2);circ(180,451,10,None,GREEN)
        line([(140,300),(140,373)],'#93aaa4',2);line([(140,373),(140,473)],'#93aaa4',3)
        for x,y,t in [(170,230,'主臥'),(630,140,'更衣室'),(900,195,'雙人書房'),(490,290,'客浴'),(665,305,'儲藏室'),(40,360,'主浴'),(100,705,'廚房'),(-115,670,'後陽台')]:label(x,y,t,18)
    # Structural pier must survive demolition. Do not wrap it in bulky cabinetry.
    rect(445.1,880.1,100.1,89.9,'#69736b',INK)
    for a in range(448,530,15):line([(a,883),(min(a+38,543),967)],'#939e96',1)
    label(495,906,'結構柱',15,'#ffffff');label(495,930,'100 × 90',12,'#ffffff')
    if new:
        rect(425,480,95,300,'#c2cfbb',INK,2)
        # West-facing service zones. Symbols indicate allocation, not fabrication openings.
        rect(429,489,60,68,'#748c7d',INK);label(463,512,'酒櫃',13)
        rect(429,565,47.5,38.1,'#e5e8dd',INK);label(475,576,'掃地機 ↓',12)
        rect(444,614,27,49.5,'#324744',INK);label(488,630,'IH',12)
        circ(466,707,11,'#ebeee5',INK);line([(466,719),(466,727)],INK,2)
        label(475,743,'備餐／吧台',12)
        rect(220,760,60,155,'#9c927e',INK)
        label(250,891,'收齊',12,GREEN)
        label(250,790,'深',15);label(250,813,'收',15);label(250,836,'納',15)
        rect(220,915,60,40,'#9c927e',INK)
        rect(280,915,165,40,'#a9c6bc',INK)
        for x in [335,390]:line([(x,915),(x,955)],'#547c70')
        label(362.5,927,'玻璃展示・深 40',13)
        rect(660,805,55,110,'#c4b8a2',INK)
        rect(660,915,30,40,'#c4b8a2',INK)
        label(690,824,'玄',14);label(690,847,'關',14);label(690,870,'矮櫃',12)
        # Former room boundary shown only as demolition information.
        line([(220,753),(545.2,753),(545.2,880)],RED,2,True)
        dim(315,540,425,540,'110',dy=-22)
        dim(520,675,619.5,675,'99.5',dy=5)
        dim(425,459,520,459,'95',dy=-20)
        dim(410,480,410,780,'300',dx=-25)
        dim(478,780,478,880.1,'100.1',dx=25)
        dim(545.2,897,660,897,'114.8',dy=-10)
        line([(603,943),(603,840),(578,818),(562,758),(714,735)],GREEN,2)
        line([(707,730),(714,735),(705,739)],GREEN,2)
        label(366,813,'收藏室拆開',14,GREEN);label(366,839,'變成共享走動區',13,GREEN)
        for n,x,y in [(1,473,466),(2,335,899),(3,250,752),(4,690,794)]:
            circ(x,y,13,GREEN);label(x,y-10,str(n),16,'#ffffff')
    else:
        rect(434,464,81,189,'#c9c9b8',INK,2);label(474,530,'原中島',14);label(474,559,'189 × 81',12)
        for x,y,w,h in [(215,753,335,40),(215,793,60,162),(275,905,160,50),(550,753,160,50)]:rect(x,y,w,h,'#c2baab',INK)
        label(383,766,'原收藏展示牆',14);label(631,770,'玄關櫃',14)
        line([(545.2,803),(545.2,883)],INK,3)
        label(368,839,'收藏室',20);label(615,885,'玄關',18)
        line([(214,751),(712,751),(712,805),(548,805),(548,884)],RED,3,True)
        dim(570,660,570,753,'93',dx=20)
    # Entrance swing remains outside the home.
    line([(553,955),(553,1005)],INK,2)
    label(610,979,'入戶・獨立梯廳',14)

def card(d,x,y,n,title,lines):
    d.rect(x,y,438,35+len(lines)*27,'#e9ede5')
    d.circle(x+21,y+19,13,GREEN);d.text(x+21,y+9,str(n),17,'#ffffff',True,'middle')
    d.text(x+45,y+8,title,20,INK,True)
    for i,line in enumerate(lines):d.text(x+16,y+42+i*26,line,16,MUTED)

d=Drawing(1800,1100)
d.text(45,28,'V3 提案｜打開收藏室，延伸生活中島',35,INK,True)
d.text(47,84,'以新 V2「旋轉電視＋玄關高矮櫃」為底案 · 2D 討論稿 · 尺寸：cm · 2026-09-10',19,MUTED)
for x,title,note in [(45,'調整前｜新 V2','原 V3 改名；收藏室仍獨立'),(918,'提案後｜新 V3','拆收藏室隔間、重排玄關櫃；柱與廚房牆保留')]:
    d.text(x,140,title,27,INK,True);d.text(x,179,note,17,MUTED)
    plan(d,x+7,228,.84,195,360,new=x>500)
d.line([(889,140),(889,796)],'#ccd4ca',2)
d.text(48,819,'紅虛線：擬拆展示牆／門片、移位玄關櫃',19,RED)
d.text(918,819,'綠線：主要回家動線　圓圈：電視旋轉範圍',18,GREEN)
for x,title,lines in [(45,'中島 189 × 81 → 300 × 95',['檯面面積約增加 86%；檯高維持 95。','酒櫃、掃地機與飲水檢修朝西／冰箱。']), (625,'收納沿外圍重新配置',['深 40 玻璃櫃＋深 60 行李／大型收藏櫃。','櫃尾與轉角收齊，不再留下落地窄縫。']), (1203,'留下能走動的空間',['冰箱前 110；中島南端至柱 100.1。','玄關柱旁 114.8；通道不擺固定吧椅。'])]:
    d.text(x,888,title,23,INK,True)
    for i,t in enumerate(lines):d.text(x,932+i*30,t,18,MUTED)
d.text(45,1047,'99.5 為中島至固定影音櫃的間距；旋轉電視轉動時需清空兩者之間。尺寸依現有模型，非現場丈量／施工圖。',18,MUTED)
d.save('V3-格局對照')

d=Drawing(1750,1160)
d.text(40,28,'V3 開放大中島｜全屋 2D 格局提案',34,INK,True)
d.text(42,79,'取消封閉收藏室，把空間交還中島、展示與回家動線。其餘臥室、廚衛與客廳機能沿用新 V2。',19,MUTED)
plan(d,45,138,.81,-230,-30,new=True,full=True)
card(d,1260,140,1,'300 × 95 × H95 長中島',['酒櫃、掃地機及飲水設備朝冰箱。','IH 與小水槽分區，保留備餐段。','維持細長比例；南端不放固定椅。'])
card(d,1260,320,2,'165 × 40 可開啟玻璃展示',['南牆總長 225，含左端 60 轉角封板。','封閉轉角不計入有效展示寬。','外深 40，層板淨深約 36。'])
card(d,1260,500,3,'155 × 60 深收納高櫃',['櫃身延長 35，直接接到南牆展示櫃。','保留行李與较深收藏的空間。','L 形交角作封閉收邊，櫃門分段。'])
card(d,1260,680,4,'玄關櫃與電箱櫃連續收邊',['矮櫃 110 × 55 × H90，柱旁 114.8。','南端 30 × 40 轉角封閉，不留地洞。','電箱前板分段，維修門避開矮櫃。'])
d.text(1260,883,'設計取捨',23,INK,True)
for i,t in enumerate(['封閉收藏室的防塵、遮光與收納量會減少。','玻璃櫃仍採可關門櫃；深收藏用實門收納。','柱、廚房牆、外牆保留，不以拆柱換空間。','給排水與插座需隨中島延長重新定位。']):d.text(1260,924+29*i,t,16,MUTED)
d.text(45,1060,'圖面下方為入戶；方位沿現有模型。公共空間外僅示意保留範圍，家具未逐一描繪。',17,MUTED)
d.text(45,1092,'2D 提案，尚未套入 3D。淋浴組已另行同步修正於目前 V1、V2 的主浴南牆。',17,GREEN)
d.save('V3-全屋格局')

plan_data={'status':'2D concept only','base':'new v2 = original v3','units':'cm','island':{'x':425,'y':480,'w':95,'d':300,'h':95},'preservedColumn':{'x':445.1,'y':880.1,'w':100.1,'d':89.9},'cabinets':[{'id':'display','x':280,'y':915,'w':165,'d':40},{'id':'collection-return','x':220,'y':915,'w':60,'d':40,'use':'closed corner infill; not counted as usable display'},{'id':'deep-storage','x':220,'y':760,'w':60,'d':155},{'id':'entry','x':660,'y':805,'w':55,'d':110,'h':90},{'id':'entry-return','x':660,'y':915,'w':30,'d':40,'h':90,'use':'closed removable corner infill; not counted as usable storage'}], 'nominalClearances':{'fridgeToIsland':110,'islandToFixedTVBase':99.5,'islandSouthToColumn':100.1,'entryColumnToCabinet':114.8},'retainedWalls':['kitchen boundary x210–220','exterior and structural columns'],'demolition':['collection north display and east door','collection short return at y875; structural pier retained'],'relocated':['entry cabinet run'],'cabinetJunctionRevision':{'leftExtensionCm':35,'rightCornerCm':[30,40],'electricalAccess':'split cabinet front; service hatch above low cabinet, separate from infill','entryDoorClearCm':107},'limits':['Measurements from model, not site survey.','TV sweep requires an empty rotation area; aisle dimension applies to parked TV.','No fixed stools in the 100cm south route.','Appliance doors are not to be opened opposite one another simultaneously.','Storage capacity decreases compared with enclosed room; large figurines require item-by-item shelf planning.']}
(OUT/'格局尺寸.json').write_text(json.dumps(plan_data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Saved two paired SVG/PNG concept boards and measured layout data.')
