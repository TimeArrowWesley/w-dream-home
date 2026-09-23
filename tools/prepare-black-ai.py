from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import ast,json,math
P=Path(__file__).resolve().parents[1];R=P/'調整紀錄/20260923全版本霧黑工業'
captures=json.loads((R/'captures.json').read_text(encoding='utf8'))
old={e['key']:e for e in json.loads((R/'album-before.json').read_text(encoding='utf8'))['entries']}
# Reuse the established room-specific constraints, not historical style choices.
tree=ast.parse((P/'tools/prepare-grey-ai.py').read_text(encoding='utf8'))
notes=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='notes' for t in n.targets))
style=P/'評估/20260923V4霧黑天花試案/ai/BC01-living-C.png'
common='''Use case: sketch-to-render. Produce ONE polished PHOTOREALISTIC architectural interior photograph, landscape 1536x1024. Image 1 is the STRICT geometry, camera and material-location source; image 2 is ONLY a reference for the approved matte black ceiling / medium gray walls / graphite cabinets / gray-brown wood mood. Never copy image 2 layout or objects. Rebuild realistic photographed materials, depth, natural indirect light, soft contact shadows, fine surface detail, realistic glazing and reflections; not a flat CAD, illustration or clay render. Invariants: preserve EXACT image 1 framing, perspective, walls, beams, doors, window openings, solid wall below and above windows, furniture footprint, ALL storage cabinet partitions, equipment count, shelf contents and foreground occlusions. Empty shelves remain EMPTY. Matte near-black #242628 ceiling including beams; medium neutral gray #858986 painted/mineral walls; deep gray door surrounds only where modeled. Stone ONLY where a modeled stone feature or counter exists; never turn ordinary walls into stone. Graphite opaque cabinets stay opaque; clear glass stays clear. Keep desaturated gray-brown HERRINGBONE WOOD only where the model shows wood floor, and gray tile only where shown. Preserve dark versus lighter material hierarchy, do not brighten black ceilings or gray walls to white. Existing light sources only, balanced natural interior photography exposure, not black underexposure; no invented strip lights, recesses, windows, furniture, props, plants or people. Large white FLUSH CIRCULAR SPEAKER GRILLES on ceilings are opaque, finely perforated, NON-LUMINOUS discs, not recessed light bowls. Actual small downlights stay lights. Do not add text, labels or watermarks. This is an exact-view material photorealization, not a redesign of the architecture.'''
common=common.replace('Image 1 is the STRICT geometry, camera and material-location source; image 2 is ONLY a reference for the approved matte black ceiling / medium gray walls / graphite cabinets / gray-brown wood mood. Never copy image 2 layout or objects.','The supplied image is the STRICT geometry, camera and material-location source.')
common+=' IMPORTANT object decoding: a small pale sphere on a rectangular torso inside a showcase is a collectible FIGURINE placeholder. Render one realistic neutral humanoid designer toy with small arms/legs and head in each such exact footprint, never a ball on a marble plinth. Empty cells stay empty. Flat white rectangular screens at desks are MONITORS seen from their back or with a white screen; never lamps, lampshades or glowing panels. Keep desk monitors, chair headrests and PC towers recognizable and distinct.'
groups={}
for e in captures:groups.setdefault(e['modelHash'],[]).append(e)
jobs=[]
for h,es in groups.items():
 e=es[0];key=e['file'].removesuffix('.png');note=notes[e['room']]
 note=note.replace('Never add dining seats in other versions.','Keep exactly the seats visible in image 1, including V4 two island chairs.')
 note=note.replace('Gray-brown vertical timber and silver brushed metal remain distinct.','Graphite fronts, gray-brown wood and brushed metal remain distinct exactly as modeled.')
 note=note.replace('V1 has exactly two round stools along the OUTER ARC, not between counter and high glass cabinet. ','')
 prompt=common+'\nRoom constraints (material location always follows image 1): '+note
 if e['room']=='collection' and e['version']=='v0':prompt=common+'\nOriginal-layout cat room: retain exact cat shelves, scratch post and litter/storage furniture. No cat or added glass showcase or new window.'
 if e['version'] in ['v0','v1'] and e['room']=='living':prompt+=' Retain ALL upper and right-hand closed TV storage, no demolition. Gray stone is limited to the existing back panel under upper cabinetry.'
 if e['version'] in ['v2','v3'] and e['room'] in ['living','entry','island']:prompt+=' This version has rotating metal TV hardware. Retain exact orientation and slim mechanism, never replace it with a stone wall. The stone backing belongs only to a FIXED glass showcase.'
 if e['version'] in ['v0','v1'] and e['room'] in ['island','living','entry']:prompt+=' The high double-sided island GLASS cabinet must stay transparent and almost empty, except ONE DARK CERAMIC VASE where modeled. That dark silhouette is a VASE, NOT a figurine. Do not fill this island glass cabinet with toys, figurines, bottles, white vases or opaque backing. Separate WALL showcase figures stay in their exact compartments. The island sink is a ROUND hollow metal basin, not rectangular, not a filled white disc.'
 if e['room']=='study':prompt+=' Do not add figurines on desks. Keep the modeled number of toy figures in each showcase. Gray round sphere speakers beyond are AUDIO SPEAKERS, not toys. Neutral functional work light, restrained display light.'
 if e['room'] in ['bed','closet']:prompt+=' Every visible bedroom and wardrobe floor is gray-brown herringbone WOOD, no tile. Thin hanging wardrobe slabs represent individual hanging GARMENTS, not solid vertical partitions. Keep a quiet medium gray bedroom background, existing gray-taupe headboard and wood accents.'
 if e['room']=='storage':prompt+=' Adjustable shelf boards are smooth matte LIGHT GRAY METAL, no wood grain and no LED strips on shelves. Only the existing floor is wood; retain empty aisles.'
 if e['room']=='collection' and e['version']!='v0':prompt+=' Backside storage shelves contain boxes only, no figurines. Public-facing glass showcases retain exact modeled figure counts. Do not add a figurine to an empty shelf.'
 if e['room']=='kitchen':
  prompt=prompt.replace('The white outdoor units seen through glass with black circles are AIR CONDITIONER CONDENSERS with fan grilles, NOT washing machines. No round washer doors on these condensers. ','')
  prompt+=' Entire galley floor is GRAY TILE. Factory cabinets remain dark or stainless exactly as shown, no timber fronts. Only draw mechanical equipment if it is actually visible in the supplied source, no invented outdoor units or washers. Keep GAS burners where modeled, no substitution to induction.'
  if e['angle']=='B':prompt+=' CRITICAL: the GLASS COMPARTMENTS on the LEFT are the back of an INTERIOR COLLECTION DISPLAY CABINET, with figures/empty shelves as shown. They are NOT outdoor windows. Absolutely no air conditioners, exterior scenery, fans, washing machines or outdoor equipment in these glass compartments. Keep the source partitions and contents.'
 if e['room']=='entry' and e['angle']=='A':prompt+=' This view may be largely occluded by an existing wall. Preserve the exact occlusion; never invent a new view through it.'
 if e['room']=='bed' and e['angle']=='E':prompt+=' Retain the seated viewpoint toward the blank projection screen; it is not a window.'
 prior=P/'成品圖集/20260914暗色現代工業'/old[e['key']]['ai']
 # The already-reviewed photograph preserves small equipment and decoration; the
 # new model remains authoritative for the exact finish locations and geometry.
 prompt='Use case: precise-interior-material-edit. IMAGE 1 is the existing photorealistic photograph to EDIT. IMAGE 2 is the same camera with the NEW approved materials and authoritative geometry. Preserve image 1 camera, architectural proportions, furniture, equipment, all shelves/contents and photographic realism; change material finishes to match image 2. Matte near-black ceiling and beams (#242628), medium neutral gray walls (#858986), deep-gray door bands where shown, graphite opaque joinery where image 2 shows it, brushed gunmetal frames. Keep existing gray stone ONLY on the marked feature panel/counter, and desaturated gray-brown herringbone wood where already present. Keep gray tile in wet/utility rooms. Preserve all real figurines, the single dark ceramic vase in the high island glass cabinet, monitors, factory appliances and all fixed openings as image 1 and model 2 depict. White round speaker grilles are flat opaque NON-LUMINOUS discs. Do not change lighting locations or add decor, seating, lights, windows, equipment or stone. Do not brighten the black ceiling to white. Natural photographic soft shadows and restrained interior exposure; crisp realistic materials, NOT a CAD render. ONE landscape 1536x1024 image, no text. The photo is a previous finish version, so update every visible target surface according to model 2, including adjacent room ceilings seen through doors.\n'+note
 if e['version'] in ['v0','v1'] and e['room'] in ['entry','living','island']:prompt+=' The tall glass cabinet on the island is EMPTY except ONE DARK CERAMIC VASE; do not replace the vase by a toy. The island sink is ROUND and hollow. '+('Retain exactly two round stools on the OUTER ARC.' if e['version']=='v1' else 'V0 has NO island barstools: do not add any. Keep the two separate LOUNGE CHAIRS around the living coffee table.')
 if e['room']=='kitchen':
  prompt=prompt.replace('The white outdoor units seen through glass with black circles are AIR CONDITIONER CONDENSERS with fan grilles, NOT washing machines. No round washer doors on these condensers. ','')
  prompt+=' Factory GAS burners remain gas. Interior glass display cabinets are NOT outdoor windows; never add fans or outdoor units inside. Only show actual outdoor equipment visible in the reference model.'
 if e['room']=='storage':prompt+=' Light gray metal shelving stays metal and EMPTY as shown, no wood shelves or LED strips.'
 if e['room']=='collection' and e['version']=='v0':prompt+=' This is the original cat room: retain cat furniture, NO newly added showcases.'
 if e['room'] in ['bed','closet']:prompt+=' Bedroom/wardrobe floor is HERRINGBONE WOOD. Hanging garments stay garments, no partitions between them.'
 if e['room']=='entry' and e['angle']=='A':prompt+=' Preserve the close blank wall occlusion; do not reveal an invented room view.'
 if e['version'] in ['v0','v1'] and e['room']=='living':prompt+=' Preserve all upper and right TV cabinetry; never demolish storage.'
 if e['version'] in ['v2','v3'] and e['room'] in ['entry','living','island']:prompt+=' Preserve slim metal rotating TV mounting; no stone TV wall; fixed display backing only.'
 prompt=prompt.replace('all real figurines, the single dark ceramic vase in the high island glass cabinet, monitors','all existing real figurines and monitors')
 if e['room']=='entry':prompt+=' Repaint ALL tall entry cabinet vertical door/side panels from old brown timber to opaque MATTE GRAPHITE GRAY. Entry low cabinet vertical fronts also graphite; ONLY horizontal tops retain wood. No brown vertical entry cabinet panels remain.'
 if e['version'] in ['v0','v1'] and e['room'] in ['entry','living','island']:prompt+=' The curved island VERTICAL FRONT changes from brown wood to opaque MATTE GRAPHITE GRAY. Keep existing gray stone counter and all geometry.'
 if e['room']=='closet':prompt+=' Drawer unit tops are GRAY-BROWN WOOD, never stone or marble. Preserve their wood grain.'
 if e['room']=='study':prompt+=' Do NOT add vases, books or any new objects to showcase shelves. Existing empty compartments stay empty.'
 prompt+=' FINAL CHECK: every visible ceiling surface in EVERY visible room, including the living room viewed through study glazing, must be matte near-black. The entire home has NO skylights or roof openings. Any rectangular ceiling grille is an opaque dark ventilation grille, never blue sky or a glowing skylight. Preserve tiny functional devices and lower shelf finishes as modeled.'
 jobs.append({'key':key,'sourceKey':e['key'],'viewKey':e['key'],'room':e['room'],'version':e['version'],'angle':e['angle'],'modelHash':h,'modelPath':str((R/e['model']).resolve()),'priorAiPath':str(prior.resolve()),'prompt':prompt,'referenced_image_paths':[str(prior.resolve()),str((R/e['model']).resolve())],'mappedViews':[q['key'] for q in es],'outputPath':str((R/'ai'/f'{key}.png').resolve())})
assert all(j['prompt'] and 'undefined' not in j['prompt'] for j in jobs)
(R/'ai').mkdir(exist_ok=True)
(R/'jobs.json').write_text(json.dumps(jobs,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
font=ImageFont.truetype('C:/Windows/Fonts/msjh.ttc',20)
for start in range(0,len(jobs),6):
 canvas=Image.new('RGB',(1728,816),'#202226');d=ImageDraw.Draw(canvas)
 for i,j in enumerate(jobs[start:start+6]):
  x=i%3*576;y=i//3*408
  with Image.open(j['modelPath']) as im:canvas.paste(im.resize((576,384)),(x,y+24))
  d.text((x+5,y),j['key'],font=font,fill='white')
 canvas.save(R/f'sources-{start//6+1:02}.jpg',quality=95)
print(json.dumps({'slots':len(captures),'unique':len(jobs),'pages':math.ceil(len(jobs)/6)},ensure_ascii=False))
