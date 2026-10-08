'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),build=require('./home-test-fixture.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'調整紀錄/20261008來源格局校正CW01');
process.env.HOME_TEST_BW03='1';process.env.HOME_TEST_BW04='1';
// Fixture order must also match the actual HTML entry points: binding the
// Blender meshes before correcting openings silently falls back to coarse geometry.
for(const v of JSON.parse(fs.readFileSync(path.join(root,'version-registry.json'),'utf8')).versions){
 const html=fs.readFileSync(path.join(root,v.path),'utf8'),scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
 const i=scripts.indexOf('source-layout-corrections.js');
 assert.equal(scripts.filter(s=>s==='source-layout-corrections.js').length,1,v.id+' correction included once');
 assert(i>scripts.indexOf('kitchen-plan-corrections.js')&&i<scripts.indexOf('walk.js'),v.id+' source correction before interaction and binding');
 assert(html.indexOf('source-layout-corrections.js')<html.indexOf('</body>'),v.id+' valid document position');
}
(async()=>{const report=[];for(const [version,n] of Object.entries({v0:0,v1:2,v2:5,v3:6,v4:3,v5:4})){
 const f=await build(n),{T,V,c}=f,A=c.HOME_SOURCE_LAYOUT;V.selectRoom('closet');f.tick(120,30);
 assert.equal(c.HOME_BLENDER_V1.getState().state,'ready');assert.equal(A.records.length,9);
 for(const o of A.windowParts){const b=f.bounds(o);assert(b.y>=64.99&&b.y+b.d<=80.01);}
 const pivot=A.door,meta=pivot.userData.interactiveDoor;assert.equal(meta.openAngle,-Math.PI/2);assert(Math.abs(pivot.position.z+480-207)<1e-5);
 const door=c.HOME_INTERACTION.getState().entries.find(e=>e.name==='更衣室門');assert(door);
 const glass=A.windowParts.find(o=>o.material.transmission>0||[].concat(o.material).some(m=>m.transmission>0));assert(glass);
 const meshes=[];V.scene.traverse(o=>{if(o.isMesh&&!o.userData.allowance&&o.geometry.attributes.position)meshes.push(o);});
 function visible(o){for(;o;o=o.parent)if(!o.visible)return false;return true;}
 const ray=new T.Raycaster(V.pos(450,194,155),new T.Vector3(0,0,-1));
 for(const open of [false,true]){
  c.HOME_INTERACTION.setDoor(door.id,open);f.tick(120,30);const hits=ray.intersectObjects(meshes.filter(visible),false);assert(hits.length);assert.equal(hits[0].object,glass,version+' window must remain visible with door '+open);
 }
 const start=pivot.rotation.y;const collision=[];
 const leaf=pivot.children.find(o=>o.userData.name==='更衣室門');leaf.geometry.computeBoundingBox();
 const obstacles=meshes.filter(o=>{for(let p=o;p;p=p.parent)if(p===pivot)return false;const b=f.bounds(o);return visible(o)&&b.x<500&&b.x+b.w>390&&b.y<211&&b.y+b.d>110&&b.z<215&&b.z+b.h>1;});
 for(let k=0;k<=180;k++){
  pivot.rotation.y=-Math.PI/2*k/180;pivot.updateMatrixWorld(true);
  const b=leaf.geometry.boundingBox.clone().expandByScalar(-.08),inv=leaf.matrixWorld.clone().invert();
  for(const o of obstacles){if(!f.overlap(f.bounds(leaf),f.bounds(o),.08))continue;const mat=inv.clone().multiply(o.matrixWorld),p=o.geometry.attributes.position,ix=o.geometry.index;let hit=false;
   for(let i=0;i<(ix?ix.count:p.count);i+=3){const t=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,ix?ix.getX(i+j):i+j).applyMatrix4(mat));if(b.intersectsTriangle(new T.Triangle(...t))){hit=true;break;}}
   if(hit&&!collision.some(q=>q.name===(o.userData.name||o.name)))collision.push({name:o.userData.name||o.name,fraction:k/180});
  }
 }
 pivot.rotation.y=start;pivot.updateMatrixWorld(true);assert.deepEqual(collision,[],version+' door collisions');
 const cupboard=[];V.fittings.traverse(o=>{if(o.userData.cabinet?.name==='更衣室頂天櫃')cupboard.push(o);});assert.equal(cupboard.length,1);assert(f.bounds(cupboard[0]).x>=484.99);
 const kitchen=c.HOME_KITCHEN_PLAN;assert.equal(c.HOME_EQUIPMENT.units.dishwasher.name,'Bosch SMI8ZCS00X · 半嵌式');assert.equal(kitchen.window.z,122);
 report.push({version,window:[415,65,70,15,95,150],windowVisibleClosedAndOpen:true,doorHingeY:207,doorSamples:181,collisions:collision,besideWindowCabinetPreserved:true,BlenderState:c.HOME_BLENDER_V1.getState().state,kitchenPlanPreserved:true});console.log(version+' CW01 geometry and door passed');
 }fs.writeFileSync(path.join(out,'模型核對.json'),JSON.stringify({passed:true,versions:report,limits:'指定門片／窗視線幾何；尺寸尚未現場核定，非全屋施工碰撞或動態光影認證'},null,2));})().catch(e=>{console.error(e.message);process.exitCode=1});
