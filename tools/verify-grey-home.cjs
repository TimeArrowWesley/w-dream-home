'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),build=require('./home-test-fixture.cjs');
const R=path.resolve('調整紀錄/20260922灰石全屋');fs.mkdirSync(R,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function geometry(f){const rows=[];f.V.scene.updateMatrixWorld(true);for(const root of [f.V.architecture,f.V.fittings,f.V.beams])root.traverse(o=>{if(!o.isMesh||o.userData.gr06NewFitting)return;rows.push(JSON.stringify([o.id,hash(Buffer.from(o.geometry.attributes.position.array.buffer)),o.geometry.index?hash(Buffer.from(o.geometry.index.array.buffer)):null,o.matrixWorld.elements]));});return rows.sort();}
function equipment(f){const rows=[];for(const root of f.E.items)root.traverse(o=>{if(o.isMesh){const mats=Array.isArray(o.material)?o.material:[o.material];rows.push(JSON.stringify([o.id,...mats.map(m=>[m.id,m.color?.toArray(),m.map?.id,m.roughness,m.metalness,m.opacity])]))}});return rows.sort();}
(async()=>{const checks=[];for(let v=0;v<5;v++){
 const overrides={'grey-stone-design.js':''},f=await build(v===0?0:v+1,overrides);f.V.selectRoom('all');const g=geometry(f),e=equipment(f);delete overrides['grey-stone-design.js'];f.run('grey-stone-design.js');assert.deepEqual(geometry(f),g,'Existing geometry v'+v);assert.deepEqual(equipment(f),e,'Factory equipment finishes v'+v);
 const first=f.c.HOME_GREY_STONE.getState();f.c.HOME_GREY_STONE.apply();assert.deepEqual(geometry(f),g);assert.deepEqual(f.c.HOME_GREY_STONE.getState(),first,'Idempotent finish application');
 let stones=0,newFittings=0;f.V.fittings.traverse(o=>{if(o.isMesh&&o.userData.greyStoneRole?.includes('stone'))stones++;if(o.isMesh&&o.userData.gr06NewFitting)newFittings++;});assert(stones>=2);assert.equal(newFittings,[0,1,4].includes(v)?1:0);
 checks.push({version:'v'+v,geometryUnchanged:true,equipmentFinishesUnchanged:true,idempotent:true,stoneSurfaces:stones,newLinearLightMeshes:newFittings,state:first});fs.writeFileSync(path.join(R,'模型核對.json'),JSON.stringify({revision:'20260922-gr06',method:'Source position/index/world matrices and equipment material signatures before/after applying finishes. Added LED strip explicitly excluded; no construction or lighting-performance certification.',checks},null,2)+'\n');console.log('V'+v+' finish-only verification passed');
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
