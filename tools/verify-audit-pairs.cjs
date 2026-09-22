'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),build=require('./home-test-fixture.cjs'),{collision}=require('./verify-model-repairs.cjs');
const mesh=g=>{const a=[];g.traverse(o=>{if(o.isMesh)a.push(o);});return a;};
(async()=>{const records=[];for(let v=1;v<=4;v++){
 const f=await build(v+1),{V,c}=f;c.HOME_REALISM.render=()=>{};c.HOME_REALISM.invalidate=()=>{};
 const states=c.HOME_INTERACTION.getState().entries,pivots=new Map();V.scene.traverse(o=>{if(o.isGroup&&o.userData.interactionId!==undefined)pivots.set(o.userData.interactionId,o);});
 const entry=states.find(e=>e.name==='主浴80cm門洞'),eg=pivots.get(entry.id),shower=V.scene.getObjectByName('MR01 主浴淋浴滑門'),glass=mesh(shower).find(o=>o.userData.slideRatio),start=glass.position.z;
 let samples=0,hits=0;for(let a=0;a<=30;a++)for(let b=0;b<=30;b++){eg.rotation.y=entry.openAngle*a/30;glass.position.z=start+79*b/30;V.scene.updateMatrixWorld(true);samples++;for(const x of mesh(eg))for(const y of mesh(shower))if(collision(f,x,y))hits++;}
 eg.rotation.y=0;glass.position.z=start;assert.equal(hits,0,'Master paired movement V'+v);
 let tvCheck=null;if(v===3){const tv=c.HOME_ROTATING_TV,subs=f.E.items.filter(o=>o.userData.equipment.key==='sub').flatMap(mesh);let collisions=0;for(let k=0;k<=180;k++){tv.pivot.rotation.y=k*Math.PI/180;V.scene.updateMatrixWorld(true);for(const a of mesh(tv.pivot))for(const b of subs)if(collision(f,a,b))collisions++;}assert.equal(collisions,0,'V3 moved subwoofer hits rotating TV');tvCheck={samples:181,hits:collisions};}
 records.push({version:'v'+v,masterDoorPair:{samples,hits},tvAgainstMovedSubs:tvCheck});console.log('V'+v+' paired-motion passed');
 }fs.writeFileSync(path.resolve('調整紀錄/20260922全版本模型與AI複核/同時開啟核對.json'),JSON.stringify({revision:'20260922-qa03',method:'Sampled source meshes; master entrance 0..90 degrees against full shower travel. Not site approval.',records},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
