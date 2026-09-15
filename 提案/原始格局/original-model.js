'use strict';
// V0 uses the original drawing contours and the current shared equipment builders.
window.HOME_ORIGINAL_BUILD={
 island(c){
  const {T,M,pos,box,info,EQ}=c,s=HOME_ORIGINAL_SPEC.island;
  const g=EQ.group('V0 原圖曲線設備中島');g.userData.footprint={x:s.x,y:s.y,w:s.w,d:s.d,h:95};
  g.userData.island={version:'v0',opening:'W',sink:s.sink,worktopWidth:80};
  const shape=new T.Shape();[...s.contour.north,...s.contour.south.slice().reverse()].forEach(([x,y],i)=>i?shape.lineTo(x-482.5,480-y):shape.moveTo(x-482.5,480-y));shape.closePath();
  const hole=new T.Path();hole.absellipse(500-482.5,480-610.3,11,11,0,Math.PI*2,true);shape.holes.push(hole);
  const cut=new T.Path();[[611.5,538.25],[611.5,587.75],[638.5,587.75],[638.5,538.25]].forEach(([x,y],i)=>i?cut.lineTo(x-482.5,480-y):cut.moveTo(x-482.5,480-y));cut.closePath();shape.holes.push(cut);
  const top=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:3,bevelEnabled:false,curveSegments:32}),M.grey);top.rotation.x=-Math.PI/2;top.position.y=92;g.add(top);top.castShadow=top.receiveShadow=true;top.userData.islandSurface='countertop';
  const meta={...top.userData};info(top,'V0 原圖80cm寬曲線中島',s.note,'原始PDF平面向量＋現行設備分艙');Object.assign(top.userData,meta);
  function panel(x,y,w,d,z,h,name,outer=false){const o=EQ.cover(x,y,w,d,z,h,M.black,g,name);if(outer)o.userData.islandExterior=true;return o;}
  for(let i=0;i<s.contour.south.length-1;i++){
   const a=s.contour.south[i],b=s.contour.south[i+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
   const o=panel((a[0]+b[0])/2-len/2,(a[1]+b[1])/2-1.8,len,1.8,8,84,'V0 弧檯外側連續收口',true);o.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);
   const toe=panel((a[0]+b[0])/2-len/2,(a[1]+b[1])/2-5,len,1.8,0,8,'V0 中島內縮踢腳');toe.rotation.y=o.rotation.y;
  }
  panel(585,498.1,80,1.8,0,92,'V0 展示櫃接合封板',true);
  for(const y of [578.3,656.5])panel(405,y,71.2,1.8,0,92,'V0 酒櫃分艙側板');
  panel(476.2,580.1,1.8,76.4,0,92,'V0 酒櫃與濕區隔板');
  panel(478,580.1,57,1.8,0,8,'V0 濕區內側踢腳');
  panel(478,654.7,57,1.8,0,92,'V0 濕區背板');
  panel(533.2,581.9,1.8,72.8,0,92,'V0 濕區側板');
  panel(478,581.9,55.2,72.8,6.2,1.8,'V0 濕區落地底板');
  const service=panel(478.3,578.3,54.6,1.8,8,83.7,'V0 飲水內側檢修門');service.userData.swingFront={name:'V0 飲水濕區・內側檢修',face:'N',hinge:'min'};
  EQ.product('wine',439.75,618.35,0,'W',g,'保留原圖西側酒櫃位置；朝冰箱的開放分艙。');
  EQ.product('clar',500,631,8,'W',g,'原圖左側飲水槽下獨立濕區；與酒櫃隔板分開，朝北側內側檢修。');
  EQ.receivingSink(g,500,610.3);
  for(const y of [499.9,541])panel(585,y,63,1.8,0,92,'V0 掃地機分艙側板');
  panel(647,501.7,1.8,39.3,0,92,'V0 掃地機背板');
  panel(585,501.7,1.8,39.3,40,52,'V0 掃地機入口上方櫃面');
  EQ.product('robot',620.7,521.1,0,'W',g,'中島北端獨立落地艙；朝內側與冰箱方向進出。');
  EQ.product('ih',625,563,90.3,'N',g,'原圖左側飲水槽保留，IH置於右側弧檯乾區；真開孔與分艙。');
  panel(592,543,51,46,76,2,'V0 IH下方通風檢修層板');
  panel(591,544,1.8,43,8,68,'V0 乾區檢修面').userData.swingFront={name:'V0 IH乾區檢修',face:'W',hinge:'min'};
  EQ.bay('V0 酒櫃開放艙',405,580.1,71.2,76.4,0,92,'西向，原廠散熱與安裝條件待核');
  EQ.bay('V0 掃地機落地艙',585,501.7,62,39.3,0,40,'朝西平進平出');
  window.HOME_ORIGINAL_ISLAND={root:g,shape,spec:s};return g;
 },
 partitions(c){
  const {T,M,wall,glazing,openDoor,setDoorOpening,info}=c;
  const d=openDoor(330,753,70,'H',true,'原圖貓房70cm入口',0);
  setDoorOpening(d,-Math.PI/2,0);
  info(wall(215,753,115,4,275),'原圖貓房北側收納背牆','北側門洞位於 x330–400，保留原圖位置。');
  glazing(400,753,20,4,0,275);
  // Short facets preserve the curve without a rectangular collision envelope.
  for(let i=0;i<16;i++){
   const a=-Math.PI/2+i*Math.PI/32,b=a+Math.PI/32;
   const p=[420+52*Math.cos(a),805+52*Math.sin(a)],q=[420+52*Math.cos(b),805+52*Math.sin(b)];
   const len=Math.hypot(q[0]-p[0],q[1]-p[1]);
   for(const [z,h,mat] of [[0,7,M.steel],[7,265,M.glass],[272,3,M.steel]]){
    const m=wall((p[0]+q[0])/2-len/2,(p[1]+q[1])/2-1.5,len,3,h,z,mat);
    m.rotation.y=-Math.atan2(q[1]-p[1],q[0]-p[0]);m.userData.originalPart='cat-curve';
   }
  }
  info(wall(470,805,4,75,275),'原圖貓房東側隔間','沿原圖弧形轉角接至入口結構柱旁，保留獨立貓房。');
  wall(435,880,39,4,275);
 },
 storage(c){
  const {T,M,box,cyl,info,fittings,cabinet,pos}=c;
  const g=new T.Group();g.name='V0 原圖貓房機能';fittings.add(g);
  const top=cabinet(220,758,106,60,0,95,'V0 貓房清潔收納','S',M.black);
  top.userData.desc='原圖北側機能櫃位置；門洞與收納分開，貓用品及清潔耗材收納。';
  for(const x of [231,339]){
   const w=85,d=50,y=905,z=55;
   box(x,y,w,d,0,3,M.black,g);box(x,y,w,d,z-3,3,M.black,g);
   box(x,y,3,d,3,z-6,M.black,g);box(x+w-3,y,3,d,3,z-6,M.black,g);
   box(x,y+d-3,w,3,3,z-6,M.black,g);
   box(x+7,y+7,w-14,d-14,3,8,M.grey,g,'V0 可取出的貓砂托盤');
   info(box(x,y+1,w,2,z-15,12,M.black,g),'V0 貓砂櫃開放入口','原圖南側貓砂與備品區；開口無門片，托盤可向前取出。');
  }
  for(const [y,z] of [[855,65],[808,112],[863,161]]){
   box(221,y,35,30,z,3,M.black,g,'V0 壁掛貓跳台');
   box(221,y+2,2,26,z-16,16,M.steel,g,'貓跳台牆側支承');
  }
  cyl(242,872,0,5,63,M.linen,g);cyl(242,872,0,18,3,M.black,g);
  g.userData.footprint={x:215,y:753,w:259,d:202};
  const shoe=cabinet(485,805,60,70,0,110,'V0 原圖玄關鞋櫃','E',M.black);
  shoe.parent.traverse(o=>{if(o.isMesh)o.userData.finishGroup='entry-graphite';});
  const entry=new T.Group();entry.name='V0 玄關掛衣與隨身物';fittings.add(entry);
  const side=box(485,805,2,70,110,100,M.black,entry,'V0 原圖玄關櫃側板');side.userData.finishGroup='entry-graphite';
  box(487,822,45,2,191,2,M.steel,entry,'V0 外套掛桿');
  box(529,816,2,14,185,10,M.steel,entry,'掛桿固定座');
  box(498,822,29,3,184,2,M.steel,entry);box(501,820,23,5,133,50,M.darkcloth,entry,'V0 玄關短外套');
  for(const z of [137,159,181])box(487,865,5,2,z,3,M.steel,entry,'V0 側面帽鉤');
  box(510,842,20,16,110,1,M.steel,entry,'V0 鑰匙置物盤');box(504,811,24,14,110,18,M.darkcloth,entry,'V0 隨身包');
 },
 living(c){
  const {T,M,pos,box,cyl,info,fittings,EQ}=c,s=HOME_ORIGINAL_SPEC.sofa;
  const g=new T.Group();g.name='V0 原圖弧形沙發';fittings.add(g);
  function layer(points,z,h,mat,name){
   const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x-482.5,480-y):shape.moveTo(x-482.5,480-y));shape.closePath();
   const o=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSegments:2,bevelSize:.8,bevelThickness:.8,curveSegments:16}),mat);
   o.rotation.x=-Math.PI/2;o.position.y=z;o.castShadow=o.receiveShadow=true;g.add(o);if(name)info(o,name,s.note,'原始PDF沙發輪廓');return o;
  }
  layer(s.outline,8,28,M.darkcloth,'V0 原圖弧形沙發外緣');
  layer(s.outline,36,7,M.cloth,'V0 弧形沙發座墊');
  const outer=s.outline.slice(4,41),inner=outer.map((p,i)=>{
   const a=outer[Math.max(i-1,0)],b=outer[Math.min(i+1,outer.length-1)],dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy);
   return [p[0]-dy/n*17,p[1]+dx/n*17];
  });
  layer([...outer,...inner.reverse()],43,38,M.darkcloth,'V0 弧形沙發連續靠背');
  for(const [x,y] of [[764,554],[823,540],[910,535],[1015,570],[1037,634]])cyl(x,y,0,3,8,M.steel,g);
  for(const [x,y,a] of [[810,524,-.3],[909,507,.08],[1005,556,.72]]){const p=box(x-18,y,36,16,44,28,M.linen,g,'V0 沙發靠枕');p.rotation.y=-a;}
  g.userData.footprint={x:740.5,y:482.8,w:329.4,d:181.1,h:82};g.userData.sourcePolygon=s.outline;
  const rug=new T.Mesh(new T.CircleGeometry(166,80),M.cloth);rug.rotation.x=-Math.PI/2;rug.position.copy(pos(890,682,.8));fittings.add(rug);info(rug,'V0 原圖圓形地毯','依原圖圓形會客區位置；直徑332cm為圖面輪廓配置。');
  const lift=EQ.coffee(false);lift.parent.position.x-=26;lift.parent.position.z-=69;
  lift.children.filter(o=>o.isMesh&&o.geometry.type==='CylinderGeometry').forEach(o=>{o.scale.x=o.scale.z=60/43;});
  lift.userData.desc='V0 原圖圓茶几中心 x890/y682；桌面直徑120cm，保留45／65cm升降操作。';window.HOME_COFFEE_LIFT=lift;
  const chairs=[];
  function lounge(x,y,angle){
   const q=new T.Group();q.name='V0 原圖單椅';q.position.copy(pos(x,y,0));q.rotation.y=angle;fittings.add(q);
   function local(a,b,w,d,z,h,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(a+w/2,z+h/2,b+d/2);o.castShadow=true;q.add(o);return o;}
   info(local(-30,-30,60,60,10,29,M.darkcloth),'V0 原圖活動單椅','依原圖會客位置；單椅約65×70cm，產品未定。');
   local(-31,-32,62,12,39,40,M.cloth);local(-27,-18,54,47,39,6,M.cloth);
   for(const xx of [-26,24])for(const yy of [-24,24])local(xx,yy,3,3,0,10,M.steel);
   chairs.push(q);
  }
  lounge(718,659,-.55);lounge(1025,742,.9);
  window.HOME_ORIGINAL_LIVING={sofa:g,rug,chairs};
 },
 study(c){
  const {T,M,box,cyl,fittings,info,EQ,odyssey57,chair}=c;
  const g=new T.Group();g.name='V0 原圖L型書桌與電子琴';fittings.add(g);
  info(box(835,50,190,75,73,2.5,M.black,g),'V0 原圖190×75書桌','原圖L型書桌主段190×75，左回折50×120；檯高75.5cm。');
  box(835,125,50,120,73,2.5,M.black,g,'V0 L型書桌回折');
  for(const [x,y] of [[841,57],[1015,57],[841,230],[878,57]]){box(x,y,4,4,4,69,M.steel,g);box(x-2,y-2,8,8,0,4,M.rubber,g);}
  odyssey57(933,76,0);chair(946,179,Math.PI,true);
  EQ.product('pc',870,179.55,0,'E',g,'V0 L型書桌回折段下方主機位。第二套工作站不改占原圖電子琴位置。');
  box(912,110,45,16,75.6,1.4,M.grey,g,'V0 鍵盤');
  info(box(915,310,135,40,69,6,M.black,g),'V0 原圖電子琴','原圖書房南牆電子琴位置；135×40cm為外觀佔位，確切型號待選。');
  for(const x of [920,1039]){box(x,313,6,34,0,69,M.black,g);}
  box(927,315,111,19,75,1,M.white,g);
  for(let i=1;i<52;i++)box(927+i*111/52,315,.2,19,76,.2,M.black,g);
  for(let i=0;i<36;i++)if(![2,6].includes(i%7))box(929+i*3.05,321,1.5,12,76,1,M.black,g);
  box(935,346,95,2,30,2,M.steel,g);box(963,343,8,3,6,12,M.steel,g);
  box(966,266,48,28,43,5,M.darkcloth,g,'V0 電子琴椅');for(const x of [970,1006])for(const y of [270,286])box(x,y,3,3,0,43,M.steel,g);
 }
};
