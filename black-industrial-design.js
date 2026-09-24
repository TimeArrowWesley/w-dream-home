'use strict';
// BI01: accepted black-ceiling / medium-gray style; all version geometries remain.
(()=>{
const V=window.HOME_VIEWER,T=window.THREE,G=window.HOME_GREY_STONE,I=window.HOME_INDUSTRIAL,C=V?.finishContext;
if(!V||!G||!I||window.HOME_BLACK_INDUSTRIAL)return;
const revision='20260923-bi01',version=window.HOME_LAYOUT.proposal,targets=new Map(),col=h=>new T.Color(h).convertSRGBToLinear();
function mat(name,hex,roughness=.94,metalness=0,map=null){const m=new T.MeshStandardMaterial({color:col(hex),roughness,metalness,map,envMapIntensity:.35});m.name='BI01 '+name;m.userData.bi01=true;return m;}
const materials={ceiling:mat('霧黑天花與樑面','#242628',.97),wall:mat('中灰礦物牆','#858986'),accent:mat('深灰連續門框牆帶','#596062'),graphite:mat('石墨霧面櫃板','#363d41',.82,.04),black:mat('炭黑服務側','#252b2f',.8,.04),liner:mat('中灰展示內襯','#697073',.88),metal:mat('槍灰拉絲金屬','#747c82',.38,.78,I.textures['directional-brushed-metal'])};
function device(o){for(let p=o;p;p=p.parent)if(p.userData.equipment)return true;return false;}
function chain(o){let n='';for(let p=o;p;p=p.parent)n+='|'+(p.userData.name||p.name||'');return n;}
function assign(o,material,role){targets.set(o,{material,role});}
const states=V.wallParts.map(p=>[p,p.m.scale.y,p.m.position.y]);for(const [p] of states){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}V.scene.updateMatrixWorld(true);
V.architecture.traverse(o=>{
 if(!o.isMesh||Array.isArray(o.material)||o.material.transparent||o.userData.greyStoneRole!=='quiet-wall')return;
 const geometry=o.geometry.clone(),pos=geometry.attributes.position,norm=geometry.attributes.normal,idx=geometry.index,normalMatrix=new T.Matrix3().getNormalMatrix(o.matrixWorld);
 for(const group of geometry.groups){const c=new T.Vector3(),n=new T.Vector3();for(let j=group.start;j<group.start+group.count;j++){const k=idx?idx.getX(j):j;c.add(new T.Vector3().fromBufferAttribute(pos,k).applyMatrix4(o.matrixWorld));n.add(new T.Vector3().fromBufferAttribute(norm,k).applyMatrix3(normalMatrix));}c.multiplyScalar(1/group.count);n.normalize();const p=c.clone().addScaledVector(n,1),x=c.x+482.5,y=c.z+480,publicFace=p.x+482.5>=220&&p.x+482.5<=1085&&p.z+480>=375&&p.z+480<=955;group.materialIndex=publicFace&&y>=364&&y<=376&&x>=315&&x<=872&&Math.abs(n.y)<.4?1:0;}
 o.geometry=geometry;assign(o,[materials.wall,materials.accent],'medium-gray-wall');
});
for(const [p,s,y] of states){p.m.scale.y=s;p.m.position.y=y;}V.scene.updateMatrixWorld(true);
V.ceiling.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)&&(o.material===C.ceilingMaterial||o.material===C.materials.concrete||o.userData.name==='設備檢修口'))assign(o,materials.ceiling,'black-ceiling');});
V.beams.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material))assign(o,materials.ceiling,'black-beam');});
V.fittings.traverse(o=>{
 if(!o.isMesh||Array.isArray(o.material)||device(o)||o.material.transparent||o.userData.gr06NewFitting||o.userData.v4IndustrialRole)return;
 const n=o.userData.name||o.name||'',c=chain(o),b=new T.Box3().setFromObject(o),s=b.getSize(new T.Vector3()),x=b.min.x+482.5,y=b.min.z+480,role=o.userData.industrialRole||'';
 const publicRoom=y>=375&&x>=220,study=x>=754&&x+s.x<=793&&y>=179&&y+s.z<=366;
 if(['island-reeded-wood','curved-smoked-wood'].includes(role))assign(o,materials.graphite,'island-graphite');
 else if(role==='island-service-matte')assign(o,materials.black,'service-black');
 else if(n==='書房九抽收納')assign(o,materials.graphite,'study-drawers');
 else if(publicRoom&&['smoked-walnut','entry-walnut'].includes(role)&&s.y>3&&!/沙發|影音|電視架/.test(c))assign(o,materials.graphite,'public-storage-graphite');
 else if(study&&s.x<=2.1&&s.z>150&&s.y>=60)assign(o,materials.liner,'study-liner');
 else if((study||publicRoom&&/展示|玻璃櫃/.test(c))&&o.material.metalness>=.5&&Math.max(s.x,s.y,s.z)>35)assign(o,materials.metal,'display-metal');
});
function apply(){
 for(const [o,t] of targets){o.material=t.material;o.userData.blackIndustrialRole=t.role;}
 V.scene.userData.blackIndustrial={revision,version,surfaces:targets.size,palette:'霧黑天花／中灰牆／深灰門框帶／灰石／石墨櫃／灰棕人字木地板',geometry:'各版既有格局、收納、設備保留',limits:'業主採用風格；實體色票、樑下淨高與照明待核。非照度或施工認證。'};
 const display=window.HOME_CURRENT_VERSION?.()||version;const historical=window.HOME_VERSION_REGISTRY?.versions.find(v=>v.id===display)?.history;const foot=document.querySelector?.('.uiSideFoot');if(foot)foot.textContent=display.toUpperCase()+(window.HOME_HYBRID?' · VN01圓弧中島／AU01影音／BI01材質':window.HOME_TV_WALL?' · TW01主牆／AU01影音／BI01材質':window.HOME_LIVING_AUDIO?' · AU01影音／BI01材質':' · BI01霧黑工業')+(historical?' · 已停用／歷史':' · 工程待核');
 window.HOME_REALISM?.registerMaterials?.();window.HOME_REALISM?.invalidate?.();
}
window.HOME_BLACK_INDUSTRIAL={revision,apply,materials,targets,getState:()=>({...V.scene.userData.blackIndustrial})};
for(const owner of [I,G,window.HOME_V4_INDUSTRIAL].filter(Boolean)){const base=owner.apply;owner.apply=function(){base();apply();};}
if(window.HOME_R05){const base=window.HOME_R05.applyFinishes;window.HOME_R05.applyFinishes=function(){base?.();apply();};}
// V1 controls reapply finishes at DOMContentLoaded. Always finish that startup
// pass with the accepted BI01 palette, just as later material resets do.
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',apply,{once:true});
apply();window.HOME_REALISM?.ready?.then(apply);
})();
