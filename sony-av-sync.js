'use strict';
// AV02 (2026-11-15): owner switched the living-room AV set and the laundry tower.
// Runs after SV01 survey calibration so every version keeps its measured position;
// only the product envelopes change, in each product's own local axes (front = local -z).
//   TV       LG OLED83G6PTA      -> Sony BRAVIA 9 II 85 型 Y-85XR90M2 189.2 x 107.7 x 4.6 cm, 48.2 kg (back face kept on the wall)
//   Centre   KEF Q6 Meta         -> Sony BRAVIA Theatre Trio 中置 58.9 x 6.4 x 16.5 cm (front face kept)
//   L / R    KEF Q7 Meta         -> Trio 左右前置 16 x 33.7 x 16.5 cm on a stand (stand is a placeholder)
//   Subs     SVS SB-2000 Pro x2  -> Sony Sub 9 SA-SW9 x2 39 x 40 x 35 cm (centre kept)
//   Rears    Ci160QR / AU01 / MR01 boxes -> Sony Rear 9 SA-RS9 15.4 x 28.6 x 15.4 cm on the existing supports
//   Removed  Denon AVR-X3800H, 4 x KEF Ci160QR ceiling height channels
//   Washer   LG WD-S1916B 77 deep -> WD-S2220B 83 deep (back face kept, front moves 6 cm)
(()=>{
 const V=window.HOME_VIEWER,T=window.THREE,E=window.HOME_EQUIPMENT;
 if(!V||!T||!E||window.HOME_SONY_AV)return;
 const state={revision:'20261115-AV02',state:'loading',source:'家具清單 20261115-appliance-r5；Sony 台灣官網規格；LG 台灣官網規格',changed:[],removed:[]};
 const api=window.HOME_SONY_AV={state,ready:null};
 const SRC='家具清單 2026-11-15＋原廠官網規格';
 const SPEC={
  tv:{name:'Sony BRAVIA 9 II 85 型 Y-85XR90M2',w:189.2,d:4.6,h:107.7,kg:48.2,
      desc:'189.2 寬 × 107.7 高 × 4.6 厚 cm，48.2 kg（不含腳座，Sony 規格頁）。背面貼齊原壁掛面，中心高不變。壁掛架、VESA 與牆面補強待 Sony 及木作確認。'},
  q6:{name:'Sony BRAVIA Theatre Trio 中置',w:58.9,d:16.5,h:6.4,kg:3.2,
      desc:'58.9 寬 × 6.4 高 × 16.5 深 cm，約 3.2 kg（Sony 台灣官網）。前緣對齊原中置艙前緣；需 1 個插座與 HDMI eARC 接電視。'},
  q7:{name:'Sony BRAVIA Theatre Trio 左右前置',w:16,d:16.5,h:33.7,kg:3.6,
      desc:'喇叭 16 寬 × 33.7 高 × 16.5 深 cm，3.6 kg（Sony 台灣官網）。落地腳架為示意，Sony 附壁掛支架，也可改壁掛於電視兩側；無線訊號，各需 1 個插座。'},
  sub:{name:'Sony BRAVIA Theatre Sub 9 SA-SW9',w:39,d:35,h:40,kg:23.3,
      desc:'39 寬 × 40 高 × 35 深 cm，23.3 kg，600 W。沿用原重低音中心位置；無線訊號，各需 1 個插座，建議加隔振墊。'},
  washer:{name:'LG WashTower 第二代 WD-S2220B',w:70,d:83,h:189,kg:160,
      desc:'70 寬 × 83 深 × 189 高 cm，160 kg；門開 90° 時總深 146 cm（LG 台灣官網）。背面貼齊原位置，比原 WD-S1916B 往前多 6 cm。'}
 };
 const REAR={name:'Sony BRAVIA Theatre Rear 9 SA-RS9',w:15.4,d:15.4,h:28.6,
  desc:'15.4 寬 × 28.6 高 × 15.4 深 cm，2.7 kg，90 W（Sony 規格）。放在原環繞承台上，朝向沿用原設計；無線訊號，各需 1 個插座。'};

 const unregister=o=>o.traverse(m=>{if(m.isMesh)V.unregisterObject?.(m);});
 function meshes(g){const a=[];g.traverse(o=>{if(o.isMesh)a.push(o);});return a;}
 function flags(src){const u={};for(const k of ['dynamicDoor','rotatingTV','finishGroup'])if(src?.userData?.[k]!==undefined)u[k]=src.userData[k];return u;}
 function label(mesh,name,desc,extra){mesh.userData={...(extra||{}),name,desc,source:SRC};V.registerObject?.(mesh);return mesh;}
 function boxMesh(parent,x,z,w,d,y,h,mat,name,desc,extra){
  const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x+w/2,y+h/2,z+d/2);m.castShadow=m.receiveShadow=true;parent.add(m);return label(m,name,desc,extra);
 }
 function disc(parent,x,y,z,r,depth,mat,name,desc,extra){
  const m=new T.Mesh(new T.CylinderGeometry(r,r,depth,40),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z+depth/2);parent.add(m);return label(m,name,desc,extra);
 }
 function mat(hex,rough,metal){const m=new T.MeshStandardMaterial({color:hex,roughness:rough,metalness:metal});m.color.convertSRGBToLinear();return m;}
 const MAT={
  body:mat('#1d2022',.55,.25),fabric:mat('#2a2d30',.92,0),grey:mat('#3a3f42',.6,.3),
  screen:mat('#06080a',.18,.1),stand:mat('#26292b',.45,.55),ring:mat('#4a4f52',.4,.5)
 };
 function setEquipment(g,key,s){
  g.name=s.name;g.userData.name=s.name;g.userData.desc=s.desc;g.userData.source=SRC;
  const old=g.userData.equipment||{};g.userData.equipment={...old,key,name:s.name,w:s.w,d:s.d,h:s.h,kg:s.kg,envelope:'product',revision:state.revision,note:s.desc};
  if(E.units?.[key])Object.assign(E.units[key],{name:s.name,w:s.w,d:s.d,h:s.h,kg:s.kg});
 }
 // Survey calibration may bake offsets into vertices, so anchor on the old meshes' real local box.
 function localBox(g){g.updateMatrixWorld(true);const inv=new T.Matrix4().copy(g.matrixWorld).invert(),b=new T.Box3();
  g.traverse(o=>{if(!o.isMesh||!o.visible)return;o.geometry.computeBoundingBox();b.union(o.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inv,o.matrixWorld)));});return b;}
 function clear(g){const box=localBox(g),old=meshes(g),keep=flags(old[0]);for(const o of [...g.children]){unregister(o);g.remove(o);}
  const holder=new T.Group();holder.name='AV02 外形';g.add(holder);return {keep,box,holder};}

 function rebuildTV(g){
  const s=SPEC.tv,{keep,box,holder}=clear(g),c=box.getCenter(new T.Vector3());
  const back=box.max.z,front=back-s.d,y0=c.y-s.h/2,x0=c.x-s.w/2;
  boxMesh(holder,x0,front+.08,s.w,s.d-.08,y0,s.h,MAT.body,s.name,s.desc,keep);
  const scr=boxMesh(holder,x0+.35,front,s.w-.7,.06,y0+.35,s.h-.7,MAT.screen,s.name,s.desc,keep);scr.userData.equipmentSurface='tv-screen';
  setEquipment(g,'tv',s);
 }
 function rebuildCentre(g){
  const s=SPEC.q6,{keep,box,holder}=clear(g),c=box.getCenter(new T.Vector3()),front=box.min.z,x0=c.x-s.w/2,y=box.min.y;
  boxMesh(holder,x0,front+.5,s.w,s.d-.5,y,s.h,MAT.body,s.name,s.desc,keep);
  boxMesh(holder,x0+.3,front,s.w-.6,.5,y+.3,s.h-.6,MAT.fabric,s.name,s.desc,keep);
  setEquipment(g,'q6',s);
 }
 function rebuildFront(g){
  const s=SPEC.q7,{keep,box,holder}=clear(g),lift=65,f=-s.d/2,c=box.getCenter(new T.Vector3());holder.position.set(c.x,box.min.y,c.z);g=holder;
  boxMesh(g,-13,-13,26,26,0,1.5,MAT.stand,'前置喇叭腳架・示意',s.desc,keep);
  boxMesh(g,-2,-2,4,4,1.5,lift-2.5,MAT.stand,'前置喇叭腳架・示意',s.desc,keep);
  boxMesh(g,-s.w/2,f,s.w,s.d,lift-1,1,MAT.stand,'前置喇叭腳架・示意',s.desc,keep);
  boxMesh(g,-s.w/2,f+.5,s.w,s.d-.5,lift,s.h,MAT.body,s.name,s.desc,keep);
  boxMesh(g,-s.w/2+.3,f,s.w-.6,.5,lift+.3,s.h-.6,MAT.fabric,s.name,s.desc,keep);
  for(const yy of [lift+9,lift+21])disc(g,0,yy,f-.15,yy===lift+21?2.6:5.2,.2,MAT.ring,s.name,s.desc,keep);
  setEquipment(g.parent,'q7',s);
 }
 function rebuildSub(g){
  const s=SPEC.sub,{keep,box,holder}=clear(g),f=-s.d/2,c=box.getCenter(new T.Vector3()),eq=g;holder.position.set(c.x,box.min.y,c.z);g=holder;
  boxMesh(g,-s.w/2,f+.5,s.w,s.d-.5,0,s.h,MAT.body,s.name,s.desc,keep);
  boxMesh(g,-s.w/2+.4,f,s.w-.8,.5,1.2,s.h-2.4,MAT.fabric,s.name,s.desc,keep);
  setEquipment(eq,'sub',s);
 }
 function rebuildWasher(g){
  // Keep the published doors/display; extend the cabinet 6 cm forward from the fixed back face.
  const s=SPEC.washer,oldD=g.userData.equipment?.d||77,shift=s.d-oldD,ms=meshes(g);
  let body=null,vol=0;for(const m of ms){m.geometry.computeBoundingBox();const z=m.geometry.boundingBox.getSize(new T.Vector3());const v=z.x*z.y*z.z;if(v>vol){vol=v;body=m;}}
  for(const m of ms){if(m===body)continue;m.position.z-=shift;}
  if(body){body.geometry.computeBoundingBox();const ob=body.geometry.boundingBox.clone().translate(body.position),oc=ob.getCenter(new T.Vector3()),os=ob.getSize(new T.Vector3()),depth=os.z+shift;
   body.geometry.dispose();body.geometry=new T.BoxGeometry(os.x,os.y,depth);body.position.set(oc.x,oc.y,ob.max.z-depth/2);}
  for(const m of ms){m.userData.name=s.name;m.userData.desc=s.desc;m.userData.source=SRC;}
  setEquipment(g,'washer',s);
  // Door-swing allowance: move with the new front and size it to the published 146 cm open depth.
  const front=new T.Vector3(0,0,-1).applyQuaternion(g.getWorldQuaternion(new T.Quaternion())).normalize();
  const allowance=E.allowances?.find(a=>a.name==='洗衣塔前方開門');
  if(allowance&&Math.abs(front.y)<.1){
   const axis=Math.abs(front.x)>Math.abs(front.z)?'x':'z',sign=Math.sign(front[axis]),swing=146-s.d;
   const b=new T.Box3().setFromObject(allowance),size=b.getSize(new T.Vector3());
   const near=(sign>0?b.min[axis]:b.max[axis])+sign*shift,far=near+sign*swing;
   const scale=swing/size[axis];allowance.scale[axis==='x'?'x':'z']*=scale;
   allowance.updateMatrixWorld(true);const nb=new T.Box3().setFromObject(allowance);
   const mid=(near+far)/2,cur=(nb.min[axis]+nb.max[axis])/2;const wp=allowance.getWorldPosition(new T.Vector3());wp[axis]+=mid-cur;
   allowance.parent.worldToLocal(wp);allowance.position.copy(wp);allowance.userData.allowance={...allowance.userData.allowance,note:'WD-S2220B 門開 90° 總深 146 cm，扣機身 83 cm 為門前 63 cm；與陽台通行不可同時使用'};
  }
 }
 function hide(o,reason){o.visible=false;unregister(o);o.userData.av02Removed=reason;state.removed.push(o.name||o.userData.name||reason);}
 function rear(parent,worldBase,dir,id){
  // worldBase: centre of the support top; dir: horizontal facing direction in world space.
  const g=new T.Group();g.name='Sony Rear 9 後環繞 '+id;V.scene.add(g);
  g.position.copy(worldBase);g.rotation.y=Math.atan2(-dir.x,-dir.z);
  const s=REAR,f=-s.d/2;
  boxMesh(g,-s.w/2,f+.5,s.w,s.d-.5,0,s.h,MAT.body,s.name,s.desc);
  boxMesh(g,-s.w/2+.3,f,s.w-.6,.5,.3,s.h-.6,MAT.fabric,s.name,s.desc);
  g.userData={name:s.name,desc:s.desc,source:SRC,channel:id,av02:true};
  parent.attach(g);return g;
 }
 function centreOf(objs){const b=new T.Box3();for(const o of objs)b.expandByObject(o);return b.getCenter(new T.Vector3());}
 function facing(body,grille,fallback){const d=centreOf(grille).sub(centreOf(body));d.y=0;return d.lengthSq()>1e-4?d.normalize():fallback;}
 function surrounds(tvCentre){
  const fallback=p=>{const d=tvCentre.clone().sub(p);d.y=0;return d.lengthSq()?d.normalize():new T.Vector3(0,0,1);};
  const groups=[];V.scene.traverse(o=>{if(!o.isMesh&&o.visible&&(o.name.startsWith('AU01 小型完整後環繞 ')||o.name.startsWith('耳平環繞 Ci160QR ')||o.name==='MR01 V3背架承托完整環繞音箱'))groups.push(o);});
  let n=0;
  for(const g of groups){
   if(g.name.startsWith('AU01')){
    const keep=['AU01 背架隔振承板','AU01 家具短柱','AU01 音箱承台'];
    const deck=g.children.find(c=>c.userData.name==='AU01 音箱承台');if(!deck)continue;
    const old=g.children.filter(c=>!keep.includes(c.userData.name));
    const inner=[];for(const c of old)c.traverse(m=>{if(m.isMesh)inner.push(m);});
    inner.sort((a,b)=>new T.Box3().setFromObject(b).getSize(new T.Vector3()).length()-new T.Box3().setFromObject(a).getSize(new T.Vector3()).length());
    const body=inner[0],grille=inner.find(m=>m!==body&&m.parent===body.parent);
    const top=new T.Box3().setFromObject(deck),base=top.getCenter(new T.Vector3());base.y=top.max.y;
    const dir=grille?facing([body],[grille],fallback(base)):fallback(base);
    old.forEach(o=>hide(o,'AU01 小型環繞改 Rear 9'));rear(g,base,dir,'R'+(++n));
   }else if(g.name.startsWith('耳平環繞 Ci160QR ')){
    const body=g.children.find(c=>c.userData.name==='Ci160QR 定製背腔示意'),cone=g.children.find(c=>c.userData.name==='Ci160QR 耳平環繞預排'),stand=g.children.find(c=>c.name==='環繞獨立落地支架');
    if(!body||!stand)continue;
    const top=new T.Box3().setFromObject(stand),base=top.getCenter(new T.Vector3());base.y=top.max.y;
    const dir=cone?facing([body],[cone],fallback(base)):fallback(base);
    hide(body,'Ci160QR 背腔改 Rear 9');if(cone)hide(cone,'Ci160QR 改 Rear 9');rear(g,base,dir,'R'+(++n));
   }else{
    const decks=g.children.filter(c=>c.userData.name==='V3 環繞承台');
    for(const deck of decks){
     const db=new T.Box3().setFromObject(deck),dc=db.getCenter(new T.Vector3());
     const near=c=>{const c2=new T.Box3().setFromObject(c).getCenter(new T.Vector3());return Math.hypot(c2.x-dc.x,c2.z-dc.z)<20;};
     const body=g.children.filter(c=>c.userData.name==='V3 小型完整音箱外形示意'&&near(c)),grille=g.children.filter(c=>c.userData.name==='V3 朝主座音箱面網'&&near(c));
     if(!body.length)continue;const base=dc.clone();base.y=db.max.y;
     const dir=grille.length?facing(body,grille,fallback(base)):fallback(base);
     [...body,...grille].forEach(o=>hide(o,'MR01 環繞改 Rear 9'));rear(g,base,dir,'R'+(++n));
    }
   }
  }
  return n;
 }
 function apply(){
  const items=E.items||[];const by=k=>items.filter(g=>g.userData.equipment?.key===k);
  const tv=by('tv')[0];let tvCentre=new T.Vector3();
  if(tv){rebuildTV(tv);tv.updateMatrixWorld(true);tvCentre=new T.Box3().setFromObject(tv).getCenter(new T.Vector3());state.changed.push('tv');}
  const q6=by('q6')[0];
  if(q6){
   // Remove the Q6 rubber pads; the Trio centre has its own feet.
   const qb=new T.Box3().setFromObject(q6);V.scene.traverse(o=>{if(o.name==='影音設備承托墊'&&o.visible){const c=new T.Box3().setFromObject(o).getCenter(new T.Vector3());if(c.x>qb.min.x&&c.x<qb.max.x&&c.z>qb.min.z-2&&c.z<qb.max.z+2)hide(o,'Q6 承托墊');}});
   rebuildCentre(q6);state.changed.push('centre');
  }
  by('q7').forEach(rebuildFront);if(by('q7').length)state.changed.push('front x'+by('q7').length);
  by('sub').forEach(rebuildSub);if(by('sub').length)state.changed.push('sub x'+by('sub').length);
  by('washer').forEach(rebuildWasher);if(by('washer').length)state.changed.push('washer');
  for(const avr of by('avr')){hide(avr,'Denon 不採用');avr.userData.equipment.adopted=false;}
  const select=document.getElementById('equipmentSelect');
  if(select)for(const o of [...select.options]){if(o.value==='')continue;const g=items[Number(o.value)];if(!g)continue;if(g.userData.av02Removed)o.remove();else o.textContent=g.name;}
  const sky=[];V.scene.traverse(o=>{if(!o.isMesh&&o.name.startsWith('KEF Ci160QR 高度聲道 '))sky.push(o);});sky.forEach(o=>hide(o,'Trio 內建向上發聲，取消天花喇叭'));
  state.rears=surrounds(tvCentre);
  window.HOME_REALISM?.registerMaterials?.();window.HOME_REALISM?.invalidate?.(true,true);
  state.state='ready';window.dispatchEvent(new CustomEvent('sony-av-ready',{detail:{...state}}));
 }
 const wait=window.HOME_SURVEY?.ready||Promise.resolve();
 api.ready=Promise.resolve(wait).then(()=>{
  if(window.HOME_INTERACTION?.withClosedPose)window.HOME_INTERACTION.withClosedPose(apply);else apply();
 }).catch(error=>{state.state='failed';state.error=String(error);console.error('AV02 影音同步失敗',error);});
})();
