'use strict';
// Orthographic projection from the same source meshes as the interactive V0.
const fs=require('fs'),path=require('path'),build=require('./home-test-fixture.cjs');
(async()=>{const f=await build(0),{T,V}=f;V.scene.updateMatrixWorld(true);
const wallSet=new Set(V.wallParts.map(p=>p.m)),walls=[],triangles=[];
for(const p of V.wallParts){if(p.z>=150)continue;const b=f.bounds(p.m);walls.push([b.x,b.y,b.w,b.d]);}
V.scene.traverse(o=>{
 if(!o.isMesh||wallSet.has(o)||o.material?.isShaderMaterial||o.userData.allowance)return;
 for(let p=o;p;p=p.parent){if(p===V.ceiling||p===V.beams||p===V.labels||p.userData.allowance)return;if(p.visible===false&&p!==V.architecture&&p!==V.fittings)return;}
 const b=f.bounds(o);if(b.z>150||b.z+b.h<-.1||b.w*b.d<1||b.x>1200||b.x+b.w<-250||b.y>990||b.y+b.d<-30)return;
 const p=o.geometry.attributes.position,ix=o.geometry.index;if(!p)return;
 const mats=Array.isArray(o.material)?o.material:[o.material],verts=[];
 for(let i=0;i<p.count;i++){const a=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);verts.push([a.x+482.5,a.z+480,a.y]);}
 for(let i=0;i<(ix?ix.count:p.count);i+=3){const a=verts[ix?ix.getX(i):i],bb=verts[ix?ix.getX(i+1):i+1],c=verts[ix?ix.getX(i+2):i+2];
  if((bb[1]-a[1])*(c[0]-a[0])-(bb[0]-a[0])*(c[1]-a[1])<.1)continue;
  const mi=o.geometry.groups.find(g=>i>=g.start&&i<g.start+g.count)?.materialIndex||0,m=mats[mi]||mats[0];if(!m?.color||m.opacity<.08)continue;
  const col=m.color.clone().convertLinearToSRGB();const rgb=[col.r,col.g,col.b].map(x=>Math.round(52+Math.max(0,Math.min(1,x))*185));
  const h=(a[2]+bb[2]+c[2])/3;
  if(m.transparent&&h<4)continue;
  if(m.transparent){rgb[0]=160;rgb[1]=184;rgb[2]=183;}
  if(o.userData.islandSurface==='countertop'){rgb[0]=77;rgb[1]=79;rgb[2]=78;}
  triangles.push([(a[2]+bb[2]+c[2])/3,rgb,...[a,bb,c].flatMap(q=>q.slice(0,2))]);
 }
});triangles.sort((a,b)=>a[0]-b[0]);
const out=path.resolve('提案/原始格局/核對/平面幾何.json');fs.writeFileSync(out,JSON.stringify({triangles,walls,doors:V.doorPlan()}));console.log({triangles:triangles.length,walls:walls.length});
})();
