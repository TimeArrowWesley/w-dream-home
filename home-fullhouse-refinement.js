'use strict';
// BW04: transfer BW04 geometry/PBR bakes into the EXISTING interactive objects.
(()=>{
const V=window.HOME_VIEWER,T=window.THREE;
const version=window.HOME_LAYOUT?.displayVersion;
if(!V||!T||!['v0','v2','v3','v4','v5'].includes(version)||window.HOME_BLENDER_V1)return;
const base=new URL('assets/blender-home/bw04/'+version+'/',document.currentScript.src),R=window.HOME_REALISM;
const status={revision:'BW04',state:'loading',meshes:0,materials:0,source:version.toUpperCase()+' BW04',bytes:0,limits:'WebGL PBR + all-room Cycles irradiance; not live Cycles'};
const bindings=new Map(),records=[],createdMaterials=[],baseline=[];
function signature(mesh){
 const g=mesh.geometry,p=g.attributes.position,idx=g.index,v=new T.Vector3();let h=2166136261;
 const mix=n=>h=Math.imul(h^(n|0),16777619)>>>0;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);mix(Math.floor(v.x*100+.500001));mix(Math.floor(-v.z*100+.500001));mix(Math.floor(v.y*100+.500001));}
 for(let i=0;i<(idx?idx.count:p.count);i++)mix(idx?idx.getX(i):i);
 return p.count+':'+(idx?idx.count:p.count)+':'+h.toString(16).padStart(8,'0');
}
// Bind before DOMContentLoaded starts automatic study-door motion. Temporarily
// recover full wall heights for matching, then restore the user's cutaway state.
const walls=V.wallParts.map(p=>[p,p.m.scale.y,p.m.position.y]);
try{
 for(const [p] of walls){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}
 V.scene.updateMatrixWorld(true);
 V.scene.traverse(o=>{
  if(!o.isMesh||!o.geometry.attributes.position||o.isInstancedMesh||o.isSkinnedMesh)return;
  const p=o.geometry.attributes.position;if(p.count>100000)return;
  const key=signature(o),chain=[];for(let p=o;p&&p!==V.scene;p=p.parent)chain.unshift(p.userData.name||p.name||p.type);
  const worldBounds=new T.Box3(),point=new T.Vector3();for(let i=0;i<p.count;i++)worldBounds.expandByPoint(point.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));
  const item={o,path:chain.join(' / '),inverse:o.matrixWorld.clone().invert(),worldBounds};
  if(!bindings.has(key))bindings.set(key,[]);bindings.get(key).push(item);
 });
}finally{for(const [p,sy,y] of walls){p.m.scale.y=sy;p.m.position.y=y;}V.scene.updateMatrixWorld(true);}
function material(m,tex){
 let out;
 if(m.glass){
  // r128 has thin-surface transmission, no KHR volume thickness. Keep live
  // transparency for nested cabinet panes; do not bake opaque glass into maps.
  out=new T.MeshPhysicalMaterial({color:new T.Color(...m.color),roughness:m.roughness,metalness:0,transmission:.90,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide,envMapIntensity:.22});
  out.ior=m.ior;
 }else{
  const floor=m.sourceMaterialId===217,wall=m.sourceMaterialId===85;
  const Surface=m.sourceMaterialId===-3500?T.MeshPhysicalMaterial:T.MeshStandardMaterial;
  out=new Surface({color:0xffffff,map:floor?tex.floorColor:tex.color,normalMap:floor?tex.floorNormal:tex.normal,aoMap:null,roughness:m.roughness,metalness:m.metalness,envMapIntensity:.3,side:m.side??T.FrontSide});
  if(m.sourceMaterialId===-3500)out.reflectivity=.05;
  if(m.sourceMaterialId===85){
   // Port BW04's 120×60cm offset brick node analytically, so its 1.5mm joints
   // stay legible when the atlas is minified. All values are render proposals.
   out.onBeforeCompile=s=>{
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 bwStoneWorld;').replace('#include <begin_vertex>','#include <begin_vertex>\nbwStoneWorld=(modelMatrix*vec4(position,1.0)).xyz;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 bwStoneWorld;').replace('#include <map_fragment>','#include <map_fragment>\nvec2 bp=vec2(bwStoneWorld.x+482.5,bwStoneWorld.y);float br=floor(bp.y/60.);bp.x+=mod(br,2.)*60.;vec2 bj=abs(fract(bp/vec2(120.,60.))-.5)*vec2(120.,60.);float bd=min(60.-bj.x,30.-bj.y);float ba=max(fwidth(bd),.025);float bwJoint=1.-smoothstep(.075-ba,.075+ba,bd);diffuseColor.rgb*=mix(1.,.16,bwJoint);');
   };out.extensions={derivatives:true};out.customProgramCacheKey=()=> 'bw01-bl02-stone-joints';
  }
  const fineStone=[9,85,122,174,215,219].includes(m.sourceMaterialId)||m.name.includes('bathroom stone inner faces');
  if(fineStone){
   // Keep high-frequency mineral texture independent of the whole-house atlas.
   const gain=m.sourceMaterialId===85?.68:m.sourceMaterialId===174||m.name.includes('bathroom stone inner faces')?.42:.8;
   const previousStone=out.onBeforeCompile;
   out.normalScale.set(.28,.28);
   out.onBeforeCompile=shader=>{
    previousStone.call(out,shader);
    shader.uniforms.bwFineStone={value:tex.stoneColor};shader.uniforms.bwStoneGain={value:gain};
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 bwSurfaceWorld;varying vec3 bwSurfaceNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nbwSurfaceWorld=(modelMatrix*vec4(position,1.)).xyz;bwSurfaceNormal=normalize(mat3(modelMatrix)*normal);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D bwFineStone;uniform float bwStoneGain;varying vec3 bwSurfaceWorld;varying vec3 bwSurfaceNormal;').replace('#include <map_fragment>',`vec3 bwWeights=pow(abs(bwSurfaceNormal),vec3(8.));bwWeights/=max(dot(bwWeights,vec3(1.)),.0001);vec3 bwCoord=vec3(bwSurfaceWorld.x,-bwSurfaceWorld.z,bwSurfaceWorld.y)*.007;
    vec3 bwRock=sRGBToLinear(texture2D(bwFineStone,bwCoord.yz)).rgb*bwWeights.x+sRGBToLinear(texture2D(bwFineStone,bwCoord.xz)).rgb*bwWeights.z+sRGBToLinear(texture2D(bwFineStone,bwCoord.xy)).rgb*bwWeights.y;diffuseColor.rgb*=bwRock*bwStoneGain;`);
   };
   out.customProgramCacheKey=()=> 'bw03-fine-stone-'+gain;
   out.userData.bw03FineStone=true;
  }
 }
 out.name='BW04 '+m.name;out.userData={...out.userData,blenderRevision:'BW04',sourceMaterialId:m.sourceMaterialId};createdMaterials.push(out);return out;
}
function applyLighting(){
 const C=V.finishContext,s=window.HOME_COMFORT?.getState();if(!s)return;
 const night=document.getElementById('night').classList.contains('active'),w=window.HOME_CURTAINS?.getState()||[];
 const closed=w.length?w.reduce((a,x)=>a+x.closed,0)/w.length:0,power=s.brightness/100,display=s.display/100;
 C.hemi.intensity=(night?.035+power*.11:.35)*(1-.78*closed);
 C.fill.intensity=(night?.012+power*.06:.14)*(1-.78*closed);
 C.sun.intensity=(night?.008:.70)*(1-.94*closed);
 if(!night){C.hemi.color.set('#e9e8e3');C.fill.color.set('#eeece7');}
 const publicLight=l=>l.position.x+482.5>745||l.position.z+480>=375;
 C.roomLights.filter(publicLight).forEach(l=>l.intensity=power*.65);
 C.finishLights.filter(publicLight).forEach(l=>l.intensity=display*1.05);
 R?.invalidate?.(false);
}
function reapply(){
 for(const r of records)r.o.material=r.o.userData.study&&document.getElementById('glass').checked?V.finishContext.materials.white:r.material;
 if(records.length){
  V.scene.userData.blenderV1={revision:'BW04',source:'BW04',meshes:records.length,scope:'十二空間／全屋家具細化與材質；保留格局及互動',render:'網頁PBR／Blender材質烘焙，不是即時Cycles'};
  const foot=document.querySelector('.uiSideFoot');if(foot)foot.textContent=version.toUpperCase()+' · BW04 Blender材質／細化 · 工程待核';
  R?.registerMaterials?.();R?.invalidate?.();
 }
}
function install(data,buffer,tex){
 if(records.length)return;
 if(data.revision!=='BW04'||data.version!==version||buffer.byteLength!==data.geometryBytes)throw Error('BW04 asset mismatch');
 const materials=data.materials.map(m=>material(m,tex)),pending=[],used=new Set();
 for(const m of data.meshes){
  let candidates=(bindings.get(m.signature)||[]).filter(x=>!used.has(x.o));
  if(candidates.length>1)candidates=candidates.filter(x=>x.path===m.sourcePath);
  if(candidates.length!==1)throw Error('BW04 object binding '+m.id+' matched '+candidates.length);
  const b=candidates[0];used.add(b.o);
  const src=new Float32Array(buffer,m.vertexOffset,m.vertexCount*8),index=new Uint32Array(buffer,m.indexOffset,m.indexCount);
  const positions=new Float32Array(m.vertexCount*3),normals=new Float32Array(m.vertexCount*3),uvs=new Float32Array(m.vertexCount*2);
  const replacementWorldBounds=new T.Box3();
  const nmat=new T.Matrix3().getNormalMatrix(b.inverse),v=new T.Vector3(),n=new T.Vector3();
  for(let i=0;i<m.vertexCount;i++){
   v.set(src[i*8],src[i*8+1],src[i*8+2]);replacementWorldBounds.expandByPoint(v);v.applyMatrix4(b.inverse);n.set(src[i*8+3],src[i*8+4],src[i*8+5]).applyMatrix3(nmat).normalize();
   positions.set([v.x,v.y,v.z],i*3);normals.set([n.x,n.y,n.z],i*3);uvs.set([src[i*8+6],src[i*8+7]],i*2);
  }
  let mainUV=uvs;
  if(m.id===data.floorUV?.sourceId){const {min,max}=data.floorUV;mainUV=new Float32Array(uvs.length);for(let i=0;i<m.vertexCount;i++){mainUV[i*2]=(src[i*8]/100-min[0])/(max[0]-min[0]);mainUV[i*2+1]=(-src[i*8+2]/100-min[1])/(max[1]-min[1]);}}
  if(m.id===data.wallUV?.sourceId){const {min,max}=data.wallUV;mainUV=new Float32Array(uvs.length);for(let i=0;i<m.vertexCount;i++){mainUV[i*2]=(src[i*8]/100-min[0])/(max[0]-min[0]);mainUV[i*2+1]=(src[i*8+1]/100-min[1])/(max[1]-min[1]);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(positions,3));g.setAttribute('normal',new T.BufferAttribute(normals,3));g.setAttribute('uv',new T.BufferAttribute(mainUV,2));g.setAttribute('uv2',new T.BufferAttribute(uvs,2));g.setIndex(new T.BufferAttribute(new Uint32Array(index),1));
  const mids=[...new Set(m.groups.map(x=>x.material))];for(const group of m.groups)g.addGroup(group.start,group.count,mids.indexOf(group.material));
  g.computeBoundingBox();g.computeBoundingSphere();b.o.geometry.computeBoundingBox();
  const a=b.o.geometry.boundingBox,bb=g.boundingBox;
  // Rounded rotated furniture may shrink local corners. Preserve the actual
  // world envelope used for layout, not an inverse-transformed bounding box.
  const drift=Math.max(...b.worldBounds.min.toArray().map((v,i)=>Math.abs(v-replacementWorldBounds.min.getComponent(i))),...b.worldBounds.max.toArray().map((v,i)=>Math.abs(v-replacementWorldBounds.max.getComponent(i))));
  if(drift>.035)throw Error('BW04 world envelope changed '+m.id);status.maxEnvelopeDriftCm=Math.max(status.maxEnvelopeDriftCm||0,drift);
  g.userData={...b.o.geometry.userData,blenderRevision:'BW04',sourceId:m.id};
  pending.push({o:b.o,geometry:g,material:mids.length===1?materials[mids[0]]:mids.map(id=>materials[id]),sourceId:m.id,referenceId:m.referenceId,hidden:!!m.hidden,room:m.room,sourceWorldBounds:b.worldBounds,replacementWorldBounds,oldGeometry:b.o.geometry,oldMaterial:b.o.material});
 }
 // Commit only after every mesh has matched and retained its original envelope.
 for(const r of pending){baseline.push({o:r.o,geometry:r.oldGeometry,material:r.oldMaterial});r.o.geometry=r.geometry;r.o.material=r.material;r.o.userData.blenderV1Source=r.sourceId;if(r.hidden)r.o.visible=false;records.push(r);}
 // Dispose only unreferenced old geometry. Some source buffers are shared.
 const live=new Set();V.scene.traverse(o=>{if(o.isMesh)live.add(o.geometry);});for(const g of new Set(baseline.map(r=>r.geometry)))if(!live.has(g))g.dispose();
 status.state='ready';status.meshes=records.length;status.materials=materials.length;
 const glassControl=document.getElementById('glass'),glassChange=glassControl.onchange;
 glassControl.onchange=function(...args){glassChange?.apply(this,args);reapply();};
 for(const [owner,key] of [[window.HOME_BLACK_INDUSTRIAL,'apply'],[window.HOME_GREY_STONE,'apply'],[window.HOME_INDUSTRIAL,'apply'],[window.HOME_R05,'applyFinishes']]){
  if(!owner?.[key])continue;const original=owner[key];owner[key]=function(...args){const r=original.apply(this,args);reapply();return r;};
 }
 for(const key of ['reapply','update','setScene']){
  const owner=window.HOME_COMFORT;if(!owner?.[key])continue;const previous=owner[key];owner[key]=function(...args){const result=previous.apply(this,args);applyLighting();return result;};
 }
 for(const id of ['day','night','comfortBrightness','comfortKelvin','comfortDisplay']){
  const node=document.getElementById(id);node.addEventListener(id==='day'||id==='night'?'click':'input',applyLighting);
 }
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-comfort-scene]'))applyLighting();});
 applyLighting();reapply();window.dispatchEvent(new CustomEvent('blender-v1-ready'));
}
async function load(){
 const dependencies=Promise.all([R?.whenReady,window.HOME_FLOORING?.ready,window.HOME_EXTERIOR?.ready]);
 const start=performance.now();const response=await fetch(new URL('manifest.json?layout=cw01',base));if(!response.ok)throw Error('BW04 manifest '+response.status);const data=await response.json();
 const geometry=fetch(new URL(data.geometryFile,base)).then(async r=>{if(!r.ok)throw Error('BW04 geometry '+r.status);const compressed=await r.arrayBuffer();status.bytes+=compressed.byteLength;if(typeof DecompressionStream!=='function')throw Error('此瀏覽器不支援模型解壓縮');return new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();});
 const texturesReady=Promise.all(Object.entries(data.maps).map(([key,url])=>new Promise((resolve,reject)=>{
  new T.TextureLoader().load(new URL(url,base).href,t=>{t.encoding=/color/i.test(key)?T.sRGBEncoding:T.LinearEncoding;t.anisotropy=Math.min(8,V.renderer.capabilities.getMaxAnisotropy());t.wrapS=t.wrapT=key==='stoneColor'?T.RepeatWrapping:T.ClampToEdgeWrapping;t.needsUpdate=true;resolve([key,t]);},undefined,reject);
 })));
 const [buffer,textureEntries]=await Promise.all([geometry,texturesReady]);await dependencies;install(data,buffer,Object.fromEntries(textureEntries));status.loadMilliseconds=Math.round(performance.now()-start);
}
const api=window.HOME_BLENDER_HOME=window.HOME_BLENDER_V1={getState:()=>({...status}),install,reapply,ready:null,records};
api.ready=load().catch(error=>{
 status.state='fallback';status.error=String(error.message||error);console.error('Blender材質載入未完成，保留原模型：',error);
 const note=document.createElement('div');note.id='blenderLoadWarning';note.setAttribute('role','status');note.textContent='Blender材質載入未完成，暫時顯示原模型；請重新整理。';note.style.cssText='position:fixed;bottom:12px;left:285px;right:16px;z-index:1000;padding:12px;background:#4c3625;color:#fff;font:14px system-ui';document.body.appendChild(note);
});
})();
