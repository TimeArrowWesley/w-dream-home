'use strict';
// AU01: owner accepts open island-side space; V1/V4 share the V4 depth layout.
// Coordinates are centimetres in the working model, not construction set-out.
(()=>{
 const V=window.HOME_VIEWER,T=window.THREE,E=window.HOME_EQUIPMENT,v=window.HOME_LAYOUT?.proposal;
 if(!V||!['v1','v4'].includes(v)||window.HOME_LIVING_AUDIO)return;
 const revision='20260923-au01',M=V.finishContext.materials,moved=new Set();
 function shift(g,x=0,y=0){if(!g||moved.has(g))return;g.position.x+=x;g.position.z+=y;moved.add(g);if(g.userData.footprint){g.userData.footprint.x+=x;g.userData.footprint.y+=y;}}
 function drop(g){if(!g)return;g.traverse(o=>V.unregisterObject?.(o));g.parent?.remove(g);}
 function center(g){g.updateWorldMatrix(true,true);const b=new T.Box3().setFromObject(g),p=b.getCenter(new T.Vector3());return [p.x+482.5,p.z+480];}
 function moveTo(g,x,y){const p=center(g);g.position.x+=x-p[0];g.position.z+=y-p[1];}
 if(v==='v4'){
  const F=window.HOME_FIXED_LIVING;
  for(const g of [F.base,F.tv,F.wall,F.sofa,window.HOME_COFFEE_LIFT?.parent])shift(g,45);
  for(const g of V.fittings.children)if(g.userData.channel||g.name.startsWith('耳平環繞 Ci160QR '))shift(g,45);
  for(const g of V.fittings.children)if(g.userData.allowance&&/環繞固定|Switch 2 層板|影音櫃外形/.test(g.name))shift(g,45);
  const S=window.HOME_OPEN_ISLAND_SPEC;S.nominalClearances.islandToSofa=262;
  for(const k of ['listener','fixedTV','tvBase','coffee'])S.audio[k].x+=45;
  S.audio.floorSpeakers.forEach(s=>{s.cx+=45;s.x+=45;});
  window.HOME_SOFA.spec.footprint.x=797;
 }else{
  shift(window.HOME_SOFA.root,0,50);window.HOME_SOFA.spec.backY=540;
  window.HOME_SOFA.spec.footprint.y=522;
  shift(window.HOME_COFFEE_LIFT?.parent,0,50);
  const q7=E.items.filter(o=>o.userData.equipment.key==='q7').sort((a,b)=>center(a)[0]-center(b)[0]);
  q7.forEach((g,i)=>moveTo(g,[790,1045][i],874));
 }
 // Retain the front-wall subwoofer arrangement but reserve rear cable space.
 const subs=E.items.filter(o=>o.userData.equipment.key==='sub').sort((a,b)=>center(a)[0]-center(b)[0]);
 subs.forEach((g,i)=>moveTo(g,[788,1055][i],920));
 // Remove earlier incompatible rear proxies and their obsolete stand envelopes.
 const remove=[];V.fittings.traverse(o=>{if(o.name==='R05 背架承托小型環繞・候選形式'||o.name.startsWith('耳平環繞 Ci160QR ')||o.userData.name==='環繞固定與背腔待核')remove.push(o);});remove.forEach(drop);
 const group=new T.Group();group.name='AU01 背架小型完整後環繞・型號待核';V.fittings.add(group);
 const shellMat=new T.MeshStandardMaterial({color:new T.Color('#343c40').convertSRGBToLinear(),roughness:.78,metalness:.03});
 for(const [i,x] of [809,1025].entries()){
  const y=530.6,g=new T.Group();g.name='AU01 小型完整後環繞 '+(i+1);g.position.copy(V.pos(x,y,0));
  g.userData.speakerProposal={w:14.4,d:14.3,h:17.2,baseHeight:90,reference:'完整小型音箱外形候選；型號、配對與家具固定未核定',channel:i?'SL':'SR'};group.add(g);
  function box(w,h,d,z,name){const m=new T.Mesh(new T.BoxGeometry(w,h,d),shellMat);m.position.y=z;m.userData.name=name;m.castShadow=m.receiveShadow=true;g.add(m);}
  box(16,1,16,72.5,'AU01 背架隔振承板');box(3,16,3,81,'AU01 家具短柱');box(14.6,1,14.6,89.5,'AU01 音箱承台');
  const body=new T.Group();body.position.y=100;body.rotation.y=Math.atan2(917.5-x,600-y);g.add(body);
  const m=new T.Mesh(new T.SphereGeometry(7.2,24,16),shellMat);m.scale.z=7.15/7.2;body.add(m);
  const face=new T.Mesh(new T.CircleGeometry(5.6,32),M.rubber);face.position.z=7.17;body.add(face);
  const base=new T.Mesh(new T.CylinderGeometry(5.5,5.5,2.8,24),shellMat);base.position.y=91.4;g.add(base);
 }
 // Former 'rear' height row sat in front of the reference listener. Separate
 // front/rear rows about that listener; retain beam clearances and grille size.
 const overhead=[[835,430],[1000,430],[835,770],[1000,770]];
 V.ceiling.children.filter(o=>o.name.includes('高度聲道')).forEach((g,i)=>moveTo(g,...overhead[i]));
 const audio={listener:{x:917.5,y:600,earHeight:105,status:'主座耳位比較基準；需真人試坐'},tv:{x:917.5,y:948.6},screenFrontY:947.2,sofa:{...window.HOME_SOFA.spec.footprint},front:[{x:790,y:874},{x:1045,y:874}],subs:[{x:788,y:920},{x:1055,y:920}],surrounds:[{x:809,y:530.6},{x:1025,y:530.6}],overhead,viewingDistanceCm:347.2,windowSideNominalCm:48};
 if(v==='v4'){
  const S=window.HOME_OPEN_ISLAND_SPEC;S.audio.listener={...audio.listener};S.audio.overhead.centers=overhead;S.audio.viewingDistanceCm=347.2;
  S.audio.floorSpeakers=S.audio.floorSpeakers.filter(s=>!['SL','SR'].includes(s.id));
  for(const s of S.audio.floorSpeakers)if(s.id.startsWith('SW')){s.cy=920;s.y=900.25;}
  S.audio.surroundProposal={type:'完整小型音箱背架試配',centers:audio.surrounds,status:'非已核定機種或聲學完成'};
 }
 V.rooms.find(r=>r.id==='living').note='AU01：V1／V4統一沙發及影音前後基準，主座試坐點至螢幕347.2cm；沙發回靠窗側，窗側48cm只作清潔／窗簾接近，主要通行走中島側。小型後環繞背架承托；設備與聲學待核。';
 if(v==='v4')V.rooms.find(r=>r.id==='island').note='AU01：保留280×110中島及兩席，檯緣至沙發側邊262cm；業主接受留空。坐人／拉椅另核，原收納保持。';
 window.HOME_LIVING_AUDIO={revision,version:v,audio,rearGroup:group,limits:'模型試配；非聲學、人體或工程驗收。窗側非主要通道，低頻位置須現場調校。'};
 V.scene.updateMatrixWorld(true);
})();
