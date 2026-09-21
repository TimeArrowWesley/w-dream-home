'use strict';
// MR01: reviewable V1–V4 model repair, centimetres, not site-approved shop drawings.
(()=>{
const V=window.HOME_VIEWER,T=window.THREE,E=window.HOME_EQUIPMENT,L=window.HOME_LAYOUT;
const version=L?.proposal;if(!V||!['v1','v2','v3','v4'].includes(version))return;
const M=V.finishContext.materials,revision='20260921-mr01',records=[],removed=[];
const boxBounds=o=>{const a=new T.Box3().setFromObject(o);return {x:a.min.x+482.5,y:a.min.z+480,z:a.min.y,w:a.max.x-a.min.x,d:a.max.z-a.min.z,h:a.max.y-a.min.y};};
const all=()=>{const a=[];V.scene.traverse(o=>a.push(o));return a;};
const named=n=>all().find(o=>(o.userData.name||o.name)===n);
function drop(o){if(o){removed.push(o);o.traverse(q=>V.unregisterObject?.(q));o.parent?.remove(o);}}
function group(name,parent=V.fittings){const g=new T.Group();g.name=name;g.userData.modelRepair=revision;parent.add(g);return g;}
function tag(o,name,desc='顧問MR01模型試案；五金、固定與現場淨尺寸待深化。'){o.userData={...o.userData,name,desc,source:'2026-09-21 業主授權執行檢視修正',modelRepair:revision};V.registerObject?.(o);return o;}
function b(x,y,w,d,z,h,mat,name,parent=V.fittings){const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);o.position.copy(V.pos(x+w/2,y+d/2,z+h/2));o.castShadow=o.receiveShadow=true;parent.add(o);return tag(o,name);}
function flat(o,outer,hole){const {x,y,w,d,z,h}=outer,s=new T.Shape();s.moveTo(x-482.5,480-y);s.lineTo(x+w-482.5,480-y);s.lineTo(x+w-482.5,480-y-d);s.lineTo(x-482.5,480-y-d);s.closePath();
 if(hole){const p=new T.Path(),{x:a,y:c,w:e,d:f}=hole;p.moveTo(a-482.5,480-c);p.lineTo(a-482.5,480-c-f);p.lineTo(a+e-482.5,480-c-f);p.lineTo(a+e-482.5,480-c);p.closePath();s.holes.push(p);}
 o.geometry=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false});o.geometry.rotateX(-Math.PI/2);o.position.set(0,z,0);o.rotation.set(0,0,0);o.scale.set(1,1,1);return o;
}
// Collection: two telescoping panels park within the existing return length.
if(version==='v1'||version==='v2'){
 const old=all().find(o=>o.userData.interactiveDoor?.name==='收藏室東側入口');drop(old);
 const g=group('MR01 收藏室外掛雙聯滑門',V.architecture);g.userData.slidingDoor={name:'收藏室雙聯滑門',key:'collection-mr01',axis:'z',distance:-42};
 for(const [i,y] of [804.2,844.2].entries()){
  const leaf=b(550.5+i*3,y,1.2,41.8,.3,214.4,M.black,'收藏室雙聯門片 '+(i+1),g);leaf.userData.slideRatio=i?1:2;leaf.userData.walkDoor=true;
  const pull=b(549.7+i*3,y+30,.8,8,96,14,M.steel,'收藏室內縮側拉手',leaf);pull.position.sub(leaf.position);
 }
 b(549.6,804.2,9.8,127.8,217,6,M.steel,'收藏室雙聯上吊軌',V.architecture);
 records.push({issue:'M01',choice:'two telescoping surface sliders',opening:[545.2,803,883],effectiveY:[804.2,883],clearCm:78.8,parkedMaxY:930,siteApproval:false});
}
// V2: take the obstructing case doors away inside the closed room. Lift only
// the first 60 cm of the bag cabinet; retain the floor-supported right bays.
if(version==='v2'){
 const luggage=named('收藏室 B 行李箱專用格');luggage?.traverse(o=>{if(o.userData.swingFront)removed.push(o);});
 removed.filter(o=>o.parent===luggage).forEach(o=>o.parent.remove(o));
 const bags=V.fittings.children.find(o=>o.name==='收藏室精品包櫃');
 if(!bags||!luggage)throw Error('MR01 V2 collection baseline missing');
 const oldMeshes=[];bags.traverse(o=>{if(o.isMesh)oldMeshes.push(o);});oldMeshes.forEach(drop);
 const inner=new T.MeshStandardMaterial({color:new T.Color('#b8b9b0').convertSRGBToLinear(),roughness:.78,metalness:.02});
 function bay(x,w,z,h,label){const g=group(label,bags);b(x,953.2,w,1.8,z,h,inner,'精品包櫃背板',g);
  for(const xx of [x,x+w-1.8])b(xx,905,1.8,48.2,z,h,M.black,'精品包櫃直板',g);
  for(const zz of [z,z+h-1.8])b(x+1.8,905,w-3.6,48.2,zz,1.8,M.black,'精品包櫃頂底板',g);
  const levels=z? [97,139,181,223]:[2,44,86,128,170,212];
  for(const zz of levels){if(zz>z+2)b(x+1.8,907,w-3.6,44.4,zz,1,M.glass,'精品包可調玻璃層板',g);
   for(let i=0;i<(w>60?2:1);i++)b(x+8+i*44,919,28,17,zz+2,23,M.linen,'精品包外形示意・未核實容量',g);
  }
  // Sliding glazed fronts provide access without sweeping over the luggage retrieval area.
  for(let i=0;i<2;i++){const leaf=b(x+1.8+i*(w-3.6)/2,903.2+i*1.1,(w-3.6)/2+.6,.7,z+2,h-4,M.glass,'精品包側移玻璃',g);leaf.userData.slideFront={name:label+'側移門 '+(i+1),axis:'x',distance:(i?1:-1)*((w-3.6)/2-1)};}
  return g;
 }
 bay(275,60,95,150,'MR01 左側上提包櫃');bay(335,100,0,245,'MR01 右側包櫃');
 records.push({issue:'M02',retainedCaseCount:2,lowerRetrievalBay:{x:275,y:905,w:60,d:50,h:95},caseProxy:{x:224,y:886,w:42,d:60,h:75},route:[[224,886],[280,886],[280,833],[355,833]],limit:'左段櫃底升至95cm，該段低位包格減少；高位支撐、紙箱及取物站姿待確認。'});
}
// V3: keep both subwoofer envelopes unchanged and move them to the front field.
if(version==='v3'){
 for(const [id,y] of [['SW1',548],['SW2',618]]){const o=E.items.find(o=>o.userData.channel===id);if(!o)throw Error('Missing '+id);o.position.copy(V.pos(705,y,0));o.rotation.y=-Math.PI/2;o.userData.modelRepair=revision;o.userData.equipment.note='MR01前場試位；外形不縮小，延遲、相位、分頻與房間低頻需現場測量。';}
 for(const o of all().filter(o=>o.name.startsWith('耳平環繞 Ci160QR ')||o.userData.name==='環繞固定與背腔待核'))drop(o);
 const g=group('MR01 V3背架承托完整環繞音箱');
 for(const y of [478,690]){
  b(978, y-8,16,16,72,1,M.steel,'V3 背架隔振底板',g);b(984.5,y-1.5,3,3,73,16,M.steel,'V3 家具連接短柱',g);b(978.7,y-7.3,14.6,14.6,89,1,M.steel,'V3 環繞承台',g);
  const shell=new T.Mesh(new T.SphereGeometry(1,24,16),M.black);shell.scale.set(7.15,8.6,7.2);shell.position.copy(V.pos(986,y,98.6));g.add(shell);tag(shell,'V3 小型完整音箱外形示意','14.3深×14.4寬×17.2高cm候選外形；沿用V1研究形式，不是採購定案。');
  const face=new T.Mesh(new T.CircleGeometry(5.5,24),M.rubber);face.rotation.y=-Math.PI/2;face.position.copy(V.pos(978.8,y,99));g.add(face);tag(face,'V3 朝主座音箱面網');
 }
 records.push({issue:'M03',rearAisle:{fromX:995,toX:1085,nominalClear:90},frontSubs:[[705,548],[705,618]],surroundsOnRack:true,limit:'模型動線試排；不以移位證明聲學效果。'});
}
// Flush sliding furniture fronts, retaining the cabinet carcasses and shelves.
function slideCabinet(name,x,y,w,z,h){const g=V.fittings.children.find(o=>o.name===name);if(!g)throw Error('Missing '+name);
 const original=g.children.find(o=>o.userData.swingFront);if(original){const q=boxBounds(original);z=q.z;h=q.h;}
 for(const o of [...g.children])if(o.userData.swingFront)drop(o);
 const left=name.startsWith('後陽台')?1.4:.8,span=w-left-.8,half=span/2;
 for(let i=0;i<2;i++){const leaf=b(x+left+i*half,y+i*1.1,half+.4,.8,z,h,M.blackglass,name+'側移面板 '+(i+1),g);leaf.userData.slideFront={name:name+'側移門 '+(i+1),axis:'x',distance:(i?1:-1)*(half-1)};}
 g.userData.access={kind:'bypass-sliding',clearWidth:half-1,proposal:true};
}
slideCabinet('更衣室窗前矮櫃',415,120.3,70,8,81);
slideCabinet('更衣室頂天櫃',485,120.3,61,8,236);
slideCabinet('後陽台水槽右側頂天收納櫃',-125,554.3,117,8,266);
records.push({issue:'M06',choice:'sliding cabinet fronts; unchanged room doors',tradeoff:'單次開口約半櫃寬；增加雙軌與清潔細節，物品寬度須對照。'});
// Master shower: retain the fixed glass and clear opening; park a wet-side
// slider over the fixed panel. This eliminates the intersecting door sweeps.
drop(all().find(o=>o.userData.interactiveDoor?.name==='主浴淋浴玻璃門'));
const bathEntry=all().find(o=>o.userData.interactiveDoor?.name==='主浴80cm門洞');
bathEntry.position.z+=4;bathEntry.userData.modelRepair=revision;
records.push({issue:'M05-closed-leaf',closedLeafY:[282,286],hingeY:286,reason:'原關閉門板伸入臥室並碰化妝台；厚度移入原10cm門洞深度，80cm門洞與開向保留。'});
const shower=group('MR01 主浴淋浴滑門',V.architecture);shower.userData.slidingDoor={name:'主浴淋浴滑門',key:'shower-mr01',axis:'z',distance:-79};
const glass=b(145.5,298.5,1,77,1,210,M.glass,'主浴淋浴側移玻璃',shower);glass.userData.slideRatio=1;glass.userData.walkDoor=true;
const pull=b(146.6,307,2.4,1.6,97,20,M.steel,'淋浴滑門直拉手',glass);pull.position.sub(glass.position);
b(144.6,296,4.6,164,211.3,3.4,M.steel,'主浴淋浴上吊軌',V.architecture);
records.push({issue:'M05',choice:'wet-side sliding glass',openingY:[300,373],travel:79,parkedY:[377.5,454.5],limit:'玻璃厚度、承重、止擺、止水及拆洗由廠商核定；不是既有現場門型確認。'});
// Adjacent storage slider: separate the track planes without reducing the 80 cm opening.
const store=all().find(o=>o.userData.slidingDoor?.key==='storage');store.position.z+=8;
const rail=named('儲藏拉門上吊軌');rail.position.z+=8;rail.userData.modelRepair=revision;
for(const x of [654,735])b(x,375,1,8.7,.3,214.4,M.steel,'儲藏拉門側向封縫',V.architecture);
records.push({issue:'M07',doorPlaneY:[384,387],clearOpeningX:[655,735],tradeoff:'門片向走道多突出8cm，維持80cm名義開口；軌道與門框節點待放樣。'});
// Fix hinge thickness locally. The offset moves only the virtual hinge axis;
// closed leaf positions stay unchanged. Pulls stay on their respective leaf.
for(const o of all())if(o.userData.swingFront){const meta=o.userData.swingFront,n=meta.name;
 if(/^R05 展示(下部|上部)/.test(n)){meta.hingeFrontOffset=.7;meta.hingeEdgeOffset=.7;}
 if(/V[34] 行李與深收藏/.test(n)){meta.hingeFrontOffset=1.1;meta.hingeEdgeOffset=.5;}
 if(/V[34] 飲水濕區檢修/.test(n)){meta.hingeFrontOffset=1.1;meta.hingeEdgeOffset=.5;}
}
if(version==='v3'||version==='v4')for(const o of all())if(o.userData.name==='深櫃層板'){
 const q=boxBounds(o);if(q.z>2&&q.z<240){o.geometry=new T.BoxGeometry(57.8,q.h,q.d);o.position.copy(V.pos(q.x+28.9,q.y+q.d/2,q.z+q.h/2));o.userData.modelRepair=revision;}
}
// Put the removable bag on a dedicated part of the entry top, outside the service-door sweep.
if(version==='v3'||version==='v4'){
 const bag=named('玄關隨身包');if(bag){const g=bag.parent;for(const o of [...g.children]){const q=boxBounds(o);if(q.x>=676&&q.x+q.w<=701&&q.y>=855&&q.y+q.d<=873&&q.z>=89&&q.z<125){o.position.z-=45;o.userData.modelRepair=revision;}}}
 records.push({issue:'M09',bagY:[811,826],electricalAccess:'Keep service area clear.'});
}
// Main kitchen sink: reuse existing external position and tap; cut the worktop
// and sink-base top, remove solid proxies, and build a real cavity within the recorded 28 cm product envelope.
const counter=named('A區308.7cm石材檯面'),cut={x:12.5,y:654.5,w:42,d:75};
flat(counter,boxBounds(counter),cut);tag(counter,'A區308.7cm石材檯面','原外形與高度保留；水槽開孔為模型深化，須對已下單廚具模板。');
const oldSink=named('78cm雙層水槽'),sinkBounds=oldSink&&boxBounds(oldSink);
for(const o of all()){if(!o.isMesh)continue;const q=boxBounds(o);if(q.x>=10.9&&q.x+q.w<=56.1&&q.y>=652.9&&q.y+q.d<=731.1&&q.z>=86.4&&q.z<87.5&&q.h<1)drop(o);}
const base=V.fittings.children.find(o=>o.name==='A區120cm雙開水槽櫃');
for(const o of base.children){if(!o.isMesh)continue;const q=boxBounds(o);if(q.z>81&&q.h<2)flat(o,q,cut);}
const sink=group('MR01 主廚房中空水槽'),metal=new T.MeshStandardMaterial({color:new T.Color('#899297').convertSRGBToLinear(),roughness:.35,metalness:.78,side:T.DoubleSide});
const rim=b(11,653,45,78,86.5,.7,metal,'78cm雙層水槽・薄邊',sink);flat(rim,{x:11,y:653,w:45,d:78,z:86.5,h:.7},{x:14,y:656,w:39,d:72});
for(const [x,y,w,d] of [[13.5,655.5,.5,73],[53,655.5,.5,73],[14,655.5,39,.5],[14,728,39,.5]])b(x,y,w,d,59.5,27.4,metal,'主水槽中空側壁',sink);
const bottom=b(13.5,655.5,40,73,59.2,.3,metal,'主水槽槽底',sink);flat(bottom,{x:13.5,y:655.5,w:40,d:73,z:59.2,h:.3},{x:30.5,y:689,w:6,d:6});
b(30.5,689,6,6,58.7,.2,M.rubber,'主水槽排水口示意',sink);
records.push({issue:'M08',outer:sinkBounds,cutout:cut,recordedProduct:'BELEGA BESK-R15 78×45×28cm，家具主檔既有紀錄',externalHeightCm:28,provisionalInnerDepthCm:27.7,limit:'依既有產品外徑建模；內膽淨深、圓角、滴水板及開孔模板仍待廚具商核對。'});
V.scene.updateMatrixWorld(true);
if(version==='v3'){
 const a=window.HOME_OPEN_ISLAND_SPEC.audio;a.baselineFloorSpeakers=JSON.parse(JSON.stringify(a.floorSpeakers));
 a.floorSpeakers=a.floorSpeakers.filter(o=>!['SL','SR'].includes(o.id)).map(o=>o.id==='SW1'||o.id==='SW2'?{...o,cx:705,cy:o.id==='SW1'?548:618,x:685.25,y:(o.id==='SW1'?548:618)-18,w:39.5,d:36,face:'E'}:o);
 a.rackSurrounds=[{id:'SR',cx:986,cy:478},{id:'SL',cx:986,cy:690}].map(o=>({...o,centerHeight:98.6,model:'MR01完整小型音箱候選，未核定'}));
 a.revision=revision;a.note='MR01以前場重低音及背架環繞試排；原115.6度等聲學註記不適用新位置，須現場重算調音。';
 window.HOME_OPEN_ISLAND_SPEC.relocated=window.HOME_OPEN_ISLAND_SPEC.relocated.filter(s=>s!=='two surround stands');
}
window.HOME_MODEL_REPAIRS={revision,version,records,removed,boxBounds};
})();
