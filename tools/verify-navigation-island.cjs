'use strict';
// Actual application geometry, animation handlers and ray intersections. No GPU.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {performance}=require('perf_hooks'),build=require('./home-test-fixture.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'調整紀錄/20260910動線與模型修正');
const files=['design.js','提案/旋轉電視與直線中島/design.js','equipment-models.js','walk.js','interaction.js','realism.js'];
const report={method:'Actual Three.js geometry and animation/collision handlers with stubbed renderer. GPU frame rate and visual materials are not measured.',hashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')])),variants:{}};
(async()=>{
for(const n of [2,3]){const publicVersion=n===2?'v1':'v2';
 const {T,c,V,E,events,raf,get,bounds,tick}=await build(n),near=(a,b,m,t=.025)=>assert(Math.abs(a-b)<t,`${m}: ${a}, expected ${b}`);
 const island=V.scene.getObjectByName(n<3?'曲線設備中島':'直線設備中島'),sink=island.userData.island.sink;
 V.scene.updateMatrixWorld(true);
 function down(x,y){return new T.Raycaster(V.pos(x,y,150),new T.Vector3(0,-1,0)).intersectObject(island,true).filter(h=>h.object.visible&&!h.object.userData.allowance)[0];}
 const surface=[];
 for(const r of [0,5,9.5,10.6,11.4,12.5])for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
  const h=down(sink.x+r*Math.cos(a),sink.y+r*Math.sin(a));assert(h,'sink surface gap');
  if(r<10.7){assert(h.point.y<94.9,'sink must be hollow below the countertop');assert(['sink-bowl','sink-drain'].includes(h.object.userData.islandSurface),'visible inner basin');}
  else if(r===11.4){assert(h.point.y>95&&h.point.y<95.2,'rim sits above stone without coplanar surfaces');}
  else near(h.point.y,95,'stone outside sink');surface.push(h.point.y);
 }
 const ih=E.items.find(o=>o.userData.equipment.key==='ih');
 for(const x of [-14.5,0,14.5])for(const z of [-25.5,0,25.5]){const p=new T.Vector3(x,0,z).applyMatrix4(ih.matrixWorld),h=down(p.x+482.5,p.z+480);near(h.point.y,95.4,'IH glass above stone');assert.equal(h.object.userData.islandSurface,'ih-glass');}
 const chassis=ih.children.find(o=>o.userData.islandSurface==='ih-chassis'),b=bounds(chassis);
 const cut=n<3?{x:480.8,y:599.5,w:27,d:49.5}:{x:448.3,y:547.8,w:49.5,d:27};
 assert(b.x>cut.x&&b.y>cut.y&&b.x+b.w<cut.x+cut.w&&b.y+b.d<cut.y+cut.d,'IH chassis fits the stone opening');
 // Model mode moves every animation frame, including before OS key repeat.
 V.selectRoom('living');c.HOME_TOUR.setMode('model');tick(2);
 const key=(type,k,target={closest:()=>false})=>{for(const fn of events.get(type)||[])fn({key:k,target,preventDefault(){},stopImmediatePropagation(){}});};
 let start=V.camera.position.clone();key('keydown','w');const steps=[];
 for(let i=0;i<20;i++){const previous=V.camera.position.clone();tick();steps.push(previous.distanceTo(V.camera.position));}
 key('keyup','w');near(start.distanceTo(V.camera.position),33.6,'20 continuous 16ms frames',.05);assert(steps.every(x=>x>1.67&&x<1.69),'no key-repeat pauses or jumps');
 start=V.camera.position.clone();tick(4);near(start.distanceTo(V.camera.position),0,'keyup stops immediately');
 key('keydown','w',{closest:()=>true});tick(3);near(start.distanceTo(V.camera.position),0,'controls do not move camera');
 key('keydown','w');c.dispatchEvent(new c.Event('blur'));tick(3);near(start.distanceTo(V.camera.position),0,'blur clears held keys');
 // Default drawing has no full-screen 32-sample pass, and reuses shadow maps.
 const rs=c.HOME_REALISM.getState();assert.equal(rs.quality,'eco');const before=rs.shadowUpdates;tick(60);
 const after=c.HOME_REALISM.getState();assert(after.shadowUpdates-before<=7,'at most 7 shadow refreshes per 60 x 16ms frames');assert.equal(after.postPasses,0,'eco mode does not run occlusion pass');near(V.renderer.getPixelRatio(),1,'default device-pixel ratio cap');
 c.HOME_REALISM.setQuality('high');tick(20);assert(c.HOME_REALISM.getState().postPasses>0,'detail mode remains available at rest');c.HOME_REALISM.setQuality('eco');
 const doors=[];V.architecture.traverse(g=>{if(g.userData.interactiveDoor){const m=g.children.find(o=>o.isMesh&&o.userData.name),rotation=g.rotation.y;g.rotation.y=0;V.scene.updateMatrixWorld(true);doors.push({g,m,name:g.userData.interactiveDoor.name,b:bounds(m)});g.rotation.y=rotation;}});
 V.selectRoom('living');c.HOME_WALK.enter();V.camera.position.copy(V.pos(370,700,165));
 const I=c.HOME_INTERACTION;for(const d of doors)I.setDoor(d.name,false);tick(100);
 for(const d of doors){const b=d.b;assert(I.blocksPoint(b.x+b.w/2-482.5,b.y+b.d/2-480,18),d.name+' closed blocks passage');I.setDoor(d.name,true);}
 tick(130);const crossings=[];
 for(const d of doors){near(Math.abs(d.g.rotation.y),Math.PI/2,d.name+' opens 90 degrees');const opened=bounds(d.m);for(const part of V.wallParts){const w=bounds(part.m);const overlap=opened.x<w.x+w.w-.025&&opened.x+opened.w>w.x+.025&&opened.y<w.y+w.d-.025&&opened.y+opened.d>w.y+.025&&opened.z<w.z+w.h-.025&&opened.z+opened.h>w.z+.025;assert(!overlap,d.name+' open leaf penetrates wall / jamb');}if(d.name==='入戶門')continue;const b=d.b,alongX=b.w>b.d;for(let k=-25;k<=25;k+=5){const x=b.x+b.w/2+(alongX?0:k),y=b.y+b.d/2+(alongX?k:0);assert(c.HOME_WALK.canStand(x-482.5,y-480),d.name+` open passage at ${x},${y}`);}crossings.push(d.name);}
 // A person in the study door sweep pauses it without losing the open request.
 V.camera.position.copy(V.pos(370,700,165));I.setDoor('書房玻璃門',false);tick(100);V.camera.position.copy(V.pos(850,430,165));I.setDoor('書房玻璃門',true);tick(100);
 let study=I.getState().entries.find(e=>e.name==='書房玻璃門');assert(study.blocked&&Math.abs(study.angle)<Math.PI/2,'door pauses before person');near(Math.abs(study.target),Math.PI/2,'opening request retained');
 V.camera.position.copy(V.pos(370,700,165));tick(100);study=I.getState().entries.find(e=>e.name==='書房玻璃門');near(Math.abs(study.angle),Math.PI/2,'door resumes to 90 after person steps away');
 // Sliding doors retain their actual travel and are tested by walking across them.
 for(const [name,x,y,axis] of [['客浴雙聯滑門',532,377,'y'],['kitchen',205,685,'x']]){
  I.setDoor(name,false);tick(220);assert(!c.HOME_WALK.canStand(x-482.5,y-480),'sliding door blocks when closed');I.setDoor(name,true);tick(220);
  for(let k=-25;k<=25;k+=5)assert(c.HOME_WALK.canStand(x-482.5+(axis==='x'?k:0),y-480+(axis==='y'?k:0)),name+' opens a walkable passage');
 }
 let aisles=null;
 if(n>2){
  const speakers=E.items.filter(o=>o.userData.equipment.key==='q7').map(bounds);for(const q of speakers){assert(q.y>=460&&q.y+q.d<=660,'speaker must not enter cross aisles');near(q.w,31.5,'speaker true depth');near(q.d,31.7,'speaker true width');}
  const TV=c.HOME_ROTATING_TV;
  for(let a=0;a<=180;a+=1){TV.pivot.rotation.y=a*Math.PI/180;V.scene.updateMatrixWorld(true);const t=bounds(TV.pivot);for(const q of speakers)assert(q.x>=t.x+t.w||q.y>=t.y+t.d||q.y+q.d<=t.y,'TV sweep clears speakers');}
  TV.pivot.rotation.y=0;V.scene.updateMatrixWorld(true);
  // Normal circulation width excludes deliberately opened room-door sweeps.
  for(const d of doors)I.setDoor(d.name,false);tick(100);
  const route=[[585,417.5],[835,417.5]],south=[[585,706.5],[800,706.5],[800,740],[1030,740]];
  for(const points of [route,south])for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/5));for(let k=0;k<=count;k++){const x=a[0]+(b[0]-a[0])*k/count,y=a[1]+(b[1]-a[1])*k/count;assert(c.HOME_WALK.canStand(x-482.5,y-480),`living cross aisle blocked at ${x},${y}`);}}
  aisles={northCm:85,southCm:93,speakers,condition:'TV parked; hinged room doors closed'};
 }
 // Repeated movement checks do not scan the same geometry vertices again.
 for(let i=0;i<40;i++)c.HOME_WALK.canStand(250+i%20,70+i%25);
 const builds=I.getState().metrics.boundsBuilds,t=performance.now();for(let i=0;i<400;i++)c.HOME_WALK.canStand(250+i%20,70+i%25);const ms=performance.now()-t;
 assert.equal(I.getState().metrics.boundsBuilds,builds,'stationary door bounds cached');
 report.variants[publicVersion]={sinkRaySamples:surface.length,ihSurfaceSamples:9,ihChassisClear:true,modelMovementSteps:steps.length,hingedDoor90Count:doors.length,openLeavesClearWalls:true,walkableInteriorDoors:crossings,slidingPassages:2,obstructedOpeningResumes:true,aisles,collision400ProbesMs:Math.round(ms*100)/100,render:{defaultQuality:after.quality,shadowRefreshesPer60Frames:after.shadowUpdates-before,postPasses:after.postPasses},metrics:I.getState().metrics};
 console.log(`${publicVersion.toUpperCase()}: sink / IH surfaces, continuous camera, 90-degree doors, open passages, shadow budget and cached collisions passed (${ms.toFixed(1)}ms / 400 probes).`);
}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
