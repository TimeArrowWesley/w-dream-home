'use strict';
// Baselines include the 20260911 closet-wall repair; verify-bedroom-wall.cjs proves only that wall changed.
// Actual source geometry and feature handlers, offline. No browser/GPU claims.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'提案/南牆電視與開放中島/模型檢視');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
// Exclude the explicitly tagged shared vanity only when comparing pre-vanity baselines.
// tools/verify-master-vanity.cjs independently checks this addition in all four versions.
function signature(V,omitSharedVanity=false){V.scene.updateMatrixWorld(true);const a=[];V.scene.traverse(o=>{if(o.isMesh&&!(omitSharedVanity&&o.userData.masterVanity))a.push(JSON.stringify({p:digest(Buffer.from(o.geometry.attributes.position.array.buffer)),m:o.matrixWorld.elements,c:o.material?.color?.getHex(),opacity:o.material?.opacity,visible:o.visible}));});return {meshes:a.length,hash:digest(a.sort().join('\n'))};}
function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const report={method:'Actual Three.js geometry, full feature handlers and CPU color rasterization. Textures, reflections, GPU performance and browser layout are not verified by this offline test.',retained:{},checks:[]};
 // Baselines after the verified closet-wall repair, before animations and without the shared vanity.
 const hashes=['bf4ad4514059d508eadf18408b23cbcc15f150d5a9964747a6641ca85647009c','b464fd7f408b5dac88b275275abd5759dcdab4918c9efcb335cb4c59f5089d6d','09bc50a5cd5a5ddc58e867444e8575118af7dd03ff0b3f1098ceb98d49962825'];
 if(!process.argv.includes('--a-only'))for(const n of [2,3,4]){const f=await build(n),s=signature(f.V,true);assert.equal(s.hash,hashes[n-2],'V'+(n-1)+' remains unchanged');report.retained['v'+(n-1)]=s;}
 const f=await build(5),{V,c,E,T,bounds,near,overlap}=f;V.scene.updateMatrixWorld(true);report.initialModel=signature(V);
 assert.equal(c.HOME_LAYOUT.version,'v4');assert.equal(V.rooms.length,13);assert.equal(E.items.length,24);assert(c.HOME_FIXED_LIVING);assert(!c.HOME_ROTATING_TV);assert(!c.HOME_ROTATING_TV_CONTROLS);
 const backing=V.wallParts.find(p=>p.m.userData.name==='V4 南牆灰礦物塗料背牆');assert(backing,'TV finish follows wall cutaway');
 const counts={};for(const e of E.items){assert(e.userData.equipment,'equipment metadata '+e.name);const k=e.userData.equipment.key;counts[k]=(counts[k]||0)+1;}
 for(const [k,n] of Object.entries({tv:1,q7:2,q6:1,sub:2,switch2:1,switch2dock:1,ps5:1,avr:1,wine:1,robot:1,ih:1,clar:1}))assert.equal(counts[k],n,k);
 const island=c.HOME_OPEN_ISLAND.island,spec=c.HOME_OPEN_ISLAND_SPEC;
 const role=r=>island.children.find(o=>o.userData.islandSurface===r),top=role('countertop'),b=bounds(top);near(b.x,425,'island west');near(b.y,480,'island north');near(b.w,110,'island width');near(b.d,280,'island length');near(b.z+b.h,95,'height');
 const ray=new T.Raycaster(),down=(x,y,objects=[top])=>{ray.set(V.pos(x,y,160),new T.Vector3(0,-1,0));return ray.intersectObjects(objects).sort((a,b)=>a.distance-b.distance);};
 assert(!down(455,725).length,'sink opening');assert(!down(457.5,636.9).length,'IH opening');assert(down(520,625).length,'east counter solid');
 const rim=role('sink-rim'),floor=role('sink-floor'),bowl=role('sink-bowl');assert(rim&&floor&&bowl);near(bounds(rim).w,45,'sink width');near(bounds(rim).d,55,'sink length');
 for(const [x,y] of [[443,710],[467,740],[463,725]]){assert(!down(x,y).length);near(down(x,y,[rim,floor,bowl,top])[0].point.y,75,'20cm-deep clear basin',.06);}
 assert(!down(455,725,[floor,rim]).length,'open drain');
 const named=n=>{let a;island.traverse(o=>{if(o.userData.name===n)a=o;});assert(a,n);return a;};
 const clar=E.items.find(o=>o.userData.equipment.key==='clar'),cb=bounds(clar),base=bounds(named('V4 濕區設備承重底板'));near(cb.z,base.z+base.h,'CLAR supported');
 for(const pipe of island.children.filter(o=>o.userData.wetFixture)){assert(!overlap(bounds(pipe),cb,.05),'plumbing intersects CLAR '+pipe.userData.name);assert(bounds(pipe).x+bounds(pipe).w<498.2,'plumbing outside knee space');}
 const faces=[];island.traverse(o=>{if(o.userData.name==='V4 濕區西向檢修門')faces.push(bounds(o));});faces.sort((a,b)=>a.y-b.y);assert.equal(faces.length,2);near(faces[0].y-671.8,.3,'wet north reveal');near(faces[1].y-faces[0].y-faces[0].d,.3,'wet seam');near(758.2-faces[1].y-faces[1].d,.3,'wet south reveal');
 for(const [key,range] of Object.entries({wine:[481.8,550],robot:[551.8,602],ih:[603.8,670],clar:[671.8,758.2]})){const q=bounds(E.items.find(o=>o.userData.equipment.key===key));assert(q.y>=range[0]&&q.y+q.d<=range[1],key+' within own bay');}
 const fridge=bounds(E.items.find(o=>o.userData.equipment.key==='fridge'));near(b.x-fridge.x-fridge.w,110,'closed fridge body to counter edge');near(spec.preservedColumn.y-b.y-b.d,120.1,'south passage');
 near(bounds(named('V4 玄關端完整木皮')).y+1.8,760,'finished island end');const turn=bounds(named('V4 酒櫃與留膝側面轉折封板'));near(turn.w,35,'wine-to-knee step completely capped');near(turn.y+turn.d,bounds(named('V4 東側留膝完成面')).y,'step to knee board butt joint');
 near(760-bounds(named('V4 玄關端內縮踢腳')).y-bounds(named('V4 玄關端內縮踢腳')).d,4,'toe kick recess');
 const tv=E.items.find(o=>o.userData.equipment.key==='tv'),tb=bounds(tv);near(tb.w,184.7,'83 inch TV width');near(tb.z+tb.h/2,100,'TV center height');near(tb.y,947.2,'fixed TV front plane');
 for(const target of spec.audio.floorSpeakers.filter(s=>['L','R','SW1','SW2'].includes(s.id))){const e=E.items.find(o=>o.userData.channel===target.id);assert(e);for(const k of ['x','y','w','d'])near(bounds(e)[k],target[k],target.id+' '+k);}
 assert(!V.architecture.children.some(o=>o.userData.interactiveDoor?.name?.includes('收藏')),'collection door removed');
 const overlaps=[];for(const e of E.items)for(const m of E.covers){if(!visible(m))continue;let own=false;for(let p=m;p;p=p.parent)if(p===e)own=true;if(!own&&overlap(bounds(e),bounds(m),.12))overlaps.push({equipment:e.userData.equipment.key,panel:m.userData.name||m.name,eb:bounds(e),pb:bounds(m)});}
 fs.writeFileSync(path.join(out,'接口檢查.json'),JSON.stringify(overlaps,null,2));assert(!overlaps.some(o=>o.equipment!=='oven'),'equipment-panel intersections: '+JSON.stringify(overlaps));
 const oven=E.items.find(o=>o.userData.equipment.key==='oven');let ovenContacts=0;oven.traverse(m=>{if(m.isMesh)for(const p of E.covers)if(m!==p&&overlap(bounds(m),bounds(p),.12))ovenContacts++;});assert.equal(ovenContacts,0);
 const glass=[];V.fittings.traverse(o=>{if(o.name==='V4 收藏玻璃展示櫃')o.traverse(m=>{if(m.userData.name==='V4 玻璃展示門')glass.push([bounds(m),o.userData.glassOpening]);});});assert.equal(glass.length,3);for(const [q,o] of glass){near(q.z-o.z,.3,'glass bottom');near(o.z+o.h-q.z-q.h,.3,'glass top');}
 let shoes=0;V.fittings.traverse(o=>{if(o.userData.shelfTop!==undefined){near(bounds(o).z,o.userData.shelfTop,'shoe supported');shoes++;}});assert.equal(shoes,6);
 const lift=c.HOME_COFFEE_LIFT;near(bounds(lift).z+bounds(lift).h,45,'coffee default');f.get('coffeeLift').click();V.scene.updateMatrixWorld(true);near(bounds(lift).z+bounds(lift).h,65,'coffee raised');f.get('coffeeLift').click();
 f.get('showSwitch2').click();assert.equal(V.getCurrent(),'living');assert.equal(E.items[Number(f.get('equipmentSelect').value)].userData.equipment.key,'switch2');f.get('inspectEquipment').click();assert.equal(f.get('inspectionNote').hidden,false);f.get('inspectEquipment').click();assert.equal(f.get('inspectionNote').hidden,true);
 const doors=c.HOME_INTERACTION.getState().entries;assert(doors.some(e=>e.key==='kitchen'&&e.electric));
 for(const d of doors){assert(c.HOME_INTERACTION.setDoor(d.id,true));f.tick(140,50);const q=c.HOME_INTERACTION.getState().entries.find(e=>e.id===d.id);near(q.angle,q.openAngle,d.name+' opens',.003);c.HOME_INTERACTION.setDoor(d.id,false);f.tick(140,50);}
 c.HOME_RGB.update('living',{on:true,color:'#ff2277',mode:'wave',brightness:.65});assert.equal(c.HOME_RGB.getState().living.mode,'wave');
 c.HOME_CURTAINS.set(1,'all');f.tick(140,50);assert.equal(c.HOME_CURTAINS.getState().length,6);assert(c.HOME_CURTAINS.getState().every(e=>e.closed>.99));c.HOME_CURTAINS.set(0,'all');f.tick(140,50);assert(c.HOME_CURTAINS.getState().every(e=>e.closed<.01));c.HOME_COMFORT.setScene('daily');assert.equal(c.HOME_COMFORT.getState().scene,'daily');
 c.HOME_INTERACTION.setDoor('入戶門',true);c.HOME_INTERACTION.setDoor('kitchen',true);for(const d of doors.filter(d=>/書房/.test(d.name)))c.HOME_INTERACTION.setDoor(d.id,true);f.tick(140,50);c.HOME_TOUR.setMode('walk');await Promise.resolve();assert(c.HOME_WALK.getState().active);
 let samples=0;for(const route of spec.routes)for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let t=0;t<=len;t+=2){const x=a[0]+(b[0]-a[0])*t/len,y=a[1]+(b[1]-a[1])*t/len;assert(c.HOME_WALK.canStand(x-482.5,y-480),'blocked path '+[x,y]);samples++;}}
 const stools=c.HOME_A_CONTROLS;assert(!stools.getState().stoolsVisible);V.camera.position.copy(V.pos(625,800,165));assert(stools.toggleStools(true));assert(stools.blocksPoint(570-482.5,610-480,18));assert(!stools.blocksPoint(625-482.5,800-480,18));assert(!c.HOME_WALK.canStand(570-482.5,610-480));stools.toggleStools(false);assert(c.HOME_WALK.canStand(570-482.5,610-480));V.camera.position.copy(V.pos(570,610,165));assert(!stools.toggleStools(true),'cannot add chair under avatar');assert(!stools.getState().stoolsVisible);
 c.HOME_TOUR.setMode('model');for(const d of doors)c.HOME_INTERACTION.setDoor(d.id,false);f.tick(140,50);
 const ceilings=V.ceiling.children.filter(o=>o.name.includes('高度聲道'));assert.equal(ceilings.length,4);for(const o of ceilings){const q=bounds(o);for(const m of V.beams.children)assert(!overlap(q,bounds(m),.01),'speaker intersects beam');for(const h of V.ceiling.userData.hvac)assert(!overlap(q,{...h,h:15},.01),'speaker intersects HVAC');}
 report.checks.push('Coffee lift45→65,Switch2 focus and cabinet inspection handlers work','V1/V2/V3 geometry, transforms and colors retained','V4: 13 spaces,24 equipment instances, fixed83-inch TV at centerH100','280×110×H95 island, independent west-facing bays and real55×45×D20 sink','Appliances clear cabinet panels; plumbing clears CLAR; proper door seams and closed cabinet returns','All room/cabinet doors open fully; kitchen electric door,6 curtains,RGB and shared scene controls work','Three modeled walking routes clear for36cm body; optional chairs have dynamic collisions and avatar protection','Four ceiling speakers clear modeled beams and HVAC');
 report.routes={count:spec.routes.length,samples,bodyRadiusCm:18};report.equipment=E.items.map(e=>({key:e.userData.equipment.key,bounds:bounds(e)}));report.bayContacts={actualIntersections:0,conservativeOvenAABBFalsePositives:overlaps.length};
 if(!process.argv.includes('--no-images')){
  report.views=render({T,V,version:'a',out,cutaway:true,views:[{id:'overview',room:'all',name:'全屋配置鳥瞰',p:[1050,1230,1020],t:[480,490,45]}]});
  report.views.push(...render({T,V,version:'a',out,views:[
   {id:'entry',room:'entry',name:'進門望向開放中島',p:[603,925,165],t:[478,665,100]},
   {id:'living',room:'living',name:'沙發望向南牆電視',p:[901,600,110],t:[917.5,948.6,100]},
   {id:'reverse',room:'living',name:'南牆回望客廳中島',p:[788,865,165],t:[595,596,95]},
   {id:'island-west',room:'island',name:'朝冰箱的設備面',p:[328,674,163],t:[467,634,75]},
   {id:'island-east',room:'island',name:'中島留膝與完整端面',p:[641,802,165],t:[474,646,84]},
   {id:'sink',room:'island',name:'真開孔水槽與爐具',p:[370,796,187],t:[455,713,86]},
   {id:'storage',room:'collection',name:'玻璃展示與深收納',p:[437,806,165],t:[283,906,130]}
  ]}));
 }
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({checks:report.checks,model:report.initialModel,routes:report.routes,views:report.views?.length},null,2));
})().catch(e=>{console.error(e);process.exit(1);});
