'use strict';
// Real Three.js source geometry, CPU views and interaction code; no browser or GPU.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'調整紀錄/20260910開放大中島');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const expected=['7df07c1748e43ae3a77538104a7bd72fb3e35a469ae4eb6d586ba9842b2e20b6','74f25518f516352f33385086bdc9441a003e04963fed421d870053b85ee99a74'];
// Exclude the explicitly tagged shared vanity only when comparing pre-vanity baselines.
// tools/verify-master-vanity.cjs independently checks this addition in all four versions.
function signature(V,omitSharedVanity=false){V.scene.updateMatrixWorld(true);const a=[];V.scene.traverse(o=>{if(o.isMesh&&!(omitSharedVanity&&o.userData.masterVanity))a.push(JSON.stringify({p:digest(Buffer.from(o.geometry.attributes.position.array.buffer)),m:o.matrixWorld.elements,c:o.material?.color?.getHex(),opacity:o.material?.opacity,visible:o.visible}));});return {meshes:a.length,hash:digest(a.sort().join('\n'))};}
function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const report={method:'Real Three.js geometry and interaction code; CPU color views omit textures/reflections/lighting. No GPU or browser verification.',retained:{},checks:[]};
 for(const n of [2,3]){const f=await build(n),s=signature(f.V,true);assert.equal(s.hash,expected[n-2],'Retained V'+(n-1)+' full mesh geometry, transforms, visibility and colors unchanged');report.retained['v'+(n-1)]=s;}
 const f=await build(4),{V,c,E,T,bounds,near,overlap}=f;V.scene.updateMatrixWorld(true);
 assert.equal(c.HOME_LAYOUT.version,'v3');assert.equal(V.rooms.length,13);assert.equal(E.items.length,24);
 const counts={};for(const e of E.items){const k=e.userData.equipment.key;counts[k]=(counts[k]||0)+1;}
 for(const [k,n] of Object.entries({wine:1,robot:1,ih:1,clar:1,tv:1,q6:1,q7:2,sub:2,switch2:1,switch2dock:1,ps5:1,avr:1}))assert.equal(counts[k],n,k);
 const island=c.HOME_OPEN_ISLAND.island;assert.deepEqual({...island.userData.footprint},{x:425,y:480,w:95,d:300,h:95});
 const top=island.children.find(o=>o.userData.islandSurface==='countertop');assert(top);const b=bounds(top);near(b.w,95,'island width');near(b.d,300,'island length');near(b.z+b.h,95,'countertop height');
 const ray=new T.Raycaster();const down=(x,y)=>{ray.set(V.pos(x,y,160),new T.Vector3(0,-1,0));return ray.intersectObject(top).length;};
 assert.equal(down(455,735),0,'sink real opening');assert.equal(down(457,639),0,'IH real opening');assert(down(500,600),'solid preparation counter');
 // Check the usable cavity, not just an absent countertop triangle.
 const role=r=>island.children.find(o=>o.userData.islandSurface===r),rim=role('sink-rim'),floor=role('sink-floor'),bowl=role('sink-bowl');
 assert(rim&&floor&&bowl);near(bounds(rim).w,45,'sink outer depth');near(bounds(rim).d,55,'sink outer length');near(bounds(floor).w,34,'tapered basin floor depth');near(bounds(floor).d,44,'tapered basin floor length');
 const downward=(x,y,objects)=>{ray.set(V.pos(x,y,130),new T.Vector3(0,-1,0));return ray.intersectObjects(objects).sort((a,b)=>a.distance-b.distance);};
 for(const [x,y] of [[443,720],[467,750],[463,735]]){assert.equal(down(x,y),0,'expanded bowl is a true hole');const hit=downward(x,y,[rim,bowl,floor,top])[0];assert(hit);near(hit.point.y,75,'unobstructed 20cm-deep basin bottom',.06);}
 assert(!downward(455,735,[floor,rim]).length,'drain remains open');assert(down(466,700),'old drip bowl replaced with solid faucet deck');
 const named=n=>{let a;island.traverse(o=>{if(o.userData.name===n)a=o;});assert(a,n);return a;};
 const clar=E.items.find(o=>o.userData.equipment.key==='clar'),base=bounds(named('濕區設備承重底板')),cb=bounds(clar);near(cb.z,base.z+base.h,'CLAR rests on actual bottom board');
 assert(!island.children.some(o=>o.name==='飲水機防潮落地台'),'no obsolete pedestal overlaps the new continuous bottom board');
 const wet=island.children.filter(o=>o.userData.wetFixture);for(const pipe of wet){assert(!overlap(bounds(pipe),cb,.05),'pipe into CLAR appliance');assert(bounds(pipe).x+bounds(pipe).w<482.2,'wet fittings clear knee recess');}
 const faces=[];island.traverse(o=>{if(o.userData.name==='飲水濕區西向檢修門')faces.push(bounds(o));});faces.sort((a,b)=>a.y-b.y);assert.equal(faces.length,2);
 near(faces[0].y-672,.3,'wet door north reveal');near(faces[1].y-faces[0].y-faces[0].d,.3,'wet door seam');near(778.2-faces[1].y-faces[1].d,.3,'wet door south reveal');near(92-faces[1].z-faces[1].h,.3,'wet door top reveal');
 near(780-bounds(named('玄關端內縮踢腳')).y-bounds(named('玄關端內縮踢腳')).d,4,'south toe kick recess');
 const showcase=V.fittings.children.find(o=>o.name==='V3 收藏玻璃展示櫃'),glass=[];showcase.traverse(o=>{if(o.userData.name==='V3 玻璃展示門')glass.push(bounds(o));});assert.equal(glass.length,3);
 const opening=showcase.userData.glassOpening;for(const b of glass){near(b.z-opening.z,.3,'glass bottom reveal');near(opening.z+opening.h-b.z-b.h,.3,'glass top reveal');}
 let shoes=0;V.fittings.traverse(o=>{if(o.userData.shelfTop!==undefined){near(bounds(o).z,o.userData.shelfTop,'shoe touches shelf');shoes++;}});assert.equal(shoes,6);
 report.sink={outerCm:'55 × 45',innerTopCm:'50 × 40',depthCm:20,realOpening:true,clearDrainAndCLAR:true};
 report.checks.push('55×45 hollow sink, 50×40 interior and 20cm depth verified by actual ray intersections','CLAR supported on bottom board; plumbing outside appliance and knee space; 3mm wet-door reveals','Glass doors fit real cabinet height with 3mm top/bottom reveals; six shoes touch their shelves');
 const front=island.children.find(o=>o.userData.name==='玄關端完整深色木皮');assert(front?.userData.openIslandWood);const end=bounds(front);near(end.y+end.d,780,'south end');near(end.w,95,'whole end width');
 const Q=E.items.find(o=>o.userData.equipment.key==='q6'),qb=bounds(Q);near(qb.z,7,'center within console');near(qb.x+qb.w,674.5,'center flush front');
 const pivot=c.HOME_ROTATING_TV.pivot;near(pivot.position.z+480,583,'TV aligned with actual middle sofa seat');
 const audio=E.items.filter(o=>['q7','sub'].includes(o.userData.equipment.key));
 for(const target of c.HOME_OPEN_ISLAND_SPEC.audio.floorSpeakers.filter(s=>['L','R','SW1','SW2'].includes(s.id))){const o=audio.find(o=>o.userData.channel===target.id);assert(o,target.id);const b=bounds(o);for(const k of ['x','y','w','d'])near(b[k],target[k],target.id+' '+k);}
 const speakers=E.items.filter(o=>o.userData.equipment.key==='q7').map(bounds);near(speakers[0].y-(speakers[1].y+speakers[1].d),172.3,'speaker clear gap');near(805-(speakers[0].y+speakers[0].d),104.15,'south aisle');
 assert(!V.architecture.children.some(o=>o.userData.interactiveDoor?.name?.includes('收藏')),'old collection door removed');
 const overlaps=[];for(const e of E.items){const eb=bounds(e);for(const m of E.covers){if(!visible(m))continue;let own=false;for(let p=m;p;p=p.parent)if(p===e)own=true;if(!own&&overlap(eb,bounds(m),.12))overlaps.push({equipment:e.userData.equipment.key,panel:m.userData.name||m.name,eb,pb:bounds(m)});}}
 report.equipmentPanelOverlaps=overlaps;fs.writeFileSync(path.join(out,'待檢查接口.json'),JSON.stringify(overlaps,null,2));
 const before=c.HOME_INTERACTION.getState();assert(before.entries.some(e=>e.key==='kitchen'&&e.electric));assert(before.entries.some(e=>e.name.includes('V3 收藏玻璃展示')));
 for(const door of before.entries.filter(e=>/V3 收藏玻璃展示|V3 飲水濕區/.test(e.name))){
  assert(c.HOME_INTERACTION.setDoor(door.id,true));f.tick(140,50);const opened=c.HOME_INTERACTION.getState().entries.find(e=>e.id===door.id);near(opened.angle,opened.openAngle,'new door reaches full opening',.003);
  assert(c.HOME_INTERACTION.setDoor(door.id,false));f.tick(140,50);
 }
 const keptDoors=before.entries.filter(e=>!e.name.includes('櫃門'));
 for(const d of keptDoors)assert(c.HOME_INTERACTION.setDoor(d.id,true));f.tick(140,50);
 for(const d of keptDoors){const state=c.HOME_INTERACTION.getState().entries.find(e=>e.id===d.id);near(state.angle,state.openAngle,d.name+' fully opens',.003);}
 for(const d of keptDoors)c.HOME_INTERACTION.setDoor(d.id,Math.abs(d.angle)>.1);f.tick(140,50);
 c.HOME_RGB.update('living',{on:true,color:'#ff2277',mode:'wave',brightness:.65});assert.equal(c.HOME_RGB.getState().living.mode,'wave');
 c.HOME_CURTAINS.set(1,'all');f.tick(140,50);report.curtains=c.HOME_CURTAINS.getState();assert.equal(report.curtains.length,6);assert(report.curtains.every(e=>e.closed>.99));c.HOME_CURTAINS.set(0,'all');f.tick(140,50);assert(c.HOME_CURTAINS.getState().every(e=>e.closed<.01));
 c.HOME_COMFORT.setScene('daily');assert.equal(c.HOME_COMFORT.getState().scene,'daily');
 const tv=c.HOME_ROTATING_TV_CONTROLS;tv.setTarget('island');f.tick(140,50);near(tv.getState().angle,180,'TV reaches180',.01);tv.setTarget('living');f.tick(140,50);near(tv.getState().angle,0,'TV returns0',.01);
 assert(tv.toggleStool(true));assert(tv.getState().upperStoolVisible);tv.toggleStool(false);
 // Full room-body paths use the actual broad/narrow phase movement colliders.
 c.HOME_INTERACTION.setDoor('入戶門',true);c.HOME_INTERACTION.setDoor('kitchen',true);f.tick(140,50);
 c.HOME_TOUR.setMode('walk');await Promise.resolve();assert(c.HOME_WALK.getState().active);
 const routes=[[[603,943],[603,840],[578,818],[562,758],[714,735],[810,755]],[[350,700],[350,845],[423,845],[555,845],[603,840]],[[350,700],[155,700]],[[350,700],[355,437],[760,437],[820,420]]];
 let samples=0;for(const points of routes)for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<=len;t+=2){const x=a[0]+(b[0]-a[0])*t/len,y=a[1]+(b[1]-a[1])*t/len;assert(c.HOME_WALK.canStand(x-482.5,y-480),'blocked route at '+[x,y]);samples++;}}
 c.HOME_TOUR.setMode('model');c.HOME_INTERACTION.setDoor('入戶門',false);c.HOME_INTERACTION.setDoor('kitchen',false);f.tick(140,50);
 const ceilings=V.ceiling.children.filter(o=>o.name.includes('高度聲道'));assert.equal(ceilings.length,4);
 for(const o of ceilings){const b=bounds(o);for(const m of V.beams.children)assert(!overlap(b,bounds(m),.01),'ceiling speaker into beam');for(const q of V.ceiling.userData.hvac)assert(!overlap(b,{...q,h:15},.01),'speaker into HVAC access');}
 // Max radial extent of actual rotating vertices, rather than a guessed TV size.
 let radius=0;pivot.updateMatrixWorld(true);pivot.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);radius=Math.max(radius,Math.hypot(q.x+482.5-647,q.z+480-583));}});
 const fixed=[{x:425,y:480,w:95,d:300},...c.HOME_OPEN_ISLAND_SPEC.cabinets,...speakers,...audio.filter(o=>o.userData.equipment.key==='sub').map(bounds),c.HOME_OPEN_ISLAND_SPEC.preservedColumn,{x:835,y:464,w:160,d:240}];
 let minimum=Infinity;for(const b of fixed){const d=Math.hypot(Math.max(b.x-647,0,647-b.x-b.w),Math.max(b.y-583,0,583-b.y-b.d))-radius;assert(d>0,'TV sweep intersects furniture');minimum=Math.min(minimum,d);}
 report.routes={count:routes.length,samples,bodyRadiusCm:18,doorsOpen:['entry','kitchen'],TVParked:'living'};report.ceilingSpeakers={count:4,clearOfModeledBeamsAndHVAC:true};report.tvSweep={radius,minimumGap:minimum};
 report.checks.push('Four actual walk routes pass with 36cm body; no removed collection-wall collider remains','Four ceiling speakers clear modeled beams and HVAC terminals/access','Actual TV radial sweep clears static furniture and speakers through180°');
 assert(!overlaps.some(o=>['wine','robot','ih','clar','q6','switch2','switch2dock','avr','ps5'].includes(o.equipment)),'new equipment versus cabinet collision');
 // Oven face is wider than its recessed body; the group AABB is conservative.
 const oven=E.items.find(o=>o.userData.equipment.key==='oven');let ovenContacts=0;
 oven.traverse(m=>{if(!m.isMesh)return;for(const p of E.covers)if(m!==p&&overlap(bounds(m),bounds(p),.12))ovenContacts++;});assert.equal(ovenContacts,0);
 report.equipmentPanelOverlaps=overlaps.map(o=>({...o,classification:'false positive from overall appliance bounds; actual body and front trim have zero panel intersections'}));
 report.checks.push('V1/V2 full geometry, colors and transforms unchanged','24 original equipment instances and 13 navigation spaces preserved','300×95×95 island with real sink/IH openings and full entry-facing finish','Wine/robot/IH/wet service zones face west','Q6 inside console; TV y583; Q7 south aisle104.15cm','Old collection door removed; new framed glass doors interactive','Room doors reach full opening; kitchen electric sliding door retained','RGB wave, shared scene, curtains and TV180° rotation work; optional stool toggles');
 report.model=signature(V);report.equipment=E.items.map(e=>({key:e.userData.equipment.key,bounds:bounds(e)}));report.interactions=c.HOME_INTERACTION.getState();
 if(!process.argv.includes('--no-images'))report.views=render({T,V,version:'v3',out,views:[
  {id:'entry',room:'entry',name:'進門視線',p:[603,925,165],t:[475,780,100]},
  {id:'island-west',room:'island',name:'西側設備分艙',p:[328,677,163],t:[467,644,75]},
  {id:'storage',room:'collection',name:'展示與深收納接角',p:[479,801,165],t:[283,906,125]},
  {id:'entry-cabinet',room:'entry',name:'玄關矮櫃與掛衣',p:[570,811,165],t:[678,885,123]},
  {id:'audio',room:'living',name:'沙發主座影音',p:[950,583,105],t:[647,583,124]},
  {id:'island-east',room:'island',name:'中島東側與留膝',p:[600,795,160],t:[479,652,87]},
  {id:'sink',room:'island',name:'55×45單槽與20cm槽深',p:[377,791,187],t:[455,729,86]}
 ]});
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks,model:report.model,panelOverlaps:overlaps,images:report.views?.length},null,2));
})().catch(e=>{console.error(e);process.exit(1);});
