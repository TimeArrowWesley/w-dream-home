'use strict';
// Orthographic 2D source geometry for the speaker proposal. Does not modify the viewer.
const fs=require('fs'),path=require('path'),build=require('./home-test-fixture.cjs');
const out=path.resolve('提案/20260914喇叭配置');fs.mkdirSync(out,{recursive:true});
const audioName=/KEF Q[67]|SVS SB|耳平環繞|環繞獨立|Ci160QR|環繞固定與背腔/;
(async()=>{for(let v=1;v<=4;v++){
 const f=await build(v+1),{V,T}=f;
 V.scene.updateMatrixWorld(true);
 const wallSet=new Set(V.wallParts.map(p=>p.m)),triangles=[],walls=[],equipment=[];
 for(const p of V.wallParts){if(p.z>=150)continue;const b=f.bounds(p.m);walls.push([b.x,b.y,b.w,b.d]);}
 for(const item of f.E.items)if(audioName.test(item.userData.name||item.name))equipment.push({name:item.userData.name||item.name,bounds:f.bounds(item)});
 V.scene.traverse(o=>{
  if(!o.isMesh||wallSet.has(o)||o.material?.isShaderMaterial||o.userData.allowance)return;
  for(let p=o;p;p=p.parent){if(p===V.ceiling||p===V.beams||p===V.labels||p.userData.allowance||audioName.test((p.userData.name||'')+' '+p.name))return;if(p.visible===false&&p!==V.architecture&&p!==V.fittings)return;}
  const b=f.bounds(o);if(b.z>160||b.z+b.h<-.1||b.w*b.d<1||b.x>1200||b.x+b.w<-250||b.y>990||b.y+b.d<-30)return;
  const p=o.geometry.attributes.position,ix=o.geometry.index;if(!p)return;
  const mats=Array.isArray(o.material)?o.material:[o.material],verts=[];
  for(let i=0;i<p.count;i++){const a=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);verts.push([a.x+482.5,a.z+480,a.y]);}
  for(let i=0;i<(ix?ix.count:p.count);i+=3){const a=verts[ix?ix.getX(i):i],bb=verts[ix?ix.getX(i+1):i+1],c=verts[ix?ix.getX(i+2):i+2];
   const area=(bb[1]-a[1])*(c[0]-a[0])-(bb[0]-a[0])*(c[1]-a[1]);if(area<.1)continue;
   const mi=o.geometry.groups.find(g=>i>=g.start&&i<g.start+g.count)?.materialIndex||0,m=mats[mi]||mats[0];if(!m?.color||m.opacity<.08)continue;
   const h=(a[2]+bb[2]+c[2])/3;
   let grey=h<2?237:Math.round(192+Math.min(1,m.color.r*.21+m.color.g*.72+m.color.b*.07)*44);
   if(m.transparent)grey=228;
   triangles.push([+h.toFixed(2),grey,...[a,bb,c].flatMap(q=>q.slice(0,2).map(n=>+n.toFixed(2)))]);
  }
 });
 triangles.sort((a,b)=>a[0]-b[0]);
 fs.writeFileSync(path.join(out,'source-v'+v+'.json'),JSON.stringify({version:v,triangles,walls,equipment,sourceCommit:process.env.HOME_PLAN_SOURCE_COMMIT||'local workspace'}));
 console.log('V'+v+': '+triangles.length+' floor-plan triangles, '+walls.length+' walls.');
}})().catch(e=>{console.error(e);process.exitCode=1;});
