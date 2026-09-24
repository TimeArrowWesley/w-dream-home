'use strict';
// IR01: finish missing service-side cabinet faces without changing island footprints.
// Run before walk/interaction registration and before the material layers.
(()=>{
const V=window.HOME_VIEWER,T=window.THREE,E=window.HOME_EQUIPMENT;
if(!V||!E||window.HOME_ISLAND_SHELL)return;
const version=window.HOME_CURRENT_VERSION(),M=V.finishContext.materials;
const island=V.fittings.children.find(o=>o.userData.island&&o.userData.footprint);
if(!island)return;
const added=[],revision='20260924-ir01';
function panel(x,y,w,d,z,h,name,door){
 const m=new T.Mesh(new T.BoxGeometry(w,h,d),M.black.clone());m.position.copy(V.pos(x+w/2,y+d/2,z+h/2));m.name=name;m.castShadow=m.receiveShadow=true;
 m.userData={name,desc:'IR01補齊原檯面下缺面；尺寸為模型修復值。封板、散熱及檢修五金待設計師核定。',ir01:true,openIslandWood:true};
 if(door)m.userData.swingFront={name,face:door,hinge:'min',hingeFrontOffset:1.1};
 island.add(m);E.covers.push(m);V.registerObject(m);added.push(m);return m;
}
function segment(a,b,z,h,name,th=1.6){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);const m=panel((a[0]+b[0])/2-th/2,(a[1]+b[1])/2-len/2,th,len,z,h,name);m.rotation.y=Math.atan2(dx,dy);return m;}
function strip(points,z,h,name){for(let i=1;i<points.length;i++)segment(points[i-1],points[i],z,h,name);}
if(version==='v1'||version==='v3'){
 // Dry access is genuinely closed below its separate narrow ventilation band.
 panel(478.2,588.5,46.2,1.6,8,66,'IR01 圓弧中島IH下方檢修門','N');
 panel(478,590.1,53.8,64.6,6.2,1.8,'IR01 IH艙底板');
 panel(478,590.3,53.8,1.6,0,6.2,'IR01 IH艙內縮踢腳');
 panel(478,588.5,46.7,1.6,86.5,5.5,'IR01 IH散熱帶上收口');
 for(const z of [77,80,83])panel(478,589.5,46.7,1.2,z,.7,'IR01 IH散熱葉片');
 const edge=[[525,588.1],[530.63,587.87],[536.24,587.18],[541.7,586.07],[547,584.54],[552.12,582.6],[557.04,580.29],[561.75,577.62],[566.22,574.61]];
 strip(edge,6.2,85.8,'IR01 內弧連續封板');
 strip(edge.map(([x,y])=>[x+1.6,y+1.6]),0,6.2,'IR01 內弧踢腳');
 segment(edge.at(-1),[593,574.3],5,87,'IR01 飲水檢修南側回板');
 segment([587.08,550.29],[593,549.5],5,87,'IR01 飲水檢修北側回板');
 panel(593,551.1,1.6,22.9,70.3,21.7,'IR01 飲水檢修上封板');
 panel(594.6,551.1,1.6,22.9,0,5,'IR01 飲水艙內縮踢腳');
 segment([587.08,550.29],[596.5,541.6],0,92,'IR01 掃地機與飲水艙間封板');
}else if(version==='v4'){
 // Robot entry stays open below 40 cm; the IH chassis is not an exposed hole.
 panel(434,541.3,1.6,48.4,40.3,33.7,'IR01 小中島掃地機上方檢修門','W');
 panel(434,541,1.6,49,86.5,5.5,'IR01 小中島IH散熱上收口');
 for(const z of [78,81,84])panel(435,541.8,1.2,47.4,z,.7,'IR01 小中島IH散熱葉片');
 panel(433.5,591.8,1.6,59.4,70.3,21.7,'IR01 小中島濕區上封板');
 panel(435.1,591.8,1.6,59.4,0,5,'IR01 小中島濕區內縮踢腳');
 panel(433.5,591.8,1.6,2.2,5,65.3,'IR01 小中島檢修門北收口');
 panel(433.5,649,1.6,2.2,5,65.3,'IR01 小中島檢修門南收口');
}else if(version==='v0'){
 // Original 80 cm curved plan: close the wedge between the two service bays.
 const pts=window.HOME_ORIGINAL_SPEC.island.contour.north.filter(p=>p[0]>=534.3&&p[1]>=541);
 // Preserve the approach to the recessed west-facing service door: the curved
 // fascia only caps the head; the two returns close the sides of that recess.
 strip(pts,86.5,5.5,'IR01 原圖內弧上收口');
 segment([533.2,578.3],[591,587],8,84,'IR01 原圖濕區弧端收口');
 segment([580.433,541.261],[591,544],8,84,'IR01 原圖乾區弧端收口');
 panel(591,544,1.8,43,86.5,5.5,'IR01 原圖IH散熱上收口');
 for(const z of [78,81,84])panel(592,544.8,1.2,41.4,z,.7,'IR01 原圖IH散熱葉片');
}
V.scene.updateMatrixWorld(true);
window.HOME_ISLAND_SHELL={revision,version,island,added,getState:()=>({revision,version,added:added.length,footprint:island.userData.footprint})};
})();
