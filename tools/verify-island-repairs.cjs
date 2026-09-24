'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),build=require('./home-test-fixture.cjs');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.HOME_TEST_REPORT_DIR||path.join(root,'調整紀錄/20260924全版本模型修復'));fs.mkdirSync(out,{recursive:true});
const versions=JSON.parse(fs.readFileSync(path.join(root,'version-registry.json'),'utf8')).versions;
(async()=>{const report={revision:'20260924-ir01',passed:false,method:'Actual Three.js geometry and interaction with an offline renderer stub; browser GPU review recorded separately.',versions:[]};
 for(const v of versions){const f=await build(v.fixture),{T,V,E,c,bounds}=f;f.tick(3);const shell=c.HOME_ISLAND_SHELL;assert(shell&&shell.version===v.id);V.scene.updateMatrixWorld(true);
  let meshes=0;V.scene.traverse(o=>{if(!o.isMesh)return;meshes++;for(const a of Object.values(o.geometry.attributes))assert(Array.from(a.array).every(Number.isFinite),v.id+' invalid vertex '+o.name);});
  const sinks=[];V.fittings.traverse(o=>{if(/^sink-/.test(o.userData.islandSurface||'')){assert.equal(o.material.side,T.DoubleSide,v.id+' hidden sink interior');sinks.push(o.userData.islandSurface);}});assert(sinks.length>=3);
  const tv=E.items.find(o=>o.userData.equipment.key==='tv'),screen=tv.children.find(o=>o.userData.equipmentSurface==='tv-screen'),body=tv.children[0];assert(screen);screen.geometry.computeBoundingBox();body.geometry.computeBoundingBox();const screenFront=screen.position.z+screen.geometry.boundingBox.min.z,bodyFront=body.position.z+body.geometry.boundingBox.min.z;assert(bodyFront-screenFront>=.079,'TV screen/case separation');
  const collisions=[];for(const p of shell.added)for(const appliance of E.items){if(!['wine','robot','clar','ih'].includes(appliance.userData.equipment.key))continue;if(f.overlap(bounds(p),bounds(appliance),.06))collisions.push([p.name,appliance.userData.equipment.key]);}assert.deepEqual(collisions,[],v.id+' new panel intersects appliance');
  const before=c.HOME_INTERACTION.getState(),doors=before.entries.filter(d=>d.name.startsWith('IR01'));
  for(const d of doors){assert(c.HOME_INTERACTION.setDoor(d.id,true));f.tick(100,30);const open=c.HOME_INTERACTION.getState().entries.find(e=>e.id===d.id);assert(Math.abs(open.angle-open.openAngle)<.001);c.HOME_INTERACTION.setDoor(d.id,false);f.tick(100,30);assert(Math.abs(c.HOME_INTERACTION.getState().entries.find(e=>e.id===d.id).angle)<.001);}
  c.HOME_INDUSTRIAL.apply();c.HOME_R05?.applyFinishes();V.fittings.traverse(o=>{if(/^sink-/.test(o.userData.islandSurface||''))assert.equal(o.material.side,T.DoubleSide,'finish reset lost inner sink');});
  const rec={version:v.id,history:v.history,meshes,sinkParts:sinks.length,addedPanels:shell.added.length,applianceCollisions:collisions,operableNewDoors:doors.map(d=>d.name),tvScreenClearanceCm:bodyFront-screenFront,islandFootprint:shell.island.userData.footprint};report.versions.push(rec);fs.writeFileSync(path.join(out,'模型驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(rec));
 }
 report.passed=true;report.limits='指定設備及新門片抽樣；不是全連續角度、施工或現場安裝認證。';fs.writeFileSync(path.join(out,'模型驗證.json'),JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
