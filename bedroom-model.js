'use strict';
// Openings verified against the source drawing, independently of the bedroom millwork.
window.HOME_SHARED_OPENINGS={
 storage({T,M,box,wall,architecture}){const g=new T.Group();g.name='儲藏室外掛拉門';g.userData.slidingDoor={name:'儲藏室拉門',key:'storage',axis:'x',distance:82};architecture.add(g);
  const m=box(654,376,82,3,.3,214.4,M.black,g,'儲藏室拉門','原圖80cm開口；門扇向左收在走道側，外掛五金為放樣提案。');m.userData.slideRatio=1;m.userData.walkDoor=true;
  wall(655,365,80,10,30,215);box(573,375,164,5,215,4,M.steel,architecture,'儲藏拉門上吊軌');return g;}
};
// Shared adjustable storage racks; shelf heights describe a proposed physical setup.
window.HOME_STORAGE_BUILD=function({T,M,pos,box,info,fittings}){
 const root=new T.Group();root.name='儲藏室可調式層架';fittings.add(root);
 const steel=M.steel.clone();steel.color.set('#424b4a');steel.roughness=.72;
 const shelfMat=M.steel.clone();shelfMat.color.set('#697270');shelfMat.roughness=.8;
 const shelves=[];
 function piece(name,x,y,w,d,z,h,material=steel,parent=root){const m=box(x,y,w,d,z,h,material,parent,name);m.userData.adjustableStorage=true;return m;}
 // Slotted steel standards have actual openings, rather than an opaque painted strip.
 function standard(x,y,west){
  const shape=new T.Shape();shape.moveTo(0,0);shape.lineTo(3,0);shape.lineTo(3,235);shape.lineTo(0,235);shape.closePath();
  for(let z=10;z<=225;z+=5){const hole=new T.Path();hole.moveTo(1,z);hole.lineTo(1,z+2);hole.lineTo(2,z+2);hole.lineTo(2,z);hole.closePath();shape.holes.push(hole);}
  const m=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:1.5,bevelEnabled:false,curveSegments:1}),steel);
  m.position.copy(pos(x,west?y+3:y,0));if(west)m.rotation.y=Math.PI/2;m.castShadow=m.receiveShadow=true;root.add(m);
  info(m,'儲藏層架・5cm調整孔柱','235cm高；層板連托架可按5cm孔距重新安裝或拆除。五金與牆體固定方式待選型。');m.userData.adjustableStorage=true;
  for(const z of [4,119,229]){
   if(west)piece('孔柱壁面固定座',580.2,y,1.8,3,z,3);
   else piece('孔柱壁面固定座',x,270.2,3,1.8,z,3);
  }
 }
 for(const y of [285,345])standard(582,y,true);
 for(const x of [662,723])standard(x,272,false);
 function shelf(side,clearHeight){
  const g=new T.Group();g.name='儲藏室'+(side==='west'?'左側':'推車位上方')+'可拆層板';root.add(g);
  const west=side==='west',x=west?584:647,y=274,w=west?55:90,d=west?85:45;
  const top=piece(west?'儲藏室鐵件層架・可調層板':'推車位・可調層板',x,y,w,d,clearHeight+6,2,shelfMat,g);
  top.userData.desc=(west?'左側85cm寬×55cm深':'門正對90cm寬×45cm深')+'；含托架下緣高度'+clearHeight+'cm，5cm一格可調或整片拆除。';
  // The panel bears directly on two cantilever brackets connected to the standards.
  if(west)for(const yy of [285.5,345.5]){
   piece('層板承重托架',583.5,yy,53,2,clearHeight,6,steel,g);
   piece('托架扣接座',582.8,yy,.7,2,clearHeight,6,steel,g);
  }else for(const xx of [662.5,723.5]){
   piece('層板承重托架',xx,273.5,2,43,clearHeight,6,steel,g);
   piece('托架扣接座',xx,272.8,2,.7,clearHeight,6,steel,g);
  }
  g.userData.adjustableShelf={side,clearHeight,pitch:5,removable:true};shelves.push(g);return g;
 }
 for(const z of [45,100,155,210])shelf('west',z);
 for(const z of [140,210])shelf('north',z);
 // No floor plinth, front posts or fixed crossbars interrupt the roll-in parking area.
 root.userData.storage={adjustable:true,pitch:5,height:235,left:{width:85,depth:55},north:{width:90,depth:45},parking:{x:657.5,y:274,z:0,w:75,d:90,h:140},doorClearWidth:80};
 window.HOME_STORAGE_MODEL={root,shelves,spec:root.userData.storage};return window.HOME_STORAGE_MODEL;
};
// Shared private-room detailing. All dimensions are cm and proposed millwork sizes.
window.HOME_BEDROOM_BUILD=function(C){
 const {T,M,pos,box,cyl,info,fittings,architecture,roomLights,vanity,pickables}=C;
 const root=new T.Group();root.name='主臥與更衣室細節';root.userData.bedroomUpgrade=true;fittings.add(root);
 const charcoal=M.steel.clone(),trayMat=M.cloth.clone();charcoal.color.set('#282d2c');trayMat.color.set('#64625c');
 const groups={},diffusers={mirror:[],reading:[],night:[],closet:[]};
 function piece(name,x,y,w,d,z,h,mat=M.black,parent=root,wood=false){const m=box(x,y,w,d,z,h,mat,parent,name);m.userData.bedroomUpgrade=true;if(wood)m.userData.bedroomWood=true;return m;}
 function group(name){const g=new T.Group();g.name=name;g.userData.bedroomUpgrade=true;root.add(g);return g;}
 function glow(type,name,x,y,w,d,z,h,parent=root){const mat=new T.MeshStandardMaterial({color:'#eee6d8',emissive:'#fff0dd',emissiveIntensity:0,roughness:.55});const m=piece(name,x,y,w,d,z,h,mat,parent);diffusers[type].push(m);return m;}
 // Keep the established 70 cm bedside / 75 cm vanity working heights.
 for(const g of fittings.children.filter(g=>['床頭抽屜','床頭黑玻高櫃'].includes(g.userData.cabinet?.name))){g.traverse(o=>{if(!o.isMesh)return;o.userData.bedroomWood=true;o.userData.bedroomUpgrade=true;if(o.userData.swingFront)o.userData.recessedPull=true;});}
 // Relocate the existing mirror onto a supported sliding carriage, not a floating panel.
 const mirror=group('化妝鏡・前拉滑座');groups.mirror=mirror;mirror.position.y=.8;
 for(const m of [...vanity.group.children].filter(m=>/^化妝鏡・/.test(m.userData.name||''))){mirror.add(m);m.userData.bedroomUpgrade=true;}
 for(const y of [174,194])piece('化妝鏡・桌面滑軌',-57,y,52,1,75,.8,charcoal);
 glow('mirror','化妝鏡・左柔光',-50.65,168.4,.45,1,88,42,mirror);
 glow('mirror','化妝鏡・右柔光',-50.65,200.6,.45,1,88,42,mirror);
 // A real shallow tray in the north upper drawer; the existing front and pull travel with it.
 const drawer=group('化妝台・飾品分隔抽屜');groups.drawer=drawer;
 for(const m of [...vanity.group.children])if(m.isMesh&&/^化妝台・(?:抽屜面板|內嵌抽屜拉手)$/.test(m.userData.name||'')){const q=m.position;if(q.z+480<130&&q.y>50){drawer.add(m);m.userData.bedroomUpgrade=true;}}
 piece('飾品抽屜・絨布底',-55,93,63,30,51.4,.8,trayMat,drawer);
 for(const y of [93,122])piece('飾品抽屜・側板',-55,y,63,1,52.2,9,charcoal,drawer);
 for(const x of [-55,7])piece('飾品抽屜・端板',x,94,1,28,52.2,9,charcoal,drawer);
 for(const x of [-34,-13])piece('飾品抽屜・橫向分隔',x,94,.7,28,52.2,5,charcoal,drawer);
 piece('飾品抽屜・中央分隔',-54,107.6,61,.7,52.2,5,charcoal,drawer);
 // Outlet faces towards the knee recess; no cable floating in the walkway.
 piece('化妝台・側邊插座面板',-9,126.05,12,.7,59,6,charcoal);
 for(const x of [-6,0]){piece('化妝台・插座孔',x,126.8,.5,.1,61,2,M.rubber);piece('化妝台・USB-C',x,126.8,2,.1,60,.4,M.rubber);}
 groups.stool=vanity.stool;vanity.stool.traverse(o=>{if(o.isMesh)o.userData.bedroomUpgrade=true;});
 // Bedside reading lights attach to the existing open recess, clear of cabinet leaves.
 for(const x of [64,316]){piece('床頭閱讀燈・固定座',x,2,8,2,77,6,charcoal);piece('床頭閱讀燈・支臂',x+3,4,2,22,78,2,charcoal);piece('床頭閱讀燈・遮光燈頭',x-2,22,12,7,76,4,charcoal);glow('reading','床頭閱讀燈・下照面',x-1,23,10,5,75.8,.2);}
 for(const x of [113,265])glow('night','床架低位導光',x,28,1,164,7,1);
 // Retain the existing north long-coat bay. Refit only the eastern lower double-hang bay.
 const lower=[];fittings.traverse(o=>{if(!o.isMesh||o.userData.bedroomUpgrade)return;const q=o.position;if(q.x+482.5>=690&&q.x+482.5<=745&&q.z+480>=132&&q.z+480<=198&&q.y>12&&q.y<110)lower.push(o);});
 for(const o of lower){o.parent.remove(o);const k=pickables.indexOf(o);if(k>=0)pickables.splice(k,1);}
 const drawers=group('更衣室・內衣褲抽屜');groups.closetDrawer=group('更衣室・上層分隔抽屜');
 // Fixed case is supported on the original plinth; fronts face the aisle to the west.
 for(const y of [132,193])piece('更衣抽屜櫃・側板',692,y,51,2,8,77,M.black,drawers,true);
 piece('更衣抽屜櫃・背板',741,134,2,59,8,77,M.black,drawers,true);
 for(const z of [8,33,58,83])piece('更衣抽屜櫃・層板',692,134,49,59,z,2,M.black,drawers,true);
 for(const z of [10,35,60]){const g=z===60?groups.closetDrawer:drawers;piece('更衣室・抽屜深色面板',690,134,2,59,z,22.7,M.black,g,true);piece('更衣室・內嵌指拉槽',689.7,144,.3,39,z+20.5,1.5,charcoal,g);}
 const cd=groups.closetDrawer;piece('內衣抽屜・底板',692,136,46,55,60.5,1,trayMat,cd);
 for(const y of [136,190])piece('內衣抽屜・側板',692,y,46,1,61.5,15,charcoal,cd);
 piece('內衣抽屜・背板',737,137,1,53,61.5,15,charcoal,cd);
 for(const y of [163])piece('內衣抽屜・分隔',693,y,43,.8,61.5,10,charcoal,cd);
 piece('內衣抽屜・分隔',714,137,.8,53,61.5,10,charcoal,cd);
 // Short coats remain in the upper rail. Keep their hems above the new drawer top.
 fittings.traverse(o=>{if(!o.isMesh||o.userData.bedroomUpgrade)return;const q=o.position;if(q.x+482.5>=698&&q.x+482.5<=742&&q.z+480>=139&&q.z+480<=252&&q.y>120&&q.y<200)o.userData.wardrobeShortHang=true;});
 // Use the narrow entrance cabinet for closed dust-protected bag shelves.
 const bags=group('更衣室・小包防塵櫃');for(const z of [110,150,190]){const leaf=piece('小包防塵門・玻璃',728.3,58,.2,69,z+1,36,M.glass,bags);leaf.userData.swingFront={name:'小包防塵門 '+z,face:'W',hinge:'min'};const frame=[];for(const y of [57,127])frame.push(piece('小包防塵門・直框',728.5,y,1,1,z,38,charcoal,leaf));for(const h of [z,z+37])frame.push(piece('小包防塵門・橫框',728.5,58,1,69,h,1,charcoal,leaf));frame.forEach(m=>m.position.sub(leaf.position));}
 for(const z of [111.8,151.8,191.8])piece('手拿包示意・淺櫃僅放小包',733,77,9,25,z,24,M.cloth,bags);
 // Deeper seasonal bags fit above the long-hang rail, with a shelf carrying their weight.
 piece('長衣區・包包承重層板',582,2,106,51,212,2,M.black,root,true);
 piece('包包區・中央分隔',634,2,2,51,214,26,M.black,root,true);
 for(const x of [594,647])piece('季節包示意・30×20×23',x,14,30,20,214,23,M.cloth);
 for(const [x,y,w,d] of [[584,52,102,1],[690,134,1,122],[583,204,104,1],[729,58,1,69]])glow('closet','更衣室・櫃內遮光燈',x,y,w,d,232,1);
 const task=new T.PointLight('#fff0dd',0,170,1.6);task.name='主臥工作照明';task.castShadow=false;task.position.copy(pos(-23,185,118));root.add(task);
 const closetTask=new T.PointLight('#fff0dd',.2,180,1.6);closetTask.name='更衣櫃內補光';closetTask.position.copy(pos(666,157,194));root.add(closetTask);
 root.traverse(o=>{if(o.isMesh)o.userData.bedroomUpgrade=true;});
 window.HOME_BEDROOM_MODEL={root,groups,diffusers,task,closetTask,vanity,removedClosetParts:lower.length,revision:'20260911-private'};
 return window.HOME_BEDROOM_MODEL;
};
