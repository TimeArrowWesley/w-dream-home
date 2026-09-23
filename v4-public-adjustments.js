'use strict';
// V4 R02. Owner accepted R01 arrangement on 2026-09-23. Dimensions remain model proposals.
(()=>{
const V=window.HOME_VIEWER,T=window.THREE,E=window.HOME_EQUIPMENT,v=window.HOME_LAYOUT?.proposal;
if(!V||v!=='v4'||window.HOME_V4_PUBLIC)return;
const M=V.finishContext.materials,records=[],removed=[];
const trial={revision:'20260923-v4r02',version:v,records,removed};window.HOME_V4_PUBLIC=trial;
function drop(g){if(!g)return;removed.push(g.name||g.userData.name);g.traverse(o=>V.unregisterObject?.(o));g.parent?.remove(g);}

 const dx=-45,moved=[];
 function shift(g){if(!g||moved.includes(g))return;g.position.x+=dx;moved.push(g);if(g.userData.footprint)g.userData.footprint={...g.userData.footprint,x:g.userData.footprint.x+dx};}
 const F=window.HOME_FIXED_LIVING;
 for(const g of [F.base,F.tv,F.wall,F.sofa,window.HOME_COFFEE_LIFT?.parent])shift(g);
 for(const g of V.fittings.children)if(g.userData.channel||g.name.startsWith('耳平環繞 Ci160QR '))shift(g);
 // Keep the existing full rear-speaker enclosure proxy, replace the floor stands
 // with rack supports so the open study door has a continuous turning route.
 for(const [id,x] of [['SR',770],['SL',974]]){
  const g=V.fittings.children.find(o=>o.userData.channel===id);if(!g)continue;
  drop(g.children.find(o=>o.name==='環繞獨立落地支架'));g.position.copy(V.pos(x,531,0));
  const base=new T.Mesh(new T.BoxGeometry(28,1,16),M.steel);base.position.set(0,72.5,0);base.userData={name:'R02 後環繞背架承板',publicTrial:true};g.add(base);
  const post=new T.Mesh(new T.BoxGeometry(3,22,3),M.steel);post.position.set(0,84,0);post.userData={name:'R02 後環繞背架支承',publicTrial:true};g.add(post);
  g.userData.surround={...g.userData.surround,installation:'R02家具背架承托；保留既有28×12×30背腔示意，容積、固定、承載與聲學待核，不是原廠認證'};
 }
 for(const g of V.ceiling.children)if(g.name.includes('高度聲道'))shift(g);
 for(const a of V.fittings.children)if(a.userData.allowance&&/環繞固定|Switch 2 層板|影音櫃外形/.test(a.name))shift(a);
 F.stools.forEach(g=>g.traverse(o=>o.visible=true));
 // Keep records aligned with the actual shifted geometry; floor, openings and columns stay put.
 const S=window.HOME_OPEN_ISLAND_SPEC;S.nominalClearances.islandToSofa=217;
 S.audio.listener.x+=dx;S.audio.fixedTV.x+=dx;S.audio.tvBase.x+=dx;S.audio.coffee.x+=dx;
 S.audio.floorSpeakers.forEach(s=>{s.cx+=dx;s.x+=dx;});S.audio.overhead.centers.forEach(p=>p[0]+=dx);
 for(const [id,x] of [['SR',770],['SL',974]]){const s=S.audio.floorSpeakers.find(s=>s.id===id);s.cx=x;s.cy=531;s.x=x-14;s.y=525;}
 if(window.HOME_SOFA.spec.footprint)window.HOME_SOFA.spec.footprint.x=752;
 trial.seats=F.stools;trial.seatedProxies=[610,710].map(y=>({x:549,y:y-28,w:76,d:56,z:0,h:135}));
 trial.routes={entryToStudy:[[603,946],[603,825],[603,770],[675,770],[675,485],[828,485],[828,370]],entryToKitchen:[[603,946],[603,825],[340,825],[340,677],[185,677]],window:[[675,485],[1048,485],[1048,750]]};
 V.rooms.find(r=>r.id==='living').note='R02採用配置：沙發、茶几、地毯、固定電視與影音群向中島側移45cm；中島至沙發217cm，窗邊至沙發側邊93cm（均模型名義值）。兩張中島椅常態顯示。';
 V.rooms.find(r=>r.id==='island').note='280×110中島保留，兩張座椅納入日常使用；217cm名義間距需扣坐人與拉椅。原展示與深收納保留，大箱實物容量仍待確認。';
 records.push({action:'living-group-shift',dx,moved:moved.map(o=>o.name),islandToSofa:217,sofaToWindow:93,stoolsVisible:true,surrounds:'既有完整背腔示意移至沙發背架承托，原落地支架移除；承載與聲學另核。',storage:'既有展示及深櫃幾何全數保留；沒有新增已核實的大箱容量。'});
V.scene.updateMatrixWorld(true);
})();
