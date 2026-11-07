'use strict';
// SV01: measured shell from the owner's 2026-11-03 setting-out plan.
// Installed AFTER the detailed meshes: source signatures and product sizes stay intact.
(()=>{
 const V=window.HOME_VIEWER,T=window.THREE;if(!V||window.HOME_SURVEY)return;
 const version=window.HOME_LAYOUT?.displayVersion||'v1',records=[],summary=[];
 const state={revision:'20261106-SV01',state:'loading',audit:'20261107-SV02',version,source:'2026-11-03 放樣圖 P-03',unit:'cm',limits:['275cm裝修天花及240cm廚房天花仍為設計值；CH309/310是樓板高度。','無標註的牆厚、洞口寬與梁寬由向量牆線對位，不等同標註尺寸。','南側156與384尺寸端點相差約1cm；保留156門區，右段模型383，待設計師核對。','後陽台內寬模型183.4cm、牆線推估177.3cm，無標註，待核。','主浴西側開口沿用窗台90／洞高140cm，1103未標高與型式。','沿用既有材質與靜態光照，新增梁體採即時受光，未重新烘焙。']};
 const round=n=>Math.round(n*100)/100;
 function bounds(o){const b=new T.Box3().setFromObject(o);return {x:b.min.x+482.5,y:b.min.z+480,z:b.min.y,w:b.max.x-b.min.x,d:b.max.z-b.min.z,h:b.max.y-b.min.y};}
 function name(o){const a=[];for(let p=o;p&&p!==V.scene;p=p.parent)a.unshift(p.userData.name||p.name||p.type);return a.join(' / ');}
 function room(b){const x=b.x+b.w/2,y=b.y+b.d/2;if(x<0&&y>490)return '後陽台';if(y<283&&x<406)return '主臥';if(x<315&&y<493)return '主浴';if(x<225&&y>=493)return '廚房';if(x>754&&y<385)return '電腦房';if(x>405&&x<583&&y>208&&y<376)return '客浴';if(x>=583&&x<757&&y>260&&y<376)return '儲藏室';if(y<376)return '更衣室／走道';if(y>750&&x<550)return '收藏室';if(y>750&&x<715)return '玄關';if(x<710)return '中島';return '客廳';}
 function save(o,b,a,reason){if(!Object.keys(b).some(k=>Math.abs(b[k]-a[k])>.04))return;records.push({version,room:room(b),name:name(o),sourceId:o.userData.blenderV1Source||null,before:Object.fromEntries(Object.entries(b).map(([k,v])=>[k,round(v)])),after:Object.fromEntries(Object.entries(a).map(([k,v])=>[k,round(v)])),delta:Object.fromEntries(Object.keys(b).map(k=>[k,round(a[k]-b[k])])),reason});o.userData.surveyRevision=state.revision;}
 function lerp(v,knots){for(let i=1;i<knots.length;i++){if(v<=knots[i][0]){const [a,A]=knots[i-1],[b,B]=knots[i];return A+(v-a)*(B-A)/(b-a);}}const [a,A]=knots.at(-1);return v+A-a;}
 function xy(x,y){
  let X=x,Y=y;
  if(y<493){
   X=lerp(x,[[-210,-210],[-85,-90],[-75,y<282?-75:-72],[0,0],[305,303],[315,315],[405,405],[415,421],[485,482],[490,493],[570,571],[580,583],[615,615],[655,658],[735,735],[745,745],[755,757],[1085,1085],[1185,1185]]);
   if(x<315)Y=lerp(y,[[-15,-13],[0,2],[85,88],[282,282],[292,295],[483,478],[493,493]]);
   else if(x<755)Y=lerp(y,[[0,0],[80,82],[123,123],[207,208],[217,222],[260,260],[270,270],[365,363],[375,375],[493,493]]);
   else Y=lerp(y,[[0,0],[85,89],[88,89],[312,315],[365,374],[375,382],[493,493]]);
  }else if(x<315){X=lerp(x,[[-210,-210],[-8,-15],[0,0],[210,212],[220,225],[315,315]]);}
  if(x>=1084&&y>=375)Y=lerp(y,[[375,382],[580,572],[650,655],[880,880],[955,955],[970,970]]);
  return [X,Y];
 }
 // Widths without dimension strings use the source vector outlines, rounded to cm.
 const beamDefs=[
  ['主臥北梁',0,2,405,45,238,309],['主臥西梁',-90,88,60,390,236,309],
  ['電腦房北梁',583,0,502,46,238,310],['窗側外梁',1085,89,60,791,238,310],
  ['主臥走道橫梁',-8,351,490,42,258,310],['書房／儲藏室橫梁',583,328,502,46,258,310],
  ['中央縱梁',482,82,64,798,238,310],['南側周圈梁',0,910,1085,45,238,310]
 ];
 const oldBeamRows=[];
 function cap(b){let h=275;for(const [,x,y,w,d,z] of beamDefs)if(b.x<x+w-.2&&b.x+b.w>x+.2&&b.y<y+d-.2&&b.y+b.d>y+.2)h=Math.min(h,z);return h;}
 const shellMaterial=V.finishContext.materials.concrete.clone();shellMaterial.name='SV01 中灰牆';shellMaterial.color.set('#565955').convertSRGBToLinear();shellMaterial.map=null;shellMaterial.bumpMap=null;shellMaterial.roughness=.96;const beamMaterial=V.finishContext.ceilingMaterial.clone();beamMaterial.name='SV01 霧黑梁';beamMaterial.color.set('#202325').convertSRGBToLinear();beamMaterial.map=null;beamMaterial.bumpMap=null;
 const wallMap=new Map(V.wallParts.map(p=>[p.m,p]));
 function deform(o,fn,reason,before){
  const b=before||bounds(o),world=o.matrixWorld.clone(),old=o.geometry,p=old.attributes.position,g=old.clone(),a=g.attributes.position,v=new T.Vector3();
  let zmin=Infinity,zmax=-Infinity;const values=new Float32Array(a.count*3);
  for(let i=0;i<a.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(world);const q=fn(v.x+482.5,v.z+480,v.y);values.set([q[0]-482.5,q[2],q[1]-480],i*3);zmin=Math.min(zmin,q[2]);zmax=Math.max(zmax,q[2]);}
  const part=wallMap.get(o);if(part){part.z=zmin;part.h=zmax-zmin;o.position.y=(zmin+zmax)/2;o.scale.y=1;}
  o.updateWorldMatrix(true,false);const inv=o.matrixWorld.clone().invert();
  for(let i=0;i<a.count;i++){v.fromArray(values,i*3).applyMatrix4(inv);a.setXYZ(i,v.x,v.y,v.z);}a.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();o.geometry=g;o.updateMatrixWorld(true);save(o,b,bounds(o),reason);
 }
 function box(n,x,y,w,d,z,h,mat,parent=V.architecture,isWall=true){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.copy(V.pos(x+w/2,y+d/2,z+h/2));m.name=n;m.userData.name=n;m.userData.desc='SV01／'+state.source+'；單位cm。';m.userData.surveyRevision=state.revision;m.castShadow=m.receiveShadow=true;parent.add(m);parent.updateWorldMatrix(true,false);m.position.copy(parent.worldToLocal(V.pos(x+w/2,y+d/2,z+h/2)));if(isWall){const p={m,z,h};V.wallParts.push(p);wallMap.set(m,p);}V.registerObject(m);m.updateMatrixWorld(true);records.push({version,room:room(bounds(m)),name:n,before:null,after:bounds(m),delta:null,reason:'1103新增／重建構件'});return m;}
 function remove(o,reason){const b=bounds(o);records.push({version,room:room(b),name:name(o),sourceId:o.userData.blenderV1Source||null,before:b,after:null,delta:null,reason});o.parent?.remove(o);const i=V.wallParts.findIndex(p=>p.m===o);if(i>=0)V.wallParts.splice(i,1);V.unregisterObject(o);}
 function windowBox(def){const {id,n,x,y,w,d,sill,h,old}=def;const horizontal=w>d,C=V.finishContext.materials;
  box(n+'・窗下實牆',x,y,w,d,0,sill,shellMaterial);const wallTop=id==='bed'?236:['studyN','studyE','living1','living2'].includes(id)?238:275;box(n+'・窗上實牆',x,y,w,d,sill+h,wallTop-sill-h,shellMaterial);
  const parts=[box(n+'・下框',x,y,w,d,sill,3,C.steel),box(n+'・上框',x,y,w,d,sill+h-3,3,C.steel)];
  parts.push(box(n+'・左框',x,y,horizontal?3:w,horizontal?d:3,sill,h,C.steel));parts.push(box(n+'・右框',horizontal?x+w-3:x,horizontal?y:y+d-3,horizontal?3:w,horizontal?d:3,sill,h,C.steel));
  parts.push(box(n+'・玻璃',horizontal?x+3:x+w*.35,horizontal?y+d*.35:y+3,horizontal?w-6:w*.3,horizontal?d*.3:d-6,sill+3,h-6,C.glass));
  def.parts=parts;summary.push({room:n,item:'窗洞',before:old,after:{width:horizontal?w:d,sill,height:h,top:sill+h},basis:'高度／窗台為圖面標註；水平洞口依向量邊線'});
 }
 const windows=[
  {id:'bed',n:'主臥西窗',x:-90,y:88,w:15,d:194,sill:125,h:102,old:{width:197,sill:75,height:158,top:233}},
  {id:'closet',n:'更衣室凹槽窗',x:423,y:67,w:59,d:15,sill:124,h:82,old:{width:70,sill:95,height:150,top:245}},
  {id:'studyN',n:'電腦房北窗',x:775,y:-15,w:310,d:15,sill:10,h:212,old:{width:310,sill:0,height:245,top:245}},
  {id:'studyE',n:'電腦房東窗',x:1085,y:89,w:15,d:226,sill:14,h:212,old:{width:224,sill:0,height:245,top:245}},
  {id:'living1',n:'客廳北側落地窗',x:1085,y:382,w:15,d:190,sill:14,h:212,old:{width:205,sill:0,height:245,top:245}},
  {id:'living2',n:'客廳南側落地窗',x:1085,y:655,w:15,d:225,sill:14,h:212,old:{width:230,sill:0,height:245,top:245}},
  {id:'kitchen',n:'廚房後陽台窗',x:-15,y:733,w:15,d:164,sill:125,h:94,old:{width:85,sill:122,height:96,top:218}}
 ];
 function isOldWindow(b){const near=(a,v)=>Math.abs(a-v)<.15;return b.x>=-85.1&&b.x+b.w<=-74.9&&b.y>=84.9&&b.y+b.d<=282.1||b.x>=414.9&&b.x+b.w<=485.1&&near(b.y,65)&&b.d<=15.1||b.x>=414.9&&b.x+b.w<=485.1&&near(b.y,70.25)||b.x>=774.9&&b.x+b.w<=1085.1&&b.y>=-10.1&&b.y+b.d<=.1||b.x>=1084.9&&b.x+b.w<=1095.1&&((b.y>=87.9&&b.y+b.d<=312.1)||(b.y>=374.9&&b.y+b.d<=580.1)||(b.y>=649.9&&b.y+b.d<=880.1))||b.x>=-8.1&&b.x+b.w<=.1&&b.y>=729.9&&b.y+b.d<=897.1;}
 function apply(){
  const cut=document.getElementById('cut')?.checked;
  for(const p of V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;p.m.visible=true;}V.scene.updateMatrixWorld(true);
  // Record all current components before any parent or hinge moves.
  const meshes=[];for(const parent of [V.architecture,V.fittings,V.ceiling])parent.traverse(o=>{if(o.isMesh&&o.geometry?.attributes.position&&!o.isInstancedMesh)meshes.push({o,b:bounds(o),matrix:o.matrixWorld.clone(),path:name(o)});});
  if(window.HOME_FLOORING?.floor){const o=HOME_FLOORING.floor;meshes.push({o,b:bounds(o),matrix:o.matrixWorld.clone(),path:name(o)});}
  const rigid=new Map();
  for(const g of window.HOME_EQUIPMENT?.items||[]){const b=bounds(g);if(!Number.isFinite(b.x))continue;const [nx,ny]=xy(b.x+b.w/2,b.y+b.d/2);g.traverse(o=>{if(o.isMesh)rigid.set(o,[nx-b.x-b.w/2,ny-b.y-b.d/2]);});}
  // Preserve purchased kitchen modules as complete assemblies. Translate the
  // east run 2cm to the measured wall, rather than stretching appliances.
  const kitchenShift=b=>b.y>=700&&b.x+b.w/2>=140?2:0;
  const caps=new Map();
  V.fittings.traverse(g=>{if(!g.userData.cabinet&&!/中島頂天雙面玻璃櫃|頂天收納櫃|頂天櫃|整段同深展示牆/.test(g.name))return;const b=bounds(g);if(b.h<200||b.w>700||b.d>600)return;const top=cap(b);if(b.z+b.h>top+.1){g.traverse(o=>{if(o.isMesh&&!rigid.has(o))caps.set(o,{top,from:b.z+b.h});});if(b.z+b.h>=274){let [sx,sy]=xy(b.x,b.y),[ex,ey]=xy(b.x+b.w,b.y+b.d);if(g.name==='更衣室頂天櫃'){sx=482;ex=546;}let pieces=[[sx,sy,ex,ey]];for(const [,bx,by,bw,bd,bz] of beamDefs){if(bz>top+.1)continue;pieces=pieces.flatMap(([x0,y0,x1,y1])=>{const l=Math.max(x0,bx),r=Math.min(x1,bx+bw),n=Math.max(y0,by),s=Math.min(y1,by+bd);if(l>=r||n>=s)return [[x0,y0,x1,y1]];return [[x0,y0,l,y1],[r,y0,x1,y1],[l,y0,r,n],[l,s,r,y1]].filter(p=>p[2]-p[0]>.05&&p[3]-p[1]>.05);});}for(const [x0,y0,x1,y1] of pieces)box(g.name+'・梁下封頂收邊',x0,y0,x1-x0,y1-y0,top,275-top,V.finishContext.materials.black,V.ceiling,false);summary.push({room:room(b),item:g.name+'封頂高度',before:{top:round(b.z+b.h)},after:{top},basis:'配合實測梁底，梁旁加固定收邊封至裝修天花'});}}});
  // Move hinges as well as leaves. Geometry uses the captured world matrix.
  for(const parent of [V.architecture,V.fittings])parent.traverse(o=>{if(!o.isMesh&&o.userData.interactionId!==undefined){const p=o.getWorldPosition(new T.Vector3()),[x,y]=xy(p.x+482.5,p.z+480);o.parent.worldToLocal(p.set(x-482.5,p.y,y-480));o.position.copy(p);}});
  V.scene.updateMatrixWorld(true);
  for(const {o,b,matrix,path} of meshes){
   if(o.parent===V.architecture&&isOldWindow(b)){remove(o,'以1103窗洞、窗台與窗高替換');continue;}
   if(o.parent===V.architecture&&Math.abs(b.x-660)<.1&&Math.abs(b.y-955)<.1&&b.w>39){remove(o,'入戶子母門的小門位置原被實牆封住');continue;}
   // Detached historical glazing and unused allowances remain detached/hidden.
   let group=o;while(group.parent&&![V.architecture,V.fittings,V.ceiling].includes(group.parent))group=group.parent;
   const isFit=group.parent===V.fittings,isArch=group.parent===V.architecture;
   const kitchen=isFit&&b.x>=-.1&&b.x+b.w<=215.1&&b.y>=492.9;
   const rigidShift=rigid.get(o);
   const limit=caps.get(o)||{top:isFit&&b.z+b.h>=237&&!kitchen?cap(b):275,from:b.z+b.h<=245.1?b.z+b.h:275};const capTop=Math.min(limit.top,limit.from);
   // Reapply old transform for the source vertices, but localize to the new pivot.
   o.matrixWorld.copy(matrix);
   const fn=(x,y,z)=>{
    let X=x,Y=y,Z=z;
    if(kitchen){X=x+kitchenShift(b);}
    else if(rigidShift){X=x+rigidShift[0];Y=y+rigidShift[1];}
    else if(isFit&&path.includes('更衣室頂天櫃')){X=482+(x-485)*64/61;Y=xy(x,y)[1];}
    else if(isFit&&b.y>=400&&b.x>=315){/* freestanding public-area design stays put */}
    else [X,Y]=xy(x,y);
    if(isArch&&z>=274.9&&b.h>300)Z=x<405&&y<283?309:310;
    if(!rigidShift&&!kitchen&&isFit&&capTop<limit.from-.05&&z>180)Z=180+(z-180)*(capTop-180)/(limit.from-180);
    const n=o.userData.name||o.name||'';
    if(isArch&&(/入戶門/.test(path)||Math.abs(b.x-553)<.1&&b.y>=951&&b.y<966))Z=lerp(z,[[0,0],[100,100],[215,230],[275,275]]);
    if(isArch&&/客浴|雙聯滑門上軌/.test(n)&&b.y>=360&&b.y<390)Z=lerp(z,[[0,0],[100,100],[215,220],[218,223],[245,258],[275,275]]);
    if(isArch&&/儲藏/.test(path))Z=lerp(z,[[0,0],[100,100],[215,220],[245,258],[275,275]]);
    if(isArch&&/廚房電動玻璃滑門|廚房電動門機/.test(path))Z=lerp(z,[[0,0],[100,100],[213,230],[223,240],[275,275]]);
    if(isArch&&Math.abs(b.x-210)<.1&&Math.abs(b.y-625)<.1&&b.z>220)Z=lerp(z,[[223,240],[275,275]]);
    if(isArch&&/門頂封板/.test(n)&&b.z>210&&b.z+b.h<246)Z=lerp(z,[[215,215],[245,275]]);
    if(isArch&&Math.abs(b.x-490)<.1&&Math.abs(b.y-365)<.1&&b.z>210)Z=lerp(z,[[215,220],[245,275]]);
    if(isArch&&Math.abs(b.x-655)<.2&&Math.abs(b.y-365)<.2&&b.z>210)Z=lerp(z,[[215,220],[245,275]]);
    return [X,Y,Z];
   };
   deform(o,fn,'放樣尺寸對位／櫃體避梁／設備等尺寸移位',b);
  }
  // New structural beams replace all earlier schematic beam proxies.
  for(const o of [...V.beams.children]){oldBeamRows.push({name:name(o),...bounds(o)});remove(o,'舊示意梁撤換為1103梁位及梁底');}

  // Correct structural column boundaries and completed face at the entry.
  const col=V.architecture.children.find(o=>o.isMesh&&o.userData.name==='客廳窗間結構柱');
  if(col){const b=bounds(col);deform(col,(x,y,z)=>[x,572+(y-b.y)/b.d*83,z], '窗間柱依1103外包絡：572–655cm');}
  for(const o of V.architecture.children.filter(o=>o.isMesh)){const b=bounds(o);if(b.y>879&&b.x>440&&b.x<447&&b.w>98&&b.w<104)deform(o,(x,y,z)=>[444+(x-b.x)*102/b.w,y,z],'南側柱寬102cm');if(Math.abs(b.x-700)<.1&&Math.abs(b.y-955)<.1)deform(o,(x,y,z)=>[702+(x-700)*383/385,y,z],'156cm門區；南牆尺寸鏈1cm差異另列');}
  const shaft=V.architecture.children.find(o=>o.userData.name==='更衣室管道間');if(shaft){const b=bounds(shaft);deform(shaft,(x,y,z)=>[546+(x-b.x)*81/b.w,82+(y-b.y)*39/b.d,z],'更衣室管道外包絡依1103向量牆線');}
  const columns=V.architecture.children.filter(o=>o.isMesh&&bounds(o).h>300).map(bounds);
  for(const [n,x,y,w,d,z,top] of beamDefs){const g=new T.Group();g.name=n;V.beams.add(g);let pieces=[[x,y,x+w,y+d]];for(const c of columns){pieces=pieces.flatMap(([x0,y0,x1,y1])=>{const l=Math.max(x0,c.x),r=Math.min(x1,c.x+c.w),a=Math.max(y0,c.y),b=Math.min(y1,c.y+c.d);if(l>=r||a>=b)return [[x0,y0,x1,y1]];return [[x0,y0,l,y1],[r,y0,x1,y1],[l,y0,r,a],[l,b,r,y1]].filter(p=>p[2]-p[0]>.05&&p[3]-p[1]>.05);});}for(const [x0,y0,x1,y1] of pieces)box(n,x0,y0,x1-x0,y1-y0,z,top-z,beamMaterial,g,false);}
  for(const def of windows)windowBox(def);
  // Bath tile inner face moves from -75 to -72. Existing west wall is thickened.
  const C=V.finishContext.materials;
  const smallPivot=new T.Group();smallPivot.position.copy(V.pos(697,955,0));smallPivot.userData.interactiveDoor={name:'入戶子母門小門',openAngle:-Math.PI/2,initialAngle:0};V.architecture.add(smallPivot);const smallLeaf=box('入戶子母門小門',661,951,35.7,4,0,230,C.black,smallPivot,false);smallLeaf.userData.walkDoor=true;window.HOME_INTERACTION?.registerDoor(smallPivot,smallPivot.userData.interactiveDoor,smallLeaf);window.HOME_INTERACTION?.configureDoor('入戶門',Math.PI/2);
  box('入戶小門上方封牆',660,955,42,15,230,45,shellMaterial);
  box('入戶子母門右門框',697,951,5,19,0,230,C.steel);
  box('更衣室窗左側收口',421,2,2,80,0,275,shellMaterial);
  box('主臥窗側收口',-90,282,18,30,0,275,shellMaterial);
  // Ceiling remains a designed finished level, not the structural CH dimension.
  V.scene.userData.survey={...state,structuralHeight:{bed:309,public:310},finishHeight:{main:275,kitchen:240}};
  window.HOME_DATA.slab=310;state.fixedServices={waterFloor:{x:629,y:526},drainHeight:232,closetPipeBottom:227,backVentBottom:282,sprinklerBottom:289};if(window.HOME_EQUIPMENT?.refinements.fridgeAir)window.HOME_EQUIPMENT.refinements.fridgeAir.nominalAisleCm=85.5;
  window.HOME_FLOORING?.applySurvey?.(xy);
  const curtainChanges=window.HOME_CURTAINS?.applySurvey?.(windows.map(w=>({...w,railHeight:w.id==='bed'?234:236})))||[];summary.push(...curtainChanges);
  for(const r of V.rooms){if(r.id==='all')continue;for(const k of ['p','t']){const [x,y]=xy(r[k][0],r[k][1]);r[k][0]=x;r[k][1]=y;}}
  window.HOME_TOUR?.applySurveyAreas?.(xy,{
   bed:[[-75,2],[405,2],[405,282],[-75,282]],
   bath1:[[-72,295],[303,295],[303,478],[-72,478]],
   bath2:[[421,222],[571,222],[571,363],[421,363]],
   study:[[757,0],[1085,0],[1085,374],[757,374]],
   kitchen:[[0,493],[212,493],[212,955],[0,955]],
   storage:[[583,270],[745,270],[745,363],[583,363]]
  });
  V.scene.updateMatrixWorld(true);window.HOME_WALK?.refreshColliders();window.HOME_TOUR?.invalidatePlan?.();window.HOME_INTERACTION?.refreshPlan?.();
  if(cut){for(const p of V.wallParts){const hh=Math.max(0,Math.min(p.z+p.h,85)-p.z);p.m.visible=hh>.1;p.m.scale.y=hh/p.h;p.m.position.y=p.z+hh/2;}}
  state.state='ready';state.changedComponents=records.length;state.windows=windows.length;state.beams=beamDefs.length;
  const status=document.getElementById('status');if(status)status.textContent='SV01｜已依2026/11/03放樣圖校正。尺寸差異見「全室尺寸變更」；裝修天花及未標尺寸仍為設計值。';
  const nav=document.querySelector('.uiPrimary');if(nav&&!document.getElementById('surveyReportLink')){const a=document.createElement('a');a.id='surveyReportLink';a.href=new URL('全室放樣核對.html?version='+version,document.baseURI).href;a.target='_blank';a.rel='noopener';a.textContent='放樣核對';nav.appendChild(a);}
  const foot=document.querySelector('.uiSideFoot');if(foot)foot.textContent=version.toUpperCase()+' · SV01 1103放樣尺寸';
  if(foot?.parentElement&&!document.getElementById('surveyRevision')){
   const badge=document.createElement('a');badge.id='surveyRevision';
   badge.href=new URL('全室放樣核對.html?version='+version,document.baseURI).href;badge.target='_blank';badge.rel='noopener';
   badge.textContent='1103 放樣核對 · SV02／11月7日';badge.style.cssText='display:block;padding:8px 14px;color:#bbd5c6;font-size:12px;line-height:1.6;flex-shrink:0';
   foot.parentElement.insertBefore(badge,foot);
  }
  V.finishContext.materials.concrete.needsUpdate=true;window.HOME_REALISM?.registerMaterials?.();window.HOME_REALISM?.invalidate?.(true,true);
  window.dispatchEvent(new CustomEvent('survey-ready'));
 }
 const api=window.HOME_SURVEY={state,records,summary,windows,beamDefs,oldBeamRows,xy,getState:()=>({...state}),ready:null};
 api.ready=Promise.all([window.HOME_BLENDER_V1?.ready,window.HOME_FULLHOUSE_LIGHT?.ready,window.HOME_FULLHOUSE_MIRRORS?.ready,window.HOME_FLOORING?.ready]).then(()=>{
  if(window.HOME_INTERACTION?.withClosedPose)window.HOME_INTERACTION.withClosedPose(apply);else apply();
 }).catch(error=>{state.state='failed';state.error=String(error);console.error('SV01尺寸校正失敗',error);throw error;});
})();
