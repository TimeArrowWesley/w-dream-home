'use strict';
// Offline software rasterizer of the source meshes. No browser, WebGL or network.
// Color / geometry review only: textures, reflections and real lighting are omitted.
const fs=require('fs'),path=require('path'),zlib=require('zlib');
function png(file,w,h,pixels){
 const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}
 function chunk(name,data){const type=Buffer.from(name),buf=Buffer.concat([type,data]);let c=0xffffffff;for(const x of buf)c=table[(c^x)&255]^(c>>>8);const a=Buffer.alloc(4),b=Buffer.alloc(4);a.writeUInt32BE(data.length);b.writeUInt32BE((c^0xffffffff)>>>0);return Buffer.concat([a,buf,b]);}
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=2;
 const rows=Buffer.alloc((w*3+1)*h);for(let y=0;y<h;y++)Buffer.from(pixels.buffer,y*w*3,w*3).copy(rows,y*(w*3+1)+1);
 fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(rows,{level:5})),chunk('IEND',Buffer.alloc(0))]));
}
module.exports=function({T,V,version,out}){
 fs.mkdirSync(out,{recursive:true});V.labels.visible=false;V.ceiling.visible=V.beams.visible=true;
 for(const p of V.wallParts){p.m.visible=true;p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}
 V.scene.updateMatrixWorld(true);
 const meshes=[];V.scene.traverse(o=>{if(!o.isMesh||o.material?.isShaderMaterial||o.userData.allowance||o.name==='窗外天空')return;for(let p=o;p;p=p.parent)if(!p.visible)return;if(o.material?.transparent&&o.material?.map&&!o.material?.color)return;meshes.push(o);});
 const viewpoints=[];
 // Distinct layouts reviewed in every room; both entry heights get matching close-ups.
 if(version==='v1'||version==='v3')for(const r of V.rooms.filter(r=>r.id!=='all')){
  viewpoints.push({id:r.id+'-A',room:r.id,name:r.n+' A',p:r.p,t:r.t});
 }
 const reverse={living:[[1010,730,165],[620,660,110]],island:[[375,645,165],[605,543,112]],kitchen:[[107,605,165],[110,913,114]],bed:[[48,231,165],[321,54,126]],closet:[[651,177,160],[634,25,125]],study:[[809,315,165],[1030,95,125]],collection:[[312,849,158],[496,790,120]],bath1:[[117,354,165],[0,463,105]],bath2:[[478,324,165],[540,234,113]],storage:[[650,350,165],[715,283,114]],back:[[-102,758,165],[-80,515,114]]};
 if(version==='v1'||version==='v3')for(const [room,[p,t]] of Object.entries(reverse))viewpoints.push({id:room+'-B',room,name:V.rooms.find(r=>r.id===room).n+' B',p,t});
 viewpoints.push({id:'entry-living',room:'entry',name:'玄關客廳面',p:[733,665,159],t:[554,766,80]});
 if(version==='v2'||version==='v4'){const r=V.rooms.find(r=>r.id==='entry');viewpoints.push({id:'entry-A',room:'entry',name:'玄關內側',p:r.p,t:r.t});}
 const width=740,height=480,camera=new T.PerspectiveCamera(72,width/height,2,4000),light=new T.Vector3(-.4,.8,.5).normalize();
 function render(view){
  camera.position.copy(V.pos(...view.p));camera.lookAt(V.pos(...view.t));camera.updateMatrixWorld(true);camera.updateProjectionMatrix();
  const pv=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),frustum=new T.Frustum().setFromProjectionMatrix(pv);
  const rgb=new Uint8Array(width*height*3),depth=new Float32Array(width*height);depth.fill(Infinity);for(let i=0;i<rgb.length;i+=3){rgb[i]=177;rgb[i+1]=188;rgb[i+2]=187;}
  const opaque=[],transparent=[];
  for(const o of meshes){if(!frustum.intersectsObject(o))continue;const materials=Array.isArray(o.material)?o.material:[o.material],p=o.geometry.attributes.position,ind=o.geometry.index,groups=o.geometry.groups;
   const matrix=new T.Matrix4().multiplyMatrices(camera.matrixWorldInverse,o.matrixWorld),verts=[];
   for(let k=0;k<p.count;k++){const a=new T.Vector3(p.getX(k),p.getY(k),p.getZ(k)).applyMatrix4(matrix);verts.push([a.x,a.y,-a.z]);}
   const worldNormal=new T.Matrix3().getNormalMatrix(o.matrixWorld),normals=o.geometry.attributes.normal;
   for(let i=0;i<(ind?ind.count:p.count);i+=3){
    const mi=groups.find(g=>i>=g.start&&i<g.start+g.count)?.materialIndex||0,m=materials[mi]||materials[0];if(!m.color||m.opacity<.015)continue;
    const idx=[0,1,2].map(k=>ind?ind.getX(i+k):i+k);let points=idx.map(k=>verts[k]);if(points.every(p=>p[2]<2)||points.every(p=>p[2]>4000))continue;
    const clipped=[];for(let k=0;k<3;k++){const a=points[k],b=points[(k+1)%3],ina=a[2]>=2,inb=b[2]>=2;if(ina)clipped.push(a);if(ina!==inb){const f=(2-a[2])/(b[2]-a[2]);clipped.push(a.map((v,j)=>v+(b[j]-v)*f));}}
    if(clipped.length<3)continue;
    const normal=new T.Vector3();if(normals)for(const k of idx)normal.add(new T.Vector3().fromBufferAttribute(normals,k));normal.applyMatrix3(worldNormal).normalize();
    const shade=m.isMeshBasicMaterial?1:.58+.40*Math.abs(normal.dot(light)),color=m.color.clone().multiplyScalar(shade).convertLinearToSRGB(),col=[color.r,color.g,color.b].map(x=>Math.max(0,Math.min(255,Math.round(x*255)))),alpha=m.transparent?Math.min(.6,m.opacity):1;
    for(let k=1;k<clipped.length-1;k++){
     const tri=[clipped[0],clipped[k],clipped[k+1]].map(p=>[(p[0]*camera.projectionMatrix.elements[0]/p[2]+1)*width/2,(1-p[1]*camera.projectionMatrix.elements[5]/p[2])*height/2,1/p[2]]);
     const item={tri,col,alpha,z:clipped.reduce((s,p)=>s+p[2],0)/clipped.length};(alpha<1?transparent:opaque).push(item);
    }
   }
  }
  function paint({tri:t,col,alpha}){
   const [a,b,c]=t,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<.01)return;
   const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(width-1,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(height-1,Math.ceil(Math.max(a[1],b[1],c[1])));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/den,v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/den,w=1-u-v;if(u<0||v<0||w<0)continue;
    const z=1/(u*a[2]+v*b[2]+w*c[2]),j=y*width+x;if(z>depth[j]+.015)continue;if(alpha>=1)depth[j]=z;for(let k=0;k<3;k++)rgb[j*3+k]=Math.round(col[k]*alpha+rgb[j*3+k]*(1-alpha));
   }
  }
  opaque.forEach(paint);transparent.sort((a,b)=>b.z-a.z).forEach(paint);png(path.join(out,version+'-'+view.id+'.png'),width,height,rgb);
  return {version,...view,file:version+'-'+view.id+'.png',triangles:opaque.length+transparent.length};
 }
 const images=[];if(!process.env.HOME_MATERIAL_ONLY)for(const view of viewpoints){images.push(render(view));}
 const extras=[];
 extras.push(render({id:'entry-floor',room:'entry',name:'玄關六角磚與木地板交界',p:[758,883,165],t:[621,868,0]}));
 if(!process.env.HOME_MATERIAL_ONLY&&(version==='v1'||version==='v3')){
  const mirror=V.scene.getObjectByName('更衣室側移滑鏡')?.children[0];
  if(mirror){const start=mirror.position.x;mirror.position.x+=50;V.scene.updateMatrixWorld(true);const r=V.rooms.find(r=>r.id==='closet');extras.push(render({id:'closet-open',room:'closet',name:'滑鏡移開',p:r.p,t:r.t}));mirror.position.x=start;V.scene.updateMatrixWorld(true);}
  extras.push(render({id:'fridge-front',room:'kitchen',name:'冰箱上下格柵',p:[85,743,156],t:[163,781,132]}));
 }
 if(process.env.HOME_MATERIAL_ONLY){const p=path.join(out,version+'-views.json'),old=JSON.parse(fs.readFileSync(p,'utf8'));old.extras=[...(old.extras||[]).filter(e=>e.id!=='entry-floor'),...extras];fs.writeFileSync(p,JSON.stringify(old,null,2));}
 else fs.writeFileSync(path.join(out,version+'-views.json'),JSON.stringify({method:'source meshes, depth-buffer software render; texture/reflection/real lighting excluded',images,extras},null,2));
 console.log(version+': exported '+images.length+' offline geometry/color review images.');
};
module.exports.png=png;
