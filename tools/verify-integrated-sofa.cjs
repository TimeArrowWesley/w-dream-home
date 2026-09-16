'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),build=require('./home-test-fixture.cjs');
const out=path.resolve(__dirname,'../調整紀錄/20260916沙發整合與AI更新');
(async()=>{const versions=[];for(const [n,v] of [[0,'v0'],[2,'v1'],[3,'v2'],[4,'v3'],[5,'v4']]){
 const f=await build(n),{c,V,bounds}=f;f.tick(3);const s=c.HOME_SOFA;
 assert(s&&s.spec.version===v,'correct version sofa');assert(s.parts.length>=60);
 const all=[];V.scene.traverse(o=>{if(o.isMesh)all.push(o);});
 const sofaParts=all.filter(o=>o.userData.sofaPart);assert.equal(sofaParts.length,s.parts.length,'one integrated sofa only');
 for(const m of all){const a=m.geometry?.attributes?.position?.array;if(a)assert(Array.from(a).every(Number.isFinite),'finite geometry '+m.name);}
 const box=new f.T.Box3();for(const m of s.parts)box.union(new f.T.Box3().setFromObject(m));
 const footprint={x:box.min.x+482.5,y:box.min.z+480,z:box.min.y,w:box.max.x-box.min.x,d:box.max.z-box.min.z,h:box.max.y-box.min.y};
 assert(footprint.z>=-.01&&footprint.z<.1,'floor supported');
 if(s.spec.facing==='W'){assert(Math.abs(footprint.x+footprint.w-995)<.1,'window-side outer edge retained');assert(Math.abs(footprint.x-817)<.1);}
 const structural=[];for(const p of V.wallParts){const b=bounds(p.m);for(const m of s.parts)if(f.overlap(bounds(m),b,.2))structural.push({part:m.userData.sofaPart,wall:p.m.userData.name,b});}assert.deepEqual(structural,[],'sofa clear of architecture');
 const furniture=[];for(const m of all){if(m.userData.sofaPart||m.userData.allowance||m.geometry.type==='PlaneGeometry')continue;const b=bounds(m);if(b.z+b.h<3||b.z>90||b.w>500||b.d>500)continue;
  for(const p of s.parts)if(f.overlap(bounds(p),b,.3))furniture.push({part:p.userData.sofaPart,other:m.userData.name||m.name,otherBounds:b});
 }
 assert.deepEqual(furniture,[],'sofa clear of furniture and equipment');
 const stands=c.HOME_EQUIPMENT.items.filter(o=>['q7','sub','projector'].includes(o.userData.equipment?.key)).map(o=>({name:o.name,key:o.userData.equipment.key,bounds:bounds(o)}));
 V.scene.traverse(o=>{if(o.userData.surround)stands.push({name:o.name,key:'surround',bounds:bounds(o)});});
 const scenes=['daily','makeup','reading','projection','night'];for(const x of scenes)assert(c.HOME_BEDROOM.setScene(x));c.HOME_BEDROOM.setScene('daily');
 for(const x of ['mirror','stool','drawer','closetDrawer']){assert(c.HOME_BEDROOM.setFurniture(x,true));assert(c.HOME_BEDROOM.setFurniture(x,false));}
 c.HOME_WALK.refreshColliders();const pathPoints=s.spec.facing==='W'?Array.from({length:10},(_,i)=>[1040,480+i*20]):Array.from({length:10},(_,i)=>[810+i*20,s.spec.backY-45]);
 const walk=pathPoints.map(([x,y])=>({x,y,clear:c.HOME_WALK.canStand(x-482.5,y-480)}));
 const tv=c.HOME_ROTATING_TV_CONTROLS;if(tv){tv.setTarget('island');f.tick(420,1000/60);assert(Math.abs(tv.getState().angle-180)<.01);tv.setTarget('living');f.tick(420,1000/60);}
 const entry={version:v,parts:s.parts.length,triangles:s.parts.reduce((a,m)=>a+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0),footprint,structural,furniture,walk,walkNote:v==='v3'?'北端y480測點距既有北重低音僅11.25cm，小於18cm角色半徑，因此阻擋屬正確；後側通道y500–660可通行。未宣稱北端可直接穿過設備。':'所列背側測點可通行',stands,bedroomControls:4,bedroomScenes:5,equipmentCount:c.HOME_EQUIPMENT.items.length,rooms:V.rooms.length};versions.push(entry);console.log(JSON.stringify(entry));
 }fs.writeFileSync(path.join(out,'模型核對.json'),JSON.stringify({method:'Actual source geometry, AABB collision candidates and feature handlers. Not a structural certification or GPU benchmark.',versions},null,2));})().catch(e=>{console.error(e.stack);process.exitCode=1;});
