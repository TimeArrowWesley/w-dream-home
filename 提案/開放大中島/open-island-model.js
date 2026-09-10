'use strict';
// V3 additions use the shared equipment, finishes and interaction builders.
window.HOME_OPEN_ISLAND_BUILD = {
  island({T,M,pos,box,info,EQ}) {
    const g=EQ.group('V3 開放大中島'),s=window.HOME_OPEN_ISLAND_SPEC.island;
    g.userData.footprint={...s};
    const sink={x:455,y:735,w:45,d:55,innerW:40,innerD:50,depth:20};
    g.userData.island={opening:'W',sink,knee:{x:484,y:674,w:34,d:104},version:'v3'};
    function roundRect(cx,cy,w,d,r){
      const p=new T.Shape(),x=cx-482.5-w/2,y=480-cy-d/2;
      p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);
      p.lineTo(x+w,y+d-r);p.quadraticCurveTo(x+w,y+d,x+w-r,y+d);
      p.lineTo(x+r,y+d);p.quadraticCurveTo(x,y+d,x,y+d-r);
      p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);p.closePath();return p;
    }
    const shape=new T.Shape();
    for(const [i,[x,y]] of [[425,480],[520,480],[520,780],[425,780]].entries())i?shape.lineTo(x-482.5,480-y):shape.moveTo(x-482.5,480-y);
    shape.closePath();
    shape.holes.push(roundRect(sink.x,sink.y,42,52,4));
    const cut=new T.Path();for(const [i,[x,y]] of [[444,614],[444,663.5],[471,663.5],[471,614]].entries())i?cut.lineTo(x-482.5,480-y):cut.moveTo(x-482.5,480-y);cut.closePath();shape.holes.push(cut);
    const top=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:3,bevelEnabled:false,curveSegments:32}),M.grey);
    top.rotation.x=-Math.PI/2;top.position.y=92;top.castShadow=true;top.receiveShadow=true;g.add(top);
    info(top,'300 × 95 開放大中島・高95','95cm石材檯面；IH玻璃頂95.4cm。單槽外框55×45、內槽50×40、深20cm；真開孔與獨立排水。設備與檢修朝冰箱，玄關端完整木皮。東側南段留膝34×104cm，一張活動椅預設收起。');top.userData.islandSurface='countertop';
    function panel(x,y,w,d,z,h,name,wood=false){const m=EQ.cover(x,y,w,d,z,h,M.black,g,name);if(wood)m.userData.openIslandWood=true;return m;}
    // No solid proxy through an equipment bay. All shells have separate faces.
    for(const y of [480,558.4,606,670.2])panel(y===480?425:426.8,y,y===480?93.2:91.4,1.8,0,92,'長中島分艙固定側板');
    panel(425,778.2,95,1.8,8,84,'玄關端完整深色木皮',true);
    panel(429,774.2,87,1.8,0,8,'玄關端內縮踢腳');
    panel(518.2,480,1.8,194,8,84,'中島東側連續深色木皮',true);
    panel(514.2,484,1.8,186,0,8,'中島東側內縮踢腳');
    panel(482.2,672,1.8,106.2,8,84,'飲水背板與東側留膝面',true);
    panel(478.2,674,1.8,100,0,8,'留膝區內縮踢腳');
    panel(429,607.8,1.8,62.4,0,8,'IH 艙內縮踢腳');
    panel(429,672,1.8,104,0,6.2,'濕區落地內縮踢腳');
    panel(427,672,55.2,106.2,6.2,1.8,'濕區設備承重底板');
    box(484,674,34.2,2,89,3,M.steel,g,'留膝檯面橫向支撐');
    box(516.2,676,2,100.2,89,3,M.steel,g,'留膝檯面邊緣支撐');
    // Wine cabinet remains freestanding in an open west-facing bay, with rear space.
    EQ.product('wine',462.15,520.85,0,'W',g,'西向開放艙；機身66.3深×65.7寬，檯下7cm、後側22.9cm幾何餘量。独立式機型能否檯下安裝與台灣供貨仍須原廠確認。');
    EQ.product('robot',451.75,582.05,0,'W',g,'中島獨立落地艙，朝冰箱進出；有獨立上蓋與西向取出路徑，不與酒櫃共艙。');
    panel(427,560.2,88,45.8,40,1.8,'掃地機艙頂檢修層板');
    panel(475.5,560.2,1.8,45.8,0,40,'掃地機基座後側隔板');
    panel(425,560.2,1.8,45.8,42,50,'掃地機上方收納門',true).userData.swingFront={name:'掃地機上方收納',face:'W',hinge:'min'};
    EQ.product('ih',457.5,638.75,90.3,'N',g,'27×49.5cm檯面開孔；玻璃面95.4cm，下方獨立通風層。爐面與石材不共面。');
    panel(427,607.8,87,62.4,76,1.8,'IH 獨立散熱隔板');
    panel(425,607.8,1.8,62.4,8,66,'IH 下方收納門',true).userData.swingFront={name:'IH 下方乾式收納',face:'W',hinge:'min'};
    panel(425,607.8,1.8,62.4,86.5,5.5,'IH 通風帶上收口',true);
    for(const y of [608,670])panel(425,y,1.8,1,74,12.5,'IH 進氣帶側框');
    for(const z of [77,80,83])panel(426,608.8,1.8,60.4,z,.7,'IH 西側內縮散熱葉片');
    EQ.product('clar',447,688,8,'W',g,'濕區北端落在8cm底板，避開加大水槽及排水；西向可開檢修門，與IH乾區以實板分隔。');
    // The wet bay has a continuous floor now; do not leave the old pedestal inside it.
    const oldStand=g.children.find(o=>o.name==='飲水機防潮落地台');if(oldStand){g.remove(oldStand);oldStand.traverse(o=>{if(o.isMesh)o.geometry.dispose();});}
    // V3 gets a preparation sink, independently of V1/V2's small drinking-water bowl.
    const metal=new T.MeshStandardMaterial({color:'#697477',roughness:.38,metalness:.72,side:T.DoubleSide});metal.color.convertSRGBToLinear();metal.userData.finishId='v3-sink-brushed-steel';
    function flat(shape,z,th,mat,name,role){const m=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:th,bevelEnabled:false,curveSegments:12}),mat);m.rotation.x=-Math.PI/2;m.position.y=z;m.castShadow=m.receiveShadow=true;info(m,name,'V3 備餐單槽55×45cm，槽深20cm；尺寸為設計配置，產品型號待選。');m.userData.islandSurface=role;g.add(m);return m;}
    const rim=roundRect(455,735,45,55,4.5);rim.holes.push(roundRect(455,735,40,50,3.5));flat(rim,95.02,.14,metal,'V3 單槽55×45薄邊','sink-rim');
    // Closed thin shell with tapered inner walls: the bowl remains hollow all the way down.
    const rings=[[41,51,4,94.99],[35,45,4,74.5],[34,44,3.5,75],[40,50,3.5,95.02]].map(([w,d,r,z])=>{const p=roundRect(455,735,w,d,r).getPoints(12);p.pop();return p.map(q=>new T.Vector3(q.x,z,-q.y));});
    const vertices=[];for(let a=0;a<4;a++)for(let i=0;i<rings[a].length;i++){const j=(i+1)%rings[a].length,b=(a+1)%4;for(const q of [rings[a][i],rings[a][j],rings[b][j],rings[a][i],rings[b][j],rings[b][i]])vertices.push(q.x,q.y,q.z);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();
    const bowl=new T.Mesh(geo,metal);info(bowl,'V3 備餐槽中空內膽','內槽50×40cm，深20cm；下收至44×34cm，檯面與槽壁分離，不用實心方塊代替水槽。');bowl.userData.islandSurface='sink-bowl';g.add(bowl);
    const floor=roundRect(455,735,34,44,3.5),drainHole=new T.Path();drainHole.absellipse(455-482.5,480-735,4.5,4.5,0,Math.PI*2,true);floor.holes.push(drainHole);flat(floor,74.5,.5,metal,'V3 槽底與真排水口','sink-floor');
    const drainRing=new T.Shape();drainRing.absellipse(455-482.5,480-735,5.1,5.1,0,Math.PI*2,false);const innerDrain=new T.Path();innerDrain.absellipse(455-482.5,480-735,4.1,4.1,0,Math.PI*2,true);drainRing.holes.push(innerDrain);flat(drainRing,75.03,.15,metal,'V3 排水濾口薄邊','sink-drain');
    function tube(points,r,mat,name){const curve=new T.CatmullRomCurve3(points.map(p=>pos(...p))),m=new T.Mesh(new T.TubeGeometry(curve,40,r,10,false),mat);info(m,name,'V3 獨立濕區管路與龍頭造型示意，均收在留膝背板西側。');m.userData.wetFixture=true;g.add(m);return m;}
    tube([[455,735,74.5],[455,735,51],[455,742,31],[455,751,32],[449,751,43],[432,751,43]],2,metal,'V3 水槽存水彎與排水');
    tube([[448,697,95],[448,697,116],[448,701,126],[448,715,126],[448,720,116]],1.3,M.steel,'V3 備餐水龍頭');
    tube([[470,697,95],[470,697,121],[470,699,126],[470,714,126],[470,719,122]],.85,M.black,'CLAR Smart 獨立飲水龍頭');
    box(468,694,4,3,97,6,M.screen,g,'CLAR 觸控溫度面板');
    for(const [x,name] of [[448,'冷熱水'],[470,'CLAR 飲水']]){box(x-2,695,4,4,94.99,.4,M.steel,g,name+'龍頭固定座');tube([[x,697,94.9],[x,697,62],[x,681,48]],.5,M.black,'V3 '+name+'供水管');}
    // West service doors are split so their sweeps fit the working aisle.
    for(const [y,d] of [[672.3,53.2],[725.8,52.1]])panel(425,y,1.8,d,8,83.7,'飲水濕區西向檢修門',true).userData.swingFront={name:'V3 飲水濕區檢修',face:'W',hinge:'min'};
    EQ.bay('V3 酒櫃開放艙',427,481.8,91.2,76.6,0,92,'西向開放，獨立式機型的安裝方式待原廠確認');
    EQ.bay('V3 掃地機維修艙',427,560.2,48.5,45.8,0,40,'向西平進平出，維修抽出基座');
    EQ.bay('V3 IH乾式散熱艙',427,607.8,87,62.4,77.8,14.2,'與下方收納隔開；西側真通風帶');
    EQ.bay('V3 飲水濕區',427,674,55.2,104.2,8,84,'55×45×深20cm單槽；北側飲水機、南側存水彎與西向檢修門；東側留膝');
    EQ.allowance('V3 酒櫃操作預留',360,485,65,73,0,90,'操作時勿同時打開主冰箱');
    EQ.allowance('V3 掃地機西向進出預留',365,560.2,60,45.8,0,35,'設計預留，實際回充定位依廠商測試');
    g.userData.serviceZones={wine:[481.8,558.4],robot:[560.2,606],ih:[607.8,670.2],wet:[674,778.2]};
    return g;
  },
  storage({T,M,pos,box,cyl,ball,cabinet,display,finishHeight,EQ,fittings}) {
    const wood=m=>{m.traverse(o=>{if(o.isMesh&&(o.material===M.black||o.material===M.blackglass||o.userData.swingFront))o.userData.openIslandWood=true;});return m;};
    const deep=EQ.group('V3 深收納櫃・155×60');
    // Keep tall luggage bays clear of fixed shelves through the luggage.
    for(const y of [760,837,913.2])EQ.cover(220,y,60,1.8,0,245,M.black,deep,'深櫃固定隔板');
    for(const z of [0,93,158,243.2])EQ.cover(220,760,60,155,z,1.8,M.black,deep,'深櫃層板');
    EQ.cover(220,760,1.8,155,0,245,M.black,deep,'深櫃靠牆背板');
    box(220,760,60,150,245,30,M.black,deep,'深櫃頂端順樑封板').userData.openIslandWood=true;
    for(const y of [762,839]){const d=EQ.cover(278.2,y,1.8,73.2,8,235,M.black,deep,'V3 行李與深收藏門');d.userData.swingFront={name:'V3 行李與深收藏',face:'E',hinge:'min'};d.userData.openIslandWood=true;}
    box(231,769,42,62,1.8,85,M.black,deep,'85cm 行李箱');box(233,846,40,62,1.8,75,M.grey,deep,'75cm 行李箱');
    const blank=box(220,915,60,40,0,245,M.black,fittings,'收藏櫃 L 形封閉轉角','結束原地洞；不計入可用展示寬。');blank.userData.openIslandWood=true;
    const showcase=display(280,915,165,40,245,'V3 收藏玻璃展示櫃','N');
    // Replace the fixed glass proxy with three framed, genuinely operable doors.
    const fixedGlass=showcase.children.find(m=>m.isMesh&&m.material===M.glass&&m.geometry.parameters?.height>200);
    const doorZ=fixedGlass.position.y-fixedGlass.geometry.parameters.height/2+.3,doorH=fixedGlass.geometry.parameters.height-.6;
    showcase.userData.glassOpening={z:doorZ-.3,h:doorH+.6};showcase.remove(fixedGlass);fixedGlass.geometry.dispose();
    for(const [x,w] of [[282.3,52.4],[337.3,52.4],[392.3,50.4]]){
      const leaf=box(x,914.8,w,.8,doorZ,doorH,M.glass,showcase,'V3 玻璃展示門');
      leaf.userData.swingFront={name:'V3 收藏玻璃展示',face:'N',hinge:'min'};
      for(const [xx,zz,ww,h] of [[x,doorZ,1.2,doorH],[x+w-1.2,doorZ,1.2,doorH],[x+1.2,doorZ,w-2.4,1.2],[x+1.2,doorZ+doorH-1.2,w-2.4,1.2]]){const frame=box(xx,914.7,ww,1,zz,h,M.steel,leaf);frame.position.sub(leaf.position);}
    }
    const daily=EQ.group('V3 玄關日常收納');
    const entry=wood(cabinet(660,805,55,110,0,90,'V3 玄關矮櫃','W').parent);
    // Join the low cabinet to the service cabinet; no walkable pocket behind it.
    const corner=box(660,915,30,40,0,90,M.black,fittings,'玄關南端可拆封閉轉角','30×40cm，與電箱下部同高銜接，不計入有效收納。');corner.userData.openIslandWood=true;
    box(668,817,37,18,90,1,M.steel,daily,'玄關鑰匙與隨身物品盤');
    box(677,856,22,15,90,21,M.darkcloth,daily,'玄關隨身包');
    for(const x of [681,693])box(x,861,1.5,2,111,7,M.black,daily);box(681,861,13.5,2,118,1.5,M.black,daily);
    for(const z of [1.8,39.8])for(const y of [823,851,879]){const shoe=ball(682,y,z+4,13,4,4,M.darkcloth,daily);shoe.userData.shelfTop=z;shoe.userData.name='V3 放在層板上的日常鞋';}
    // The coat rail is above the cabinet footprint, on its fixed south return.
    const side=box(660,913.2,30,1.8,90,105,M.black,daily,'玄關既有側板上延・帽鉤固定面');side.userData.openIslandWood=true;
    const path=new T.CurvePath(),top=finishHeight(680,846);
    path.add(new T.LineCurve3(pos(680,913.2,190),pos(680,856,190)));
    path.add(new T.QuadraticBezierCurve3(pos(680,856,190),pos(680,846,190),pos(680,846,200)));
    path.add(new T.LineCurve3(pos(680,846,200),pos(680,846,top)));
    const rail=new T.Mesh(new T.TubeGeometry(path,32,1.1,8,false),M.steel);rail.name='V3 側接頂掛衣桿';daily.add(rail);
    box(676,842,8,8,top-1,1,M.steel,daily,'V3 掛衣桿頂固定座');
    for(const z of [142,159,176])box(665,908,2,5,z,2,M.steel,daily,'V3 側面帽鉤');
    ball(666,905,157,7,3,7,M.cloth,daily);
    box(680,878,1,1,179,11,M.steel,daily,'V3 衣架掛頸');box(668,878,25,1,178,1,M.steel,daily,'V3 衣架');
    box(670,876,21,4,121,57,M.darkcloth,daily,'V3 短外套');
    daily.userData.storage={shoes:true,coatRail:true,hatSideHooks:3,keyTray:true,bagSurface:true,umbrellaRack:false};
    daily.userData.footprint={x:660,y:805,w:55,d:110,h:90};
    // Keep electrical access above the low return instead of burying a full-height door.
    const plinth=box(690,915,70,40,0,90,M.black,fittings,'電箱櫃下部固定收邊');plinth.userData.openIslandWood=true;
    wood(cabinet(690,915,70,40,92,183,'電箱上段獨立維修門','N').parent);
    return {deep,showcase,entry,daily};
  }
};
