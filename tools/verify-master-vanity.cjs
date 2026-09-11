'use strict';
// Offline source-geometry, collision and shared-version checks. No browser or GPU.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'調整紀錄/20260911主臥化妝台');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const before=['7df07c1748e43ae3a77538104a7bd72fb3e35a469ae4eb6d586ba9842b2e20b6','74f25518f516352f33385086bdc9441a003e04963fed421d870053b85ee99a74','e8369544cf55dbd80e1834899d3b15ecbe25f3b370ef5ab59af7af7c9c0e5052','e8c06189cd9208879dc345e4e8a2926cc798494c33f5d6dd9860c6650ff98d8a'];
(async()=>{
 fs.mkdirSync(out,{recursive:true});const versions=[];let sharedShape;
 for(const n of [2,3,4,5]){
  const f=await build(n),{T,V,E,c,bounds,near,overlap}=f;V.scene.updateMatrixWorld(true);
  const a=[],newMeshes=[];V.scene.traverse(o=>{if(!o.isMesh)return;if(o.userData.masterVanity)newMeshes.push(o);else a.push(JSON.stringify({p:sha(Buffer.from(o.geometry.attributes.position.array.buffer)),m:o.matrixWorld.elements,c:o.material?.color?.getHex(),opacity:o.material?.opacity,visible:o.visible}));});
  assert.equal(sha(a.sort().join('\n')),before[n-2],'All pre-existing V'+(n-1)+' meshes, materials and transforms unchanged');
  const tables=[];V.scene.traverse(o=>{if(o.name==='主臥靠窗化妝台')tables.push(o);});assert.equal(tables.length,1);
  const g=tables[0],table=newMeshes.find(o=>o.userData.name==='主臥化妝台・190×75cm檯面'),b=bounds(table);
  for(const [k,v] of Object.entries({x:-65,y:90,w:75,d:190,z:72,h:3}))near(b[k],v,'table '+k);
  const shape=sha(JSON.stringify(newMeshes.map(o=>({name:o.userData.name,b:bounds(o)}))));if(sharedShape)assert.equal(shape,sharedShape);sharedShape=shape;
  for(const m of newMeshes.filter(o=>o.userData.vanityWood))assert.equal(m.userData.finishGroup,'cabinet-dark-straight-veneer');
  let bed;V.scene.traverse(o=>{if(o.userData.name==='180 × 202 KING 床')bed=o;});assert(bed);near(bounds(bed).x-(b.x+b.w),90,'Bed-side clearance');
  const s=bounds(E.refinements.masterVanity.stool);near(s.z,0,'Stool is floor-supported');near(s.z+s.h,45,'Seat height');assert(s.x+s.w<b.x+b.w,'Stool tucked beneath desktop');
  near(E.refinements.masterVanity.kneeWidth,118,'Knee width');near(E.refinements.masterVanity.kneeHeight,72,'Knee height');
  assert.equal(E.items.length,24);assert.equal(V.rooms.length,13);
  const existing=[];for(const parent of [V.architecture,V.fittings])parent.traverse(o=>{if(o.isMesh&&!o.userData.masterVanity)existing.push(o);});
  const intersects=[];for(const m of newMeshes)for(const o of existing)if(overlap(bounds(m),bounds(o),.1))intersects.push([m.userData.name,o.userData.name||o.name]);assert.deepEqual(intersects,[],'No new cabinet, chair or mirror intersects existing architecture/furniture');
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'家具清單.json'),'utf8')),item=catalog.items.find(i=>i.id==='model-master-vanity');assert.equal(item.modelSearch[0],g.name,'Catalog 3D locator resolves to the vanity group');
  // Check actual curtain panel vertices through opening, midpoint and closed states.
  const curtain=V.scene.getObjectByName('可互動落地窗簾').children[4];
  for(const v of [0,.5,1,0]){c.HOME_CURTAINS.set(v,'bed');f.tick(90,50);curtain.traverse(o=>{if(o.isMesh)for(const m of newMeshes)assert(!overlap(bounds(o),bounds(m),.03),'Curtain intersects '+m.userData.name);});}
  c.HOME_INTERACTION.setDoor('主浴80cm門洞',true);f.tick(100,50);c.HOME_TOUR.setMode('walk');await Promise.resolve();
  let samples=0;for(let y=75;y<=255;y+=5){assert(c.HOME_WALK.canStand(55-482.5,y-480),'Blocked bed-side walkway y'+y);samples++;}
  c.HOME_TOUR.setMode('model');
  versions.push({version:'v'+(n-1),addedMeshes:newMeshes.length,table:b,stool:s,bedClearCm:90,kneeWidthCm:118,kneeHeightCm:72,walkSamples:samples,originalGeometryUnchanged:true,existingEquipment:24,rooms:13,curtainStatesChecked:[0,.5,1],intersects});
  if(n===2&&!process.argv.includes('--no-images')){
   const views=[{id:'vanity',room:'bed',name:'床側靠窗化妝台',p:[156,245,156],t:[-30,180,84]},{id:'room',room:'bed',name:'主臥整體與床側通道',p:[340,258,160],t:[50,135,75]}];
   render({T,V,version:'after',out,views});g.visible=false;render({T,V,version:'before',out,views:views.slice(0,1)});g.visible=true;
  }
 }
 const C=require('../furniture-core.js'),d=C.validate(JSON.parse(fs.readFileSync(path.join(root,'家具清單.json'),'utf8')));
 assert.equal(d.items.length,82);assert.equal(d.items.filter(i=>i.original).length,79);assert.equal(d.items.filter(i=>i.id==='model-master-vanity').length,1);
 const report={date:new Date().toISOString(),method:'Actual Three.js source, offline collision handlers and CPU geometry/color images; no GPU, texture or mirror-reflection validation.',versions,catalogItems:82};
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
