from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923V4灰石工業校正';(R/'ai').mkdir(exist_ok=True)
cs=json.loads((R/'captures.json').read_text(encoding='utf8'))
for c in cs:
 c['lightingAffected']=c['room']=='study'
 c['changed']=c['changed'] or c['lightingAffected']
(R/'captures.json').write_text(json.dumps(cs,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
common='''Use case: sketch-to-render. Produce ONE finished photorealistic architectural interior photograph, landscape 1536x1024. Input image 1 is the authoritative updated V4 GI01 source model and edit target. Preserve EXACT camera, framing, geometry, doors, windows, beam positions, cabinet compartments, furniture footprints, equipment counts and orientation. Turn the flat source model into photographed materials and realistic lighting. This is a neutral GRAY-STONE MODERN INDUSTRIAL home, with GRAPHITE cabinetry, real subtle BRUSHED GUNMETAL frames and low-saturation gray-brown herringbone floor. Strong controlled material contrast: charcoal satin/matte cabinet faces versus midgray mineral plaster, textured gray stone versus clear glass, brushed metal edges versus wood accent tops. Match the finish assignment visible in the source precisely: entry vertical cabinet panels, deep storage fronts, large living-facing island cabinet panels and study drawer faces are smooth GRAPHITE, NOT wood. Small island short-end panel, entry horizontal counter, AV counter and sofa rear rack retain desaturated gray-brown wood accents. Existing metal display frames and shelf-edge trims have subtle gunmetal brushed reflections; no bright chrome, brass or gold. Glass shelves/doors remain transparent. Display backing is quiet neutral medium gray, not walnut. Keep gray-brown herringbone floor grain and direction, neither blacken it nor turn it beige, orange or red. Walls/ceiling remain gray and daytime windows remain bright; do NOT darken the whole image or use night lighting. Neutral daylight and neutral-white study functional lighting, restrained localized warm-neutral display accents, mild warm wall-wash ONLY above the existing gray-stone TV panel. NO uniform amber hotel glow, no continuous new perimeter LED strips, no RGB colored wash. Fine rough mineral stone only on the existing fixed TV feature panel; countertop is smooth honed gray stone, never rough masonry. Plain black coffee table without marble veins. White fridge stays white, factory electronics keep their original materials. Black rectangular island hob is flush induction with two subtle rings, NOT a second sink; there is ONE sink and TWO separate black faucets. Retain both island stools exactly where visible, never add extra chairs. Rear surround enclosures stay on short supports on the sofa rear rack; no floor stands. Do not add decor, plants, people, openings, extra lights or change room proportions. Empty cabinet compartments stay empty; existing figure proxies must stay HUMANOID collectible figurines, exactly one figure in each occupied compartment, no spheres/vases/books/decor added. Must be a convincing photographed high-end interior, not a flat CAD/clay screenshot, schematic or drawing. No text, watermark or labels.'''
common+=' Both round stool seats are dark gray upholstered fabric, never wood. Keep suspended black flat rectangular panels rectangular, not cylindrical pendants. Rear surround speakers each keep one large circular driver. TV stone wash is continuous from the existing strip, no spotlights or scallops.'
notes={
'entry':'Entry: graphite vertical cabinet faces with retained gray-brown horizontal top. Preserve gray-tile/herringbone threshold and the exact existing suspended black rectangular object and round wall fan if visible; do not reinterpret them as windows.',
'living':'Living: exact gray fabric sofa, black coffee table, rug, all speakers/subwoofers and open AV cabinet. Fixed TV dark/off; glass and windows remain glass. Graphite island and entry cabinetry must read distinctly darker than gray-brown floor. Upholstery remains comfortable textured gray.',
'island':'Island: preserve all sink/faucet/hob/wine-fridge/robot-bay geometry. Living-facing vertical panels GRAPHITE; small opposite short-end panel retains gray-brown wood as shown. Exactly two stools at their source positions, only depict those visible.',
'kitchen':'Kitchen view: preserve already ordered kitchen fittings and their finishes. Change only new graphite public cabinets visible through the doorway, matching the source. Do not recolor the manufacturer equipment or add island seating in the kitchen.',
'bed':'Bedroom doorway view: bedroom finishes remain unchanged, the large white rectangle is a BLANK RETRACTABLE PROJECTION SCREEN, not a window/mirror. Keep both doorways and visible public graphite cabinetry beyond exactly. No new stone in bedroom.',
'study':'Study: both workstations, monitors, computers, chairs, bookshelf contents and visible figure counts unchanged. Nine closed drawer fronts are graphite. Glass display back medium gray, thin frames/shelf edge/brushed metal. Neutral-white functional light and less uniformly bright shelf accents; keep natural daylight. No RGB.',
'collection':'Collection: clear glass, middle-gray solid backing, visible gunmetal frames; deep closed storage faces graphite. Maintain each compartment and all displayed figure/bag counts. Do not turn transparent front into solid metal. Keep doorway and island positions.',
'storage':'Storage: metal open shelves and empty aisle remain exactly unchanged. Public cabinetry seen beyond becomes graphite per source, but keep sofa rear rack gray-brown wood. No new machines, windows, mirrors or decorations.'}
nostone={'entry','bed','collection'}
jobs=[]
for c in cs:
 if not c['changed']:continue
 k=c['key']+'-v4gi01';prompt=common+'\nView: '+c['key']+'. '+notes[c['room']]
 if c['room'] in nostone or c['key'] in ['v4-living-B','v4-living-C','v4-living-E','v4-island-A','v4-island-D','v4-island-E']:
  prompt+=' CAMERA RULE: no TV stone feature is visible in this view. Existing pale panes bounded by black frames are transparent windows/glass, never stone. Plain gray plaster stays plaster.'
 if c['key']=='v4-island-B':prompt+=' CAMERA RULE: no stool is visible on the foreground working/appliance side. Do not invent cropped stools along foreground edge.'
 if c['key']=='v4-collection-B':prompt+=' CAMERA RULE: no small stool-seat fragments are visible beyond the island far counter edge; do not add them.'
 if c['room']=='study':prompt+=' Gray plaster beyond glass is not a new window. Keep white/black monitor BACKS white/black when seen from behind, screens when seen from front.'
 assert len(prompt)>1000 and 'undefined' not in prompt
 jobs.append({'key':k,'viewKey':c['key'],'room':c['room'],'modelPath':str((R/c['model']).resolve()),'modelHash':c['modelHash'],'lightingAffected':c['lightingAffected'],'prompt':prompt})
(R/'jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',18)
for start in range(0,len(jobs),6):
 sheet=Image.new('RGB',(1728,816),'#242928');d=ImageDraw.Draw(sheet)
 for i,j in enumerate(jobs[start:start+6]):
  x=i%3*576;y=i//3*408
  with Image.open(j['modelPath']) as im:sheet.paste(im.resize((576,384)),(x,y+24))
  d.text((x+4,y),j['key'],font=font,fill='white')
 sheet.save(R/f'sources-{start//6+1:02}.jpg',quality=95)
print(json.dumps({'jobs':len(jobs),'keys':[j['key'] for j in jobs],'retained':len(cs)-len(jobs)},ensure_ascii=False))
