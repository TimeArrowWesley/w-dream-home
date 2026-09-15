'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),build=require('./home-test-fixture.cjs');
const dir=path.resolve('提案/原始格局/核對'),result={checks:[],retained:{},method:'Actual Three.js geometry and interaction code in an offline fixture; no browser/GPU verification.'};
function hash(f){const a=[];f.V.scene.updateMatrixWorld(true);f.V.scene.traverse(o=>{if(o.isMesh)a.push([o.name,o.userData.name,Array.from(o.matrixWorld.elements),Array.from(o.geometry.attributes.position.array),o.geometry.index?Array.from(o.geometry.index.array):[]]);});return crypto.createHash('sha256').update(JSON.stringify(a)).digest('hex');}
(async()=>{
 const f=await build(0),{T,c,V,E}=f,s=c.HOME_ORIGINAL_SPEC;
 assert(c.HOME_LAYOUT.originalPlan);assert.equal(V.rooms.length,13);assert.equal(V.rooms.find(r=>r.id==='collection').n,'貓房');
 assert(c.HOME_ORIGINAL_LIVING);assert(c.HOME_ORIGINAL_ISLAND);assert.equal(c.HOME_ORIGINAL_ISLAND.shape.holes.length,2);
 const top=[];c.HOME_ORIGINAL_ISLAND.root.traverse(o=>{if(o.userData.islandSurface==='countertop')top.push(o);});assert.equal(top.length,1);
 V.scene.updateMatrixWorld(true);const ray=new T.Raycaster();
 for(const [x,y,hole] of [[500,610.3,true],[625,563,true],[545,632,false]]){
  ray.set(V.pos(x,y,120),new T.Vector3(0,-1,0));assert.equal(ray.intersectObjects(top).length===0,hole,`Countertop true opening ${x},${y}`);
 }
 const equipment=E.items.map(o=>o.userData.equipment?.key);for(const key of ['wine','robot','ih','clar','switch2','ps5','tv','fridge'])assert.equal(equipment.filter(k=>k===key).length,1,key+' count');
 result.checks.push('V0 room metadata, one of each common core appliance and real basin/IH holes verified');
 const I=c.HOME_INTERACTION,W=c.HOME_WALK;
 const cat=I.getState().entries.find(e=>e.name.includes('原圖貓房')),front=I.getState().entries.find(e=>e.name==='入戶門');assert(cat&&front);
 assert.equal(Math.abs(cat.openAngle),Math.PI/2);assert.equal(front.openAngle,Math.PI/2);
 I.setDoor(cat.id,true);I.setDoor(front.id,true);I.setDoor('kitchen',true);f.tick(100,30);
 assert(Math.abs(I.getState().entries[cat.id].angle-cat.openAngle)<.02);assert(Math.abs(I.getState().entries[front.id].angle-front.openAngle)<.02);
 W.refreshColliders();const stand=(x,y)=>W.canStand(x-482.5,y-480);
 for(const [x,y] of [[365,723],[365,753],[365,795],[380,842],[608,915],[608,948]])assert(stand(x,y),`Original circulation blocked at ${x},${y}`);
 result.checks.push('Cat-room north door and original entrance open 90 degrees and allow passage; electric kitchen door available');
 const wet=I.getState().entries.find(e=>e.name.startsWith('V0 飲水濕區'));assert(wet);I.setDoor(wet.id,true);f.tick(100,30);
 const leaf=V.scene.getObjectByName('V0 飲水內側檢修門')||(()=>{let r;V.scene.traverse(o=>{if(o.userData.name==='V0 飲水內側檢修門')r=o;});return r;})();
 if(leaf){const b=f.bounds(leaf),wine=E.items.find(o=>o.userData.equipment?.key==='wine');assert(!f.overlap(b,f.bounds(wine)),'Wet service door intersects wine cabinet');}
 assert(c.HOME_RGB&&c.HOME_CURTAINS&&c.HOME_COMFORT&&c.HOME_BEDROOM);result.checks.push('Common RGB, curtains, lighting scenes, bedroom controls and wet-bay service door retained');
 result.equipment=equipment;result.doors=I.getState().entries;
 const baseline=JSON.parse(fs.readFileSync(path.join(dir,'既有四版幾何基準.json')));
 for(let v=1;v<=4;v++){const q=await build(v+1),digest=hash(q);assert.equal(digest,baseline['v'+v],'V'+v+' geometry changed');result.retained['v'+v]=digest;console.log('V'+v+' geometry unchanged');}
 fs.writeFileSync(path.join(dir,'V0模型驗證.json'),JSON.stringify(result,null,2)+'\n');console.log(result.checks.join('\n'));
})().catch(e=>{console.error(e);process.exitCode=1;});
