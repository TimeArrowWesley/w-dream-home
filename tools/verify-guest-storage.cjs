'use strict';
// Actual source meshes, centimetres. Furniture tests do not certify human reach or site fixing.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const out=path.resolve('調整紀錄/20260921客浴原位收納');fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const baseline=fs.existsSync(path.join(out,'baseline.json'))?JSON.parse(fs.readFileSync(path.join(out,'baseline.json'),'utf8')):null;
function isNew(o){while(o){if(o.userData.guestStorage)return true;o=o.parent;}return false;}
function meshes(f){const a=[];f.V.scene.updateMatrixWorld(true);for(const g of [f.V.architecture,f.V.fittings])g.traverse(o=>{if(o.isMesh)a.push(o);});return a;}
function signature(f){return meshes(f).filter(o=>!isNew(o)).map(o=>{const g=o.geometry;return JSON.stringify({name:o.userData.name||o.name,position:sha(Buffer.from(g.attributes.position.array.buffer)),index:g.index?sha(Buffer.from(g.index.array.buffer)):null,matrix:o.matrixWorld.elements});}).sort();}
// Separating-axis test of the actual door box and an obstacle's world bounding box.
function doorHits(f,door,other){
 const T=f.T,db=door.geometry.boundingBox||(door.geometry.computeBoundingBox(),door.geometry.boundingBox),ob=new T.Box3().setFromObject(other);
 const verts=(b,m)=>{const a=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])a.push(new T.Vector3(x,y,z).applyMatrix4(m));return a;};
 const a=verts(db,door.matrixWorld),b=verts(ob,new T.Matrix4()),axes=[new T.Vector3(1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,0,1)];
 const u=[0,1,2].map(i=>new T.Vector3().setFromMatrixColumn(door.matrixWorld,i).normalize());
 axes.push(...u,...u.flatMap(v=>axes.slice(0,3).map(q=>new T.Vector3().crossVectors(v,q))));
 return axes.filter(v=>v.lengthSq()>1e-8).every(v=>{v.normalize();const pa=a.map(p=>p.dot(v)),pb=b.map(p=>p.dot(v));return Math.min(Math.max(...pa),Math.max(...pb))-Math.max(Math.min(...pa),Math.min(...pb))>.035;});
}
(async()=>{
 const report={revision:'20260921-gbath-r04',method:'Source geometry comparison; swept cabinet leaves, original vanity leaves and tissue cassette refill path; offline captures. Human reach, installed hardware and site dimensions remain unverified.',versions:[]};
 const album=JSON.parse(fs.readFileSync('成品圖集/20260914暗色現代工業/album-manifest.json','utf8')),captures=[];
 for(let v=0;v<5;v++){
  const n=v===0?0:v+1,f=await build(n);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};
  f.V.selectRoom('bath2');for(const p of f.V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}
  if(baseline){const old=await build(n,baseline);old.V.selectRoom('bath2');for(const p of old.V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}assert.deepEqual(signature(f),signature(old),'Unrelated geometry changed in V'+v);}
  const r=f.E.refinements.guestStorage;assert(r,'New storage missing');
  const all=meshes(f),newMeshes=all.filter(isNew),doors=newMeshes.filter(o=>o.userData.swingFront);
  assert.equal(doors.length,2);assert.equal(r.cabinet.innerW,66.4);assert.equal(r.platform.z+r.platform.h,68);
  const fixed=all.filter(o=>!o.userData.dynamicDoor&&!o.userData.allowance&&f.overlap(f.bounds(o),{x:418,y:215,z:149,w:74,d:60,h:82}));
  for(let i=0;i<=85;i++){
   doors.forEach((o,k)=>o.parent.rotation.y=(k?1:-1)*i*Math.PI/180);f.V.scene.updateMatrixWorld(true);
   for(const door of doors)for(const o of fixed){if(f.overlap(f.bounds(door),f.bounds(o))&&doorHits(f,door,o))throw Error('V'+v+' cabinet sweep '+i+' hits '+(o.userData.name||o.name));}
  }
  doors.forEach(o=>o.parent.rotation.y=0);f.V.scene.updateMatrixWorld(true);
  const vanity=all.filter(o=>o.userData.swingFront&&/懸吊浴櫃/.test(o.userData.swingFront.name)&&f.bounds(o).x>490&&f.bounds(o).x<570&&f.bounds(o).y<270);
  assert.equal(vanity.length,1); // Existing 66 cm vanity has one full-width door.
  for(const leaf of vanity){const sign=leaf.userData.swingFront.hinge==='max'?1:-1;for(let i=0;i<=85;i++){leaf.parent.rotation.y=sign*i*Math.PI/180;f.V.scene.updateMatrixWorld(true);for(const o of newMeshes){if(f.overlap(f.bounds(leaf),f.bounds(o))&&doorHits(f,leaf,o))throw Error('Vanity hits storage '+i);}}leaf.parent.rotation.y=0;}
  // Take the cassette 16 cm toward the toilet, then lift it above the platform for refilling.
  const cassetteMeshes=[];r.cassette.traverse(o=>{if(o.isMesh)cassetteMeshes.push(o);});
  const obstacles=all.filter(o=>!cassetteMeshes.includes(o)&&!o.userData.allowance&&f.overlap(f.bounds(o),{x:466,y:236,z:53,w:31,d:26,h:29}));
  const moves=[...Array.from({length:17},(_,i)=>[-i,0]),...Array.from({length:17},(_,i)=>[-16,i])];
  for(const [x,z] of moves){r.cassette.position.set(x,z,0);f.V.scene.updateMatrixWorld(true);for(const a of cassetteMeshes)for(const b of obstacles)if(f.overlap(f.bounds(a),f.bounds(b),.08))throw Error('Cassette refill intersects '+(b.userData.name||b.name)+' at '+x+','+z);}
  r.cassette.position.set(0,0,0);f.V.scene.updateMatrixWorld(true);
  for(const open of [true,false]){assert(f.c.HOME_INTERACTION.setDoor('bath2',open));f.tick(70,50);const state=f.c.HOME_INTERACTION.getState().entries.find(e=>e.key==='bath2');assert(Math.abs(state.angle-(open?1:0))<.01);}
  report.versions.push({version:'v'+v,unrelatedGeometryUnchanged:baseline?true:null,cabinetSweepSamples:86,vanityDoorSweepSamples:86*vanity.length,refillPathSamples:moves.length,entranceOpenClose:true,modelOnly:true});
  if(process.argv.includes('--capture')){
   f.c.HOME_COMFORT.setScene('daily');
   for(const e of album.entries.filter(e=>e.version==='v'+v&&e.room==='bath2')){
    const view={id:'bath2-'+e.angle+'-gb04',room:e.room,name:e.name,p:e.p,t:e.t,fov:e.fov,direction:e.direction};
    const [rec]=render({T:f.T,V:f.V,version:'v'+v,out,textured:true,width:1152,height:768,views:[view]});
    captures.push({...e,...rec,modelHash:sha(fs.readFileSync(path.join(out,rec.file)))});
   }
  }
  console.log('V'+v+': guest storage, cabinet/vanity door sweeps, cassette refill and retained geometry passed.');
 }
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2)+'\n');if(captures.length)fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify(captures,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
