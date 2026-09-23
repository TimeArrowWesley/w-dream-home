'use strict';
// GI01: V4 finish/light refinement. R02 geometry, storage and factory equipment stay.
(()=>{
const V=window.HOME_VIEWER,T=window.THREE,I=window.HOME_INDUSTRIAL,G=window.HOME_GREY_STONE;
if(window.HOME_LAYOUT?.proposal!=='v4'||!V||!I||!G||window.HOME_V4_INDUSTRIAL)return;
const C=V.finishContext,F=C.industrialFinishes,col=h=>new T.Color(h).convertSRGBToLinear();
const revision='20260923-v4gi01',targets=new Map(),diffusers=new Map(),zones={study:100,display:60,stone:65};
function material(name,hex,roughness,metalness,map){const m=new T.MeshStandardMaterial({color:col(hex),roughness,metalness,map:map||null,envMapIntensity:.65});m.name=name;m.userData.gi01=true;return m;}
const graphite=material('GI01 石墨灰霧面櫃板','#363d41',.82,.04);
const blackened=material('GI01 炭黑櫃板','#252b2f',.8,.04);
const liner=material('GI01 中灰展示內襯','#697073',.88,0);
const metal=material('GI01 槍灰拉絲金屬','#747c82',.38,.78,I.textures['directional-brushed-metal']);
const retainedWood=I.materials.walnut.clone();retainedWood.name='GI01 低彩度灰棕木點綴';retainedWood.color.copy(col('#706b64'));retainedWood.userData.gi01=true;
function chain(o){let s='';for(let p=o;p;p=p.parent)s+='|'+(p.userData.name||p.name||'');return s;}
function device(o){for(let p=o;p;p=p.parent)if(p.userData.equipment)return true;return false;}
function bounds(o){const b=new T.Box3().setFromObject(o),s=b.getSize(new T.Vector3());return{x:b.min.x+482.5,y:b.min.z+480,z:b.min.y,w:s.x,d:s.z,h:s.y};}
function target(o,m,role){targets.set(o,{material:m,role});}
V.scene.updateMatrixWorld(true);
V.fittings.traverse(o=>{
 if(!o.isMesh||Array.isArray(o.material)||device(o))return;
 const n=o.userData.name||o.name||'',c=chain(o),b=bounds(o),role=o.userData.industrialRole||'',m=o.material;
 const study=b.x>=754&&b.x+b.w<=793&&b.y>=179&&b.y+b.d<=366;
 const display=c.includes('V4 收藏玻璃展示櫃');
 if(m===C.materials.light&&(study||display)){const copy=m.clone();copy.name='GI01 展示分區燈帶';copy.userData.gi01=true;diffusers.set(o,copy);return;}
 if(m.transparent)return;
 if(role==='island-reeded-wood')target(o,n==='V4 中島北端固定板'?retainedWood:graphite,'island-graphite');
 else if(role==='island-service-matte')target(o,blackened,'service-black');
 else if(c.includes('V4 玄關矮櫃')&&role==='smoked-walnut')target(o,b.h<3?retainedWood:graphite,'entry-two-tone');
 else if(/電箱上段獨立維修門|電箱櫃下部固定收邊|玄關南端可拆封閉轉角|玄關既有側板上延/.test(c)&&role==='smoked-walnut')target(o,graphite,'entry-graphite');
 else if(/冰箱旁圓弧頂天櫃|V4 行李與深收藏門|深櫃頂端順樑封板|收藏櫃 L 形封閉轉角/.test(c)&&role==='smoked-walnut')target(o,graphite,'deep-storage-graphite');
 else if(n==='書房九抽收納')target(o,graphite,'study-drawer-graphite');
 else if(study&&b.w<=2.1&&b.d>150&&b.h>=60)target(o,liner,'study-neutral-back');
 else if(display&&b.d<=2.1&&b.w>100&&b.h>200)target(o,liner,'display-neutral-back');
 else if((study||display)&&m.metalness>=.5&&(Math.max(b.w,b.d,b.h)>35||/收邊|把手/.test(n)))target(o,metal,'brushed-display-frame');
 else if(/R02 後環繞背架承板|R02 後環繞背架支承|鑰匙置物盤/.test(n))target(o,metal,'brushed-functional-metal');
 else if(o.userData.sofaRole==='wood'||role==='media-smoked-wood')target(o,retainedWood,'retained-wood-accent');
});
const stoneStrip=V.scene.getObjectByName('GR06 石牆上緣內藏線燈・位置待燈具深化');
if(stoneStrip){stoneStrip.material=stoneStrip.material.clone();stoneStrip.material.name='GI01 灰石局部洗牆';}
function applyLighting(){
 const s=window.HOME_COMFORT?.getState()||{scene:'daily',brightness:85,display:55,kelvin:4000};
 const day=['daily','custom'].includes(s.scene),displayPower=s.display/100*zones.display/100;
 const neutral=col('#f3f5f7'),accent=col(day?'#fff0e1':'#ffe2bd');
 for(const l of C.roomLights){const p=l.position;if(p.x+482.5>745&&p.z+480<460){l.intensity=s.brightness/100*.95*zones.study/100;if(day)l.color.copy(neutral);}}
 for(const l of F.warmLights){const x=l.position.x+482.5,y=l.position.z+480;if(x>745||y>=375){l.intensity=displayPower*.48;l.color.copy(accent);}}
 for(const [o,m] of diffusers){o.material=m;m.color.copy(accent).multiplyScalar(displayPower);if(m.emissive){m.emissive.copy(accent);m.emissiveIntensity=displayPower*.8;}}
 if(stoneStrip)stoneStrip.material.color.copy(col('#ffe2bd')).multiplyScalar(zones.stone/100*(s.scene==='movie'?0:s.scene==='night'?.08:1));
 V.scene.userData.v4IndustrialLighting={...zones,scene:s.scene,study:'日常中性白；既有書房光源分區調光',display:'降低平均亮度，灰色內襯與金屬框保留反差',stone:'局部柔和洗牆；電影情境關閉',limits:'顯示用比例與光色示意；非現場照度、配光或電路核定'};
}
function apply(){
 for(const [o,t] of targets){o.material=t.material;o.userData.v4IndustrialRole=t.role;if(o.userData.gi01PreviousDesc===undefined)o.userData.gi01PreviousDesc=o.userData.desc||'';o.userData.desc='GI01：'+t.material.name+'；沿用R02幾何與容量，材質實品及施工待核。'+o.userData.gi01PreviousDesc;}
 applyLighting();window.HOME_REALISM?.registerMaterials?.();window.HOME_REALISM?.invalidate?.();
 V.scene.userData.v4IndustrialRefinement={revision,surfaces:targets.size,geometry:'V4 R02全數保留',palette:'灰石主景／石墨櫃面／槍灰拉絲／低彩度灰棕木點綴',limits:'材質與燈光提案，實品與工程待核'};
 const foot=document.querySelector?.('.uiSideFoot');if(foot)foot.textContent='V4 · R02格局／GI01材質 · 灰石現代工業，工程待核';
}
function updateZones(patch){for(const k of ['study','display','stone'])if(Number.isFinite(Number(patch[k])))zones[k]=Math.max(0,Math.min(100,Number(patch[k])));applyLighting();window.HOME_REALISM?.invalidate?.();return {...zones};}
window.HOME_V4_INDUSTRIAL={revision,apply,applyLighting,updateZones,getState:()=>({...V.scene.userData.v4IndustrialRefinement,zones:{...zones}}),materials:{graphite,blackened,liner,metal,retainedWood}};
// The general scene controls call this hook; the finish pipelines reapply GI01 last.
for(const owner of [I,G]){const base=owner.apply;owner.apply=function(){base();apply();};}
const box=document.createElement('section');box.id='v4LightingZones';box.setAttribute('aria-label','V4 分區燈光');
const title=document.createElement('h3');title.textContent='V4 分區燈光';box.append(title);
for(const [key,label] of [['study','書房功能光'],['display','展示重點光'],['stone','灰石洗牆光']]){
 const row=document.createElement('label'),input=document.createElement('input'),value=document.createElement('output');row.textContent=label+' ';input.type='range';input.min='0';input.max='100';input.value=zones[key];input.id='v4Light-'+key;input.setAttribute('aria-label',label);value.textContent=zones[key]+'%';input.addEventListener('input',()=>{updateZones({[key]:input.value});value.textContent=zones[key]+'%';});row.append(value,input);box.append(row);
}
const note=document.createElement('small');note.textContent='分區亮度為情境示意；實際迴路與配光待燈光設計確認。';box.append(note);document.getElementById('comfortScenes')?.after(box);
apply();window.HOME_REALISM?.ready?.then(apply);
})();
