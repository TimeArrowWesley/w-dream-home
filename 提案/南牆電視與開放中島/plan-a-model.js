'use strict';
// Approved A floor plan. Shared private rooms, finishes and storage stay in their builders.
(()=>{
const shared=window.HOME_OPEN_ISLAND_BUILD;
window.HOME_OPEN_ISLAND_BUILD={
 storage(ctx){
  const result=shared.storage(ctx);
  ctx.fittings.traverse(o=>{o.name=o.name.replace(/^V3 /,'A ');for(const k of ['name','desc','source'])if(typeof o.userData[k]==='string')o.userData[k]=o.userData[k].replaceAll('V3','A');if(o.userData.swingFront)o.userData.swingFront.name=o.userData.swingFront.name.replaceAll('V3','A');});
  return result;
 },
 island({T,M,pos,box,info:baseInfo,EQ}){
  function info(mesh,...args){const tags={...mesh.userData};baseInfo(mesh,...args);mesh.userData={...tags,...mesh.userData};return mesh;}
  const g=EQ.group('A 開放長中島'),spec=window.HOME_OPEN_ISLAND_SPEC;
  g.userData.footprint={...spec.island};g.userData.island={version:'a',opening:'W',sink:spec.sink,knee:spec.kneeRecess};
  const sink=spec.sink;
  function rounded(cx,cy,w,d,r){const p=new T.Shape(),x=cx-482.5-w/2,y=480-cy-d/2;p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+d-r);p.quadraticCurveTo(x+w,y+d,x+w-r,y+d);p.lineTo(x+r,y+d);p.quadraticCurveTo(x,y+d,x,y+d-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);p.closePath();return p;}
  const shape=new T.Shape();[[425,480],[535,480],[535,760],[425,760]].forEach(([x,y],i)=>i?shape.lineTo(x-482.5,480-y):shape.moveTo(x-482.5,480-y));shape.closePath();
  shape.holes.push(rounded(sink.x,sink.y,42,52,4));
  const hole=new T.Path();[[444,612.15],[444,661.65],[471,661.65],[471,612.15]].forEach(([x,y],i)=>i?hole.lineTo(x-482.5,480-y):hole.moveTo(x-482.5,480-y));hole.closePath();shape.holes.push(hole);
  const top=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:3,bevelEnabled:false,curveSegments:32}),M.grey);top.rotation.x=-Math.PI/2;top.position.y=92;top.castShadow=top.receiveShadow=true;top.userData.islandSurface='countertop';g.add(top);
  info(top,'A 280×110×H95 開放長中島','酒櫃、掃地機、IH、濕區由北至南分艙，開口朝西／冰箱。石材真開孔，備餐單槽55×45、深20；東側留膝約33×205，南端完整木皮。');
  function panel(x,y,w,d,z,h,name,wood=false){const m=EQ.cover(x,y,w,d,z,h,M.black,g,name);if(wood)m.userData.openIslandWood=true;return m;}
  // Each appliance has its own shell. The east knee space does not intrude into a body.
  panel(425,480,110,1.8,0,92,'A 中島北端固定板',true);
  for(const y of [550,602,670])panel(426.8,y,71.4,1.8,0,92,'A 分艙固定側板');
  panel(425,758.2,110,1.8,8,84,'A 玄關端完整木皮',true);
  panel(429,754.2,102,1.8,0,8,'A 玄關端內縮踢腳');
  panel(533.2,481.8,1.8,71.8,8,84,'A 東側酒櫃背面木皮',true);
  panel(529.2,485.8,1.8,63.8,0,8,'A 酒櫃背面內縮踢腳');
  panel(498.2,551.8,35,1.8,8,84,'A 酒櫃與留膝側面轉折封板',true);
  panel(502.2,547.8,27,1.8,0,8,'A 轉折內縮踢腳');
  panel(498.2,553.6,1.8,204.6,8,84,'A 東側留膝完成面',true);
  panel(494.2,555.8,1.8,198.4,0,8,'A 留膝背面內縮踢腳');
  panel(429,605.8,1.8,62.4,0,8,'A IH 艙內縮踢腳');
  panel(429,673.8,1.8,82.4,0,6.2,'A 濕區落地內縮踢腳');
  panel(427,671.8,71.2,86.4,6.2,1.8,'A 濕區設備承重底板');
  for(const y of [553.6,621.8,689.8,756.2])box(500,y,33.2,2,89,3,M.steel,g,'A 留膝檯面橫向支撐');
  box(531.2,555.6,2,200.6,89,3,M.steel,g,'A 留膝檯面外緣支撐');
  EQ.product('wine',462.15,515.9,0,'W',g,'獨立西向艙；機身寬65.7、深66.3、高85cm。艙淨寬68.2、檯下淨高92；背側留37.9。獨立式機型的檯下安裝條件仍待原廠核准。');
  EQ.product('robot',451.75,576.9,0,'W',g,'獨立落地艙，朝冰箱側平進平出；保留西向取出維修。');
  panel(427,551.8,71.2,50.2,40,1.8,'A 掃地機上方檢修層板');
  panel(475.5,551.8,1.8,50.2,0,40,'A 掃地機後側隔板');
  panel(425,552.1,1.8,49.6,42,49.7,'A 掃地機上方收納門',true).userData.swingFront={name:'A 掃地機上方收納',face:'W',hinge:'min'};
  EQ.product('ih',457.5,636.9,90.3,'N',g,'27×49.5cm真開孔；爐面95.4cm，與石材分高避免閃爍。下方獨立通風層。');
  panel(427,603.8,71.2,66.2,76,1.8,'A IH 獨立散熱隔板');
  panel(425,604.1,1.8,65.6,8,66,'A IH下方乾式收納門',true).userData.swingFront={name:'A IH下方乾式收納',face:'W',hinge:'min'};
  panel(425,603.8,1.8,66.2,86.5,5.5,'A IH通風帶上收口',true);
  for(const y of [603.8,669])panel(425,y,1.8,1,74,12.5,'A IH通風帶側框');
  for(const z of [77,80,83])panel(426,604.8,1.8,64.2,z,.7,'A IH西側內縮散熱葉片');
  EQ.product('clar',447,688,8,'W',g,'濕區北端落在8cm底板；與水槽、排水及IH乾區分開，西側雙檢修門。');
  const stand=g.children.find(o=>o.name==='飲水機防潮落地台');if(stand){g.remove(stand);stand.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}
  const metal=new T.MeshStandardMaterial({color:'#697477',roughness:.38,metalness:.72,side:T.DoubleSide});metal.color.convertSRGBToLinear();metal.userData.finishId='a-sink-brushed-steel';
  function flat(s,z,h,mat,name,role){const m=new T.Mesh(new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:12}),mat);m.rotation.x=-Math.PI/2;m.position.y=z;m.castShadow=m.receiveShadow=true;m.userData.islandSurface=role;info(m,name,'A 備餐槽外框55×45、內槽50×40、深20cm；產品型號及開孔模板待選定。');g.add(m);return m;}
  const rim=rounded(455,725,45,55,4.5);rim.holes.push(rounded(455,725,40,50,3.5));flat(rim,95.02,.14,metal,'A 備餐單槽薄邊','sink-rim');
  const rings=[[41,51,4,94.99],[35,45,4,74.5],[34,44,3.5,75],[40,50,3.5,95.02]].map(([w,d,r,z])=>{const p=rounded(455,725,w,d,r).getPoints(12);p.pop();return p.map(q=>new T.Vector3(q.x,z,-q.y));});
  const vertices=[];for(let a=0;a<4;a++)for(let i=0;i<rings[a].length;i++){const j=(i+1)%rings[a].length,b=(a+1)%4;for(const q of [rings[a][i],rings[a][j],rings[b][j],rings[a][i],rings[b][j],rings[b][i]])vertices.push(q.x,q.y,q.z);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
  const bowl=new T.Mesh(geo,metal);bowl.userData.islandSurface='sink-bowl';info(bowl,'A 備餐槽中空內膽','薄壁漸縮，20cm真槽深；內部與排水口保持中空。');g.add(bowl);
  const floor=rounded(455,725,34,44,3.5),drainHole=new T.Path();drainHole.absellipse(455-482.5,480-725,4.5,4.5,0,Math.PI*2,true);floor.holes.push(drainHole);flat(floor,74.5,.5,metal,'A 槽底真排水口','sink-floor');
  const drain=new T.Shape();drain.absellipse(455-482.5,480-725,5.1,5.1,0,Math.PI*2,false);const inner=new T.Path();inner.absellipse(455-482.5,480-725,4.1,4.1,0,Math.PI*2,true);drain.holes.push(inner);flat(drain,75.03,.15,metal,'A 排水薄邊','sink-drain');
  function tube(points,r,mat,name){const m=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>pos(...p))),40,r,10,false),mat);m.userData.wetFixture=true;info(m,name,'管路造型示意；全部位於獨立濕區，檢修朝西。');g.add(m);return m;}
  tube([[455,725,74.5],[455,725,51],[455,732,31],[455,741,32],[449,741,43],[432,741,43]],2,metal,'A 存水彎與排水');
  tube([[448,687,95],[448,687,116],[448,691,126],[448,705,126],[448,710,116]],1.3,M.steel,'A 備餐冷熱水龍頭');
  tube([[470,687,95],[470,687,121],[470,689,126],[470,704,126],[470,709,122]],.85,M.black,'A CLAR獨立飲水龍頭');
  box(468,684,4,3,97,6,M.screen,g,'A CLAR觸控溫度面板');
  for(const [x,name] of [[448,'冷熱水'],[470,'CLAR飲水']]){box(x-2,685,4,4,94.99,.4,M.steel,g,'A '+name+'固定座');tube([[x,687,94.9],[x,687,62],[x,679,48]],.5,M.black,'A '+name+'供水管');}
  for(const [y,d] of [[672.1,42.75],[715.15,42.75]])panel(425,y,1.8,d,8,83.7,'A 濕區西向檢修門',true).userData.swingFront={name:'A 飲水濕區檢修',face:'W',hinge:'min'};
  for(const [name,x,y,w,d,z,h,note] of [
   ['A 酒櫃開放艙',427,481.8,106.2,68.2,0,92,'獨立式酒櫃；安裝條件待原廠確認'],
   ['A 掃地機維修艙',427,551.8,48.5,50.2,0,40,'西側抽出檢修'],
   ['A IH乾式散熱艙',427,603.8,71.2,66.2,77.8,14.2,'與下櫃及濕區分隔'],
   ['A 飲水濕區',427,671.8,71.2,86.4,8,84,'水槽、飲水機、存水彎和雙扇檢修門']])EQ.bay(name,x,y,w,d,z,h,note);
  EQ.allowance('A 酒櫃西向操作預留',360,482,65,68,0,90,'避免與冰箱同時對開');
  EQ.allowance('A 掃地機西向進出預留',365,551.8,60,50.2,0,35,'回充須依實機測試');
  g.userData.serviceZones={wine:[481.8,550],robot:[551.8,602],ih:[603.8,670],wet:[671.8,758.2]};
  return g;
 },
 living({T,M,pos,box,cyl,info,EQ,finishHeight,wallParts}){
  const base=EQ.consoleBase(false),tv=EQ.product('tv',917.5,948.6,47.15,'N');
  const wall=EQ.group('A 南牆固定電視完成面');
  const wallHeight=finishHeight(917.5,951),backing=box(760,951,315,2,0,wallHeight,M.concrete,wall,'A 南牆灰礦物塗料背牆');
  wallParts.push({m:backing,z:0,h:wallHeight});
  Object.assign(tv.userData,{name:'A LG 83吋固定電視',desc:'南牆固定安裝，中心高100cm；主座至螢幕約347cm。線路收在背牆與195×55影音底櫃。'});
  EQ.audio(false);window.HOME_COFFEE_LIFT=EQ.coffee(false);
  const sofa=EQ.group('A 朝南L型沙發');sofa.userData.footprint={x:797,y:540,w:240,d:160,facing:'S'};
  box(797,540,240,95,9,29,M.darkcloth,sofa,'A 沙發主座');box(949,635,88,65,9,29,M.darkcloth,sofa,'A 靠窗貴妃段');
  box(797,540,240,18,38,46,M.cloth,sofa,'A 沙發背靠');
  for(const x of [817,883])box(x,560,64,72,38,10,M.cloth,sofa,'A 主座坐墊');
  box(951,560,66,137,38,10,M.cloth,sofa,'A 貴妃長坐墊');box(797,558,18,77,38,26,M.darkcloth,sofa,'A 左扶手');box(1019,558,18,142,38,26,M.darkcloth,sofa,'A 右扶手');
  for(const [x,y] of [[805,548],[1025,548],[805,624],[1025,624],[957,690],[1025,690]])box(x,y,3,3,0,9,M.steel,sofa,'A 沙發落地腳');
  for(const x of [819,886,953])box(x,557,61,15,49,30,M.cloth,sofa,'A 沙發背靠墊');
  box(782,560,270,310,.3,.7,M.cloth,sofa,'A 客廳短毛地毯');
  const stools=[];for(const y of [610,710]){
   const g=EQ.group('A 中島東側活動椅');g.userData.footprint={x:550,y:y-20,w:40,d:40,h:65};
   cyl(570,y,61,20,4,M.cloth,g);for(const x of [558,582])for(const yy of [y-12,y+12])box(x-1,yy-1,2,2,0,61,M.steel,g,'A 活動椅落地腳');
   const rest=new T.Mesh(new T.TorusGeometry(14,1,8,32),M.steel);rest.rotation.x=Math.PI/2;rest.position.copy(pos(570,y,23));g.add(rest);
   g.traverse(o=>{o.visible=false;if(o.isMesh){o.userData.dynamicDoor=true;o.userData.proposalStool=true;}});stools.push(g);
  }
  return {base,tv,wall,sofa,stools};
 }
};
})();
