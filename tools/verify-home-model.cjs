'use strict';
// Runs source geometry and interaction code offline. No browser, network or GPU.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),noop=()=>{};
const T={...require(path.join(root,'assets/three.min.js'))};
T.WebGLRenderer=class{constructor(){this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>1};this.domElement={};}setPixelRatio(){}setSize(){}render(){}setRenderTarget(){}getRenderTarget(){return null;}getDrawingBufferSize(v){return v.set(960,720);}};
T.PMREMGenerator=class{fromScene(){return {texture:new T.Texture()};}};
const ctx2d=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),measureText:()=>({width:100})},{get:(o,k)=>k in o?o[k]:noop});
const bounds=o=>{const b=new T.Box3().setFromObject(o);return {x:b.min.x+482.5,y:b.min.z+480,z:b.min.y,w:b.max.x-b.min.x,d:b.max.z-b.min.z,h:b.max.y-b.min.y};};
const overlap=(a,b,t=.04)=>a.x<b.x+b.w-t&&a.x+a.w>b.x+t&&a.y<b.y+b.d-t&&a.y+a.d>b.y+t&&a.z<b.z+b.h-t&&a.z+a.h>b.z+t;
const near=(a,b,msg,t=.03)=>assert(Math.abs(a-b)<t,`${msg}: ${a} vs ${b}`);
const modules=['walk.js','interaction.js','realism.js','flooring.js','curtains.js','rgb-lighting.js','comfort-controls.js','equipment-controls.js'];
const report={date:'2026-09-10',method:'Actual Three.js meshes and application handlers, with DOM/canvas/renderer stubs. Image decoding, GPU appearance and browser UI are not tested.',hashes:Object.fromEntries(['equipment-models.js','design.js','提案/旋轉電視與直線中島/design.js',...modules].map(f=>[f,crypto.createHash('sha256').update(read(f)).digest('hex')])),variants:{}};
(async()=>{
for(const n of [2,3]){const publicVersion=n===2?'v1':'v2';
 const nodes=new Map(),events=new Map(),raf=new Set(),images=[];let time=0,mode='model';
 function element(){const classes=new Set(),e={style:{},dataset:{},children:[],value:'',checked:false,hidden:false,width:1024,height:512,addEventListener:noop,dispatchEvent:noop,setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},getContext(){if(!this._ctx)this._ctx=new Proxy({putImageData:im=>this.__pixels=im},{get:(o,k)=>k in o?o[k]:ctx2d[k]});return this._ctx;},getBoundingClientRect:()=>({width:960,height:720,left:0,top:0}),appendChild(o){this.children.push(o);o.parentElement=this;return o;},insertBefore(o){return this.appendChild(o);},prepend(o){this.children.unshift(o);},append(...xs){xs.forEach(x=>this.appendChild(x));},after:noop,querySelector:()=>element(),querySelectorAll:()=>[],focus:noop,click(){this.onclick?.();},classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,v){if(v===undefined)v=!classes.has(k);v?classes.add(k):classes.delete(k);return v;}}};Object.defineProperty(e,'id',{get(){return this._id;},set(id){this._id=id;nodes.set(id,this);}});return e;}
 function get(id){if(!nodes.has(id)){const e=element();e.id=id;nodes.set(id,e);}return nodes.get(id);}
 const document={readyState:'complete',currentScript:{src:'https://example.invalid/equipment-controls.js'},body:element(),head:element(),getElementById:get,createElement:element,createElementNS:element,querySelector:()=>element(),querySelectorAll:()=>[],addEventListener:noop};get('view').parentElement=element();get('rgbRoom').value='living';get('curtainSelect').value='all';
 const c={THREE:T,document,console,URL,location:{hash:''},localStorage:{getItem:()=>null,setItem:noop},performance:{now:()=>time},setTimeout:noop,setInterval:noop,clearInterval:noop,devicePixelRatio:1,ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>raf.add(fn),CustomEvent:class{constructor(type){this.type=type;}},Image:class{set src(v){this.onerror?.();}},HOME_LAYOUT:{comfort:true,isV2:n%2===0,version:publicVersion,proposal:publicVersion,entryDoorY:955},addEventListener:(type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn);},dispatchEvent:e=>{for(const fn of events.get(e.type)||[])fn(e);}};
 const OriginalImage=c.Image;c.Image=class extends OriginalImage{constructor(){super();this.width=1024;this.height=512;images.push(this);}};
 c.window=c;c.Event=c.CustomEvent;vm.createContext(c);
 function run(f){vm.runInContext(read(f),c,{filename:f,timeout:60000});}
 for(const f of ['model-data.js','equipment-models.js',n<3?'design.js':'提案/旋轉電視與直線中島/design.js'])run(f);
 const V=c.HOME_VIEWER,E=c.HOME_EQUIPMENT;
 c.HOME_TOUR={getMode:()=>mode,setMode:m=>mode=m};
 for(const f of modules)run(f);await Promise.resolve();await Promise.resolve();
 const beforeTexture=[];V.fittings.traverse(o=>{if(o.userData.finishGroup==='entry-graphite')beforeTexture.push([o,o.material]);});
 // Exercise successful image callbacks after the fallback path. Pixels are stubs;
 // this verifies late material assignment, not decoding / GPU appearance.
 for(const img of images)img.onload?.();await Promise.resolve();await Promise.resolve();
 for(const [o,m] of beforeTexture)assert.strictEqual(o.material,m,'late texture callback changed an explicit entry finish');
 if(process.env.HOME_VISUAL_ONLY){c.HOME_COMFORT?.setScene('daily');require('./render-home-review.cjs')({T,V,version:publicVersion,out:path.join(root,'調整紀錄/20260910全屋外觀檢視')});continue;}
 function tick(count=100){for(let i=0;i<count;i++){time+=50;for(const fn of [...raf])fn(time);}V.scene.updateMatrixWorld(true);}
 // Restore full-height walls for physical checks: overview cutaways are presentation only.
 for(const p of V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;p.m.visible=true;}
 V.ceiling.visible=true;V.beams.visible=true;V.scene.updateMatrixWorld(true);
 const named=[];V.scene.traverse(o=>{if(o.name||o.userData.name)named.push(o);});
 const find=name=>named.find(o=>o.name===name||o.userData.name===name);
 // Foyer faces and wood cutout must meet without overlap, holes or raised thresholds.
 const floorState=c.HOME_FLOORING.getState(),entryFloor=find('玄關混色六角磚地坪'),woodFloor=find('室內暖棕人字拼木地板');
 const floorMeshes=[woodFloor,...entryFloor.children];let floorRays=0;
 assert.equal(floorState.entry.palette.length,4);assert(floorState.entry.palette.every(p=>p.tiles>0));
 for(const [x,y,finish] of [[610,870,'mixed-hexagon'],[720,870,'herringbone'],[548,850,'herringbone'],[550,930,'mixed-hexagon'],[440,850,'herringbone'],[100,700,'stone']])assert.equal(c.HOME_FLOORING.finishAt(x,y),finish);
 for(let x=538;x<=735;x+=3.1)for(let y=804;y<=952;y+=3.7){
  const ray=new T.Raycaster(V.pos(x,y,4),new T.Vector3(0,-1,0)),hits=ray.intersectObjects(floorMeshes,false);assert(hits.length,'finish hole at '+x+','+y);
  const isHex=c.HOME_FLOORING.finishAt(x,y)==='mixed-hexagon';assert.equal(hits.some(h=>h.object===woodFloor),!isHex,'wood must not remain under hex tiles');
  assert(hits[0].point.y>=.159&&hits[0].point.y<=.201,'no raised tile edge');floorRays++;
 }
 for(const mesh of entryFloor.children){near(bounds(mesh).z,mesh.name.includes('填縫')?.16:.2,'finish/grout elevation',.001);if(mesh.userData.entryTile)for(const [x,y] of mesh.userData.entryTile.points)assert(x>=545.19&&x<=714.61&&y>=802.99&&y<=955.01,'tile outside foyer');}
 assert.equal(entryFloor.children.filter(o=>o.userData.floorTransition).length,2);
 const veneer=find('冰箱旁圓弧頂天櫃').material,veneerStats=c.HOME_REALISM.getState().cabinetVeneer;
 assert.equal(veneer.userData.finishId,'cabinet-dark-straight-veneer');assert(veneerStats.surfaces>=12);near(veneer.roughness,.8,'matte cabinet finish');
 assert.equal(veneer.map.image.width,512);assert.equal(veneer.map.image.height,1024);assert.equal(veneer.metalness,0);
 assert.notStrictEqual(veneer,woodFloor.material,'floor and cabinet timber must stay independent');
 const pixelData=veneer.map.image.__pixels.data;let horizontal=0,vertical=0;
 for(let y=1;y<1024;y+=7)for(let x=1;x<512;x+=3){const i=(y*512+x)*4;horizontal+=Math.abs(pixelData[i]-pixelData[i-4]);vertical+=Math.abs(pixelData[i]-pixelData[i-512*4]);}
 assert(horizontal>vertical*1.25,'grain varies across the panel more than up its height');
 if(n===2){const out=path.join(root,'調整紀錄/20260910玄關與木皮');fs.mkdirSync(out,{recursive:true});const rgb=new Uint8Array(512*1024*3);for(let i=0;i<512*1024;i++){const tint=new T.Color(pixelData[i*4]/255,pixelData[i*4]/255,pixelData[i*4]/255).convertSRGBToLinear().multiply(veneer.color).convertLinearToSRGB();rgb[i*3]=Math.round(tint.r*255);rgb[i*3+1]=Math.round(tint.g*255);rgb[i*3+2]=Math.round(tint.b*255);}require('./render-home-review.cjs').png(path.join(out,'深灰棕直紋木皮.png'),512,1024,rgb);}
 
 const veneerMeshes=named.filter(o=>o.userData.finishGroup==='cabinet-dark-straight-veneer');
 for(const o of veneerMeshes){assert.strictEqual(o.material,veneer,'all wood cabinet faces share finish');assert(o.geometry.attributes.uv.array.every(Number.isFinite),'valid wood grain UV');}
 const door=find('廚房電動玻璃滑門'),leaf=door.children[0],closed=bounds(leaf),I=c.HOME_INTERACTION;
 assert(door&&door.children.length===1,'Exactly one kitchen sliding leaf');
 near(closed.x,203.5,'door kitchen-side plane');near(closed.y,623,'closed overlap north');near(closed.d,124,'leaf including overlaps');
 const blockers=[];V.fittings.traverse(o=>{if(o.isMesh&&!o.userData.allowance)blockers.push(o);});
 V.architecture.traverse(o=>{if(o.isMesh&&!o.userData.dynamicDoor&&!o.userData.kitchenDoorFixed)blockers.push(o);});
 const original=leaf.position.z;let minGap=Infinity;
 for(let step=0;step<=122;step++){
  leaf.position.z=original-step;V.scene.updateMatrixWorld(true);const b=bounds(leaf);
  for(const m of blockers){const other=bounds(m);assert(!overlap(b,other),`V${n} kitchen door hits ${m.userData.name||m.parent.name||'wall'} at ${step}cm`);if(other.y<b.y+b.d&&other.y+other.d>b.y&&other.x+other.w<b.x)minGap=Math.min(minGap,b.x-other.x-other.w);}
 }
 leaf.position.z=original;V.scene.updateMatrixWorld(true);
 assert(I.blocksPoint(205-482.5,680-480,18),'closed door blocks walking');
 get('kitchenDoorToggle').onclick();tick(70);const opened=bounds(leaf);near(opened.y,501,'fully parked north');near(opened.y+opened.d,625,'120cm opening completely uncovered');assert(!I.blocksPoint(205-482.5,680-480,18),'open door allows crossing');
 c.HOME_WALK.enter();for(const x of [180,190,205,220,235,250])assert(c.HOME_WALK.canStand(x-482.5,680-480),'actual walk collision permits open threshold at '+x);c.HOME_WALK.exit();
 // Runtime simulation of a closing door meeting the walker; must reopen.
 mode='walk';V.camera.position.copy(V.pos(205,680,165));I.setDoor('kitchen',false);tick(100);assert.equal(I.getState().entries.find(e=>e.key==='kitchen').target,1,'electric door reopens at an obstruction');mode='model';V.camera.position.copy(V.pos(400,680,165));I.setDoor('kitchen',false);tick(70);near(bounds(leaf).y,623,'door closes in orbit mode');
 const faces=named.filter(o=>o.userData.entryAlignedFace);assert.equal(faces.length,2);faces.forEach(o=>near(bounds(o).y,753,'entry finished face matches display'));
 for(const name of ['收藏室連續展示面','玄關延伸玻璃展示櫃'])near(bounds(find(name)).y,753,'display retained kitchen wall alignment');
 const daily=find('玄關日常收納');assert.equal(daily.userData.alignment.externalDepth,50);
 assert(beforeTexture.length>10,'entry sides and tops included in finish group');
 for(const o of faces){assert.equal(o.material.userData.finishId,'entry-graphite','no wood / unrelated finish on entry');assert.equal(o.material.map,null,'entry finish is not textured oak');near(o.material.roughness,.55,'entry satin finish');}
 assert.strictEqual(faces[0].material,faces[1].material,'adjoining facade material identity');
 near(bounds(faces[1]).x-(bounds(faces[0]).x+bounds(faces[0]).w),.2,'2mm controlled panel joint');
 let facadeRays=0;for(const x of [560,600,620,665,700])for(const z of [20,70]){const ray=new T.Raycaster(V.pos(x,700,z),new T.Vector3(0,0,1)),hit=ray.intersectObjects(V.fittings.children,true).find(h=>h.object.visible);assert.equal(hit?.object.material.userData.finishId,'entry-graphite','visible front face finish at '+x);facadeRays++;}
 const glassCarcasses=named.filter(o=>o.userData.openCarcass);assert.equal(glassCarcasses.length,2);
 for(const g of glassCarcasses){const b=bounds(g),ray=new T.Raycaster(V.pos(179,b.y+b.d/2,220),new T.Vector3(1,0,0)),hit=ray.intersectObjects(g.children,true).find(h=>!h.object.material.transparent);near(hit.point.x+482.5,208.2,'hollow upper cabinet back plane');}
 const allMeshes=[];V.scene.traverse(o=>{if(o.isMesh)allMeshes.push(o);});let vertices=0;
 const F=E.refinements;assert(F?.fridgeAir&&F?.collection&&F?.closetMirror,'four-room refinements built');
 const fridgeGroup=find('ICNh5123 淨洞與貫通散熱示意'),air=E.allowances.filter(o=>o.userData.airPath);
 assert.equal(air.length,3,'three connected air volumes');
 for(const space of air){const b=bounds(space);for(const w of V.wallParts)assert(!overlap(b,bounds(w.m)),'air path enters wall');for(const m of E.covers)assert(!overlap(b,bounds(m)),'air path blocked by cabinet panel');}
 const shaft=air.find(o=>o.name==='ICNh5123 後方通風道'),sb=bounds(shaft);near(sb.x,205,'chimney starts outside the wall');near(sb.w,5,'50mm clear rear chimney');near(sb.w*sb.d,282,'shaft net cross-section');
 const grilles=fridgeGroup.children.filter(o=>o.userData.ventilation);assert.equal(grilles.length,2);for(const q of grilles){near(q.userData.ventilation.netArea,292.56,'actual grille free area');assert(q.userData.ventilation.netArea>=200);}
 const solids=allMeshes.filter(o=>!o.material.transparent&&!o.material.isShaderMaterial&&!o.userData.allowance);
 function clearRay(a,b,message){const start=V.pos(...a),end=V.pos(...b),delta=end.clone().sub(start),ray=new T.Raycaster(start,delta.clone().normalize(),.01,delta.length()-.01);const hit=ray.intersectObjects(solids,false)[0];assert(!hit,`${message}: ${hit?.object.userData.name||hit?.object.name||hit?.object.parent.name}`);}
 for(const y of [766,780,795]){clearRay([147,y,5.2],[208,y,5.2],'inlet to chimney');clearRay([208,y,5.2],[208,y,228.2],'continuous rear chimney');clearRay([208,y,228.2],[147,y,228.2],'top outlet reaches room');}
 const niche=E.bays.find(b=>b.name.startsWith('ICNh5123'));near(niche.w,55,'niche depth preserved');near(niche.d,56.4,'niche width preserved');near(niche.h,178.8,'niche height preserved');
 const bCounter=find('B區141.85cm檯面'),aCounter=find('A區308.7cm石材檯面');near(bounds(bCounter).x-bounds(aCounter).x-bounds(aCounter).w,83.5,'actual countertop-to-countertop aisle');
 const innerSkins=named.filter(o=>o.userData.name==='收藏室內側連續淺灰櫃背');assert.equal(innerSkins.length,2);for(const o of innerSkins){near(bounds(o).y+bounds(o).d,793,'finish remains within 40cm display');assert.equal(o.material.userData.finishId,'collection-inner');}
 const mirror=find('更衣室側移滑鏡'),mirrorLeaf=mirror.children[0],mirrorClosed=bounds(mirrorLeaf),mirrorBlockers=[];
 V.fittings.traverse(o=>{if(o.isMesh&&!o.userData.allowance)mirrorBlockers.push(o);});
 const mirrorStart=mirrorLeaf.position.x;
 for(let dx=0;dx<=50;dx++){mirrorLeaf.position.x=mirrorStart+dx;V.scene.updateMatrixWorld(true);for(const o of mirrorBlockers)assert(!overlap(bounds(mirrorLeaf),bounds(o)),'sliding mirror intersects wardrobe');}
 mirrorLeaf.position.x=mirrorStart;V.scene.updateMatrixWorld(true);get('closetMirrorToggle').onclick();tick(70);near(bounds(mirrorLeaf).x-mirrorClosed.x,50,'mirror button slides right 50cm');assert.equal(get('closetMirrorToggle')['aria-pressed'],'true');I.setDoor('closet-mirror',false);tick(70);near(bounds(mirrorLeaf).x,mirrorClosed.x,'mirror closes on track');
 if(n>=3){
  const bands=named.filter(o=>o.userData.ventilation&&o.name.startsWith('背殼'));assert.equal(bands.length,2);assert(bands[0].userData.ventilation.netArea>372);assert(bands[1].userData.ventilation.netArea>864);
  const tv=E.items.find(g=>g.userData.equipment.key==='tv');
  const opaque=allMeshes.filter(o=>!o.material.transparent&&!o.material.isShaderMaterial&&!o.userData.allowance);
  for(const yy of [558,560,562])for(const z of [88,100,112]){
   const hit=new T.Raycaster(V.pos(690,yy,z),new T.Vector3(-1,0,0)).intersectObjects(opaque,false)[0];
   assert(hit,'TV face ray has surface');let inTV=false;for(let o=hit.object;o;o=o.parent)if(o===tv)inTV=true;
   assert(inTV,'support intrudes in front of lower TV screen');
  }
  const cushion=named.find(o=>o.userData.name==='貴妃椅坐墊・承接抱枕');assert(cushion);const cb=bounds(cushion);near(cb.z,38,'chaise cushion rests on base');near(cb.z+cb.h,48,'chaise top height');
  const pillows=named.filter(o=>o.userData.name==='沙發亞麻抱枕').map(bounds);assert(pillows.some(p=>p.x>830&&p.x<900&&p.z<=cb.z+cb.h+.1&&p.y<cb.y+cb.d&&p.y+p.d>cb.y),'chaise pillow has a supporting cushion');
 }
 const studyHeads=allMeshes.filter(o=>o.geometry.type==='SphereGeometry').map(bounds).filter(b=>b.x>754&&b.x+b.w<792&&b.y>=180&&b.y+b.d<=365);assert(studyHeads.length>=9);assert(studyHeads.every(b=>b.z+b.h<185),'display figures extend into upper bookcase');
 const zones={bed:[-90,0,405,282],closet:[405,0,745,260],study:[755,0,1100,375],kitchen:[0,490,220,955],bath1:[-210,280,315,495],bath2:[405,207,580,375],storage:[580,260,745,375],collection:[210,753,548,955],back:[-210,490,0,955]};
 const sharedZones={};for(const [room,[x1,y1,x2,y2]] of Object.entries(zones)){const parts=[];for(const o of allMeshes){if(o.material.isShaderMaterial||o.userData.allowance)continue;const b=bounds(o),x=b.x+b.w/2,y=b.y+b.d/2;if(x>=x1&&x<x2&&y>=y1&&y<y2&&b.w<400&&b.d<400){const m=o.material,geometry=crypto.createHash('sha256').update(Buffer.from(o.geometry.attributes.position.array.buffer)).digest('hex');parts.push(JSON.stringify({b,geometry,color:m.color?.getHex(),opacity:m.opacity,roughness:m.roughness}));}}parts.sort();sharedZones[room]={meshes:parts.length,sha256:crypto.createHash('sha256').update(parts.join('\n')).digest('hex')};}
 const wallJunctions=[];for(const g of named.filter(o=>o.userData.cabinet||o.userData.openCarcass)){const b=bounds(g);for(const p of V.wallParts){const w=bounds(p.m);if(!p.m.material.transparent&&overlap(b,w,.5)){const intrusion=[Math.min(b.x+b.w,w.x+w.w)-Math.max(b.x,w.x),Math.min(b.y+b.d,w.y+w.d)-Math.max(b.y,w.y)].filter(v=>v>0);wallJunctions.push({cabinet:g.name||g.userData.name,bounds:b,wall:w,intrusion:Math.min(...intrusion),status:'candidate; wall attachment and source-coordinate alignment require interpretation'});}}}
 for(const o of allMeshes){assert(o.geometry&&o.material,'mesh has geometry/material');const a=o.geometry.attributes.position;assert(a&&a.count>0,'mesh has vertices');vertices+=a.count;for(const v of a.array)assert(Number.isFinite(v),`invalid vertex ${o.name}`);assert(o.matrixWorld.elements.every(Number.isFinite),'finite world transform');}
 // Actual outside shell must obscure device backs at human-device height.
 const exterior=allMeshes.filter(o=>o.userData.islandExterior);assert(exterior.length>0,'island exterior present');
 let skinRays=0;for(const key of ['wine','robot','clar']){const g=E.items.find(g=>g.userData.equipment.key===key),b=bounds(g);const at=V.pos(b.x+b.w/2,b.y+b.d/2,b.z+b.h/2),origin=at.clone().add(new T.Vector3(500,0,0)),ray=new T.Raycaster(origin,at.clone().sub(origin).normalize());assert(ray.intersectObjects(exterior,true).some(h=>h.distance<500),'east shell hides '+key+' back');skinRays++;}
 // Verify actual supporting geometry now reaches the floor or shelf.
 const supports={};for(const name of ['床架內縮落地底座','書桌落地調平腳墊','飲水機防潮落地台','影音櫃落地支腳','廚房C櫃內縮落地底座','內嵌冰箱櫃落地底座']){const objs=named.filter(o=>o.name===name||o.userData.name===name);assert(objs.length,'support '+name);objs.forEach(o=>near(bounds(o).z,0,name+' reaches floor',.1));supports[name]=objs.length;}
 const beamBoxes=V.beams.children.filter(o=>o.isMesh).map(bounds),hvac=V.ceiling.userData.hvac;
 assert.equal(hvac.length,6,'both AC rooms have supply, return and access');
 for(const q of hvac){const b={...q,h:2};for(const beam of beamBoxes)assert(!overlap(b,beam),'HVAC intersects beam '+q.room+q.type);}
 const strips=allMeshes.filter(o=>o.name.includes('RGB 燈條'));for(const o of strips)for(const b of beamBoxes)assert(!overlap(bounds(o),b),'RGB strip inside beam');
 const curtainRails=allMeshes.filter(o=>o.userData.curtainRail);assert.equal(curtainRails.length,6);for(const o of curtainRails)for(const b of beamBoxes)assert(!overlap(bounds(o),b),'curtain rail intersects beam: '+o.name);
 for(const room of ['living','study']){c.HOME_RGB.update(room,{on:false});assert(c.HOME_RGB.fixtures[room].lights.every(e=>e.light.intensity===0),'RGB off');for(const mode of ['static','breathe','rainbow','wave','chase']){c.HOME_RGB.update(room,{on:true,mode});tick(3);assert.equal(c.HOME_RGB.getState()[room].mode,mode);}}
 c.HOME_CURTAINS.set(1,'all');tick(35);assert(c.HOME_CURTAINS.getState().every(e=>e.closed>.999),'all 6 curtains close');c.HOME_CURTAINS.set(0,'all');tick(35);assert(c.HOME_CURTAINS.getState().every(e=>e.closed<.001),'all 6 curtains open');
 const rooms=[];for(const r of V.rooms){V.selectRoom(r.id);V.scene.updateMatrixWorld(true);assert(V.camera.position.toArray().every(Number.isFinite),'valid room camera');rooms.push({id:r.id,name:r.n,position:V.camera.position.toArray()});}
 report.variants[publicVersion]={meshes:allMeshes.length,vertices,rooms,refinements:{...F,checks:{airPathRays:9,airVolumesOutsideWalls:true,grilleFreeArea:true,mirrorSweepStepCm:1,mirrorButton:true,displayEnvelopePreserved:true}},door:{closed,opened,travelCm:122,clearOpeningCm:120,minParkingGapCm:minGap,sweepStepCm:1,modelModeToggle:true,walkingBlocksClosed:true,walkingClearOpen:true,obstructionReopens:true},entryFaces:faces.map(o=>({name:o.userData.name,...bounds(o)})),entryFinish:{facadeRays,panels:beforeTexture.length,jointCm:.2,lateTextureCallbacksStable:true},sharedZones,wallJunctions,islandBackOcclusionRays:skinRays,supports,hvac,curtains:c.HOME_CURTAINS.getState(),rgbModes:5,finish:c.HOME_REALISM.getState()};
 report.variants[publicVersion].finishRevision={entry:floorState.entry,floorRays,cabinetVeneer:veneerStats};
 console.log(`${publicVersion.toUpperCase()}: ${allMeshes.length} meshes, ${rooms.length} room views, door sweep/controls, entry, island, supports, HVAC, RGB and curtains passed.`);
}
if(!process.env.HOME_VISUAL_ONLY){
 assert.equal(JSON.stringify(report.variants.v1.finishRevision),JSON.stringify(report.variants.v2.finishRevision),'shared foyer and dark cabinet finish');
 for(const [a,b] of [['v1','v2']])assert.deepStrictEqual(report.variants[a].sharedZones,report.variants[b].sharedZones,`${a}/${b} nine common rooms geometry and finish`);
 report.sharedRoomComparison='Nine common room mesh / geometry / material fingerprints match both retained versions. Entry and the living/island layout are reviewed separately.';
 report.resolvedIssues=[{id:'K-01',status:'resolved in design geometry',description:'55cm niche at x150–205; 5cm rear air shaft x205–210 outside wall; lower inlet and forward upper outlet modeled and ray-tested.'}];
 report.openIssues=[{id:'INSTALLATION',status:'manufacturer/shop-drawing confirmation',description:'Local 110V appliance instructions, grille fabrication, structural rotating hardware and mirror fittings still require final supplier drawings; geometry is not installation approval.'}];
 fs.writeFileSync(path.join(root,'調整紀錄/20260910設備整合/全屋模型驗證.json'),JSON.stringify(report,null,2));
}
})().catch(e=>{console.error(e);process.exitCode=1;});
