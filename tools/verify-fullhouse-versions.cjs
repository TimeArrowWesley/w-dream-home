'use strict';
// Actual source geometry and controls; browser/GPU visual review is separate.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
process.env.HOME_TEST_BW04='1';
const build=require('./home-test-fixture.cjs'),root=path.resolve(__dirname,'..');
const fixtures={v0:0,v2:5,v3:6,v4:3,v5:4};
(async()=>{
 for(const version of process.argv.slice(2).length?process.argv.slice(2):Object.keys(fixtures)){
  const f=await build(fixtures[version]),{c,V,T,get}=f,A=c.HOME_BLENDER_HOME,checks=[];
  const check=(name,fn)=>{fn();checks.push(name);};
  check('Correct version and complete all-room replacement',()=>{
   assert.equal(c.HOME_LAYOUT.displayVersion,version);assert.equal(A.getState().state,'ready');assert(A.records.length>1700);
   assert.equal(new Set(A.records.map(r=>r.room)).size,10);
   for(const r of A.records){assert(r.o.parent);assert.equal(r.o.geometry,r.geometry);for(const face of ['min','max'])for(const axis of ['x','y','z'])assert(Math.abs(r.replacementWorldBounds[face][axis]-r.sourceWorldBounds[face][axis])<.035);}
  });
  check('Glass is transparent; finish reset and privacy are reversible',()=>{
   const glass=A.records.flatMap(r=>[].concat(r.material)).filter(m=>m.transmission>0);assert(glass.length>10);assert(glass.every(m=>m.transparent&&!m.depthWrite&&m.opacity<.3));
   c.HOME_INDUSTRIAL.apply();c.HOME_BLACK_INDUSTRIAL.apply();for(const r of A.records)assert.equal(r.o.material,r.material);
   get('glass').checked=true;get('glass').onchange();const study=A.records.filter(r=>r.o.userData.study);assert(study.length);
   for(const r of study)assert.equal(r.o.material,V.finishContext.materials.white);
   get('glass').checked=false;get('glass').onchange();for(const r of A.records)assert.equal(r.o.material,r.material);
  });
  check('Blender refinements are geometric, including rounded furniture',()=>{
   const detailed=A.records.filter(r=>r.geometry.attributes.position.count>r.oldGeometry.attributes.position.count*1.5);assert(detailed.length>40);
   const hidden=A.records.filter(r=>r.hidden);assert.equal(hidden.length,1);assert(!hidden[0].o.visible);
  });
  if(version==='v0')check('Original curved monitor retains a black low-reflection screen',()=>{
   const screen=A.records.find(r=>r.sourceId==='M1111').material;
   assert(screen.isMeshPhysicalMaterial);assert(screen.reflectivity<.06);assert(screen.envMapIntensity<.04);
  });
  check('Five live mirror planes follow the original movable furniture',()=>{
   assert.equal(c.HOME_FULLHOUSE_MIRRORS.getState().count,5);
   const rec=A.records.find(r=>r.referenceId==='M2111'),plane=rec.o.children.find(x=>x.userData.bw03Mirror);assert(plane);
   const before=plane.getWorldQuaternion(new T.Quaternion());assert(c.HOME_BEDROOM.setFurniture('mirror',true));
   const after=plane.getWorldQuaternion(new T.Quaternion());assert(before.angleTo(after)>1.5);c.HOME_BEDROOM.setFurniture('mirror',false);
   for(const key of ['drawer','perfumeLeft','perfumeRight','closetDrawer']){assert(c.HOME_BEDROOM.setFurniture(key,true));assert(c.HOME_BEDROOM.getState()[key]);assert(c.HOME_BEDROOM.setFurniture(key,false));}
  });
  check('Existing kitchen door still moves replacement meshes',()=>{
   const door=c.HOME_INTERACTION.getState().entries.find(x=>x.key==='kitchen');
   assert(door);const moving=A.records.filter(r=>{for(let o=r.o;o;o=o.parent)if(o.userData.slidingDoor?.key===door.key)return true;return false;});assert(moving.length);
   c.HOME_INTERACTION.setDoor(door.key,false);f.tick(100,30);const before=moving.map(r=>r.o.getWorldPosition(new T.Vector3()));
   c.HOME_INTERACTION.setDoor(door.key,true);f.tick(100,30);assert.equal(c.HOME_INTERACTION.getState().entries.find(x=>x.key===door.key).angle,1);assert(moving.some((r,i)=>r.o.getWorldPosition(new T.Vector3()).distanceTo(before[i])>10));
  });
  if(['v4','v5'].includes(version))check('Historical rotating TV still rotates upgraded geometry',()=>{
   const p=c.HOME_ROTATING_TV.pivot;assert(p);const moving=A.records.filter(r=>{for(let o=r.o;o;o=o.parent)if(o===p)return true;return false;});assert(moving.length);
   c.HOME_TOUR.setMode('model');c.HOME_ROTATING_TV_CONTROLS.setTarget('island');f.tick(500,30);assert(Math.abs(p.rotation.y-Math.PI)<.001);
   c.HOME_ROTATING_TV_CONTROLS.setTarget('living');f.tick(500,30);assert(Math.abs(p.rotation.y)<.001);
  });
  check('LED fixtures and split indirect light respond to controls',()=>{
   c.HOME_RGB.setEnabled(false);f.tick(40,30);assert(Object.values(c.HOME_RGB.fixtures).flatMap(x=>x.lights).every(x=>x.light.intensity===0));
   c.HOME_RGB.setEnabled(true);f.tick(40,30);assert(Object.values(c.HOME_RGB.fixtures).flatMap(x=>x.lights).every(x=>x.light.intensity>0));
   const L=c.HOME_FULLHOUSE_LIGHT;assert.equal(L.getState().state,'ready');const original=c.HOME_COMFORT.getState();get('night').classList.remove('active');L.update();const day=L.getState().power[0];
   get('night').classList.add('active');c.HOME_COMFORT.update({brightness:0,display:0});L.update();const p=L.getState().power;assert(p[0]<day*.1);assert.equal(p[1],0);assert.equal(p[2],0);
   if(version==='v0')assert.equal(L.getState().rgb,0);
   const wall=A.records.flatMap(r=>[].concat(r.material)).find(m=>m.userData.sourceMaterialId===85);assert(wall);
   const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};wall.onBeforeCompile(shader);
   assert(shader.fragmentShader.includes('bwStoneWorld'));assert(shader.fragmentShader.includes('bwIrradiance'));assert(shader.uniforms.bwFineStone);assert(shader.uniforms.bwDay.value);
   get('night').classList.remove('active');c.HOME_COMFORT.update(original);L.update();
  });
  check('Idle sleep and moving-frame render budget remain intact',()=>{
   c.HOME_RGB.setEnabled(false);c.HOME_TOUR.setMode('model');f.tick(90,1000/60);let start=V.renderer.draws;f.tick(180,1000/60);assert.equal(V.renderer.draws,start);
   start=V.renderer.draws;for(let i=0;i<180;i++){V.camera.position.x+=.1;f.tick(1,1000/60);}assert(V.renderer.draws-start>=85&&V.renderer.draws-start<=92);
  });
  const report={version,passed:true,state:A.getState(),lighting:c.HOME_FULLHOUSE_LIGHT.getState(),mirrors:c.HOME_FULLHOUSE_MIRRORS.getState(),checks,limits:'Offline geometry/controls; browser WebGL checks and construction verification are separate.'};
  const out=path.resolve(process.env.HOME_TEST_REPORT_DIR||path.join(root,'調整紀錄/20261006全版本擬真BW04'));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,version+'-runtime-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
