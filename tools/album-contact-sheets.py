from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,sys
root=Path(__file__).resolve().parents[1]/'成品圖集/20260914暗色現代工業'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
items=json.loads((root/'capture-manifest.json').read_text(encoding='utf8'))['entries']
rooms=['entry','living','island','kitchen','bed','closet','study','collection','bath1','bath2','storage','back']
(root/'qa').mkdir(exist_ok=True)
for v in ['v1','v2','v3','v4']:
 for group in range(3):
  sheet=Image.new('RGB',(1152,4*280),'#ddd')
  draw=ImageDraw.Draw(sheet)
  for row,room in enumerate(rooms[group*4:group*4+4]):
   for col,angle in enumerate('ABC'):
    key=f'{v}-{room}-{angle}'
    q=next((q for q in items if q['key']==key),None)
    if not q:continue
    im=Image.open(root/q['model']);im.thumbnail((384,256))
    sheet.paste(im,(col*384,row*280))
    draw.text((col*384+6,row*280+258),key,fill='#111',font=font)
  sheet.save(root/'qa'/f'{v}-{group}.jpg',quality=90)
print('Contact sheets ready')
