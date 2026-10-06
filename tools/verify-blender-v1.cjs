'use strict';
// Exercises the production loader with local assets and the existing real scene.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
process.env.HOME_TEST_BLENDER_V1='1';
const build=require('./home-test-fixture.cjs'),root=path.resolve(__dirname,'..');
(async()=>{
 const f=await build(2),{c,V,T,get}=f,A=c.HOME_BLENDER_V1,checks=[];
 const check=(name,fn)=>{fn();checks.push(name);};
 check('Public upgrade loaded completely',()=>assert.equal(A.getState().state,'ready'));
 check('All replaced meshes retain their local envelopes and scene parents',()=>{
  assert(A.records.length>700);
  for(const r of A.records){assert(r.o.parent);assert.equal(r.o.geometry,r.geometry);assert(r.geometry.boundingBox.min.distanceTo(r.oldGeometry.boundingBox.min)<.035);assert(r.geometry.boundingBox.max.distanceTo(r.oldGeometry.boundingBox.max)<.035);}
 });
 check('Two stool cushions contain the actual Blender refinement',()=>{
  for(const id of ['M1761','M1765']){const r=A.records.find(r=>r.sourceId===id);assert(r);assert(r.geometry.attributes.position.count>r.oldGeometry.attributes.position.count);}
 });
 check('All glass remains translucent, with no opaque depth-writing pane',()=>{
  const glass=A.records.flatMap(r=>[].concat(r.material)).filter(m=>m.isMeshPhysicalMaterial&&m.transmission>0);assert(glass.length>10);assert(glass.every(m=>m.transparent&&!m.depthWrite&&m.opacity<.3));
 });
 check('Finish resets retain Blender materials and the privacy switch remains reversible',()=>{
  c.HOME_INDUSTRIAL.apply();c.HOME_R05.applyFinishes();
  for(const r of A.records)assert.equal(r.o.material,r.material);
  const study=A.records.filter(r=>r.o.userData.study);assert(study.length);
  get('glass').checked=true;get('glass').onchange();
  for(const r of study)assert.equal(r.o.material,V.finishContext.materials.white);
  get('glass').checked=false;get('glass').onchange();for(const r of A.records)assert.equal(r.o.material,r.material);
 });
 check('Door motion and dining controls still move the replacement geometry',()=>{
  const moving=A.records.filter(r=>{for(let o=r.o;o;o=o.parent)if(o.userData.slidingDoor?.key==='study-slide-r05')return true;return false;});assert(moving.length);
  c.HOME_INTERACTION.setDoor('study-slide-r05',false);f.tick(100,30);const old=moving.map(r=>new T.Box3().setFromObject(r.o));
  c.HOME_INTERACTION.setDoor('study-slide-r05',true);f.tick(100,30);assert.equal(c.HOME_INTERACTION.getState().entries.find(x=>x.key==='study-slide-r05').angle,1);assert(moving.some((r,i)=>new T.Box3().setFromObject(r.o).min.distanceTo(old[i].min)>80));
  const seats=['M1761','M1765'].map(id=>A.records.find(r=>r.sourceId===id).o),before=seats.map(o=>new T.Box3().setFromObject(o).getCenter(new T.Vector3()));c.HOME_R05.setDiningPulled(true);V.scene.updateMatrixWorld(true);
  seats.forEach((o,i)=>assert(Math.abs(new T.Box3().setFromObject(o).getCenter(new T.Vector3()).distanceTo(before[i])-20)<.02));c.HOME_R05.setDiningPulled(false);
 });
 check('LED off/on still changes the actual live fixtures',()=>{
  c.HOME_RGB.setEnabled(false);f.tick(40,30);assert(Object.values(c.HOME_RGB.fixtures).flatMap(x=>x.lights).every(x=>x.light.intensity===0));
  c.HOME_RGB.setEnabled(true);f.tick(40,30);assert(Object.values(c.HOME_RGB.fixtures).flatMap(x=>x.lights).every(x=>x.light.intensity>0));
 });
 check('Final V1 still sleeps at rest and keeps the existing moving-frame budget',()=>{
  c.HOME_RGB.setEnabled(false);c.HOME_TOUR.setMode('model');f.tick(90,1000/60);let start=V.renderer.draws;f.tick(180,1000/60);assert.equal(V.renderer.draws,start);
  start=V.renderer.draws;for(let i=0;i<180;i++){V.camera.position.x+=.1;f.tick(1,1000/60);}assert(V.renderer.draws-start>=85&&V.renderer.draws-start<=92);
 });
 const report={passed:true,state:A.getState(),checks,limits:'Offline real geometry and controls; visual WebGL review recorded separately. Model dimensions are not construction approval.'};
 const out=path.resolve(process.env.HOME_TEST_REPORT_DIR||path.join(root,'調整紀錄/20261006V1Blender網頁接入BW01'));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'Blender接入驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
