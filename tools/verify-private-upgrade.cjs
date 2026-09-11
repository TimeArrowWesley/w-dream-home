'use strict';
// Actual Three.js meshes and application handlers; no browser or GPU.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'調整紀錄/20260911全屋核對與主臥細節');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function records(f){f.V.scene.updateMatrixWorld(true);const a=[];f.V.scene.traverse(o=>{if(!o.isMesh)return;const b=f.bounds(o);a.push({vanity:!!o.userData.masterVanity,name:o.userData.name||o.name,b,key:JSON.stringify({p:sha(Buffer.from(o.geometry.attributes.position.array.buffer)),m:o.matrixWorld.elements,c:o.material?.color?.getHex(),opacity:o.material?.opacity,visible:o.visible})});});return a;}
function permitted(b){if(b.h<1e-6&&Math.abs(b.z-.25)<.001&&b.x===712&&b.y===37&&b.w===51&&b.d===111)return true;/* Contact-shadow decal belonging to the replaced solid shallow cabinet. */const zones=[[-85,-15,835,300],[570,270,180,180],[-16,730,22,170]];return zones.some(([x,y,w,d])=>b.x>=x-.1&&b.y>=y-.1&&b.x+b.w<=x+w+.1&&b.y+b.d<=y+d+.1);}
function multiDiff(a,b){const count=new Map();for(const r of b)count.set(r.key,(count.get(r.key)||0)+1);return a.filter(r=>{if(count.get(r.key)){count.set(r.key,count.get(r.key)-1);return false;}return true;});}
const anchors=[
 ['主臥',['180 × 202 KING 床','主臥靠窗化妝台','投影機層板']],
 ['更衣室',['更衣室窗前矮櫃','更衣室頂天櫃','更衣室側移滑鏡','開放式更衣櫃']],
 ['雙人書房',['FUNTE 180','Samsung 57','書房九抽收納','書房模型玻璃门']],
 ['廚房',['A區120cm雙開水槽櫃','ICNh5123 外覆門板分割','C區80cm收納高櫃','BELEGA']],
 ['主浴',['TOTO NX2','浴缸','主浴淋浴立桿','懸吊浴櫃']],
 ['客浴',['TOTO LS','客浴地面','浴室鏡櫃']],
 ['儲藏室',['儲藏室鐵件層架','儲藏室拉門']],
 ['後陽台',['WashTower','後陽台水槽右側頂天收納櫃','室外機']],
 ['客廳',['OLED83G6','Q7 Meta','SB-2000','沙發']],
 ['中島',['WKb1712','Saros 20','WS2-C1','PIB375FB1E']]
];
anchors[2][1][3]='書房模型玻璃門';
(async()=>{
 fs.mkdirSync(out,{recursive:true});const report={method:'Original-plan room inventory + actual Three.js dimensions, moving furniture and real interaction handlers. CPU images omit GPU textures, reflections and lighting. No construction or FPS certification.',versions:[]};
 const snapshot=process.argv.includes('--before')?JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf('--before')+1],'utf8')):null;
 for(const n of [2,3,4,5]){
  const f=await build(n),{V,c,T,E,bounds,near,overlap}=f,B=c.HOME_BEDROOM_MODEL,control=c.HOME_BEDROOM;
  const initial=records(f),before=snapshot?await build(n,snapshot.files):null;
  let changes=null;if(before){const prior=records(before),removed=multiDiff(prior,initial),added=multiDiff(initial,prior);const unexpected=[...removed,...added].filter(r=>!permitted(r.b));if(unexpected.length)console.log(JSON.stringify(unexpected.map(({name,b})=>({name,b})),null,2));assert.deepEqual(unexpected,[],'No unrelated rooms changed');changes={beforeCommit:snapshot.commit,removed:removed.length,added:added.length,unrelatedRoomsUnchanged:true};}
  const all=[];V.scene.traverse(o=>all.push(o));const names=all.map(o=>o.userData.name||o.name||'');const inventory=[];
  for(const [room,keys] of anchors){for(const k of keys)assert(names.some(n=>n.includes(k)),room+' missing '+k);inventory.push({room,checked:keys});}
  assert.equal(E.items.length,24);assert.equal(V.rooms.length,13);
  for(const col of c.HOME_DATA.cols)assert(V.wallParts.some(p=>{const b=bounds(p.m);return Math.abs(b.x-col[0])<.1&&Math.abs(b.y-col[1])<.1&&Math.abs(b.w-col[2])<.1&&Math.abs(b.d-col[3])<.1;}),'Structural column retained');
  const walls=[[405,0,10,123],[405,207,10,158],[405,207,165,10],[745,0,10,365],[580,260,165,10],[210,745,10,210]];
  const wallResults=walls.map(([x,y,w,d])=>({x,y,w,d,present:V.wallParts.some(p=>{const b=bounds(p.m);return Math.abs(b.x-x)<.1&&Math.abs(b.y-y)<.1&&Math.abs(b.w-w)<.1&&Math.abs(b.d-d)<.1;})}));
  assert(wallResults.every(r=>r.present),'Source-derived wall anchors retained');
  // Source-derived anchor lines are recorded; layout-specific replacements remain explicit.
  const table=all.find(o=>o.userData.name==='主臥化妝台・190×75cm檯面');near(bounds(table).w,75,'vanity depth');near(bounds(table).d,190,'vanity length');near(bounds(table).z+bounds(table).h,75,'vanity height');
  const bed=all.find(o=>o.userData.name==='180 × 202 KING 床');near(bounds(bed).x-bounds(table).x-bounds(table).w,90,'Actual bedside clearance');near(B.vanity.kneeWidth,118,'Knee width');near(B.vanity.kneeHeight,72,'Knee height');near(bounds(B.groups.stool).z,0,'Stool touches floor');
  for(const g of V.fittings.children.filter(o=>o.userData.cabinet?.name==='床頭抽屜'))near(g.userData.cabinet.h,70,'bedside height');
  const starts=Object.fromEntries(Object.entries(B.groups).map(([k,g])=>[k,bounds(g)]));
  const motion=[];for(const key of ['mirror','stool','drawer','closetDrawer']){assert(control.setFurniture(key,true));const b=bounds(B.groups[key]);near(b.x-starts[key].x,{mirror:35,stool:48,drawer:35,closetDrawer:-35}[key],key+' travel');motion.push({key,closed:starts[key],open:b});assert(control.setFurniture(key,false));}
  // Sliding mirror and eastern drawer must never occupy the same space.
  control.setFurniture('closetDrawer',true);assert.equal(c.HOME_INTERACTION.setDoor('closet-mirror',true),false);control.setFurniture('closetDrawer',false);
  c.HOME_INTERACTION.setDoor('closet-mirror',true);f.tick(80,50);assert.equal(control.setFurniture('closetDrawer',true),false);c.HOME_INTERACTION.setDoor('closet-mirror',false);f.tick(80,50);
  const intersections=[];
  for(const key of ['mirror','stool','drawer','closetDrawer']){const moving=[];B.groups[key].traverse(o=>{if(o.isMesh)moving.push(o);});const others=[];for(const p of [V.architecture,V.fittings])p.traverse(o=>{if(o.isMesh&&!moving.includes(o)&&!o.userData.allowance)others.push(o);});
   const move0=B.groups[key].position.x,travel={mirror:35,stool:48,drawer:35,closetDrawer:-35}[key];
   for(let step=0;step<=10;step++){B.groups[key].position.x=travel*step/10;V.scene.updateMatrixWorld(true);for(const m of moving)for(const o of others)if(overlap(bounds(m),bounds(o),.15))intersections.push({key,step,a:m.userData.name||m.name,b:o.userData.name||o.name,ob:bounds(o)});}B.groups[key].position.x=move0;
  }
  if(intersections.length)console.log(JSON.stringify(intersections.filter(r=>r.key!=='mirror').slice(0,16),null,2));assert.deepEqual(intersections,[],'Moving furniture clears existing structure and furniture');
  // Thin bag doors include their metal frames in the swept envelope.
  const bagDoors=all.filter(o=>o.userData.swingFront?.name.startsWith('小包防塵門'));assert.equal(bagDoors.length,3);
  for(const leaf of bagDoors){const own=[];leaf.parent.traverse(o=>{if(o.isMesh)own.push(o);});const other=[];for(const p of [V.architecture,V.fittings])p.traverse(o=>{if(o.isMesh&&!own.includes(o)&&!o.userData.allowance)other.push({o,b:bounds(o)});});const name=leaf.userData.swingFront.name+'・櫃門';c.HOME_INTERACTION.setDoor(name,true);for(let i=0;i<30;i++){f.tick(1,50);for(const q of own)for(const {o,b} of other)assert(!overlap(bounds(q),b,.2),'Bag door intersects '+(o.userData.name||o.name));}c.HOME_INTERACTION.setDoor(name,false);f.tick(40,50);}
  // Curtains clear both mirror carriage positions and do not close other rooms in projection mode.
  const otherCurtains=c.HOME_CURTAINS.getState().filter(e=>e.id!=='bed').map(e=>e.target);
  assert(control.setScene('makeup'));assert(B.task.intensity>.5);assert(control.setScene('projection'));f.tick(80,50);assert(c.HOME_CURTAINS.getState().find(e=>e.id==='bed').closed>.99);assert.deepEqual(c.HOME_CURTAINS.getState().filter(e=>e.id!=='bed').map(e=>e.target),otherCurtains);assert.equal(B.task.intensity,0);
  for(const scene of ['daily','makeup','reading','projection','night']){assert(control.setScene(scene));assert.equal(control.getState().scene,scene);}assert.equal(control.setScene('unknown'),false);
  for(const q of [0,.5,1]){c.HOME_CURTAINS.set(q,'bed');f.tick(80,50);control.setFurniture('mirror',true);const panels=V.scene.getObjectByName('可互動落地窗簾').children[4];panels.traverse(o=>{if(o.isMesh)B.groups.mirror.traverse(m=>{if(m.isMesh)assert(!overlap(bounds(o),bounds(m),.05),'Mirror clears curtain');});});control.setFurniture('mirror',false);}
  control.setScene('daily');c.HOME_CURTAINS.set(0,'bed');f.tick(80,50);
  c.HOME_TOUR.setMode('walk');f.tick(10,50);V.camera.position.copy(V.pos(50,185,165));assert(control.setFurniture('stool',true)===false,'Cannot pull stool into walker');V.camera.position.copy(V.pos(350,240,165));assert(control.setFurniture('stool',true));assert(!c.HOME_WALK.canStand(25-482.5,190-480),'Moved stool refreshes walk colliders');control.setFurniture('stool',false);
  // Door travel and actual walk passage, with a 36 cm diameter avatar.
  const passages=[];for(const [key,points] of [['storage',Array.from({length:13},(_,i)=>[695,340+i*5])]]){
   c.HOME_INTERACTION.setDoor(key,false);f.tick(80,50);assert(!c.HOME_WALK.canStand((key==='storage'?695:-8)-482.5,(key==='storage'?377:775)-480),'Closed door blocks walker');c.HOME_INTERACTION.setDoor(key,true);f.tick(80,50);const entry=c.HOME_INTERACTION.getState().entries.find(e=>e.key===key);near(entry.angle,1,'sliding door fully opens');for(const [x,y] of points)assert(c.HOME_WALK.canStand(x-482.5,y-480),key+' blocked '+x+','+y);passages.push({key,samples:points.length});c.HOME_INTERACTION.setDoor(key,false);f.tick(80,50);
  }
  c.HOME_TOUR.setMode('model');
  for(const [room,keys] of [['玄關',['玄關','帽鉤']],['收藏區',[n<4?'收藏室精品包櫃':'玻璃展示']]]){for(const k of keys)assert(names.some(n=>n.includes(k)),room+' missing '+k);inventory.push({room,checked:keys});}
  const products=E.items.filter(e=>['fridge','wine','dishwasher','oven'].includes(e.userData.equipment?.key)).map(e=>({key:e.userData.equipment.key,bounds:bounds(e),status:'Body checked; exact manufacturer door/drawer envelope remains pending. Existing allowance is a planning zone, not a certified clearance.'}));
  const chairs=all.filter(o=>(o.userData.name||'').includes('LiberNovo Omni PRO'));assert.equal(chairs.length,2);
  const productBefore=before?.E.items.map(e=>({name:e.name,b:before.bounds(e)}));if(productBefore)assert.deepEqual(E.items.map(e=>({name:e.name,b:bounds(e)})),productBefore,'All appliance envelopes retained');
  report.versions.push({version:'v'+(n-1),baselineWithoutVanity:sha(initial.filter(r=>!r.vanity).map(r=>r.key).sort().join('\n')),changes,inventory,structuralColumns:6,wallResults,motion,bedSideClearClosed:90,bedSideClearWithStool:55,passages,products,chairStatus:'Two seated placeholders retained; 160-degree reclined envelope not supplied, not passed.',intersections,lightingScenes:5,rooms:13,equipment:24});
  if(n===2&&process.argv.includes('--images')){const views=[{id:'vanity',room:'bed',name:'化妝台',p:[156,245,156],t:[-30,180,84]},{id:'bedroom',room:'bed',name:'主臥',p:[340,258,160],t:[50,135,75]},{id:'closet',room:'closet',name:'更衣收納',p:[605,155,153],t:[712,164,104]}];render({T,V,version:'after',out,views});for(const k of ['mirror','stool','drawer','closetDrawer'])control.setFurniture(k,true);render({T,V,version:'use',out,views:[views[0],views[2]]});if(before)render({T:before.T,V:before.V,version:'before',out,views});}
 }
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.versions.map(v=>({version:v.version,changes:v.changes,inventory:v.inventory.length,motion:v.motion.length,passages:v.passages,wallResults:v.wallResults})),null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
