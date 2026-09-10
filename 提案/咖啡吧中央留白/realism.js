'use strict';
(()=>{
const T=THREE,V=HOME_VIEWER,C=V.finishContext,R=V.renderer,S=V.scene,M=C.materials;
const $=id=>document.getElementById(id),stats={ready:false,beveled:0,contactShadows:0,reflections:0,textureLoaded:false,quality:'high',version:3,maxBoundingError:0};
const details=new T.Group();details.name='寫實材質與燈光細節';S.add(details);
const originalEnvironment=S.environment,reflectionCache=new Map();
const color=(hex)=>new T.Color(hex).convertSRGBToLinear();
function texture(canvas,srgb=false){const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=srgb?T.sRGBEncoding:T.LinearEncoding;t.anisotropy=Math.min(8,R.capabilities.getMaxAnisotropy());return t;}
// Deterministic surface microstructure. Height and roughness have linear encoding.
function micro(kind){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(512,512);let seed=91028;for(let y=0;y<512;y++)for(let x=0;x<512;x++){seed=(seed*1664525+1013904223)>>>0;const random=(seed>>>8)/16777216;let h;if(kind==='weave'){const warp=Math.sin(x*Math.PI/3),weft=Math.sin(y*Math.PI/3);h=150+35*warp+20*weft+15*random;}else if(kind==='brushed')h=185+Math.sin(y*2.7)*4+random*8;else h=190+18*Math.sin(x/35)*Math.cos(y/27)+random*12;const i=(y*512+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=h;pixels.data[i+3]=255;}ctx.putImageData(pixels,0,0);return texture(canvas);}
const weave=micro('weave'),metalGrain=micro('brushed'),plaster=micro('plaster');
const rugCanvas=document.createElement('canvas');rugCanvas.width=rugCanvas.height=512;const rugCtx=rugCanvas.getContext('2d'),rugPixels=rugCtx.createImageData(512,512);let rugSeed=411;const grids=[8,24,64].map(n=>({n,v:Array.from({length:n*n},()=>{rugSeed=(rugSeed*1664525+1013904223)>>>0;return (rugSeed>>>24)/255;})}));function rugNoise(x,y,g){const a=x/512*g.n,b=y/512*g.n,i=Math.floor(a),j=Math.floor(b),u=a-i,v=b-j,s=t=>t*t*(3-2*t),at=(x,y)=>g.v[(y%g.n)*g.n+x%g.n];return (at(i,j)*(1-s(u))+at(i+1,j)*s(u))*(1-s(v))+(at(i,j+1)*(1-s(u))+at(i+1,j+1)*s(u))*s(v);}for(let y=0;y<512;y++)for(let x=0;x<512;x++){rugSeed=(rugSeed*1664525+1013904223)>>>0;const grain=(rugSeed>>>24)/255;const value=140+grain*40+20*rugNoise(x,y,grids[0])+10*rugNoise(x,y,grids[1])+5*rugNoise(x,y,grids[2]);const i=(y*512+x)*4;rugPixels.data[i]=value;rugPixels.data[i+1]=value;rugPixels.data[i+2]=value-3;rugPixels.data[i+3]=255;}rugCtx.putImageData(rugPixels,0,0);const rugTexture=texture(rugCanvas,true);
function replaceMaterial(old,next){S.traverse(o=>{if(o.isMesh&&o.material===old)o.material=next;});return next;}
function physical(old,options){const p=new T.MeshPhysicalMaterial();T.MeshStandardMaterial.prototype.copy.call(p,old);Object.assign(p,options);p.needsUpdate=true;return replaceMaterial(old,p);}
const steel=physical(M.steel,{roughness:.48,metalness:.72,clearcoat:.05,clearcoatRoughness:.4,envMapIntensity:.45,bumpMap:metalGrain,bumpScale:.008});steel.color.copy(color('#484b4a'));
const black=physical(M.black,{roughness:.68,metalness:.04,clearcoat:.05,clearcoatRoughness:.55,envMapIntensity:.24,bumpMap:metalGrain,bumpScale:.005});black.color.copy(color('#333635'));
M.blackglass.color.copy(color('#222626'));M.blackglass.metalness=.25;M.blackglass.roughness=.24;M.blackglass.clearcoat=.75;M.blackglass.clearcoatRoughness=.24;M.blackglass.envMapIntensity=.68;M.blackglass.needsUpdate=true;
M.glass.color.copy(color('#c5d5d2'));M.glass.opacity=.12;M.glass.roughness=.045;M.glass.metalness=.03;M.glass.envMapIntensity=.8;M.glass.depthWrite=false;
const ceramic=physical(M.ceramic,{roughness:.17,metalness:0,clearcoat:1,clearcoatRoughness:.09,envMapIntensity:.8});ceramic.color.copy(color('#e2e3df'));
M.mirror.roughness=.035;M.mirror.metalness=1;M.mirror.envMapIntensity=1.15;
for(const [m,hex] of [[M.cloth,'#b5aa98'],[M.darkcloth,'#8b8173'],[M.linen,'#f1e8d8']]){m.color.copy(color(hex));m.map=weave.clone();m.map.encoding=T.sRGBEncoding;m.map.needsUpdate=true;m.bumpMap=weave;m.bumpScale=.018;m.roughnessMap=null;m.roughness=.97;m.envMapIntensity=.15;m.userData.finishScale=12;m.needsUpdate=true;}
M.concrete.color.copy(color('#999b98'));M.concrete.bumpMap=plaster;M.concrete.bumpScale=.07;M.concrete.roughness=.93;
C.ceilingMaterial.color.copy(color('#696c6b'));C.ceilingMaterial.bumpMap=plaster;C.ceilingMaterial.bumpScale=.05;
C.rugMaterial.color.copy(color('#d5c8b4'));C.rugMaterial.bumpMap=weave;C.rugMaterial.bumpScale=.08;C.rugMaterial.roughness=1;
C.rugMaterial.map=rugTexture;C.rugMaterial.userData.finishScale=100;
V.fittings.traverse(o=>{if(o.isLine&&o.material?.color){o.material.color.copy(color('#51585a'));o.material.transparent=true;o.material.opacity=.65;}});
// Rounded geometry preserves the exact outside dimensions of every furniture part.
function rounded(w,h,d,r){const g=new T.BoxGeometry(w,h,d,6,6,6),p=g.attributes.position,n=g.attributes.normal;function remap(v,half){const k=Math.round((v/half+1)*3),a=[-half,-half+r*.293,-half+r,0,half-r,half-r*.293,half];return a[Math.max(0,Math.min(6,k))];}for(let i=0;i<p.count;i++){const q=new T.Vector3(remap(p.getX(i),w/2),remap(p.getY(i),h/2),remap(p.getZ(i),d/2));const inner=new T.Vector3(Math.max(-w/2+r,Math.min(w/2-r,q.x)),Math.max(-h/2+r,Math.min(h/2-r,q.y)),Math.max(-d/2+r,Math.min(d/2-r,q.z)));const norm=q.clone().sub(inner).normalize();q.copy(inner).addScaledVector(norm,r);p.setXYZ(i,q.x,q.y,q.z);n.setXYZ(i,norm.x,norm.y,norm.z);}g.computeBoundingBox();return g;}
V.fittings.traverse(o=>{if(!o.isMesh||o.geometry.type!=='BoxGeometry'||o.material===M.glass)return;const b=o.geometry.parameters;if(!b||Math.min(b.width,b.height,b.depth)<2||Math.max(b.width,b.depth)<18)return;const r=Math.min(.65,Math.min(b.width,b.height,b.depth)*.15);const old=o.geometry;o.geometry=rounded(b.width,b.height,b.depth,r);const size=o.geometry.boundingBox.getSize(new T.Vector3());stats.maxBoundingError=Math.max(stats.maxBoundingError,Math.abs(size.x-b.width),Math.abs(size.y-b.height),Math.abs(size.z-b.depth));o.geometry.userData.realismBevel=true;old.dispose();stats.beveled++;});
// Stuffed cushions have curved fabric faces, while keeping their existing bounding envelope.
stats.softPillows=0;V.fittings.traverse(o=>{if(!o.isMesh||o.material!==M.linen)return;o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox,size=bb.getSize(new T.Vector3()),mid=bb.getCenter(new T.Vector3());if(size.x>85||size.z>45||size.y>35||size.y<8)return;const geo=new T.SphereGeometry(1,48,24),p=geo.attributes.position;const soften=v=>Math.sign(v)*Math.pow(Math.abs(v),.35);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);p.setXYZ(i,mid.x+soften(x)*size.x/2,mid.y+soften(y)*size.y/2,mid.z+soften(z)*size.z/2);}geo.computeVertexNormals();o.geometry.dispose();o.geometry=geo;stats.softPillows++;});
// Surface-specific world UVs keep stone and textile grain at the same scale throughout the home.
function worldUV(o,scale){const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,uv=[];for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld),normal=new T.Vector3().fromBufferAttribute(n,i).transformDirection(o.matrixWorld);const a=[Math.abs(normal.x),Math.abs(normal.y),Math.abs(normal.z)];if(a[1]>=a[0]&&a[1]>=a[2])uv.push(v.x/scale,v.z/scale);else if(a[0]>=a[2])uv.push(v.z/scale,v.y/scale);else uv.push(v.x/scale,v.y/scale);}g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}
// Modelled grout: fine, slightly recessed lines, independent of the stone image.
function groutMaterial(material){material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 stoneWorld;').replace('#include <begin_vertex>','#include <begin_vertex>\nstoneWorld=(modelMatrix*vec4(position,1.0)).xyz;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 stoneWorld;').replace('#include <map_fragment>','#include <map_fragment>\nvec2 joint=abs(fract((stoneWorld.xz+vec2(32.5,30.0))/90.0)-.5)*90.0;float grout=1.0-smoothstep(.11,.27,min(joint.x,joint.y));diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*.34,grout);');};material.customProgramCacheKey=()=> 'stone-grout-v2';material.needsUpdate=true;}
groutMaterial(M.floor);M.floor.color.copy(color('#d0c7b8'));M.floor.roughness=.6;M.floor.envMapIntensity=.3;M.floor.userData.finishScale=180;
C.stoneMaterial.color.set('#c7c1b6').convertSRGBToLinear();C.stoneMaterial.roughness=.43;C.stoneMaterial.envMapIntensity=.45;
// A smooth skylight dome is seen through existing glazing; no platform is added outside the living room.
const skyUniforms={top:{value:color('#7897b4')},bottom:{value:color('#edf1f0')}};
const sky=new T.Mesh(new T.SphereGeometry(4800,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:skyUniforms,vertexShader:'varying vec3 w;void main(){w=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 w;uniform vec3 top,bottom;void main(){float h=clamp(normalize(w).y,0.,1.);gl_FragColor=vec4(mix(bottom,top,pow(h,.6)),1.);#include <tonemapping_fragment>\n#include <encodings_fragment>\n}'}));sky.material.fragmentShader=sky.material.fragmentShader.replace(';#include',';\n#include');sky.name='窗外天空';details.add(sky);
// Contact shadow decals follow furniture and wall footprints, complementing actual light shadows.
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sh=shadowCanvas.getContext('2d');sh.shadowColor='rgba(0,0,0,.8)';sh.shadowBlur=16;sh.fillStyle='#000';sh.fillRect(22,22,84,84);const shadowTex=new T.CanvasTexture(shadowCanvas);
const shadowMat=new T.MeshBasicMaterial({map:shadowTex,transparent:true,opacity:.18,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false});
function shadow(box,wall=false){const size=box.getSize(new T.Vector3());if(size.x<2||size.z<2)return;const spread=wall?12:18;const m=new T.Mesh(new T.PlaneGeometry(size.x+spread*2,size.z+spread*2),shadowMat);m.rotation.x=-Math.PI/2;m.position.set((box.min.x+box.max.x)/2,.15,(box.min.z+box.max.z)/2);if(!wall&&m.position.x+482.5>789&&m.position.x+482.5<1054&&m.position.z+480>490&&m.position.z+480<890)m.position.y=1.13;m.renderOrder=1;details.add(m);stats.contactShadows++;}
S.updateMatrixWorld(true);V.architecture.traverse(o=>{if(!o.isMesh||o.userData.walkDoor||o.material===M.glass)return;const b=new T.Box3().setFromObject(o);if(b.min.y<2&&b.max.y>100)shadow(b,true);});
const contacted=[];V.fittings.traverse(o=>{if(!o.isMesh||!o.userData.name)return;const b=new T.Box3().setFromObject(o),sz=b.getSize(new T.Vector3());if(b.min.y>12||b.max.y<15||Math.min(sz.x,sz.z)<15)return;if(contacted.some(x=>x.containsBox(b)))return;contacted.push(b);shadow(b);});
// Recessed downlight trims and lens geometry, with light-coloured diffusers.
const trim=new T.MeshStandardMaterial({color:color('#25292a'),metalness:.8,roughness:.27});
const lens=new T.MeshStandardMaterial({color:color('#fff4de'),emissive:color('#fff0d4'),emissiveIntensity:1.4,roughness:.25});
const speakerCanvas=document.createElement('canvas');speakerCanvas.width=speakerCanvas.height=256;const speakerCtx=speakerCanvas.getContext('2d');speakerCtx.fillStyle='#b8bab7';speakerCtx.fillRect(0,0,256,256);speakerCtx.fillStyle='#555b5c';for(let y=4;y<256;y+=8)for(let x=4;x<256;x+=8){speakerCtx.beginPath();speakerCtx.arc(x+(y%16?4:0),y,.85,0,Math.PI*2);speakerCtx.fill();}const speakerMaterial=new T.MeshStandardMaterial({color:color('#c1c4c1'),map:texture(speakerCanvas,true),roughness:.8});V.ceiling.traverse(o=>{if(o.isMesh&&o.userData.name==='嵌入式喇叭')o.material=speakerMaterial;});
for(const [x,y] of [[830,450],[995,450],[830,700],[995,820],[535,560],[375,650],[150,120],[295,120],[875,90],[1000,275],[100,700],[490,290],[650,130],[650,320],[235,385],[355,850]]){const ring=new T.Mesh(new T.TorusGeometry(5,.65,8,32),trim);ring.rotation.x=Math.PI/2;ring.position.copy(V.pos(x,y,273.7));V.ceiling.add(ring);const disc=new T.Mesh(new T.CircleGeometry(4.35,32),lens);disc.rotation.x=Math.PI/2;disc.position.copy(V.pos(x,y,273.65));V.ceiling.add(disc);}
// Window bounce fills approximate daylight entering through the actual glazing positions.
const bounce=[];for(const [x,y,z,power,range] of [[1058,480,185,.28,520],[1060,795,190,.28,560],[930,24,190,.23,420],[-55,165,165,.18,420]]){const l=new T.PointLight('#f0eee7',power,range,1.5);l.position.copy(V.pos(x,y,z));S.add(l);bounce.push({light:l,power});}
C.sun.shadow.radius=3;C.sun.shadow.normalBias=.4;C.sun.shadow.bias=-.0001;
// Tabletop / display object surfaces now have tangible thickness, bevels and local reflection.
M.screen.roughness=.2;M.screen.metalness=.3;M.screen.envMapIntensity=.55;
// Duvet surface gently drapes within the approved bed footprint instead of remaining a flat box.
V.fittings.traverse(o=>{if(!o.isMesh||o.material!==C.duvetMaterial)return;const g=new T.PlaneGeometry(176,140,44,36);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);const folds=.45*Math.sin(z*.16+x*.035)+.22*Math.sin(x*.24+z*.04);p.setY(i,folds+.5);}g.computeVertexNormals();const m=new T.Mesh(g,M.linen);m.position.copy(V.pos(190,140,58.2));m.castShadow=true;m.receiveShadow=true;details.add(m);});
// Stitched cushions: keep the original sofa and pillow meshes, adding physical fabric shading.
S.updateMatrixWorld(true);S.traverse(o=>{if(o.isMesh&&o.material.userData?.finishScale)worldUV(o,o.material.userData.finishScale);});
let reflectionTicket=0,reflectionPending=false;
const mirrorMaterials=new Set();S.traverse(o=>{if(o.isMesh&&o.material&&(o.material.metalness>.25||o.material===M.glass))mirrorMaterials.add(o.material);});
function zone(){const p=V.camera.position,x=p.x+482.5,y=p.z+480;if(y<285&&x<410)return 'bed';if(y<375&&x>745)return 'study';if(y<490&&x<310)return 'bath';if(y<375)return 'private';if(x<215)return 'kitchen';if(y>750&&x<450)return 'collection';return 'living';}
const probePoints={living:[725,700,145],bed:[300,220,145],study:[920,190,145],bath:[70,350,145],collection:[350,850,145],private:[615,175,145],kitchen:[105,745,145]};
function applyReflection(tex){mirrorMaterials.forEach(m=>{m.envMap=tex;m.needsUpdate=true;});}
function updateReflection(force=false){if(!stats.ready||V.getCurrent()==='all')return;const id=zone(),key=id+'-'+($('night').classList.contains('active')?'night':'day');if(!force&&reflectionCache.has(key)){applyReflection(reflectionCache.get(key).texture);return;}const ticket=++reflectionTicket;reflectionPending=true;setTimeout(()=>{if(ticket!==reflectionTicket)return;const oldTarget=R.getRenderTarget(),oldAuto=R.autoClear,hidden=[];V.labels.visible=false;S.traverse(o=>{if(o.isMesh&&o.material===M.glass){hidden.push([o,o.visible]);o.visible=false;}});const target=new T.WebGLCubeRenderTarget(128,{generateMipmaps:true,minFilter:T.LinearMipmapLinearFilter,type:T.UnsignedByteType,encoding:T.LinearEncoding});const camera=new T.CubeCamera(3,5000,target);camera.position.copy(V.pos(...probePoints[id]));try{mirrorMaterials.forEach(m=>{m.envMap=originalEnvironment;});R.autoClear=true;camera.update(R,S);const pmrem=new T.PMREMGenerator(R),env=pmrem.fromCubemap(target.texture);pmrem.dispose();if(reflectionCache.has(key))reflectionCache.get(key).dispose();reflectionCache.set(key,env);applyReflection(env.texture);stats.reflections++;}catch(error){console.warn('室內反射使用預設環境',error.message);}finally{target.dispose();hidden.forEach(([o,v])=>o.visible=v);V.labels.visible=$('labels').checked;R.setRenderTarget(oldTarget);R.autoClear=oldAuto;reflectionPending=false;}},70);}
// Screen-space contact occlusion. One colour/depth render plus a small sampling pass.
const target=new T.WebGLRenderTarget(1,1,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true});target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);target.texture.encoding=T.sRGBEncoding;
const postUniforms={tColor:{value:target.texture},tDepth:{value:target.depthTexture},resolution:{value:new T.Vector2(1,1)},inverseProjection:{value:new T.Matrix4()},projection:{value:new T.Matrix4()},strength:{value:.30}};
const postMaterial=new T.ShaderMaterial({uniforms:postUniforms,depthTest:false,depthWrite:false,toneMapped:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
precision highp float;
uniform sampler2D tColor,tDepth;uniform vec2 resolution;uniform mat4 inverseProjection,projection;uniform float strength;varying vec2 vUv;
vec3 viewPoint(vec2 uv){float z=texture2D(tDepth,uv).r;vec4 p=inverseProjection*vec4(uv*2.-1.,z*2.-1.,1.);return p.xyz/p.w;}
vec3 antialias(vec2 uv){vec2 px=1./resolution;vec3 nw=texture2D(tColor,uv+vec2(-1.,-1.)*px).rgb,ne=texture2D(tColor,uv+vec2(1.,-1.)*px).rgb,sw=texture2D(tColor,uv+vec2(-1.,1.)*px).rgb,se=texture2D(tColor,uv+vec2(1.,1.)*px).rgb,center=texture2D(tColor,uv).rgb;vec3 luma=vec3(.299,.587,.114);float a=dot(nw,luma),b=dot(ne,luma),c=dot(sw,luma),d=dot(se,luma),m=dot(center,luma);vec2 dir=vec2(-((a+b)-(c+d)),(a+c)-(b+d));float reduce=max((a+b+c+d)*.03125,.0078125);dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+reduce),vec2(-8.),vec2(8.))*px;vec3 first=.5*(texture2D(tColor,uv+dir*(-.166667)).rgb+texture2D(tColor,uv+dir*.166667).rgb);vec3 second=first*.5+.25*(texture2D(tColor,uv-dir*.5).rgb+texture2D(tColor,uv+dir*.5).rgb);float lum=dot(second,luma);return lum<min(m,min(min(a,b),min(c,d)))||lum>max(m,max(max(a,b),max(c,d)))?first:second;}
void main(){vec3 base=antialias(vUv);float depth=texture2D(tDepth,vUv).r;if(depth>.99997){gl_FragColor=vec4(base,1.);return;}vec3 p=viewPoint(vUv);vec2 pixel=1./resolution;
vec3 l=viewPoint(vUv-vec2(pixel.x,0.)),r=viewPoint(vUv+vec2(pixel.x,0.)),b=viewPoint(vUv-vec2(0.,pixel.y)),t=viewPoint(vUv+vec2(0.,pixel.y));vec3 dx=abs(l.z-p.z)<abs(r.z-p.z)?p-l:r-p;vec3 dy=abs(b.z-p.z)<abs(t.z-p.z)?p-b:t-p;vec3 n=normalize(cross(dx,dy));if(dot(n,-p)<0.)n=-n;
float radius=9.;float screenRadius=clamp(radius*projection[1][1]/max(-p.z,1.)*.5,.002,.12);float occlusion=0.;
for(int i=0;i<32;i++){float a=float(i)*2.399963;float scale=(float(i)+1.)/32.;vec2 uv=vUv+vec2(cos(a)/ (resolution.x/resolution.y),sin(a))*screenRadius*sqrt(scale);if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)continue;vec3 delta=viewPoint(uv)-p;float dist=length(delta);float facing=max(dot(n,delta/max(dist,.001))-.12,0.);occlusion+=facing*(1.-smoothstep(2.,radius*1.6,dist));}
float ao=clamp(1.-occlusion*strength*.2,.65,1.);gl_FragColor=vec4(base*ao,1.);
}`});
const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),postMaterial));
let drawing=false;function render(){if(drawing)return;drawing=true;try{if(stats.quality==='balanced'||V.getCurrent()==='all'){R.render(S,V.camera);return;}const size=R.getDrawingBufferSize(new T.Vector2());if(target.width!==size.x||target.height!==size.y){target.setSize(size.x,size.y);postUniforms.resolution.value.copy(size);}postUniforms.inverseProjection.value.copy(V.camera.projectionMatrix).invert();postUniforms.projection.value.copy(V.camera.projectionMatrix);R.setRenderTarget(target);R.render(S,V.camera);R.setRenderTarget(null);R.render(postScene,postCamera);}finally{R.setRenderTarget(null);drawing=false;}}
function lighting(){const night=$('night').classList.contains('active');skyUniforms.top.value.copy(color(night?'#101b31':'#7897b4'));skyUniforms.bottom.value.copy(color(night?'#2b3549':'#edf1f0'));bounce.forEach(b=>b.light.intensity=night?b.power*.09:b.power);C.hemi.intensity=night?.30:.72;C.fill.intensity=night?.18:.32;C.sun.intensity=night?.04:1.05;C.roomLights.forEach(l=>l.intensity=night?.62:.36);C.finishLights.forEach(l=>l.intensity=night?.88:.65);lens.emissiveIntensity=night?2:1.4;updateReflection();}
const controls=document.createElement('div');controls.id='realismControls';controls.innerHTML='<button id="realismDay">日間</button><button id="realismNight">夜間</button><button id="realismQuality">畫質：精細</button><span id="realismStatus">準備寫實材質…</span>';$('walkHUD').appendChild(controls);
document.querySelector('[data-viewmode="walk"]').textContent='寫實步行';$('walkHUD').querySelector('strong').textContent='寫實步行 · 即時 3D';
$('realismDay').onclick=()=>$('day').click();$('realismNight').onclick=()=>$('night').click();
$('realismQuality').onclick=()=>{stats.quality=stats.quality==='high'?'balanced':'high';$('realismQuality').textContent=stats.quality==='high'?'畫質：精細':'畫質：流暢';};
for(const id of ['day','night'])$(id).addEventListener('click',()=>{lighting();$('realismDay').classList.toggle('active',id==='day');$('realismNight').classList.toggle('active',id==='night');});
window.addEventListener('roomchange',()=>{if(stats.ready)updateReflection();});
let activeZone='';setInterval(()=>{if(!stats.ready||HOME_TOUR.getMode()!=='walk'||reflectionPending)return;const next=zone();if(next!==activeZone){activeZone=next;updateReflection();}},1500);
const exportOriginal=$('export').onclick;$('export').onclick=()=>{if(['model','walk'].includes(HOME_TOUR.getMode())){render();const a=document.createElement('a');a.download='W夢想之家_寫實3D_'+V.getCurrent()+'.png';a.href=R.domElement.toDataURL('image/png');a.click();}else exportOriginal();};
window.HOME_REALISM={setCurtainTransmission:t=>bounce.forEach(b=>b.light.intensity=b.power*t*(document.getElementById("night").classList.contains("active")?.09:1)),render,getState:()=>({...stats,reflectionPending,reflectionZones:[...reflectionCache.keys()]}),refreshReflections:()=>updateReflection(true)};
R.toneMappingExposure=.96;$('brightness').addEventListener('input',()=>{R.toneMappingExposure=.96*Number($('brightness').value)/100;});

// Warm industrial palette: apply to selected existing surfaces without changing footprints.
const oak=new T.MeshStandardMaterial({color:color('#eee2ca'),roughness:.72,metalness:0,envMapIntensity:.3});
stats.woodSurfaces=0;
V.fittings.traverse(o=>{if(!o.isMesh)return;const name=o.userData.name||'',front=o.userData.swingFront?.name||'';
if(name==='咖啡吧石材背板'){o.material=C.stoneMaterial;worldUV(o,100);}
if(/冰箱旁圓弧頂天櫃|咖啡吧木飾側板|180 × 80 升降桌|玄關面客廳封板|書房九抽收納/.test(name)||/床頭抽屜|咖啡吧/.test(front)){o.material=oak;stats.woodSurfaces++;}
});
C.hemi.color.set('#fff6e8');C.hemi.groundColor.set('#827563');C.fill.color.set('#fff2df');C.sun.color.set('#fff4e1');
M.light.color.set('#ffe2b2');C.roomLights.forEach(l=>l.color.set('#ffe7c3'));C.finishLights.forEach(l=>l.color.set('#ffdfac'));
const warmLights=[];
for(const [x,y,z,range] of [[920,913,156,250],[300,768,170,180],[190,40,160,230],[845,435,246,250]]){const light=new T.PointLight('#ffdab0',.32,range,1.6);light.position.copy(V.pos(x,y,z));S.add(light);warmLights.push(light);}
// Visible light strips already exist in the approved model; these fills give the surfaces a warm response.
stats.style='煙燻水泥灰・石墨灰・暖棕人字拼木地板';
const woodReady=new Promise(resolve=>{const img=new Image();img.onload=()=>{oak.map=texture(img,true);oak.map.wrapS=oak.map.wrapT=T.MirroredRepeatWrapping;oak.bumpMap=oak.map.clone();oak.bumpMap.encoding=T.LinearEncoding;oak.bumpMap.needsUpdate=true;oak.bumpScale=.015;oak.needsUpdate=true;S.updateMatrixWorld(true);V.fittings.traverse(o=>{if(o.isMesh&&o.material===oak)worldUV(o,100);});stats.woodTextureLoaded=true;resolve();};img.onerror=()=>{stats.woodTextureLoaded=false;resolve();};img.src=window.REALISM_WOOD;});

stats.wallTextureLoaded=false;
// JunPin reference: smoky cement walls, graphite beam bands, pale grey ceiling.
// Continuous low-frequency mottling replaces the old beige fibrous wall grain.
function cementMap(){
 const c=document.createElement('canvas');c.width=c.height=1024;
 const ctx=c.getContext('2d'),im=ctx.createImageData(1024,1024);let seed=290909;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const grids=[5,13,31,83].map(n=>({n,v:Array.from({length:n*n},rand)}));
 function sample(x,y,g){const a=x/1024*g.n,b=y/1024*g.n,i=Math.floor(a),j=Math.floor(b),f=t=>t*t*(3-2*t),u=f(a-i),v=f(b-j),at=(i,j)=>g.v[(j%g.n)*g.n+i%g.n];return (at(i,j)*(1-u)+at(i+1,j)*u)*(1-v)+(at(i,j+1)*(1-u)+at(i+1,j+1)*u)*v;}
 for(let y=0;y<1024;y++)for(let x=0;x<1024;x++){const cloud=(sample(x,y,grids[0])-.5 )*68+(sample(x,y,grids[1])-.5)*30+(sample(x,y,grids[2])-.5)*9+(sample(x,y,grids[3])-.5)*4;const value=201+cloud+(rand()-.5)*2,k=(y*1024+x)*4;im.data[k]=im.data[k+1]=im.data[k+2]=value;im.data[k+3]=255;}
 ctx.putImageData(im,0,0);return texture(c,true);
}
const cement=cementMap(),cementHeight=cement.clone();cementHeight.encoding=T.LinearEncoding;cementHeight.needsUpdate=true;
M.concrete.map=cement;M.concrete.bumpMap=cementHeight;M.concrete.bumpScale=.014;M.concrete.color.copy(color('#858c8e'));M.concrete.roughness=.92;M.concrete.envMapIntensity=.2;M.concrete.userData.finishScale=240;M.concrete.needsUpdate=true;
C.ceilingMaterial.map=null;C.ceilingMaterial.bumpMap=null;C.ceilingMaterial.color.copy(color('#d1d4d1'));C.ceilingMaterial.roughness=.97;C.ceilingMaterial.needsUpdate=true;
const graphite=new T.MeshStandardMaterial({color:color('#505a5d'),roughness:.89,metalness:0,envMapIntensity:.18,map:cement,bumpMap:cementHeight,bumpScale:.008});
V.beams.traverse(o=>{if(o.isMesh&&o.material===M.concrete)o.material=graphite;});
V.ceiling.traverse(o=>{if(o.isMesh&&o.material===M.concrete)o.material=C.ceilingMaterial;});
S.updateMatrixWorld(true);S.traverse(o=>{if(o.isMesh&&(o.material===M.concrete||o.material===graphite))worldUV(o,240);});
stats.wallTextureLoaded=true;stats.wallPalette={wall:'#858c8e',beam:'#505a5d',ceiling:'#d1d4d1',finish:'煙燻水泥灰・石墨灰・霧黑收邊'};
const plasterReady=Promise.resolve();
const image=new Image();image.onload=()=>{const stone=texture(image,true);stone.wrapS=stone.wrapT=T.MirroredRepeatWrapping;const height=stone.clone();height.encoding=T.LinearEncoding;height.needsUpdate=true;M.floor.map=stone;M.floor.bumpMap=height;M.floor.bumpScale=.028;M.floor.roughnessMap=height;M.floor.needsUpdate=true;C.stoneMaterial.map=stone;C.stoneMaterial.bumpMap=height;C.stoneMaterial.bumpScale=.018;C.stoneMaterial.needsUpdate=true;stats.textureLoaded=true;finish();};image.onerror=()=>{$('realismStatus').textContent='石材載入失敗，使用基本材質';finish();};
async function finish(){await Promise.all([plasterReady,woodReady]);stats.ready=true;S.userData.realism={version:3,generatedStone:stats.textureLoaded,generatedPlaster:stats.wallTextureLoaded,beveled:stats.beveled,contactShadows:stats.contactShadows};if(stats.textureLoaded)$('realismStatus').textContent='材質已就緒 · 視點 165 cm';lighting();if(location.hash==='#walk'){document.querySelector('.workspace').classList.add('planhidden');$('planToggle').textContent='顯示平面圖';HOME_TOUR.setMode('walk');}}
image.src=window.REALISM_STONE;
})();


