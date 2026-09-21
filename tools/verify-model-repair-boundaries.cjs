'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),build=require('./home-test-fixture.cjs');
const out=path.resolve('調整紀錄/20260921四版動線修正');
let baseline;const saved=path.join(out,'baseline.json');
if(fs.existsSync(saved))baseline=JSON.parse(fs.readFileSync(saved,'utf8'));
else{const cp=require('child_process'),ref='82c09791d7977d655416f7ba9f548cf29feeebad';baseline={'model-repairs.js':''};for(const f of cp.execFileSync('git',['ls-tree','-r','--name-only',ref],{encoding:'utf8'}).split('\n').filter(f=>f.endsWith('.js')))baseline[f]=cp.execFileSync('git',['show',ref+':'+f],{encoding:'utf8',maxBuffer:32*1024*1024});}
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function sig(objects){return Array.from(objects,o=>{o.updateWorldMatrix(true,false);const g=o.geometry;return JSON.stringify({name:o.userData.name||o.name,p:hash(Buffer.from(g.attributes.position.array.buffer)),i:g.index?hash(Buffer.from(g.index.array.buffer)):null,m:o.matrixWorld.elements});}).sort();}
function meshes(g){const a=[];g.traverse(o=>{if(o.isMesh)a.push(o);});return a;}
(async()=>{const checks=[];for(let v=0;v<5;v++){
 const n=v===0?0:v+1,f=await build(n),old=await build(n,baseline);
 for(const q of [f,old]){for(const p of q.V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}q.V.scene.updateMatrixWorld(true);}
 assert.deepEqual(sig(f.V.wallParts.map(p=>p.m)),sig(old.V.wallParts.map(p=>p.m)),'Fixed walls/window mullions moved V'+v);
 assert.deepEqual(sig(meshes(f.V.beams)),sig(meshes(old.V.beams)),'Beam changes V'+v);
 assert.deepEqual(sig(f.E.items.filter(o=>v!==3||o.userData.equipment.key!=='sub').flatMap(meshes)),sig(old.E.items.filter(o=>v!==3||o.userData.equipment.key!=='sub').flatMap(meshes)),'Equipment other than V3 subs moved V'+v);
 assert.deepEqual(sig(meshes(f.E.refinements.guestStorage.group)),sig(meshes(old.E.refinements.guestStorage.group)),'Guest bath GB04 changed V'+v);
 if(v===0)assert.deepEqual(sig(meshes(f.V.scene)),sig(meshes(old.V.scene)),'Original V0 geometry changed');
 checks.push({version:'v'+v,fixedWalls:true,beams:true,equipmentRetainedExceptV3Subs:true,guestBathGB04:true,fullOriginalRetained:v===0?true:undefined});console.log('V'+v+': boundaries and retained equipment passed.');
 }fs.writeFileSync(path.join(out,'保留條件核對.json'),JSON.stringify({revision:'20260921-mr01',checks},null,2)+'\n');})().catch(e=>{console.error(e);process.exitCode=1;});
