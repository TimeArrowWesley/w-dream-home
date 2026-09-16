from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
root=Path(__file__).resolve().parents[1]/'提案/原始格局'
data=json.loads((root/'核對/平面幾何.json').read_text(encoding='utf8'))
scale=1.28
im=Image.new('RGB',(1920,1660),'#f3f2ed');d=ImageDraw.Draw(im)
def font(n):return ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',n)
def p(x,y):return (round(70+(x+245)*scale),round(194+(y+20)*scale))
def label(x,y,s):
 px,py=p(x,y);bb=d.textbbox((0,0),s,font=font(23));w=bb[2]
 d.rounded_rectangle((px-w/2-13,py-18,px+w/2+13,py+23),7,fill='#263936')
 d.text((px-w/2,py-14),s,font=font(23),fill='#ffffff')
d.text((70,42),'V0 原始格局',font=font(49),fill='#233432')
d.text((72,111),'依原始平面圖還原配置  ·  現行設備與互動功能共用  ·  深色現代工業風',font=font(23),fill='#65736c')
for h,rgb,*pts in data['triangles']:
 d.polygon([p(pts[i],pts[i+1]) for i in range(0,6,2)],fill=tuple(rgb))
for x,y,w,h in data['walls']:d.rectangle((*p(x,y),*p(x+w,y+h)),fill='#656a67')
for door in data['doors']:
 pts=[p(*pt) for pt in door['points']];d.line(pts+[pts[0]],fill='#253f3b',width=2)
# Readable open-door symbols for the restored openings; structure stays unchanged.
for x,y,w,sign in [(330,753,70,1),(553,955,107,-1)]:
 d.line([p(x,y),p(x,y+sign*w)],fill='#318579',width=3)
 a=p(x-w,y-w);b=p(x+w,y+w);d.arc((*a,*b),0 if sign==1 else 270,90 if sign==1 else 360,fill='#318579',width=2)
for x,y,s in [(210,185,'主臥'),(642,125,'更衣室'),(930,220,'書房・電子琴'),(152,403,'主浴'),(490,312,'客浴'),(665,355,'儲藏室'),(-117,688,'後陽台'),(103,727,'廚房'),(345,845,'貓房'),(608,908,'玄關'),(895,700,'客廳・整合背架沙發'),(500,544,'曲線中島'),(535,464,'雙面玻璃櫃')]:label(x,y,s)
d.text((70,1512),'2026-09-16 共用家具更新：整合背架沙發與主臥  /  原始貓房、中島與書桌格局保留',font=font(24),fill='#233432')
d.text((70,1556),'中島檯高 95 cm、原圖檯寬 80 cm；貓房北側門寬 70 cm。家具輪廓依圖，設備依現行清單。',font=font(22),fill='#566963')
d.text((70,1599),'圖面由 V0 模型正投影繪製；屬配置核對圖，現場尺寸與施工構造仍需丈量確認。',font=font(20),fill='#75827c')
im.save(root/'V0-全屋格局.png',optimize=True)
im.save(root/'V0-全屋格局.webp',quality=92,method=6)
print('V0 plan exported from source geometry.')
