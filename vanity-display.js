/* VT02 adopted vanity concept, dimensions pending. Coordinates and hardware are model proposals, not shop drawings. */
(function(global){
function buildVanity(f){
 const {T,V}=f,B=f.c.HOME_BEDROOM_MODEL;if(!B||f.c.HOME_VANITY)return;
 const finishes=[],mirrorDiffusers=[];
 const root=new T.Group();root.name='VT02 玻璃展示化妝桌試案';V.fittings.add(root);
 for(const o of B.vanity.group.children)if(o!==B.groups.stool)o.visible=false;
 B.groups.mirror.visible=false;B.groups.drawer.visible=false;
 B.root.traverse(o=>{if((o.userData.name||o.name||'').includes('桌面滑軌'))o.visible=false;});
 const mat=(color,props={})=>new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness:.55,metalness:.15,...props});
 const charcoal=mat('#292e30'),metal=mat('#444d52',{metalness:.8,roughness:.3});
 const liner=mat('#797674',{metalness:0,roughness:1});
 const glass=mat('#b6d3d2',{transparent:true,opacity:.2,roughness:.08,metalness:.1,side:T.DoubleSide,depthWrite:false});
 const mirrorMat=mat('#cad3d4',{metalness:.95,roughness:.05});
 const led=mat('#eee8de',{emissive:'#eee8de',emissiveIntensity:.35});
 function box(name,x,y,w,d,z,h,m=charcoal,parent=root){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.copy(V.pos(x+w/2,y+d/2,z+h/2));o.name=name;o.userData.name=name;o.userData.vt02=true;o.userData.masterVanity=true;parent.add(o);finishes.push([o,m]);return o;}
 const perfumeTrays=[],bottles=[];
 for(const [i,y] of [90,244].entries()){
  box('VT02 內縮踢腳',-60,y+3,66,30,0,6);
  box('VT02 櫃背',-65,y,2,36,6,68);
  for(const yy of [y,y+34])box('VT02 側板',-63,yy,71,2,6,68);
  box('VT02 下櫃底板',-63,y+2,71,32,6,2);
  for(const z of [8,27.5]){box('VT02 封閉抽屜面',8,y+.25,2,35.5,z,18.8);box('VT02 抽屜指拉縫',9.98,y+5,.04,26,z+16.8,.8,metal);}
  const tray=new T.Group();tray.name='VT02 香水抽盤 '+(i+1);root.add(tray);perfumeTrays.push(tray);
  box('VT02 香水托盘底',-49,y+2,56,32,47,1.5,charcoal,tray);
  box('VT02 香水可拆內襯',-48.5,y+2.5,55,31,48.5,.5,liner,tray);
  box('VT02 香水格玻璃前面',8,y+.5,1,35,49,23,glass,tray);
  for(const yy of [y+.5,y+33.5])box('VT02 香水格前框',8,yy,1,2,47,25,metal,tray);
  box('VT02 香水格指拉',8,y+12,1,12,71,1,metal,tray);
  const layout=[[-38,y+10,20],[-17,y+10,15],[-38,y+26,16],[-17,y+26,13]];
  for(const [j,[x,yy,h]] of layout.entries()){
   const bottle=new T.Group();bottle.name='VT02 示意香水瓶 '+(i*4+j+1);tray.add(bottle);
   const bottleMat=mat(['#ad9574','#898a75','#95798d','#adada2'][j],{transparent:true,opacity:.66,roughness:.12});
   box('VT02 香水瓶身',x-3,yy-3,6,6,49,h-3,bottleMat,bottle);
   box('VT02 香水瓶蓋',x-2,yy-2,4,4,49+h-3,3,metal,bottle);bottles.push(bottle);
  }
 }
 // Glass top split around a 50 x 44 cm opaque mirror lid. Top finished height remains 75.
 box('VT02 玻璃左端',-65,90,75,36,74,1,glass);
 box('VT02 玻璃右端',-65,244,75,36,74,1,glass);
 box('VT02 中央玻璃前段',-16,126,26,118,74,1,glass);
 box('VT02 中央玻璃後緣',-65,126,5,118,74,1,glass);
 box('VT02 中央玻璃左翼',-60,126,44,34,74,1,glass);
 box('VT02 中央玻璃右翼',-60,210,44,34,74,1,glass);
 for(const yy of [90,278])box('VT02 端部承托框',-65,yy,75,2,72,2,metal);
 box('VT02 前緣細框',8,90,2,190,73.2,.8,metal);
 box('VT02 後緣承托框',-65,90,2,190,72,2,metal);
 const jewelry=new T.Group();jewelry.name='VT02 中央飾品抽盤';root.add(jewelry);
 box('VT02 中央抽盤底',-13,128,21,114,66.5,1.5,charcoal,jewelry);
 box('VT02 中央抽盤內襯',-12.5,128.5,20,113,68,.5,liner,jewelry);
 box('VT02 中央薄抽面',8,126.2,2,117.6,66.5,6.5,charcoal,jewelry);
 for(const yy of [128,150,173,196,220,241])box('VT02 飾品分隔',-12.5,yy,20,.6,68.5,3,metal,jewelry);
 for(const yy of [140,163,186,209,232]){
  const o=new T.Mesh(new T.TorusGeometry(2,.28,8,24),metal);o.rotation.x=Math.PI/2;o.position.copy(V.pos(-3,yy,69));o.name='VT02 飾品示意';o.userData.masterVanity=true;jewelry.add(o);finishes.push([o,metal]);
 }
 // Flip first, then pull forward 35 cm; this keeps the lid out of the front glass.
 const carriage=new T.Group(),hinge=new T.Group();carriage.name='VT02 鏡子前拉滑座';root.add(carriage);
 hinge.name='VT02 翻蓋鏡';hinge.position.copy(V.pos(-60,185,75));carriage.add(hinge);
 function localBox(name,x,y,z,w,h,d,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.name=name;o.userData.masterVanity=true;hinge.add(o);finishes.push([o,m]);if(name.includes('照臉燈'))mirrorDiffusers.push(o);return o;}
 localBox('VT02 鏡背蓋板',22,-.75,0,44,1.5,50,charcoal);
 localBox('VT02 化妝鏡面',22,-1.53,0,41,.08,46,mirrorMat);
 localBox('VT02 照臉燈左',22,-1.6,-23.6,40,.12,.7,led);
 localBox('VT02 照臉燈右',22,-1.6,23.6,40,.12,.7,led);
 for(const yy of [157.5,210.5])box('VT02 抽拉軌道預留',-60,yy,38,1.5,71.5,2,metal);
 box('VT02 鏡子機構淺槽底',-60,160,44,50,69.5,1,charcoal);
 for(const yy of [160,209])box('VT02 鏡槽側緣',-60,yy,44,1,70.5,2.8,charcoal);
 box('VT02 鏡槽前緣',-17,161,1,48,70.5,2.8,charcoal);
 box('VT02 後緣連接橫檔',-64,126,3,118,62,10,charcoal);
 function state(kind){
  hinge.rotation.z=kind==='closed'?0:Math.PI/2;
  carriage.position.x=kind==='closed'?0:35;
  perfumeTrays.forEach(t=>t.position.x=kind==='access'?55:0);
  jewelry.position.x=kind==='access'?18:0;
  B.groups.stool.position.x=kind==='closed'?0:48;
  V.scene.updateMatrixWorld(true);f.c.HOME_REALISM?.invalidate?.();
 }
 state('closed');
 const spec={revision:'VT02',length:190,depth:75,height:75,sideWidth:36,kneeWidth:118,kneeHeight:66.5,perfumeClearHeight:25,perfumeProxyMaxHeight:20,jewelryClearHeight:5.5,mirrorLid:[50,44],mirrorForwardTravel:35,perfumeTrayTravel:55,exampleBottles:8,status:'owner-adopted concept; model dimensions and hardware pending construction approval'};
 function mirrorProgress(t){t=Math.max(0,Math.min(1,t));hinge.rotation.z=Math.PI/2*Math.min(1,t*2);carriage.position.x=35*Math.max(0,t*2-1);root.updateWorldMatrix(true,true);}
 // Left/right are from the seated user's viewpoint facing the window (-X).
 B.groups.mirror=carriage;B.groups.drawer=jewelry;B.groups.perfumeLeft=perfumeTrays[1];B.groups.perfumeRight=perfumeTrays[0];B.diffusers.mirror=mirrorDiffusers;
 B.vanity.kneeHeight=66.5;B.vanity.revision='20261001-vt02';
 root.userData.masterVanity=true;root.userData.vanitySpec=spec;
 function apply(){for(const [o,m] of finishes)o.material=m;f.c.HOME_REALISM?.registerMaterials?.();f.c.HOME_REALISM?.invalidate?.();}
 const api={root,spec,finishes,mirrorProgress,apply,perfumeTrays,bottles,jewelry,hinge,carriage,stool:B.groups.stool,travel:{mirror:35,drawer:18,perfumeLeft:55,perfumeRight:55}};
 f.c.HOME_VANITY=api;return api;
}
if(global.HOME_VIEWER)buildVanity({T:global.THREE,V:global.HOME_VIEWER,c:global});
})(typeof window!=='undefined'?window:globalThis);
