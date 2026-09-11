'use strict';
(() => {
const T=THREE,V=HOME_VIEWER,C=V.finishContext,F=C.industrialFinishes,M=C.materials;
const version=window.HOME_LAYOUT.proposal;
const color=hex=>new T.Color(hex).convertSRGBToLinear();
const names={v1:'黑石弧吧・煙燻胡桃木',v2:'精密影音・拉絲不鏽鋼小中島',v3:'銀白脈紋大中島・深木酒廊',v4:'深礦石大中島・黑玻影音牆'};
const textures={},materials={},touched=new Set();
// Generated once per page. Shared PBR maps, no extra render loop or surface meshes.
function map(id,w,h,pixel,srgb=true){
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d'),im=ctx.createImageData(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=pixel(x/w,y/h,x,y),i=(y*w+x)*4;for(let k=0;k<3;k++)im.data[i+k]=p[k];im.data[i+3]=255;}
 ctx.putImageData(im,0,0);const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=srgb?T.sRGBEncoding:T.LinearEncoding;
 t.anisotropy=Math.min(4,V.renderer.capabilities.getMaxAnisotropy());t.name=id;textures[id]=t;return t;
}
const tau=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function hash(x,y){let s=Math.imul(x+37,73856093)^Math.imul(y+97,19349663);s=Math.imul(s^(s>>>16),2246822519);return (s>>>0)/4294967296;}
function noise(u,v,n){const x=u*n,y=v*n,i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j,f=t=>t*t*(3-2*t),at=(i,j)=>hash((i%n+n)%n,(j%n+n)%n);return (at(i,j)*(1-f(a))+at(i+1,j)*f(a))*(1-f(b))+(at(i,j+1)*(1-f(a))+at(i+1,j+1)*f(a))*f(b);}
function grainNoise(u,v,nx,ny){const x=u*nx,y=v*ny,i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j,f=t=>t*t*(3-2*t),at=(i,j)=>hash((i%nx+nx)%nx,(j%ny+ny)%ny);return (at(i,j)*(1-f(a))+at(i+1,j)*f(a))*(1-f(b))+(at(i,j+1)*(1-f(a))+at(i+1,j+1)*f(a))*f(b);}
const wood=map('smoked-walnut',512,1024,(u,v,x,y)=>{
 const drift=.012*Math.sin(v*tau)+.006*Math.sin(v*tau*3),q=u+drift;
 const pores=clamp((grainNoise(q,v,150,30)-.66)*4);
 const value=215+38*(grainNoise(q,v,22,3)-.5)+26*(grainNoise(q,v,88,9)-.5)+12*(grainNoise(q,v,4,2)-.5)-pores*10+(hash(x,y)-.5)*3;
 return [value,value,value];
});
const woodHeight=wood.clone();woodHeight.encoding=T.LinearEncoding;
const steelGrain=map('directional-brushed-metal',512,512,(u,v,x,y)=>{const q=219+12*(hash(0,y)-.5)+5*(hash(x,y)-.5);return [q,q,q];});
const steelHeight=steelGrain.clone();steelHeight.encoding=T.LinearEncoding;
const hotRolled=map('blackened-steel-cloud',512,512,(u,v,x,y)=>{const a=noise(u,v,4),b=noise(u,v,19),q=55+(a-.5)*19+(b-.5)*7+(hash(x,y)-.5)*3;return [q*.94,q,q*1.03];});
const stoneSettings={v1:{base:[37,40,39],vein:[181,184,174],width:.014,roughness:.29,name:'黑色細脈紋石材'},v2:{base:[83,87,85],vein:[177,182,173],width:.007,roughness:.40,name:'灰綠皂石細脈紋'},v3:{base:[183,185,179],vein:[42,46,47],width:.025,roughness:.34,name:'銀白深脈紋石材'},v4:{base:[61,68,69],vein:[132,141,139],width:.024,roughness:.49,name:'深礦石層理石材'}};
const s=stoneSettings[version];
const stoneMap=map('island-'+version,512,512,(u,v,x,y)=>{
 const cloud=noise(u,v,6),fine=noise(u,v,31),warp=.08*Math.sin(v*tau*2)+.045*Math.sin(u*tau*3+v*tau);
 const d=Math.abs(Math.sin(tau*(u+v*2+warp))),d2=Math.abs(Math.sin(tau*(u*3-v+warp*1.7+.31)));
 const vein=clamp(1-d/s.width)+.35*clamp(1-d2/(s.width*.35)),halo=Math.exp(-d*14)*.12;
 const f=clamp(vein+halo),grain=(cloud-.5)*19+(fine-.5)*6+(hash(x,y)-.5)*3;
 return s.base.map((a,k)=>a*(1-f)+s.vein[k]*f+grain);
});
const terrazzo=map('basalt-fine-aggregate',512,512,(u,v,x,y)=>{
 const gx=Math.floor(u*86),gy=Math.floor(v*86),r=hash(gx,gy),dx=u*86-gx-.5,dy=v*86-gy-.5;
 const fleck=r>.69&&dx*dx+dy*dy<.05+.05*r;const q=54+(noise(u,v,7)-.5)*12+(fleck?46+35*r:0);return [q*.97,q,q*1.02];
});
const rugMap=map('silver-charcoal-woven-rug',512,512,(u,v,x,y)=>{
 const edge=Math.min(u,1-u,v,1-v),border=edge<.035?42:edge<.045?152:83;
 const thread=(x%3===0?9:0)+(y%4===0?5:0)+(hash(x,y)-.5)*13+(noise(u,v,17)-.5)*17;
 return [border+thread,border+thread,border+thread-1];
});
function material(id,name,options){const m=new T.MeshPhysicalMaterial(options);m.name=name;m.userData.finishId=id;materials[id]=m;return m;}
const walnut=material('walnut','煙燻胡桃木・開放木孔',{color:color('#755b46'),map:wood,bumpMap:woodHeight,bumpScale:.028,roughness:.58,metalness:0,clearcoat:.1,clearcoatRoughness:.5,envMapIntensity:.32});
const reeded=walnut.clone();reeded.name='煙燻胡桃木・細直槽';reeded.userData.finishId='reeded-walnut';reeded.userData.reviewReeds=true;materials['reeded-walnut']=reeded;
reeded.onBeforeCompile=shader=>{
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat reed=abs(fract(vUv.x*25.0)-.5);float groove=smoothstep(.35,.49,reed);groove=mix(groove,.16,smoothstep(.25,.9,fwidth(vUv.x*25.0)));diffuseColor.rgb*=mix(1.0,.42,groove);');
};reeded.customProgramCacheKey=()=> 'walnut-fine-reeds-20260911';
const stainless=material('stainless','銀色拉絲不鏽鋼',{color:color('#c5c8c7'),map:steelGrain,bumpMap:steelHeight,bumpScale:.009,roughness:.3,metalness:.88,envMapIntensity:1.05});
const tvMetal=material('blackened-steel','黑化鋼板・細雲紋',{color:color('#ffffff'),map:hotRolled,roughness:.46,metalness:.83,envMapIntensity:.75});
const matte=material('matte-black','碳黑霧面烤漆',{color:color('#202421'),roughness:.79,metalness:.04,envMapIntensity:.18});
const stone=material('island-stone',s.name,{color:color('#ffffff'),map:stoneMap,roughness:s.roughness,metalness:0,clearcoat:.12,clearcoatRoughness:.4,envMapIntensity:.5});
const inner=material('display-interior','展示櫃煙燻木內襯',{color:color('#695747'),map:wood,bumpMap:woodHeight,bumpScale:.016,roughness:.7,envMapIntensity:.2});
const blackGlass=M.blackglass;blackGlass.color.copy(color('#111817'));blackGlass.roughness=.12;blackGlass.metalness=.3;blackGlass.clearcoat=1;blackGlass.clearcoatRoughness=.1;blackGlass.envMapIntensity=.95;
const wallFinish=M.concrete.clone();wallFinish.name='礦物灰手抹塗料';wallFinish.color.copy(color('#aaa9a2'));wallFinish.roughness=.96;wallFinish.bumpScale=.02;materials['mineral-wall']=wallFinish;
const architecturalSteel=F.steel;architecturalSteel.color.copy(color('#303632'));architecturalSteel.roughness=.38;architecturalSteel.metalness=.82;
const oldWalnut=F.darkVeneer,oldOak=F.oak;
function ancestry(o){const a=[];for(let p=o;p&&p!==V.scene;p=p.parent)a.push(p.userData.name||p.name||'');return a.join('|');}
function assign(o,m,role,uv){o.material=m;o.userData.industrialRole=role;touched.add(o);if(uv==='wood')F.cabinetUV(o);else if(uv)F.worldUV(o,uv);}
function isDevice(o){for(let p=o;p;p=p.parent)if(p.userData.equipment)return true;return false;}
function apply(){
 V.scene.updateMatrixWorld(true);
 C.ceilingMaterial.color.copy(color('#b4b6b1'));C.ceilingMaterial.roughness=.97;
 M.cloth.color.copy(color('#71736d'));M.darkcloth.color.copy(color('#343934'));M.linen.color.copy(color('#d4d4cd'));
 C.rugMaterial.color.copy(color('#ffffff'));C.rugMaterial.map=rugMap;C.rugMaterial.name='銀灰織毯・炭黑窄邊';
 const flooring=window.HOME_FLOORING;
 if(flooring){flooring.floor.material.color.copy(color('#8e7a65'));flooring.floor.material.map=wood;flooring.floor.material.bumpMap=woodHeight;flooring.floor.material.roughness=.61;flooring.floor.material.name='深煙燻棕橡木人字拼';flooring.floor.material.userData.reviewFloor=true;flooring.floor.material.needsUpdate=true;flooring.tileMaterial.color.copy(color('#ffffff'));flooring.tileMaterial.map=terrazzo;flooring.tileMaterial.roughness=.74;flooring.tileMaterial.name='玄關玄武岩細骨料大板';}
 V.architecture.traverse(o=>{if(o.isMesh&&(o.material===M.concrete||o.material===wallFinish))assign(o,wallFinish,'mineral-wall',240);});
 V.fittings.traverse(o=>{
  if(!o.isMesh)return;const n=o.userData.name||o.name||'',chain=ancestry(o),m=o.material;
  // Equipment retains manufacturer materials and all its working geometry.
  if(isDevice(o))return;
  if(o.userData.islandSurface==='countertop'||/^(260×160.2 曲線中島|81×189 直線中島)/.test(n))assign(o,stone,'island-stone',260);
  else if(/^sink-/.test(o.userData.islandSurface||''))assign(o,stainless,'sink-stainless',40);
  else if(o.userData.islandExterior)assign(o,version==='v2'?stainless:reeded,version==='v2'?'small-island-stainless':'curved-smoked-wood',version==='v2'?80:'wood');
  else if(o.userData.finishGroup==='tv-graphite'||/金屬周框/.test(n))assign(o,tvMetal,'tv-metal',160);
  else if(version==='v4'&&/V4 南牆(灰礦物塗料背牆|反射黑玻完成面)/.test(n)){assign(o,blackGlass,'fixed-tv-black-glass');o.userData.name='V4 南牆反射黑玻完成面';o.userData.desc='反射黑玻搭深木影音櫃及黑化鋼細框；原牆面與設備尺寸。';}
  else if(o.userData.finishGroup==='entry-graphite')assign(o,walnut,'entry-walnut','wood');
  else if(o.userData.finishGroup==='collection-inner')assign(o,inner,'collection-wood-liner','wood');
  else if(o.userData.openIslandWood&&/開放.*中島/.test(chain)){
   const service=!!o.userData.swingFront||/通風帶上收口/.test(n);
   assign(o,service?matte:reeded,service?'island-service-matte':'island-reeded-wood',service?null:'wood');
  }
  else if(m===oldWalnut||m===oldOak||o.userData.openIslandWood||o.userData.vanityWood||o.userData.bedroomWood)assign(o,walnut,'smoked-walnut','wood');
  else if(/影音櫃可拆上板/.test(n))assign(o,walnut,'media-smoked-wood','wood');
  else if(/書房.*展示|收藏.*展示|中島頂天雙面玻璃櫃|收藏室.*玻璃/.test(chain)){
   o.geometry.computeBoundingBox();const size=o.geometry.boundingBox.getSize(new T.Vector3());
   if((m===F.black||m===M.black||m===inner)&&size.y<=7.1&&Math.max(size.x,size.z)>35)assign(o,inner,'display-wood','wood');
  }
  else if(/廚房C櫃|廚房.*櫃|Best G-931503 電器收納門/.test(chain)&&!o.userData.doorControl&&(m===blackGlass||m===M.black||m===F.black))assign(o,stainless,'kitchen-stainless',80);
  else if(version==='v2'&&/直線中島/.test(chain)&&!o.userData.islandSurface&&(o.userData.swingFront||/外側|側板|封板/.test(n)))assign(o,stainless,'small-island-stainless',80);
  else if(/浴.*櫃|洗手.*櫃/.test(chain)&&(m===blackGlass||m===M.black||m===F.black))assign(o,walnut,'bath-walnut','wood');
  // Give the rug a single border around its actual extents, not a tiled carpet map.
  if(o.material===C.rugMaterial){const g=o.geometry,p=g.attributes.position;g.computeBoundingBox();const b=g.boundingBox,sz=b.getSize(new T.Vector3()),uv=[];const horizontal=sz.z>sz.y;for(let i=0;i<p.count;i++)uv.push((p.getX(i)-b.min.x)/Math.max(sz.x,1),(horizontal?p.getZ(i)-b.min.z:p.getY(i)-b.min.y)/Math.max(horizontal?sz.z:sz.y,1));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));}
 });
 window.HOME_STORAGE_MODEL?.root.traverse(o=>{if(o.isMesh){o.material.color.copy(color(o.material.roughness>.75?'#858c86':'#333e3a'));}});
 // Existing reflectors stay within the established economy / quality modes.
 V.scene.userData.industrialDesign={revision:'20260911-layered',version,title:names[version],palette:'黑化鋼・銀拉絲・深棕木・脈紋石・黑玻',geometry:'保留格局、門洞及設備尺寸',surfaces:touched.size,references:22,textureCount:Object.keys(textures).length};
 window.HOME_REALISM?.registerMaterials?.();window.HOME_REALISM?.invalidate();
}
window.HOME_INDUSTRIAL={apply,materials:{stone,tvMetal,...materials},textures,getState:()=>({...V.scene.userData.industrialDesign})};
apply();window.HOME_REALISM.ready?.then(apply);
})();
