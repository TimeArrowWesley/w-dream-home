'use strict';
// QA03: preserve original openings; fill only missing wall areas outside them.
// Heights are inherited model assumptions, not measured or approved dimensions.
(()=>{
const V=window.HOME_VIEWER,T=window.THREE,L=window.HOME_LAYOUT;
const version=L?.proposal;if(!V||!['v0','v1','v2','v3','v4'].includes(version))return;
const M=V.finishContext.materials,revision='20260922-qa03',records=[],removed=[];
const boxBounds=o=>{const a=new T.Box3().setFromObject(o);return {x:a.min.x+482.5,y:a.min.z+480,z:a.min.y,w:a.max.x-a.min.x,d:a.max.z-a.min.z,h:a.max.y-a.min.y};};
const all=()=>{const a=[];V.scene.traverse(o=>a.push(o));return a;};
const named=n=>all().find(o=>(o.userData.name||o.name)===n);
function drop(o){if(o){removed.push(o);o.traverse(q=>V.unregisterObject?.(q));o.parent?.remove(o);}}
function group(name,parent=V.fittings){const g=new T.Group();g.name=name;g.userData.modelRepair=revision;parent.add(g);return g;}
function tag(o,name,desc='顧問QA03模型試案；五金、固定與現場淨尺寸待深化。'){o.userData={...o.userData,name,desc,source:'2026-09-22 業主授權執行檢視修正',modelRepair:revision};V.registerObject?.(o);return o;}
function b(x,y,w,d,z,h,mat,name,parent=V.fittings){const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);o.position.copy(V.pos(x+w/2,y+d/2,z+h/2));o.castShadow=o.receiveShadow=true;parent.add(o);return tag(o,name);}
function flat(o,outer,hole){const {x,y,w,d,z,h}=outer,s=new T.Shape();s.moveTo(x-482.5,480-y);s.lineTo(x+w-482.5,480-y);s.lineTo(x+w-482.5,480-y-d);s.lineTo(x-482.5,480-y-d);s.closePath();
 if(hole){const p=new T.Path(),{x:a,y:c,w:e,d:f}=hole;p.moveTo(a-482.5,480-c);p.lineTo(a-482.5,480-c-f);p.lineTo(a+e-482.5,480-c-f);p.lineTo(a+e-482.5,480-c);p.closePath();s.holes.push(p);}
 o.geometry=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});o.geometry.rotateX(-Math.PI/2);o.position.set(0,z,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);return o;
}

function infill(x,y,w,d,z,h,name){
 const o=b(x,y,w,d,z,h,M.concrete,name,V.architecture);
 o.userData.qa03Infill=true;V.wallParts.push({m:o,z,h});return o;
}
infill(-85,312.6,10,79.8,0,90,'QA03 主浴原窗下實牆');
infill(-85,312.6,10,79.8,230,45,'QA03 主浴原窗上實牆');
infill(1085,88,10,224,245,30,'QA03 書房外窗上實牆');
infill(-8,733,8,164,215,60,'QA03 廚房後陽台玻璃上實牆');
records.push({issue:'Q01',window:{x:-85,y:312.6,width:79.8,sill:90,head:230},source:'existing design.js model values',approval:'窗高待建商立面及現場確認；位置及窗框不變'});
records.push({issue:'Q02',window:{x:1085,y:88,width:224,sill:0,head:245},source:'existing model opening',change:'fill 245–275 cm header only'});
records.push({issue:'Q03',window:{x:-8,y:733,width:164,sill:0,head:215},source:'existing model opening',change:'fill 215–275 cm header, behind kitchen ceiling above 240 cm'});
if(version==='v0'){
const counter=named('A區308.7cm石材檯面'),cut={x:12.5,y:654.5,w:42,d:75};
flat(counter,boxBounds(counter),cut);tag(counter,'A區308.7cm石材檯面','原外形與高度保留；水槽開孔為模型深化，須對已下單廚具模板。');
const oldSink=named('78cm雙層水槽'),sinkBounds=oldSink&&boxBounds(oldSink);
for(const o of all()){if(!o.isMesh)continue;const q=boxBounds(o);if(q.x>=10.9&&q.x+q.w<=56.1&&q.y>=652.9&&q.y+q.d<=731.1&&q.z>=86.4&&q.z<87.5&&q.h<1)drop(o);}
const base=V.fittings.children.find(o=>o.name==='A區120cm雙開水槽櫃');
for(const o of base.children){if(!o.isMesh)continue;const q=boxBounds(o);if(q.z>81&&q.h<2)flat(o,q,cut);}
const sink=group('QA03 主廚房中空水槽'),metal=new T.MeshStandardMaterial({color:new T.Color('#899297').convertSRGBToLinear(),roughness:.35,metalness:.78,side:T.DoubleSide});
const rim=b(11,653,45,78,86.5,.7,metal,'78cm雙層水槽・薄邊',sink);flat(rim,{x:11,y:653,w:45,d:78,z:86.5,h:.7},{x:14,y:656,w:39,d:72});
for(const [x,y,w,d] of [[13.5,655.5,.5,73],[53,655.5,.5,73],[14,655.5,39,.5],[14,728,39,.5]])b(x,y,w,d,59.5,27.4,metal,'主水槽中空側壁',sink);
const bottom=b(13.5,655.5,40,73,59.2,.3,metal,'主水槽槽底',sink);flat(bottom,{x:13.5,y:655.5,w:40,d:73,z:59.2,h:.3},{x:30.5,y:689,w:6,d:6});
b(30.5,689,6,6,58.7,.2,M.rubber,'主水槽排水口示意',sink);
records.push({issue:'Q04',outer:sinkBounds,cutout:cut,recordedProduct:'BELEGA BESK-R15 78×45×28cm，家具主檔既有紀錄',externalHeightCm:28,provisionalInnerDepthCm:27.7,limit:'依既有產品外徑建模；內膽淨深、圓角、滴水板及開孔模板仍待廚具商核對。'});

}
V.scene.updateMatrixWorld(true);
window.HOME_AUDIT_REPAIRS={revision,version,records,removed};
})();
