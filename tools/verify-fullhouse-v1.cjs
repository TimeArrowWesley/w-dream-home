'use strict';
// Exercises the production loader with local assets and the existing real scene.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
process.env.HOME_TEST_BW03='1';
const build=require('./home-test-fixture.cjs'),root=path.resolve(__dirname,'..');
(async()=>{
 const f=await build(2),{c,V,T,get}=f,A=c.HOME_BLENDER_V1,checks=[];
 const check=(name,fn)=>{fn();checks.push(name);};
 check('All-room upgrade loaded completely',()=>assert.equal(A.getState().state,'ready'));
 check('All replaced meshes retain their source world envelopes and scene parents',()=>{
  assert(A.records.length>1900);assert(new Set(A.records.map(r=>r.room)).size===10);
  for(const r of A.records){assert(r.o.parent);assert.equal(r.o.geometry,r.geometry);for(const face of ['min','max'])for(const axis of ['x','y','z'])assert(Math.abs(r.replacementWorldBounds[face][axis]-r.sourceWorldBounds[face][axis])<.035);}
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
 check('BW03 uses actual split lightmaps and dimming changes their shader weights',()=>{
  const L=c.HOME_FULLHOUSE_LIGHT;assert.equal(L.getState().state,'ready');
  const original=c.HOME_COMFORT.getState();get('night').classList.remove('active');L.update();const day=L.getState().power[0];
  get('night').classList.add('active');c.HOME_COMFORT.update({brightness:0,display:0});L.update();let p=L.getState().power;
  assert(p[0]<day*.1);assert.equal(p[1],0);assert.equal(p[2],0);
  c.HOME_COMFORT.update({brightness:85,display:55,kelvin:3000});p=L.getState().power;assert.equal(p[1],1);assert.equal(p[2],1);
  const wall=A.records.find(r=>r.sourceId==='M0502').material,shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};wall.onBeforeCompile(shader);
  assert(shader.fragmentShader.includes('bwStoneWorld'));assert(shader.fragmentShader.includes('bwIrradiance'));assert(shader.uniforms.bwDay.value);assert.equal(wall.lightMapIntensity,0);
  const glass=A.records.flatMap(r=>[].concat(r.material)).find(m=>m.transmission>0),gs={fragmentShader:T.ShaderLib.standard.fragmentShader};glass.onBeforeCompile(gs);assert(gs.fragmentShader.includes('bwGlassAlpha'));
  get('night').classList.remove('active');c.HOME_COMFORT.update(original);L.update();
 });
 check('Final V1 still sleeps at rest and keeps the existing moving-frame budget',()=>{
  c.HOME_RGB.setEnabled(false);c.HOME_TOUR.setMode('model');f.tick(90,1000/60);let start=V.renderer.draws;f.tick(180,1000/60);assert.equal(V.renderer.draws,start);
  start=V.renderer.draws;for(let i=0;i<180;i++){V.camera.position.x+=.1;f.tick(1,1000/60);}assert(V.renderer.draws-start>=85&&V.renderer.draws-start<=92);
 });
 const report={passed:true,state:A.getState(),lighting:c.HOME_FULLHOUSE_LIGHT.getState(),checks,limits:'Offline real geometry and controls; visual WebGL review recorded separately. Model dimensions are not construction approval.'};
 const out=path.resolve(process.env.HOME_TEST_REPORT_DIR||path.join(root,'調整紀錄/20261006V1全屋擬真BW03'));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'Blender接入驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
