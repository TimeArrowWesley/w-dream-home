'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),build=require('./home-test-fixture.cjs');
const out=path.resolve('調整紀錄/20260922全版本模型與AI複核');
const baseline=JSON.parse(fs.readFileSync(path.join(out,'baseline.json'),'utf8'));baseline['model-audit-repairs.js']='';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const meshes=g=>{const a=[];g.traverse(o=>{if(o.isMesh)a.push(o);});return a;};
function sig(objects){return Array.from(objects,o=>{o.updateWorldMatrix(true,false);const g=o.geometry;return JSON.stringify({name:o.userData.name||o.name,p:hash(Buffer.from(g.attributes.position.array.buffer)),i:g.index?hash(Buffer.from(g.index.array.buffer)):null,m:o.matrixWorld.elements});}).sort();}
(async()=>{const checks=[];for(let v=0;v<=4;v++){
 const f=await build(v===0?0:v+1),old=await build(v===0?0:v+1,baseline);
 for(const q of [f,old]){q.V.selectRoom('all');for(const p of q.V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}q.V.scene.updateMatrixWorld(true);}
 assert.deepEqual(sig(f.V.wallParts.filter(p=>!p.m.userData.qa03Infill).map(p=>p.m)),sig(old.V.wallParts.map(p=>p.m)),'Original walls and window frames V'+v);
 assert.deepEqual(sig(meshes(f.V.beams)),sig(meshes(old.V.beams)),'Beams V'+v);
 assert.deepEqual(sig(f.E.items.flatMap(meshes)),sig(old.E.items.flatMap(meshes)),'Equipment V'+v);
 assert.deepEqual(sig(meshes(f.E.refinements.guestStorage.group)),sig(meshes(old.E.refinements.guestStorage.group)),'Guest storage V'+v);
 if(v>0)assert.deepEqual(sig(meshes(f.V.fittings)),sig(meshes(old.V.fittings)),'Furniture V'+v);
 const {V,T}=f,parts=V.wallParts.map(p=>p.m),rays=[];
 for(const [x,y,z,kind] of [[-70,345,45,'wall'],[-70,345,150,'glass'],[-70,345,250,'wall'],[1100,200,260,'wall'],[1100,200,200,'glass'],[10,800,225,'wall'],[10,800,180,'glass']]){
  const ray=new T.Raycaster(V.pos(x,y,z),new T.Vector3(-1,0,0),0,40),hit=ray.intersectObjects(parts,false)[0];assert(hit,'Missing wall/glass at '+[v,x,y,z]);
  const glass=!!hit.object.material.transparent;assert.equal(glass,kind==='glass','Expected '+kind+' at '+[v,x,y,z]);rays.push({x,y,z,kind,hit:hit.object.userData.name||'existing glass'});
 }
 const sinkRay=new T.Raycaster(V.pos(23,682,100),new T.Vector3(0,-1,0)),hits=sinkRay.intersectObjects(meshes(V.fittings),false).filter(h=>h.point.y<95&&h.point.y>50);assert(hits.length&&hits[0].point.y<70,'Sink cavity V'+v);
 checks.push({version:'v'+v,originalWallsWindows:true,beams:true,equipment:true,guestBath:true,furnitureUnchangedExceptV0Sink:true,rays,sinkFirstSurface:hits[0].point.y,changes:f.c.HOME_AUDIT_REPAIRS.records});
 fs.writeFileSync(path.join(out,'模型保留與開口核對.json'),JSON.stringify({revision:'20260922-qa03',baseline:'6663f2003485569e49e8d26a41e3dd54e86e6c2f',units:'cm, inherited model values only',checks},null,2)+'\n');console.log('V'+v+' preserved geometry + 7 opening rays + hollow sink passed');
 }})().catch(e=>{console.error(e);process.exitCode=1;});
