'use strict';
// CP02: approved study concept, shared by V1–V5. All dimensions are model cm.
(()=>{
 if(window.HOME_CURRENT_VERSION?.()==='v0')return;
 const T=THREE,V=HOME_VIEWER,group=new T.Group(),finishes=new Map(),accent=[];
 group.name='CP02 雙人賽博電競房';V.fittings.add(group);
 const mat=(color,roughness=.68,metalness=.15)=>new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness,metalness});
 const M={frame:mat('#31373d',.42,.7),panel:mat('#35383e'),back:mat('#292e33'),drawer:mat('#424950'),glass:new T.MeshStandardMaterial({color:0xbdd2d5,roughness:.12,metalness:.1,transparent:true,opacity:.14,depthWrite:false,side:T.DoubleSide}),white:new T.MeshBasicMaterial({color:0xe1efff}),cyan:new T.MeshBasicMaterial({color:0x19d8ef}),pink:new T.MeshBasicMaterial({color:0xcd39cf})};
 V.scene.updateMatrixWorld(true);
 const removed=[];
 V.fittings.traverse(o=>{if(!o.isMesh)return;const b=new T.Box3().setFromObject(o),x=b.min.x+482.5,y=b.min.z+480;
  if(x>=754.9&&b.max.x+482.5<=792.3&&y>=179.9&&b.max.z+480<=365.1&&b.max.y<=245.1)removed.push(o);
 });
 for(const o of removed){V.unregisterObject?.(o);o.parent?.remove(o);}
 function box(x,y,w,d,z,h,m,name,extra={}){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.copy(V.pos(x+w/2,y+d/2,z+h/2));o.name='CP02 '+name;o.userData={name:o.name,desc:'業主採用風格／模型試配；尺寸、承重、照明與工程待設計師核定。',source:'CP02 2026-10-01',cp02:true,...extra};group.add(o);finishes.set(o,m);return o;}
 function leaf(y,z,h,m,name){return box(791,y,1.2,58.5,z,h,m,name,{swingFront:{name:'CP02 '+name,face:'E',hinge:'min'}});}
 box(755,180,2,185,0,245,M.back,'櫃背');
 for(const y of [180,240.7,302.3,363.2])box(757,y,34,1.8,0,245,M.frame,'櫃直板');
 for(const z of [7,74,140,184,243.2])box(757,180,34,185,z,1.8,M.frame,'固定層板');
 for(const z of [38,106])box(757,181.8,34,58.9,z,1.8,M.frame,'漫畫層板');
 leaf(181.8,8,130,M.glass,'漫畫玻璃門');
 for(let i=1;i<3;i++)for(let k=0;k<3;k++)box(791,181.8+i*61.6,1.2,58.5,8+k*22,20.5,M.drawer,'六抽抽面',{cpRole:'drawer'});
 for(let i=0;i<3;i++){
  leaf(181.8+i*61.6,i?76:142,i?107:41,M.glass,'展示玻璃門 '+i);
  leaf(181.8+i*61.6,186,57,M.drawer,'高位歸檔門 '+i);
  box(792.25,184+i*61.6,1.4,1.2,206,14,M.frame,'上櫃把手');
  box(787,184+i*61.6,1,54,181.7,.5,M.white,'展示工作白光');
 }
 const books=['#c3c9cf','#dad4cb','#617b95','#818fba','#93718b','#d5b487'].map(c=>mat(c,.95,0));
 for(const z of [9,40,76,108])for(let i=0;i<19;i++){
  const y=184+i*2.75,h=22+i%3;
  box(765,y,24,2.3,z,h,books[i%books.length],'漫畫示意',{cpRole:'manga-proxy'});
  box(789.1,y+.15,.15,1.8,z+h-5,1.2,M.white,'書背印刷示意');
 }
 // Small figure proxies: illustrations, not measurements of the owner's collection.
 for(const y of [271.6,333.2])for(const z of [76,113,142]){
  if(z===113)box(757,y-27,34,54,111,1.8,M.frame,'展示加層');
  box(764,y-10,22,20,z,1.5,M.frame,'公仔底座');
  box(771,y-4,7,8,z+9,12,books[z%6],'公仔軀幹');
  box(772,y-3,5,6,z+22,5,M.drawer,'公仔頭部');
  for(const dy of [-5,3])box(772,y+dy,5,2.5,z+1.5,8,M.frame,'公仔雙腿');
  for(const dy of [-8,6])box(771,y+dy,4,3,z+10,9,M.frame,'公仔雙臂');
 }
 // Shallow wall finish stays clear of window openings and the adjustable desks.
 for(let i=0;i<4;i++)box(755.05,1+i*44.8,1.4,44,77,165,M.panel,'桌後槍灰分縫面板');
 box(757,1,1,178,244,1,M.pink,'桌後頂部紫紅線光',{cpRole:'accent'});
 box(758,5,1,166,77,1,M.cyan,'桌一青藍背光',{cpRole:'accent'});
 box(911,357,162,1,77,1,M.cyan,'桌二青藍背光',{cpRole:'accent'});
 // Keep both layouts' cable trays identical; do not count them as new storage.
 const trays=[];V.fittings.traverse(o=>{if(/R05 書桌[一二]桌下理線槽/.test(o.userData.name||o.name))trays.push(o);});
 for(const o of trays){V.unregisterObject?.(o);o.parent?.remove(o);}
 box(765,20,12,145,62,5,M.frame,'桌一理線槽');box(924,341,145,12,62,5,M.frame,'桌二理線槽');
 V.fittings.traverse(g=>{if(g.userData.equipment?.key!=='pc')return;
  for(const o of g.children){if(o.isMesh&&!o.material.transparent)finishes.set(o,M.back);}
  // Cosmetic case face only: existing product envelope and placement stay put.
  const panel=new T.Mesh(new T.BoxGeometry(.04,48,51),M.panel);panel.position.set(12.48,28,0);g.add(panel);finishes.set(panel,M.panel);
  for(const [i,z] of [14,29,44].entries()){
   const material=new T.MeshBasicMaterial({color:i%2?0xcd39cf:0x19d8ef});
   const ring=new T.Mesh(new T.TorusGeometry(5.5,.45,6,24),material);ring.rotation.y=Math.PI/2;ring.position.set(12.51,z,-7);g.add(ring);
   ring.name='CP02 主機RGB外觀示意';finishes.set(ring,material);accent.push({mesh:ring,material,color:material.color.clone()});
  }
 });
 group.traverse(o=>{if(o.userData.cpRole==='accent')accent.push({mesh:o,material:finishes.get(o),color:finishes.get(o).color.clone()});});
 const apply=()=>{for(const [o,m] of finishes)o.material=m;window.HOME_REALISM?.invalidate(false,true);};
 window.HOME_STUDY_CP={revision:'20261001-cp02',group,finishes,accent,apply,removed:removed.length};
 V.scene.userData.studyCP={revision:'CP02',storage:'六抽／低位漫畫玻璃櫃／三格高位封閉櫃',limits:'100–300冊為需求；示意書本不是容量驗收；門型保留各版原案。'};
})();
