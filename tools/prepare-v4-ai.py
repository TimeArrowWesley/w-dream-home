from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923V4公共區更新';(R/'ai').mkdir(exist_ok=True)
cs=json.loads((R/'captures.json').read_text(encoding='utf8'))
common='''Use case: sketch-to-render. Produce ONE finished photorealistic architectural interior photograph, landscape 1536x1024. The supplied image is the authoritative UPDATED V4 R02 source model, an edit target. Preserve its EXACT camera, framing, walls, beams, door/window openings, cabinet divisions, furniture footprints and equipment counts and positions. Change the flat CAD appearance into real photographed fine textures, natural indirect daylight, soft realistic shadows and subtle reflections. GR06 palette: neutral gray walls, graphite metal, desaturated gray-BROWN wood with restrained taupe grain, gray-brown HERRINGBONE wood floor without orange or red tones. Gray tile remains tile in kitchen and wet/service rooms. Only the existing fixed TV stone feature panel is fine textured gray stone with restrained horizontal staggered joints and gentle top wash light; do not cover every wall or any glass/wood cabinet with stone. Clear glass remains transparent; mirrors reflect the same compact interior, never become additional windows. The living furniture group has moved toward the island: keep the exact new positions shown, the window-side gap and both island stools where visible. Rear surround speakers, if visible behind sofa, sit on short supports on the sofa storage/back rack: NO floor stands and NO extra speakers. Keep the existing full rectangular speaker enclosures. Preserve all closed practical storage and every glass showcase compartment. Display figure proxies become realistic small neutral collectible figures in the same count and positions; empty compartments stay EMPTY. White refrigerator remains white, electronic devices black/silver as shown, sinks are hollow basins. Do not invent decor, plants, people, furniture, extra fixtures, windows or doors. Do not recompose or enlarge the room. The result must be a convincingly photographed high-end interior, NOT a flat model screenshot, clay render, illustration or diagram. No text, labels or watermark.'''
notes={
 'entry':'Entrance: keep exact entrance door, gray tile/wood threshold, closed entry storage, island plumbing and sightlines. Both island stools remain exactly where shown, no additional chairs.',
 'living':'Living: preserve exact sofa and integrated back rack, coffee table, rug, fixed television and open AV console, ALL visible speakers/subwoofers. TV is dark/off. Stone wall is only the fixed feature surface shown; glass display and wood entry cabinets remain separate materials.',
 'island':'Island: preserve existing 280x110 counter, fine HONED gray counter stone (not rough wall stone), gray-brown vertical wood, TWO separate black faucets, single hollow sink, induction hob, wine fridge/robot bays and exactly two round stools where visible. No dining extension and no third stool.',
 'bed':'Bedroom view through doorway: preserve bedroom furnishing, blank projection screen (not a window), exact doorway and new living furniture seen beyond. No added decor or stone bedroom wall.',
 'study':'Study: keep both workstations, monitors, towers, chairs, glass display and closed drawers exactly as depicted. Beyond the study opening, keep the updated sofa rear rack and short speaker supports, no floor speaker stands. No added window or new desk.',
 'collection':'Open display/storage: preserve each glass compartment, opaque backing and closed deep cabinet. Do not convert a glazed showcase to solid wood. Keep new living group visible beyond at its exact position.',
 'storage':'Storage room view toward entrance: preserve metal shelf uprights and levels, empty access aisle, doorway and exact visible public room arrangement beyond. Do not add a mirror, window, washing machine, decorations or wood shelving.'}
jobs=[]
for c in cs:
 if not c['changed']:continue
 key=c['key']+'-v4r02';prompt=common+'\nRoom-specific constraints: '+notes[c['room']]
 if c['key'] in ['v4-entry-door5B','v4-entry-door5C','v4-entry-door5D','v4-entry-door5E','v4-living-B','v4-living-C','v4-living-E','v4-island-A','v4-island-D','v4-island-E','v4-bed-E','v4-collection-B']:
  prompt+=' CRITICAL CAMERA-SPECIFIC OVERRIDE: NO stone feature wall is visible in this view. Every pale large pane in the model with a black frame is existing transparent window/glass: keep it GLASS with subdued exterior daylight. Do NOT turn it into stone, opaque cladding, or a solid wall. Gray plaster interior walls stay plain.'
 prompt+=' Keep the coffee table a smooth plain BLACK solid surface, NO marble veins. Where island plumbing is shown, there is only ONE sink and TWO faucets: the separate black rectangular panel is a flush INDUCTION HOB with two subtle cooking rings, never a second sink. Do not add a third faucet.'
 assert 'undefined' not in prompt and len(prompt)>1000
 jobs.append({'key':key,'viewKey':c['key'],'room':c['room'],'modelPath':str((R/c['model']).resolve()),'modelHash':c['modelHash'],'prompt':prompt})
(R/'jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',20)
for start in range(0,len(jobs),6):
 canvas=Image.new('RGB',(1728,816),'#222');d=ImageDraw.Draw(canvas)
 for i,j in enumerate(jobs[start:start+6]):
  x=i%3*576;y=i//3*408
  with Image.open(j['modelPath']) as im:canvas.paste(im.resize((576,384)),(x,y+24))
  d.text((x+6,y),j['key'],font=font,fill='white')
 canvas.save(R/f'sources-{start//6+1:02}.jpg',quality=95)
print(json.dumps({'sources':len(cs),'changed':len(jobs),'unchanged':len(cs)-len(jobs),'keys':[j['key'] for j in jobs]},ensure_ascii=False))
