'use strict';
// GR06: finish proposal only. Existing architecture, cabinets and equipment stay.
(()=>{
const T=THREE,V=HOME_VIEWER,C=V.finishContext,F=C.industrialFinishes,I=window.HOME_INDUSTRIAL;
if(!I)return;const version=window.HOME_LAYOUT.proposal,revision='20260922-gr06';
const col=h=>new T.Color(h).convertSRGBToLinear(),textures={};
function noise(x,y){let n=Math.imul(x+71,73856093)^Math.imul(y+31,19349663);n=Math.imul(n^(n>>>16),2246822519);return (n>>>0)/4294967296;}
function cloud(x,y,s){const u=x/s,v=y/s,a=Math.floor(u),b=Math.floor(v),fx=u-a,fy=v-b,f=t=>t*t*(3-2*t);return (noise(a,b)*(1-f(fx))+noise(a+1,b)*f(fx))*(1-f(fy))+(noise(a,b+1)*(1-f(fx))+noise(a+1,b+1)*f(fx))*f(fy);}
function map(id,panels){const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d'),im=ctx.createImageData(512,512);for(let y=0;y<512;y++)for(let x=0;x<512;x++){const row=Math.floor(y/128),xx=(x+(row%2)*128)%256,joint=panels&&(y%128<1||xx<1);const q=joint?82:157+(cloud(x,y,61)-.5)*24+(cloud(x,y,15)-.5)*17+(noise(x,y)-.5)*11;const at=(y*512+x)*4;im.data[at]=q;im.data[at+1]=q;im.data[at+2]=q-1;im.data[at+3]=255;}ctx.putImageData(im,0,0);const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;t.name=id;textures[id]=t;return t;}
const stoneMap=map('gr06-grey-stone-panels',true),fineMap=map('gr06-fine-grey-stone',false);
function mat(name,hex,map,rough=.85){const m=new T.MeshStandardMaterial({color:col(hex),map:map||null,roughness:rough,metalness:0});m.name=name;m.userData.gr06=true;return m;}
const stone=mat('GR06 中灰細肌理石材・錯縫示意','#ffffff',stoneMap),fine=mat('GR06 細面灰石・平靜檯面','#b3b5b5',fineMap,.7),quiet=mat('GR06 平靜石墨灰','#626668'),fabric=mat('GR06 灰褐織品','#89847e',null,.98),wall=mat('GR06 淺中灰礦物面','#bebeb9');
const changed=new Set();
function set(o,m,role,uv){o.material=m;o.userData.greyStoneRole=role;changed.add(o);if(uv&&!o.userData.gr06UV){F.worldUV(o,uv);o.userData.gr06UV=true;}}
function chain(o){let s='';for(let p=o;p;p=p.parent)s+='|'+(p.userData.name||p.name||'');return s;}
function device(o){for(let p=o;p;p=p.parent)if(p.userData.equipment)return true;return false;}
// A recessed linear light is a proposed fitting, not a new wall or cabinet.
const lights=new T.Group();lights.name='GR06 灰石洗牆燈試案';lights.userData.gr06NewFitting=true;V.fittings.add(lights);
if(['v0','v1','v4'].includes(version)){
 const h=version==='v4'?244.4:169.4,m=new T.MeshBasicMaterial({color:col('#fff1d9')}),strip=new T.Mesh(new T.BoxGeometry(305,.6,1.2),m);strip.name='GR06 石牆上緣內藏線燈・位置待燈具深化';strip.position.copy(V.pos(917.5,948,h));strip.userData.gr06NewFitting=true;lights.add(strip);
}
function apply(){
 C.ceilingMaterial.color.copy(col('#c6c7c4'));
 for(const key of ['walnut','reeded-walnut','display-interior']){const m=I.materials[key];if(m)m.color.copy(col(key==='display-interior'?'#77756e':'#776f65'));}
 const floor=window.HOME_FLOORING;if(floor){floor.floor.material.color.copy(col('#9b9489'));floor.floor.material.name='GR06 灰棕色人字木地板・降低紅棕感';floor.tileMaterial.map=fineMap;floor.tileMaterial.color.copy(col('#b2b3b3'));floor.tileMaterial.name='GR06 玄關中灰細面石紋磚';}
 I.materials['mineral-wall'].color.copy(col('#bebeb9'));
 const R=window.HOME_R05;if(R){R.finishes.wood.color.copy(col('#766e64'));R.finishes.graphite.color.copy(col('#494f52'));R.finishes.back.color.copy(col('#90928d'));}
 V.architecture.traverse(o=>{if(o.isMesh&&(o.userData.industrialRole==='mineral-wall'||o.material===C.materials.concrete))set(o,wall,'quiet-wall');});
 V.fittings.traverse(o=>{
  if(!o.isMesh||device(o)||o.userData.gr06NewFitting)return;
  const n=o.userData.name||o.name||'',c=chain(o),role=o.userData.industrialRole||'';
  if(['黑玻電視背牆','R05 低反射電視背牆','GR06 灰石電視背牆'].includes(n)||/V4 南牆(反射黑玻完成面|灰礦物塗料背牆|灰石完成面)/.test(n)){set(o,stone,'fixed-stone-feature',240);o.userData.name=version==='v4'?'V4 南牆灰石完成面':'GR06 灰石電視背牆';o.userData.desc='GR06：沿用原面板外形，灰石細肌理與錯縫為視覺提案；材料品種、排版、厚度及固定待核定。';}
  else if(/南側315cm頂天玻璃展示櫃/.test(c)&&!o.material.transparent){o.geometry.computeBoundingBox();const s=o.geometry.boundingBox.getSize(new T.Vector3());if(s.z<=2.1&&s.x>250&&s.y>200)set(o,stone,'fixed-display-stone-back',240);}
  else if(role==='island-stone')set(o,fine,'fine-island-stone',240);
  else if(/電視上櫃|電箱整合櫃/.test(c)&&!o.material.transparent&&o.material.metalness<.5)set(o,quiet,'quiet-media-storage');
  else if(n.includes('床頭軟包'))set(o,fabric,'soft-bedroom');
  else if(o.userData.sofaRole==='wood')o.material.color.copy(col('#766e64'));
  else if(o.userData.sofaRole==='fabric')o.material.color.copy(col('#858784'));
 });
 for(const l of F.warmLights)l.color.copy(col('#ffe9c9'));
 V.scene.userData.greyStoneDesign={revision,version,palette:'中灰細肌理石・淺中灰礦物面・灰棕木・石墨框',floor:'保留既有人字拼，降低紅棕感（業主確認）',surfaces:changed.size,geometry:'既有格局與收納不變；固定電視牆新增內藏線燈示意',limitations:'模型材質提案；非指定產品、照度計算或施工圖'};
 window.HOME_REALISM?.registerMaterials?.();window.HOME_REALISM?.invalidate?.();
 const foot=document.querySelector?.('.uiSideFoot');if(foot)foot.textContent=version.toUpperCase()+' · GR06 · 2026.09.22 · 灰石材質提案，施工尺寸待確認';
}
const baseApply=I.apply;I.apply=function(){baseApply();apply();};
if(window.HOME_R05){const base=window.HOME_R05.applyFinishes;window.HOME_R05.applyFinishes=function(){base?.();apply();};}
window.HOME_GREY_STONE={apply,materials:{stone,fine,quiet,fabric,wall},textures,revision,getState:()=>({...V.scene.userData.greyStoneDesign})};
apply();window.HOME_REALISM?.ready?.then(apply);
})();
