'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),build=require('./home-test-fixture.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20260923V4灰石工業校正');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const mat=m=>JSON.stringify({color:m.color?.toArray(),map:m.map?.id,rough:m.roughness,metal:m.metalness,opacity:m.opacity});
function geo(f){const a=[];f.V.scene.updateMatrixWorld(true);f.V.scene.traverse(o=>{if(o.isMesh)a.push([o.id,hash(Buffer.from(o.geometry.attributes.position.array.buffer)),o.geometry.index?hash(Buffer.from(o.geometry.index.array.buffer)):null,o.matrixWorld.elements]);});return JSON.stringify(a);}
function equip(f){const a=[];for(const g of f.E.items)g.traverse(o=>{if(o.isMesh)a.push([o.id,...(Array.isArray(o.material)?o.material:[o.material]).map(mat)]);});return JSON.stringify(a);}
(async()=>{
 const overrides={'v4-industrial-refinement.js':''},f=await build(5,overrides),geometry=geo(f),devices=equip(f),floor=mat(f.c.HOME_FLOORING.floor.material),stone=mat(f.c.HOME_GREY_STONE.materials.stone);
 const privateMats=[];f.V.fittings.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)){const b=f.bounds(o);if(b.y<375&&b.x<745)privateMats.push([o,mat(o.material)]);}});
 delete overrides['v4-industrial-refinement.js'];f.run('v4-industrial-refinement.js');const gi=f.c.HOME_V4_INDUSTRIAL;
 assert.equal(geo(f),geometry,'All model geometry and world transforms');assert.equal(equip(f),devices,'Manufacturer equipment finishes');assert.equal(mat(f.c.HOME_FLOORING.floor.material),floor,'Gray-brown herringbone remains');assert.equal(mat(f.c.HOME_GREY_STONE.materials.stone),stone,'Gray stone feature remains');
 privateMats.forEach(([o,s])=>assert.equal(mat(o.material),s,'Private room finish '+o.id));
 let drawers=0,metal=0;f.V.scene.traverse(o=>{if(o.userData.v4IndustrialRole==='study-drawer-graphite')drawers++;if(o.userData.v4IndustrialRole==='brushed-display-frame')metal++;});assert.equal(drawers,9);assert(metal>=12);assert(gi.getState().surfaces>=35);
 const first=JSON.stringify(gi.getState());gi.apply();assert.equal(JSON.stringify(gi.getState()),first,'Idempotent');
 const study=f.V.finishContext.roomLights.filter(l=>l.position.x+482.5>745&&l.position.z+480<460);assert(study.length);
 const base=study[0].intensity;gi.updateZones({study:50});assert(Math.abs(study[0].intensity-base*.5)<1e-8);gi.updateZones({study:100});
 f.c.HOME_COMFORT.setScene('movie');const strip=f.V.scene.getObjectByName('GR06 石牆上緣內藏線燈・位置待燈具深化');assert.equal(strip.material.color.r,0);
 f.c.HOME_COMFORT.setScene('daily');assert(strip.material.color.r>0);assert(study[0].intensity>0);
 f.c.HOME_INDUSTRIAL.apply();assert.equal(geo(f),geometry);assert.equal(drawers,9);assert.equal(equip(f),devices);
 const results={revision:gi.revision,geometryUnchanged:true,factoryEquipmentUnchanged:true,privateMaterialsUnchanged:true,stoneAndFloorUnchanged:true,drawerFronts:drawers,metalSurfaces:metal,surfaces:gi.getState().surfaces,sceneAndZoneControls:true,limitations:'Offline source checks. Materials/lighting are proposals; no photometric, construction or all-device browser certification.'};
 for(const [v,n] of [['v0',0],['v1',2],['v2',3],['v3',4]]){const x=await build(n),g=geo(x),e=equip(x);x.run('v4-industrial-refinement.js');assert.equal(geo(x),g);assert.equal(equip(x),e);assert(!x.c.HOME_V4_INDUSTRIAL);console.log(v+' unchanged guard');}
 fs.writeFileSync(path.join(R,'模型核對.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exitCode=1;});
