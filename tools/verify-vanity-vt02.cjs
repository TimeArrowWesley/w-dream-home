'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),build=require('./home-test-fixture.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20261001全版本化妝桌VT02');
const versions=JSON.parse(fs.readFileSync(path.join(P,'version-registry.json'),'utf8')).versions;
const vis=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
function hashGeometry(f,root,omitVanity=false){f.V.scene.updateMatrixWorld(true);const a=[];root.traverse(o=>{if(!o.isMesh)return;let vanity=false;for(let p=o;p;p=p.parent)if(p.userData.masterVanity||/VT02|化妝|飾品抽屜/.test(p.userData.name||p.name||''))vanity=true;if(omitVanity&&vanity)return;a.push([o.name,o.userData.name,Array.from(o.geometry.attributes.position.array),o.matrixWorld.elements,vis(o)]);});return crypto.createHash('sha256').update(JSON.stringify(a)).digest('hex');}
(async()=>{const report={passed:false,versions:[],limits:'Six versions, specified mesh/state checks only; no construction, body fit, hardware load, window-opening or photometric certification.'};
 for(const v of versions){
  const before=await build(v.fixture,{'vanity-display.js':'','vanity-display-finalize.js':''}),f=await build(v.fixture),{V,c}=f,Q=c.HOME_VANITY,C=c.HOME_BEDROOM;
  assert(Q,'shared vanity exists');assert.equal(hashGeometry(f,V.architecture),hashGeometry(before,before.V.architecture),'architecture stays unchanged');
  assert.equal(hashGeometry(f,V.fittings,true),hashGeometry(before,before.V.fittings,true),'non-vanity furniture stays unchanged');
  for(const key of ['mirror','stool','drawer','perfumeLeft','perfumeRight','closetDrawer']){
   assert(C.setFurniture(key,true));assert(C.getState()[key]);
   f.near(c.HOME_BEDROOM_MODEL.groups[key].position.x,{mirror:35,stool:48,drawer:18,perfumeLeft:55,perfumeRight:55,closetDrawer:-35}[key],key+' travel');
   if(key==='mirror')f.near(Q.hinge.rotation.z,Math.PI/2,'mirror upright');
   assert(C.setFurniture(key,false));assert(!C.getState()[key]);
  }
  const fixed=[];for(const root of [V.architecture,V.fittings])root.traverse(o=>{if(o.isMesh&&vis(o)&&!Q.root.getObjectById(o.id)&&!Q.stool.getObjectById(o.id)){const b=f.bounds(o);if(f.overlap(b,{x:-75,y:85,z:0,w:160,d:200,h:160},0))fixed.push({o,b});}});
  const conflicts=[];
  for(const key of ['mirror','perfumeLeft','perfumeRight','drawer']){
   const group=c.HOME_BEDROOM_MODEL.groups[key],moving=[];group.traverse(o=>{if(o.isMesh)moving.push(o);});
   const own=[];Q.root.traverse(o=>{if(o.isMesh&&!moving.includes(o))own.push({o,b:f.bounds(o)});});
   for(let step=0;step<=24;step++){
    if(key==='mirror')Q.mirrorProgress(step/24);else group.position.x=Q.travel[key]*step/24;
    V.scene.updateMatrixWorld(true);
    for(const a of moving){const ab=f.bounds(a);for(const {o,b} of [...fixed,...own])if(f.overlap(ab,b,.3))conflicts.push({key,step,a:a.name,b:o.name||o.userData.name});}
   }
   if(key==='mirror')Q.mirrorProgress(0);else group.position.x=0;
  }
  assert.deepEqual(conflicts,[],'sampled mirror/drawer motion clears existing geometry');
  C.setScene('makeup');C.setFurniture('mirror',true);assert(c.HOME_BEDROOM_MODEL.diffusers.mirror.every(o=>o.material.emissiveIntensity>0));
  C.setFurniture('mirror',false);assert(c.HOME_BEDROOM_MODEL.diffusers.mirror.every(o=>o.material.emissiveIntensity===0),'closed mirror lamps off');C.setScene('daily');
  c.HOME_GREY_STONE.apply();for(const [o,m] of Q.finishes)assert.equal(o.material,m,'accepted finish persists');
  assert.equal(c.HOME_BEDROOM_MODEL.groups.perfumeLeft,Q.perfumeTrays[1],'left from seated viewpoint');assert.equal(c.HOME_BEDROOM_MODEL.groups.perfumeRight,Q.perfumeTrays[0]);
  c.HOME_TOUR.setMode('walk');f.tick(2);V.camera.position.copy(V.pos(45,260,165));assert.equal(C.setFurniture('perfumeLeft',true),false,'do not pull perfume tray into walker');
  c.HOME_TOUR.setMode('model');assert(C.setFurniture('perfumeLeft',true));const end=f.bounds(c.HOME_BEDROOM_MODEL.groups.perfumeLeft);f.near(100-end.x-end.w,36,'remaining bedside space at perfume tray');C.setFurniture('perfumeLeft',false);
  report.versions.push({version:v.id,architectureUnchanged:true,otherFurnitureUnchanged:true,controls:6,sweepSamples:100,conflicts:0,walkerGuard:true,closedMirrorLightsOff:true,kneeHeight:Q.spec.kneeHeight,perfumeClearHeight:Q.spec.perfumeClearHeight});console.log(v.id+' VT02 passed');
 }
 report.passed=true;fs.writeFileSync(path.join(R,'模型驗證.json'),JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
