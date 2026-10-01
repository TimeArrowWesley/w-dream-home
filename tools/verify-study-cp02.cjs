'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),build=require('./home-test-fixture.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20261001電競房CP02');
const registry=JSON.parse(fs.readFileSync(path.join(P,'version-registry.json'),'utf8')).versions;
function geometry(f,root){f.V.scene.updateMatrixWorld(true);const list=[];root.traverse(o=>{if(o.isMesh){const b=f.bounds(o);list.push([o.name,o.userData.name,Object.values(b).map(n=>+n.toFixed(3))]);}});return list;}
(async()=>{const report={passed:false,versions:{},limits:'Model geometry and specified controls only; no construction, photometry or 300-book capacity certification.'};
 for(const v of registry){
  const before=await build(v.fixture,{'study-cyberpunk.js':'','study-cyberpunk-finalize.js':''}),f=await build(v.fixture);
  assert.deepEqual(geometry(f,f.V.architecture),geometry(before,before.V.architecture),'fixed walls, windows and each original door stay put');
  const PCs=f.E.items.filter(o=>o.userData.equipment?.key==='pc'),oldPCs=before.E.items.filter(o=>o.userData.equipment?.key==='pc');
  assert.deepEqual(JSON.parse(JSON.stringify(PCs.map(p=>p.position.toArray()))),JSON.parse(JSON.stringify(oldPCs.map(p=>p.position.toArray()))),'computer locations retained');
  if(v.id==='v0'){assert(!f.c.HOME_STUDY_CP);assert.deepEqual(geometry(f,f.V.fittings),geometry(before,before.V.fittings));report.versions.v0={originalRetained:true};continue;}
  const cp=f.c.HOME_STUDY_CP,drawers=[];cp.group.traverse(o=>{if(o.userData.cpRole==='drawer')drawers.push(o);if(o.isMesh)assert(Object.values(f.bounds(o)).every(Number.isFinite));});assert.equal(drawers.length,6);
  for(const [o,m] of cp.finishes)assert.equal(o.material,m,'palette finalized');
  f.c.HOME_GREY_STONE.apply();for(const [o,m] of cp.finishes)assert.equal(o.material,m,'palette survives reset');
  f.c.HOME_RGB.setEnabled(false);assert(cp.accent.every(a=>a.material.color.r===0&&a.material.color.g===0&&a.material.color.b===0),'all new accent LEDs off');
  f.c.HOME_RGB.setEnabled(true);assert(cp.accent.every(a=>a.material.color.r+a.material.color.g+a.material.color.b>0),'all new accent LEDs on');
  assert.equal(f.c.HOME_RGB.getState().study.mode,'cyberpunk');
  const colors=new Set(f.c.HOME_RGB.fixtures.study.segments.map(e=>e.material.color.getHexString()));assert.equal(colors.size,2,'two-tone ceiling');
  f.V.selectRoom('study');f.tick(20);const draws=f.V.renderer.draws||0;f.tick(30);assert.equal(f.V.renderer.draws||0,draws,'static two-tone mode returns to idle');
  const doors=f.c.HOME_INTERACTION.getState().entries.filter(e=>String(e.name).startsWith('CP02'));assert(doors.length>=7,'new cabinet doors registered before interaction setup');
  report.versions[v.id]={sixDrawers:drawers.length,doors:doors.length,ledMaster:true,staticIdle:true,unchangedArchitecture:true,computerPositionsRetained:true};
 }
 const captures=registry.filter(v=>v.id!=='v0').flatMap(v=>JSON.parse(fs.readFileSync(path.join(R,'captures-'+v.id+'.json'),'utf8')));
 for(const a of 'ABCDE')assert.equal(new Set(captures.filter(e=>e.angle===a).map(e=>e.modelHash)).size,1,'identical shared '+a+' source pixels');
 report.passed=true;report.sharedSources=5;report.slots=25;fs.writeFileSync(path.join(R,'模型驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
