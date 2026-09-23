from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,ast,math
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923V1V4影音統一'
read=lambda p:json.loads(p.read_text(encoding='utf8'))
cs=read(R/'captures-v1.json')+read(R/'captures-v4.json');assert len(cs)==120
(R/'captures.json').write_text(json.dumps(cs,ensure_ascii=False,indent=2),encoding='utf8')
tree=ast.parse((P/'tools/prepare-grey-ai.py').read_text(encoding='utf8'))
notes=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='notes' for t in n.targets))
style=P/'成品圖集/20260914暗色現代工業/images/v4-living-A-bi01.webp'
common='''Use case: sketch-to-render. Produce ONE polished PHOTOREALISTIC architectural interior photograph, landscape 1536x1024. Image 1 is the authoritative UPDATED AU01 3D SOURCE MODEL, the edit target: preserve its exact camera, perspective, framing, room proportions, openings, beams, furniture sizes, ALL cabinet divisions and equipment locations/counts. Image 2 is ONLY a material/photography reference for this home's accepted BI01 matte-black ceiling, medium-gray walls, graphite cabinets, gray stone and gray-brown herringbone wood. NEVER copy image 2 layout or composition. Rebuild the flat CAD textures and lighting into convincingly photographed fine materials, natural indirect daylight, soft contact shadows, subtle reflections and depth. No flat model rendering, clay appearance or illustration. The updated sofa is closer to the WINDOW SIDE; preserve all intentionally EMPTY space between living room and island. The two floorstanding speakers are FORWARD of the TV console, and two small subwoofers near the front wall, exactly as model 1 depicts. The rear surrounds, if visible, are two SMALL ROUND COMPLETE black speakers on SHORT posts ON THE SOFA BACK RACK, NEVER floor stands or rectangular in-wall enclosures. All other equipment and cabinets remain the exact source geometry. Preserve every opaque wall above and below windows; mirrors are not windows. Existing fixtures only. Large round white flush ceiling discs are opaque finely perforated SPEAKER GRILLES, NOT glowing lamps or recessed bowls. All ceilings and beams stay matte near-black, every visible room. Medium-gray walls never become white. Stone ONLY on the modeled existing feature wall or stone countertop, never on window glass, ordinary walls, cabinets or floor. HERRINGBONE desaturated gray-brown wood stays wood; gray tile stays gray tile. Keep clear glass transparent, graphite cabinet panels opaque, local horizontal wood tops wooden. Fixed TV is black/off. Figurine proxies become real small neutral humanoid collectible figures with limbs in their exact positions; empty shelves stay EMPTY. No added plants, people, vases, books, furniture, lights, windows, decoration or watermarks. Do not widen or recompose the room. Smooth black coffee table, no marble veining. Interior furniture and visible adjoining room layout must match image 1, not image 2.'''
groups={}
for c in cs:
 if c['changed']:groups.setdefault(c['modelHash'],[]).append(c)
jobs=[]
for h,es in groups.items():
 c=es[0];k=c['key']+'-au01';prompt=common+'\nRoom constraints: '+notes[c['room']]
 if c['version']=='v1' and c['room'] in ['entry','living','island']:
  prompt+=' Preserve the full overhead TV CABINET and side closed cabinet wherever visible; do not replace these with bare stone. Preserve the tall GLASS cabinet on the curved island, the single dark ceramic vase, round hollow sink and TWO round stools along its OUTER ARC. Curved island vertical faces are matte graphite, not brown wood.'
 if c['version']=='v4' and c['room'] in ['entry','living','island','collection']:
  prompt+=' V4 keeps its long rectangular island and exactly two round stools where model shows them; one hollow sink and two separate faucets plus a flush black induction hob, not a second sink. No new upper TV cabinet.'
 if c['room']=='study':prompt+=' Preserve exactly two desks, both chairs, monitors and towers. No added storage contents. The sofa and rear speakers seen through glazing must match the updated model.'
 if c['room']=='storage':prompt+=' Empty metal shelves are empty metal shelves, not wooden or illuminated shelves. No mirror or new window.'
 assert len(prompt)>1500 and 'undefined' not in prompt
 jobs.append({'key':k,'viewKey':c['key'],'version':c['version'],'room':c['room'],'angle':c['angle'],'modelHash':h,'modelPath':str((R/c['model']).resolve()),'referenced_image_paths':[str((R/c['model']).resolve()),str(style.resolve())],'prompt':prompt,'mappedViews':[e['key'] for e in es],'outputPath':str((R/'ai'/f'{k}.png').resolve())})
(R/'ai').mkdir(exist_ok=True)
(R/'jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2),encoding='utf8')
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',20)
for start in range(0,len(jobs),6):
 im=Image.new('RGB',(1728,816),'#222');d=ImageDraw.Draw(im)
 for i,j in enumerate(jobs[start:start+6]):
  x=i%3*576;y=i//3*408
  with Image.open(j['modelPath']) as src:im.paste(src.resize((576,384)),(x,y+24))
  d.text((x+6,y),j['key'],font=font,fill='white')
 im.save(R/f'sources-{start//6+1:02}.jpg',quality=95)
print(json.dumps({'sources':len(cs),'changedSlots':sum(c['changed'] for c in cs),'newAI':len(jobs),'keys':[j['key'] for j in jobs]}))
