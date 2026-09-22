'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),out=path.resolve('調整紀錄/20260922全版本模型與AI複核');fs.mkdirSync(out,{recursive:true});
function scan(f){const a=[];f.V.scene.updateMatrixWorld(true);for(const g of [f.V.architecture,f.V.fittings,f.V.beams])g.traverse(o=>{if(o.isMesh&&!o.userData.allowance&&o.geometry.type!=='PlaneGeometry')a.push(o);});return a;}
function ancestor(o,g){while(o){if(o===g)return true;o=o.parent;}return false;}
function circleRoute(f,meshes,points,radius=30){f.V.scene.updateMatrixWorld(true);const obstacles=meshes.filter(o=>{let a=o;while(a){if(!a.visible)return false;a=a.parent;}return true;}).map(o=>({o,b:f.bounds(o)})).filter(q=>q.b.z<180&&q.b.z+q.b.h>8);const blocked=[];let samples=0;
 for(let n=1;n<points.length;n++){const a=points[n-1],b=points[n],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2);for(let k=0;k<=steps;k++){const p=a.map((x,i)=>x+(b[i]-x)*k/steps);samples++;for(const q of obstacles){const b=q.b,dx=p[0]-Math.max(b.x,Math.min(p[0],b.x+b.w)),dy=p[1]-Math.max(b.y,Math.min(p[1],b.y+b.d));if(dx*dx+dy*dy<radius*radius-.05){blocked.push({p,other:q.o.userData.name||q.o.name||q.o.parent.name});break;}}}}
 return {samples,diameterCm:2*radius,method:'Conservative circle against visible source mesh world bounds, height 8–180cm',blocked};
}
function collision(f,a,b){if(!f.overlap(f.bounds(a),f.bounds(b),.05))return false;const T=f.T;
 if(a.geometry.type==='BoxGeometry'&&b.geometry.type==='BoxGeometry'){
  const corners=o=>{o.geometry.computeBoundingBox();const q=o.geometry.boundingBox;return [[q.min.x,q.min.z],[q.max.x,q.min.z],[q.max.x,q.max.z],[q.min.x,q.max.z]].map(([x,z])=>new T.Vector3(x,0,z).applyMatrix4(o.matrixWorld));};
  const aa=corners(a),bb=corners(b);return [aa,bb].every(p=>[0,1].every(i=>{const d=p[(i+1)%4].clone().sub(p[i]),n=new T.Vector3(-d.z,0,d.x).normalize(),v=aa.map(x=>x.dot(n)),w=bb.map(x=>x.dot(n));return Math.min(Math.max(...v),Math.max(...w))-Math.max(Math.min(...v),Math.min(...w))>.05;}));
 }
 a.geometry.computeBoundingBox();const q=a.geometry.boundingBox.clone().expandByScalar(-.04);if(q.isEmpty())return false;
 const mat=a.matrixWorld.clone().invert().multiply(b.matrixWorld),p=b.geometry.attributes.position,ix=b.geometry.index;
 for(let i=0;i<(ix?ix.count:p.count);i+=3){const tri=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,ix?ix.getX(i+j):i+j).applyMatrix4(mat));if(q.intersectsTriangle(new T.Triangle(...tri)))return true;}return false;
}
async function main(){
 const report={revision:'20260922-qa03',date:'2026-09-22',method:'Source meshes and model coordinates; door/slider sweep samples; object extraction and 60cm proxy route. Not human, acoustic or site approval.',versions:[]};
 const filters=/收藏室雙聯|收藏室東側|主浴80|主浴淋浴|更衣室.*側移|後陽台.*側移|精品包.*側移|左側上提包櫃|右側包櫃|儲藏室拉門|R05 展示(上部|下部)|V[34] 行李與深收藏|V[34] 飲水濕區檢修|電箱上段/;
 for(let v=1;v<=4;v++){
  const f=await build(v+1),{T,V,c}=f;c.HOME_REALISM.render=()=>{};c.HOME_REALISM.invalidate=()=>{};V.selectRoom('all');for(const p of V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}
  const states=c.HOME_INTERACTION.getState().entries,pivots=new Map();V.scene.traverse(o=>{if(o.isGroup&&o.userData.interactionId!==undefined)pivots.set(o.userData.interactionId,o);});
  const ms=scan(f),boundsCache=new Map(ms.map(o=>[o,f.bounds(o)])),doorChecks=[];
  for(const e of states.filter(e=>filters.test(e.name))){const pivot=pivots.get(e.id);if(!pivot)throw Error('Missing pivot '+e.name);const own=[];pivot.traverse(o=>{if(o.isMesh)own.push(o);});const starts=own.map(o=>o.position.clone()),rot=pivot.rotation.y;
   function set(t){if(e.sliding){for(let i=0;i<own.length;i++){const m=own[i];m.position.copy(starts[i]);if(m.userData.slideFront){m.position[m.userData.slideFront.axis]-=t*m.userData.slideFront.distance;}else if(m.userData.slideRatio){const d=pivot.userData.slidingDoor;m.position[d.axis||'x']-=t*d.distance*m.userData.slideRatio;}}}else pivot.rotation.y=t*e.openAngle;pivot.updateMatrixWorld(true);}
   const region=new T.Box3();for(const q of [0,.25,.5,.75,1]){set(q);for(const m of own)region.union(new T.Box3().setFromObject(m));}const rb={x:region.min.x+482.5,y:region.min.z+480,z:region.min.y,w:region.max.x-region.min.x,d:region.max.z-region.min.z,h:region.max.y-region.min.y};
   const obstacles=ms.filter(o=>!ancestor(o,pivot)&&f.overlap(boundsCache.get(o),rb));const hits=new Map();
   for(let k=0;k<=90;k++){set(k/90);for(const m of own)for(const o of obstacles)if(!hits.has(o.id)&&collision(f,m,o))hits.set(o.id,{fraction:k/90,part:m.userData.name||m.name,other:o.userData.name||o.name||o.parent.name,b:f.bounds(o)});}
   pivot.rotation.y=rot;own.forEach((o,i)=>o.position.copy(starts[i]));pivot.updateMatrixWorld(true);doorChecks.push({name:e.name,samples:91,hits:[...hits.values()]});
  }
  // New main sink must be an actual cavity, not a stone or cabinet board under its center.
  V.scene.updateMatrixWorld(true);const ray=new T.Raycaster(V.pos(23,682,100),new T.Vector3(0,-1,0)),sinkHits=ray.intersectObjects(ms,false).filter(h=>h.point.y<95&&h.point.y>50);assert(sinkHits.length);assert(sinkHits[0].point.y<70,'Sink center still blocked above bowl');
  let luggageRoute=null;if(v===2){const box=ms.find(o=>o.userData.name==='75cm高行李箱放入櫃內'),start=box.position.clone(),ownGroup=box.parent,route=c.HOME_MODEL_REPAIRS.records.find(r=>r.issue==='M02').route;const bad=[];let samples=0;
   for(let n=1;n<route.length;n++){const a=route[n-1],b=route[n],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2);for(let k=0;k<=steps;k++){const x=a[0]+(b[0]-a[0])*k/steps,y=a[1]+(b[1]-a[1])*k/steps;box.position.copy(start).add(new T.Vector3(x-224,0,y-886));box.updateMatrixWorld(true);samples++;for(const o of ms){if(o===box||o.userData.allowance)continue;if(f.overlap(f.bounds(box),boundsCache.get(o),.1)&&collision(f,box,o)&&!bad.some(q=>q.other===o.id))bad.push({other:o.id,name:o.userData.name||o.name||o.parent.name,at:[x,y]});}}}
   box.position.copy(start);box.updateMatrixWorld(true);luggageRoute={samples,hits:bad};
  }
  const rearRoute=v===3?circleRoute(f,ms,[[930,420],[1040,420],[1040,748],[920,748]]):null;
  let collectionRoute=null;if(v<=2){c.HOME_INTERACTION.setDoor('入戶門',true);c.HOME_INTERACTION.setDoor('collection-mr01',true);f.tick(80,50);collectionRoute=circleRoute(f,ms,[[606,925],[606,839],[470,839],[390,839]]);collectionRoute.doorState='入戶門與收藏室門開啟';c.HOME_INTERACTION.setDoor('collection-mr01',false);c.HOME_INTERACTION.setDoor('入戶門',false);f.tick(80,50);}
  const result={version:'v'+v,changes:c.HOME_MODEL_REPAIRS.records,doorChecks,sinkFirstSurfaceZ:sinkHits[0].point.y,luggageRoute,rearRoute,collectionRoute};report.versions.push(result);fs.writeFileSync(path.join(out,'動態核對.json'),JSON.stringify(report,null,2)+'\n');
  console.log('V'+v+': '+doorChecks.length+' doors; '+doorChecks.filter(e=>e.hits.length).length+' door collisions; luggage '+(luggageRoute?.hits.length??'-')+'; route '+(rearRoute?.blocked.length??'-'));
 }
 for(const v of report.versions){assert(v.doorChecks.every(e=>e.hits.length===0),v.version+' door collision');assert(!v.luggageRoute?.hits.length,v.version+' retrieval');assert(!v.rearRoute?.blocked.length,v.version+' rear route');assert(!v.collectionRoute?.blocked.length,v.version+' collection route');}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={collision};
