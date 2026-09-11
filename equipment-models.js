'use strict';
// Dimensions are centimetres. Product envelopes are separate from design allowances.
// Procedural models describe appearance; they are not manufacturers' production CAD.
window.HOME_EQUIPMENT_BUILD = function (ctx) {
  const {T,M,pos,box,ball,cyl,info,fittings,ceiling,architecture}=ctx;
  const items=[],covers=[],allowances=[],bays=[],refinements={};let switchStation=null;
  const open=!!window.HOME_LAYOUT?.openIsland,openSpec=window.HOME_OPEN_ISLAND_SPEC,fixed=!!window.HOME_LAYOUT?.fixedTV;
  function explicitFinish(hex,roughness,metalness,id){const m=new T.MeshStandardMaterial({color:hex,roughness,metalness});m.color.convertSRGBToLinear();m.userData.finishId=id;return m;}
  const collectionFinish=explicitFinish('#b8b9b0',.78,.02,'collection-inner');
  const tvFinish=explicitFinish('#343b3a',.62,.35,'tv-graphite');
  function protectedFinish(mesh,id){mesh.userData.finishGroup=id;return mesh;}
  const graphite=new T.MeshStandardMaterial({color:'#30383b',metalness:.65,roughness:.45});
  const silver=new T.MeshStandardMaterial({color:'#a1a6a8',metalness:.65,roughness:.32});
  const units={
    tv:{name:'LG OLED83G6PTA · 83 吋 G6',w:184.7,d:2.8,h:105.7,kg:37.2},
    q6:{name:'KEF Q6 Meta',w:62.9,d:30.3,h:21,kg:14.1},
    q7:{name:'KEF Q7 Meta（含腳座）',w:31.7,d:31.5,h:100.1,kg:18.4},
    sub:{name:'SVS SB-2000 Pro（含網罩）',w:36,d:39.5,h:37.2},
    avr:{name:'Denon AVR-X3800H',w:43.4,d:38.9,h:16.7},
    ps5:{name:'PS5 Pro · 無光碟機／不含另購底座',w:38.8,d:21.6,h:8.9},
    switch2:{name:'Nintendo Switch 2 · 含 Joy-Con 2',w:27.2,d:3.07,h:11.6},
    switch2dock:{name:'Nintendo Switch 2 底座',w:20.1,d:5.12,h:11.5},
    wine:{name:'Liebherr WKb1712 · 獨立式單溫酒櫃',w:65.7,d:66.3,h:85},
    ih:{name:'Bosch PIB375FB1E',w:30.6,d:52.7,h:5.1},
    clar:{name:'CLAR WS2-C1 瞬冰瞬熱主機',w:11.5,d:38,h:32.5},
    robot:{name:'Roborock Saros 20 上下水基座',w:38.1,d:47.5,h:30},
    fridge:{name:'LG GR-QPLC82SS · 銀色核對款，採購待確認',w:91.2,d:85,h:179},
    washer:{name:'LG WashTower WD-S1916B',w:70,d:77,h:189},
    nx:{name:'TOTO NX2 CES903KVG',w:46.8,d:80,h:56.5},
    ls:{name:'TOTO LS CES87120GTW',w:41.1,d:72.5,h:49.7},
    projector:{name:'JMGO N1S Infinity 4K',w:24.3,d:21,h:23.8},
    dishwasher:{name:'Bosch SMV8ZCX00X · 全嵌式',w:59.8,d:55,h:81.5},
    oven:{name:'Bosch HSG7361B1 蒸烤箱',w:59.4,d:54.8,h:59.5},
    dishdryer:{name:'Rinnai RKD-186S(B) 懸掛烘碗機',w:79.8,d:32,h:40},
    pc:{name:'ASUS ROG Helios · 清單機殼外徑',w:25,d:59.1,h:56.5}
  };
  const angles={N:0,E:-Math.PI/2,S:Math.PI,W:Math.PI/2};
  function vanity(){
    // Original plan: west-window desk 190 x 75. Keep 10 cm behind it for the curtain.
    const g=group('主臥靠窗化妝台'),spec={x:-65,y:90,w:75,d:190,h:75,curtainGap:10,bedClear:90};
    g.userData.masterVanity=true;g.userData.dimensions=spec;g.userData.focusView={front:{x:1,z:0},distance:240,polar:1.12,azimuthOffset:.15};
    function piece(x,y,w,d,z,h,mat,name,wood=false){
      const m=box(x,y,w,d,z,h,mat,g,name,'主臥床左側靠窗；原圖桌面190×75cm。檯高75cm、鏡子與椅凳為補建提案。');
      m.userData.masterVanity=true;if(wood)m.userData.vanityWood=true;return m;
    }
    piece(-65,90,75,190,72,3,M.black,'主臥化妝台・190×75cm檯面',true);
    // Two supported drawer pedestals leave a 118 cm-wide central knee opening.
    for(const y of [90,244]){
      piece(-60,y+4,65,28,0,6,M.steel,'化妝台・內縮落地踢腳');
      piece(-65,y,2,36,6,66,M.black,'化妝台・抽屜櫃背板',true);
      for(const sy of [y,y+34])piece(-63,sy,71,2,6,66,M.black,'化妝台・抽屜櫃側板',true);
      piece(-63,y+2,71,32,6,2,M.black,'化妝台・抽屜櫃底板',true);
      for(const z of [8,29.3,50.6]){
        piece(8,y+.3,2,35.4,z,21,M.black,'化妝台・抽屜面板',true);
        piece(8.1,y+9,1,18,z+18.8,1,M.steel,'化妝台・內嵌抽屜拉手');
      }
    }
    piece(-64,126,3,118,62,10,M.black,'化妝台・桌後連接橫檔',true);
    // A supported tabletop mirror faces the seat, without a tall panel across the window.
    piece(-57,171,18,28,75,1,M.steel,'化妝鏡・桌面底座');
    piece(-52,183.5,2,3,76,12,M.steel,'化妝鏡・支架');
    piece(-53,167,2,36,86,46,M.steel,'化妝鏡・霧黑鏡框');
    piece(-50.95,168.2,.15,33.6,87.2,43.6,M.mirror,'化妝鏡・鏡面');
    const stool=group('化妝椅凳・收於桌下',g);stool.userData.masterVanity=true;
    function stoolPart(x,y,w,d,z,h,mat,name){const m=piece(x,y,w,d,z,h,mat,name);stool.add(m);return m;}
    for(const x of [-41,-9])for(const y of [172,204])stoolPart(x,y,4,4,0,41,M.steel,'化妝椅凳・落地椅腳');
    stoolPart(-43,170,40,40,40,2,M.steel,'化妝椅凳・座框');
    stoolPart(-43,170,40,40,42,3,M.linen,'化妝椅凳・坐墊');
    refinements.masterVanity={group:g,stool,...spec,kneeWidth:118,kneeHeight:72,stoolHeight:45,source:'業主客變圖：書桌190×75；改作化妝台'};
    return g;
  }
  function group(name,parent=fittings){const g=new T.Group();g.name=name;parent.add(g);return g;}
  function part(g,x,z,w,d,y,h,mat=M.black){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x+w/2,y+h/2,z+d/2);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
  function round(g,x,y,z,r,depth,mat=M.rubber){const m=new T.Mesh(new T.CylinderGeometry(r,r,depth,32),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);g.add(m);return m;}
  function switchFace(screen){
    const c=document.createElement('canvas');c.width=768;c.height=432;const p=c.getContext('2d');
    p.fillStyle=screen?'#102838':'#30383b';p.fillRect(0,0,768,432);
    if(screen){const gradient=p.createLinearGradient(0,432,768,0);gradient.addColorStop(0,'#14627c');gradient.addColorStop(.6,'#488a93');gradient.addColorStop(1,'#e29b70');p.fillStyle=gradient;p.fillRect(0,0,768,432);for(let i=0;i<6;i++){p.fillStyle=i%2?'#b9dac7':'#276577';p.beginPath();p.arc(610-i*67,280+i*16,94+i*11,0,Math.PI*2);p.fill();}}
    p.fillStyle='#f4f6f2';p.textAlign='center';p.font='bold 28px sans-serif';p.fillText('NINTENDO',384,screen?160:150);p.font='bold 62px sans-serif';p.fillText('SWITCH 2',384,screen?230:245);
    const map=new T.CanvasTexture(c);map.encoding=T.sRGBEncoding;return new T.MeshBasicMaterial({map,toneMapped:false});
  }
  function tag(g,key,note){const s=units[key];g.userData.equipment={key,...s,note:note||'',envelope:'product',revision:'20260910'};info(g,s.name,`${s.w} 寬 × ${s.d} 深 × ${s.h} 高 cm。${note||'外徑按核對規格；造型為程序模型，接管及安裝淨空另計。'}`,'家具清單＋原廠規格；2026-09-10 核對');g.userData.equipment={key,...s,note:note||'',envelope:'product',revision:'20260910'};g.traverse(o=>{if(o.isMesh){o.userData.name=s.name;o.userData.desc=g.userData.desc;o.userData.source=g.userData.source;ctx.pickables.push(o);}});items.push(g);return g;}
  function product(key,x,y,z=0,face='N',parent=fittings,note=''){
    const s=units[key],{w,d,h}=s,g=group(s.name,parent);g.position.copy(pos(x,y,z));g.rotation.y=angles[face];
    const front=-d/2;
    if(key==='nx'||key==='ls'){
      // Scale a tankless, rounded shell to the published outer envelope.
      const a=new T.Mesh(new T.SphereGeometry(1,40,24),M.ceramic);a.scale.set(w/2,h*.42,d/2);a.position.y=h*.42;g.add(a);
      part(g,-w*.33,-d*.35,w*.66,d*.70,0,h*.35,M.ceramic);
      const lid=new T.Mesh(new T.SphereGeometry(1,40,20),M.ceramic);lid.scale.set(w*.45,h*.065,d*.44);lid.position.set(0,h*.87,0);g.add(lid);
      part(g,-w*.40,d*.25,w*.8,d*.20,h*.72,h*.20,M.ceramic);
      const bounds=new T.Box3().setFromObject(g),size=bounds.getSize(new T.Vector3());
      // Normalize local geometries, not installation direction.
      const localBox=new T.Box3();for(const o of g.children){o.updateMatrix();o.geometry.computeBoundingBox();localBox.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrix));}
      const dims=localBox.getSize(new T.Vector3()),c=localBox.getCenter(new T.Vector3());
      for(const o of g.children){o.position.x=(o.position.x-c.x)*w/dims.x;o.position.z=(o.position.z-c.z)*d/dims.z;o.position.y=(o.position.y-localBox.min.y)*h/dims.y;o.scale.multiply(new T.Vector3(w/dims.x,h/dims.y,d/dims.z));}
    }else if(key==='tv'){
      part(g,-w/2,front,w,d,0,h,graphite);part(g,-w/2+.35,front,w-.7,.03,.35,h-.7,M.screen);
    }else if(key==='q7'||key==='q6'||key==='sub'){
      part(g,-w/2,front+.5,w,d-.5,0,h,M.black);part(g,-w/2+.3,front,w-.6,.5,.3,h-.6,M.rubber);
      if(key==='q6'){for(const x of [-21,0,21])round(g,x,h/2,front+.15,x===0?7.2:7.6,.25,graphite);}
      else if(key==='q7'){for(const yy of [23,44,65,84])round(g,0,yy,front+.15,yy===84?7.1:8,.25,graphite);part(g,-w/2,-d/2,w,d,0,2,graphite);}
      else round(g,0,h/2,front+.15,15,.25,graphite);
    }else if(key==='wine'){
      part(g,-w/2,front+3,w,d-3,0,h,graphite);
      part(g,-w/2,front,w,3,0,6,M.black);part(g,-w/2,front,w,3,h-6,6,M.black);
      for(const xx of [-w/2,w/2-3])part(g,xx,front,3,3,6,h-12,M.black);
      part(g,-w/2+3,front+1,w-6,1,6,h-12,M.glass);
      // Open interior with individual racks and bottle silhouettes.
      const body=g.children[0];body.visible=false; // replace solid proxy by side/rear casing
      for(const xx of [-w/2,w/2-1])part(g,xx,front+3,1,d-3,0,h,graphite);
      part(g,-w/2,d/2-1,w,1,0,h,graphite);part(g,-w/2,front+3,w,d-3,0,1,graphite);part(g,-w/2,front+3,w,d-3,h-1,1,graphite);
      for(const yy of [13,28,43,58,73]){part(g,-w/2+3,front+4,w-6,d-8,yy,1,M.steel);for(let xx=-24;xx<=24;xx+=12){const b=new T.Mesh(new T.CylinderGeometry(3,3,27,12),M.blackglass);b.rotation.x=Math.PI/2;b.position.set(xx,yy+4,front+19);g.add(b);}}
      part(g,w/2-5,front+.2,1.2,1.2,30,27,silver);
    }else if(key==='ih'){
      // The 27 x 49.5 cutout receives the chassis; the larger glass overlaps it.
      const body=part(g,-13.35,-24.6,26.7,49.2,0,h-.4,graphite);body.userData.islandSurface='ih-chassis';
      const glass=part(g,-w/2,front,w,d,h-.4,.4,M.screen);glass.userData.islandSurface='ih-glass';
      for(const zz of [-12,11]){const ring=new T.Mesh(new T.RingGeometry(8.42,8.5,64),silver);ring.rotation.x=-Math.PI/2;ring.position.set(0,h+.01,zz);g.add(ring);}
    }else if(key==='washer'){
      part(g,-w/2,front+2,w,d-2,0,h,silver);part(g,-w/2,front,w,2,0,h,graphite);
      for(const yy of [45,141]){round(g,0,yy,front+1,23,1.8,M.blackglass);round(g,0,yy,front+.1,18,.1,graphite);}
      part(g,-w/2+3,front+.02,w-6,.3,91,9,M.screen);
    }else if(key==='fridge'){
      part(g,-w/2,front+3,w,d-3,0,h,silver);
      for(const xx of [-w/2,.35])part(g,xx,front,w/2-.35,3,0,h,silver);
      part(g,3,front+.05,w/2-7,.2,78,91,M.blackglass);
      part(g,-w/2+9,front+.03,24,.3,93,39,M.rubber);part(g,-w/2+10,front,22,.1,127,3,M.screen);
      for(const xx of [-2,1])part(g,xx,front+.1,1,1,58,70,M.rubber);
    }else if(key==='avr'){
      part(g,-w/2,front+.5,w,d-.5,0,h,graphite);part(g,-w/2,front,w,.5,0,h,M.black);
      part(g,-11,front+.02,22,.1,7,4,M.screen);for(const xx of [-16,16])round(g,xx,9,front+.05,2.6,.08,silver);
      for(let xx=-18;xx<=18;xx+=2)part(g,xx,-d/2+4,.6,d-8,h-.12,.12,M.rubber);
    }else if(key==='ps5'){
      part(g,-w/2,front,w,d,0,h,M.white);part(g,-w/2,front+.2,w,d-.4,h*.38,h*.26,M.black);for(const xx of [-1.8,0,1.8])part(g,xx,front,.7,d,h-.7,.7,M.rubber);
    }else if(key==='switch2'){
      part(g,-w/2,-.695,w,1.39,0,h,graphite);const screen=new T.Mesh(new T.PlaneGeometry(19.4,10.8),switchFace(true));screen.rotation.y=Math.PI;screen.position.set(0,h/2,-.711);g.add(screen);
      for(const [xx,yy,color] of [[11.7,8.2,'#81bfc9'],[-11.7,3.5,'#d88b7a']]){round(g,xx,yy,front+.1,.72,.2,M.rubber);part(g,xx-.65,d/2-.45,1.3,.45,h-1.3,1.3,graphite);part(g,xx<0?-10.2:9.8,-.72,.4,.05,0,h,new T.MeshStandardMaterial({color}));}
      for(const [xx,yy] of [[-11.7,8.6],[11.7,3.5]])for(const [dx,dy] of [[-.6,0],[.6,0],[0,-.6],[0,.6]])round(g,xx+dx,yy+dy,-.82,.24,.15,M.rubber);
    }else if(key==='switch2dock'){
      part(g,-w/2,front,w,d,0,.2,M.rubber);part(g,-w/2,front,w,1.25,.2,h-.2,graphite);part(g,-w/2,d/2-1.25,w,1.25,.2,h-.2,graphite);part(g,-w/2,front,w,d,.2,2,graphite);
      const logo=new T.Mesh(new T.PlaneGeometry(8,4.5),switchFace(false));logo.rotation.y=Math.PI;logo.position.set(0,6,front-.002);g.add(logo);
    }else if(key==='robot'){
      part(g,-w/2,front+d*.38,w,d*.62,0,h,M.white);part(g,-w/2,front,w,d,0,2,graphite);part(g,-w/2,front,w,2,18,h-18,M.black);
      const bot=new T.Mesh(new T.CylinderGeometry(17.2,17.2,8.5,40),M.white);bot.position.set(0,6,front+18);g.add(bot);
    }else if(key==='projector'){
      part(g,-w/2,front,w,d,0,2,graphite);for(const xx of [-w/2,w/2-1.7])part(g,xx,front+3,1.7,d-6,2,h-2,graphite);
      part(g,-w/2+2,front+.4,w-4,d-1,5,h-5,silver);round(g,-3,15,front+.2,5,.4,M.screen);
    }else if(key==='oven'){
      part(g,-w/2+1.8,front+3,w-3.6,d-3,0,h,silver);part(g,-w/2,front,w,3,0,h,M.blackglass);part(g,-w/2+5,front+.02,w-10,.1,6,37,M.screen);part(g,-3.5,front+.02,7,.1,47,7,M.screen);part(g,-24,front+.1,48,1,42,1.2,silver);
    }else if(key==='dishdryer'){
      part(g,-w/2,front+.5,w,d-.5,0,h,graphite);part(g,-w/2,front,w,.5,0,h,M.blackglass);part(g,-w/2+5,front+.02,w-10,.1,5,1.5,silver);
    }else if(key==='dishwasher'){
      part(g,-w/2,front+1.8,w,d-1.8,0,h,silver);part(g,-w/2,front,w,1.8,0,h,graphite);part(g,-w/2+2,front+2,w-4,2,h-1,1,M.screen);
    }else if(key==='pc'){
      part(g,-w/2,front,w,d,0,h,graphite);part(g,-w/2+.1,front+2,.2,d-4,4,h-8,M.glass);for(const yy of [14,29,44])round(g,0,yy,front+.1,6,.2,M.rubber);
    }else{part(g,-w/2,front,w,d,0,h,graphite);part(g,-w/2+.5,front,w-1,.1,h-8,5,M.screen);}
    const tagged=tag(g,key,note);
    if(key==='clar'){
      // Raised wet-service base, separate from the appliance's measured envelope.
      const stand=group('飲水機防潮落地台',parent);stand.position.copy(g.position);stand.rotation.copy(g.rotation);
      part(stand,-units.clar.w/2,-units.clar.d/2,units.clar.w,units.clar.d,-z,z,M.steel);
    }
    if(key==='ps5'||key==='q6'){
      const padHeight=key==='q6'&&z>40?1:2,pads=group('影音設備承托墊',parent);pads.position.copy(g.position);pads.rotation.copy(g.rotation);
      for(const px of [-w/2+4,w/2-7])for(const pz of [-d/2+4,d/2-7])part(pads,px,pz,3,3,-padHeight,padHeight,M.rubber);
    }
    return tagged;
  }
  function cover(x,y,w,d,z,h,mat=M.black,parent=fittings,name='可拆設備側板') {const m=box(x,y,w,d,z,h,mat.clone(),parent,name);covers.push(m);return m;}
  function allowance(name,x,y,w,d,z,h,note){const m=box(x,y,w,d,z,h,new T.MeshBasicMaterial({color:'#e3bb72',wireframe:true,transparent:true,opacity:.7,depthWrite:false}),fittings);m.name=name;m.userData.allowance={note,notProduct:true};m.visible=false;allowances.push(m);return m;}
  function bay(name,x,y,w,d,z,h,note){bays.push({name,x,y,w,d,z,h,note});return allowance(name,x,y,w,d,z,h,note);}
  function vent(x,y,w,d,z,h,parent=fittings){for(let i=0;i<8;i++)box(x+i*w/8,y,w/16,d,z,h,graphite,parent,'可拆通風格柵');}
  // The ordered outer edge keeps the skin inside the existing countertop.
  // Solid central panels conceal device backs; narrow top/bottom slots remain
  // real openings. These slots are a design proposal, not a rated ventilation area.
  function islandOuterSkin(a,b,parent){
    const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),th=1.6;
    const x=(a[0]+b[0])/2+dy/len*th/2,y=(a[1]+b[1])/2-dx/len*th/2;
    for(const [z,h] of [[2,1],[4,1],[6,80],[87,1],[90,1]]){
      const p=cover(x-th/2,y-len/2,th,len+.02,z,h,M.blackglass,parent,h===80?'中島外側固定飾板':'中島外側通風格柵');p.rotation.y=Math.atan2(dx,dy);p.userData.islandExterior=true;
    }
  }
  function appliances(curved,shape,contour){
    const g=group(curved?'曲線設備中島':'直線設備中島');g.userData.footprint=curved?{x:404.8,y:498.1,w:260,d:160.2,h:95}:{x:434,y:464,w:81,d:189,h:95,kneeDepth:28,kneeWidth:53,kneeSide:'E'};
    let sinkX,sinkY;
    if(curved){sinkX=625;sinkY=561;}else{sinkX=460;sinkY=629;}
    g.userData.island={opening:'W',sink:{x:sinkX,y:sinkY,r:11},knee:curved?null:{x:487,y:596,w:28,d:53}};
    // Real countertop cuts. Service machinery is not hidden in a solid island mass.
    const top=shape?shape.clone():new T.Shape();if(!shape){top.moveTo(434-482.5,-(464-480));top.lineTo(515-482.5,-(464-480));top.lineTo(515-482.5,-(653-480));top.lineTo(434-482.5,-(653-480));top.closePath();}
    const hole=new T.Path();hole.absellipse(sinkX-482.5,-(sinkY-480),11,11,0,Math.PI*2,true);top.holes.push(hole);
    const ihCut=new T.Path();const cut=curved?{x:480.8,y:599.5,w:27,d:49.5}:{x:448.3,y:547.8,w:49.5,d:27};
    ihCut.moveTo(cut.x-482.5,-(cut.y-480));ihCut.lineTo(cut.x-482.5,-(cut.y+cut.d-480));ihCut.lineTo(cut.x+cut.w-482.5,-(cut.y+cut.d-480));ihCut.lineTo(cut.x+cut.w-482.5,-(cut.y-480));ihCut.closePath();top.holes.push(ihCut);
    const stone=new T.Mesh(new T.ExtrudeGeometry(top,{depth:3,bevelEnabled:false,curveSegments:32}),M.grey);stone.rotation.x=-Math.PI/2;stone.position.y=92;g.add(stone);info(stone,curved?'260×160.2 曲線中島 · 高95':'81×189 直線中島 · 高95','檯面加高5cm，酒櫃落地開放艙、IH乾區、飲水濕區、掃地機獨立維修艙。機器外徑已放入，安裝散熱與水電待廠商定案。');
    if(curved){
      // Close the entire non-operating outer curve, not only its northern tip.
      for(let i=0;i<contour.south.length-1;i++)islandOuterSkin(contour.south[i],contour.south[i+1],g);
      const end=cover(594.9,498.1,69.9,1,2,90,M.blackglass,g,'中島接展示櫃端部封板');end.userData.islandExterior=true;
      // The west end is open. Stagger the other bays along the inner curve so
      // their west-facing paths do not run through the wine cabinet.
      for(const yy of [588.1,656.5])cover(404.8,yy,71.2,1.8,0,92,M.black,g);
      for(const xx of [476,532])cover(xx,590,1.8,66,0,92,M.black,g);
      product('wine',439.75,623.05,0,'W',g,'西側開口朝主冰箱，落地開放艙；頂部約7cm。獨立式酒櫃，台灣版散熱間距與60Hz仍待供貨商核定；勿與冰箱同時開門。');
      product('robot',622.5,520,0,'W',g,'置於中島北端檯面下，從內側朝西／主冰箱方向進出；與酒櫃錯開，不經過酒櫃艙。上下水基座版別與取換方式待確認。');
      product('clar',614,561,8,'W',g,'曲線內側獨立濕區，西向檢修门朝主冰箱；電壓、濾芯與接管另確認。');
      product('ih',494.3,624.25,90.3,'N',g,'3.7kW；玻璃面高95.4cm，下方獨立乾式散熱層，與酒櫃及北端掃地機分艙。');
      cover(480,590,50,66,76,2,M.steel,g,'IH 獨立散熱層檢修板');
      for(const yy of [499,540])cover(596.5,yy,53.5,1.6,0,92,M.black,g,'掃地機分艙側板');
      cover(650,500.6,1.6,39.4,0,92,M.black,g,'掃地機背板');
      cover(596.5,500.6,1.6,39.4,40,52,M.black,g,'掃地機入口上方櫃面');
      for(const yy of [549.5,574])cover(593,yy,49,1.6,0,92,M.black,g,'飲水濕區分艙側板');
      cover(640.5,551.1,1.5,22.9,0,92,M.black,g,'飲水濕區背板');
      bay('曲線酒櫃開放艙',404.8,589.9,71.2,66.6,0,92,'西向；僅幾何容納，不等於原廠核准嵌入');
      bay('曲線掃地機維修艙',596.5,500.6,53.5,39.4,0,76,'中島下方，西向平進平出；維修先向西抽出');
      bay('曲線飲水維修艙',594,551.1,46.5,22.9,5,65,'西向檢修，濕區與掃地機隔開');
      allowance('曲線酒櫃正面操作範圍',339.8,589.9,65,66.6,0,90,'改佔西側操作區；勿與冰箱同時開門，南側94.7cm名義走道保留');
      allowance('曲線掃地機西向進出預留',536.5,500.6,60,39.4,0,35,'主機沿內側朝冰箱進出；60cm是設計預留，非原廠安裝標準');
    }else{
      for(const yy of [464,539,590,651.2])cover(434,yy,yy>=590?52:81,1.8,0,92,M.black,g);
      islandOuterSkin([515,590],[515,464],g);
      const kneeBack=cover(484.2,592,1.8,59,0,92,M.blackglass,g,'飲水艙東背板／留膝界面');kneeBack.userData.islandExterior=true;
      product('wine',469,502,0,'W',g,'西向開口朝主冰箱，北端完整深設備艙，落地與頂部7cm開放通風；勿與冰箱同時開門，安裝仍待供貨商。');
      product('robot',458.75,563,0,'W',g,'中島下方獨立艙，朝西／主冰箱平進平出；上方與IH分隔，維修先向西抽出。');
      product('clar',456,602.75,8,'W',g,'南端濕區西向檢修；局部28cm深×53cm寬留膝改在東側。');
      product('ih',473,561.3,90.3,'W',g,'玻璃面高95.4cm，操作面朝冰箱，位於掃地機上方獨立通風層，不放在酒櫃頂。');
      cover(439,541,73,47,76,2,M.steel,g,'IH 與掃地機分隔檢修板');
      bay('直線酒櫃開放艙',435.8,465.8,79.2,73.2,0,92,'取消北端留膝，酒櫃設備深66.3');
      bay('直線掃地機維修艙',434,541,81,49,0,76,'中島下方西向開口，維修先向西抽出');
      bay('直線飲水維修艙',435,591.8,49.2,59.4,5,65,'西向檢修；東側留膝');
      allowance('直線酒櫃操作範圍',369,466,65,73,0,90,'西側開口朝冰箱，開門時勿同時操作冰箱或穿行');
      allowance('直線掃地機西向進出預留',374,541,60,49,0,35,'主機朝冰箱進出；60cm是設計預留，非原廠安裝標準');
    }
    receivingSink(g,sinkX,sinkY);
    const service=curved?cover(593,551.5,1,22,5,65,M.black,g,'飲水機西向檢修門'):cover(433.5,594,1,55,5,65,M.black,g,'飲水機西向檢修門');service.userData.swingFront={name:'飲水濕區檢修・朝主冰箱',face:'W',hinge:'min'};
    return g;
  }
  function receivingSink(g,sinkX,sinkY){
    // Recessed receiving sink, separate cold/hot control head and service valves.
    const basinMetal=explicitFinish('#566164',.42,.68,'sink-brushed-steel');basinMetal.side=T.DoubleSide;
    const bowlProfile=[[1.4,81.4],[7.6,81.4],[8,81.8],[10.8,93.8],[11,94.95],[11.6,95.08],[11.8,95.06]].map(([r,h])=>new T.Vector2(r,h));
    const bowl=new T.Mesh(new T.LatheGeometry(bowlProfile.slice(0,5),64),basinMetal);bowl.position.copy(pos(sinkX,sinkY,0));g.add(bowl);
    info(bowl,'飲水接水槽・中空不鏽鋼內膽','22cm開孔，槽底高81.4cm；薄唇銜接95cm石材檯面。');
    bowl.userData.islandSurface='sink-bowl';
    const rimMaterial=explicitFinish('#9ba5a7',.34,.72,'sink-rim');rimMaterial.side=T.DoubleSide;
    const rim=new T.Mesh(new T.LatheGeometry(bowlProfile.slice(4),64),rimMaterial);rim.position.copy(bowl.position);rim.userData.islandSurface='sink-rim';g.add(rim);
    const drain=cyl(sinkX,sinkY,81.1,1.4,.2,M.rubber,g);drain.userData.islandSurface='sink-drain';
    cyl(sinkX,sinkY,58,1.4,23.1,basinMetal,g);
    cyl(sinkX+15,sinkY-9,95,1.4,27,M.black,g);box(sinkX+1,sinkY-10,15,2,120,2,M.black,g,'CLAR Smart 黑色飲水龍頭 · 造型示意');box(sinkX+14,sinkY-12,3,2,97,7,M.screen,g);
    for(const [dx,c] of [[-2,'#577bab'],[2,'#9e665d']]){box(sinkX+dx,sinkY,5,4,50,5,new T.MeshStandardMaterial({color:c}),g,'独立止水閥・待對現場水點');}
  }
  function consoleBase(rotating=false){
    const ai=allowances.length,bi=bays.length,dy=open&&rotating?openSpec.audio.tvPivot.southShift:0;
    const g=group(rotating?'旋轉電視固定底櫃':'固定電視影音開放櫃');const x=rotating?619.5:820,y=rotating?460:900,w=rotating?55:195,d=rotating?200:55,h=rotating?50:45;
    g.userData.footprint={x,y,w,d,h};
    cover(x,y,w,d,h-2,2,M.grey,g,'影音櫃可拆上板');box(x,y,w,d,5,2,M.black,g,'通風影音層板');
    for(const xx of [x+3,x+w-8])for(const yy of [y+3,y+d-8])box(xx,yy,5,5,0,5,M.steel,g,'影音櫃落地支腳');
    if(rotating){for(const yy of open?[460,524.2,593,658.2]:[460,525,590,658.2])cover(x,yy,w,1.8,7,41,M.black,g);}
    else for(const xx of [820,879,954,1013.2])cover(xx,y,1.8,d,7,36,M.black,g);
    // Open front and back; no closed generic 38cm shelf across electronic equipment.
    product('avr',rotating?647:985,rotating?493:927,7,rotating?'E':'N',g,'開放前後艙；55cm外深、機身38.9cm，接線及散熱由影音商核准。');
    product('ps5',rotating?655:849,rotating?620:918,9,rotating?'E':'N',g,'橫放、獨立於擴大機；另購光碟機與底座需重核外徑。');
    // A separate pull-out shelf keeps the confirmed second-generation hardware
    // above the PS5. Console and dock are shown stored separately, not a guessed
    // docked assembly height. Pull the tray out to insert/remove the console.
    const games=group('Switch 2 主機與二代底座',g);switchStation=games;games.userData.focusView={distance:115,polar:1.43,azimuthOffset:0,fov:40,front:{x:rotating?1:0,z:rotating?0:-1}};
    const tray=cover(rotating?623:823,rotating?(open?596:594):900.1,rotating?51.5:53,rotating?(open?60.5:62):37,25,2,M.steel,games,'Switch 2 抽拉設備層板');
    info(tray,'Switch 2 獨立抽拉層板','主機與底座分放示意；使用底座前抽出層板，留上方插拔與後方走線。滑軌與插入底座後總高待實品核對。');
    product('switch2',rotating?671.8:837,rotating?610:903,27,rotating?'E':'N',games,'業主確認二代；含Joy-Con 2，厚度按搖桿／扳機最大3.07cm。位於PS5上方層板前緣；與底座分放，螢幕為辨識示意。上方「查看 Switch 2」可直接特寫。');
    product('switch2dock',rotating?671.8:864,rotating?644:903,27,rotating?'E':'N',games,'二代底座20.1×5.12×11.5cm，位於PS5上方層板前緣、主機旁；需保留HDMI／電源／網路接頭與插拔空間。');
    allowance('Switch 2 層板抽出操作預留',rotating?674.5:823,rotating?594:866,rotating?48:53,rotating?62:37,25,35,'圖中主機與底座分放；這是層板操作空間，不是插入底座後實測高度');
    if(rotating)product('q6',open?659.35:655,560,open?7:51,'E',g,open?'中置置於固定底櫃中央開放艙，前障板與東側櫃面齊平；不隨電視旋轉。':'固定朝沙發；不隨電視轉動，故不增加旋轉負載。');
    else product('q6',917.5,920,9,'N',g,'獨立75cm中置艙，箱體前方不加木門。');
    bay('影音櫃外形',x,y,w,d,0,h,'外深55cm；實際線材彎曲半徑與熱負載尚待驗收');
    if(dy){g.position.z+=dy;g.userData.footprint.y+=dy;for(const a of allowances.slice(ai))a.position.z+=dy;for(const b of bays.slice(bi))b.y+=dy;}
    return g;
  }
  function audio(rotating=false){
    if(open&&(rotating||fixed)){
      for(const q of openSpec.audio.floorSpeakers.filter(q=>['L','R','SW1','SW2'].includes(q.id))){const m=product(q.id.startsWith('SW')?'sub':'q7',q.cx,q.cy,0,q.face);m.userData.channel=q.id;}
    }else if(rotating){
      // Keep the complete floor-standing envelopes inside the living zone,
      // beyond the TV sweep, with neither end protruding into the cross aisles.
      for(const y of [481,639])product('q7',770,y,0,'E',fittings,'移入客廳範圍，避開旋轉包絡及南北通道；原31.7×31.5×100.1cm外徑不縮小。');
      product('sub',799,800,0,'N');product('sub',1040,814,0,'N');
    }
    else{product('q7',790.85,930.75,0,'N');product('q7',1045.85,930.75,0,'N');product('sub',788,837,0,'N');product('sub',1057,820,0,'N');}
    const sky=open?openSpec.audio.overhead.centers:rotating?[[835,490],[835,665],[972,490],[972,665]]:[[835,560],[1000,560],[835,740],[1000,740]];
    sky.forEach(([x,y],i)=>{const g=group('KEF Ci160QR 高度聲道 '+(i+1),ceiling);info(cyl(x,y,272.8,11.73,.6,M.white,g),g.name,'外徑23.46cm，總深9.8cm。四顆高度聲道；定位待音響調校。');cyl(x,y,273.4,9.8,9.2,M.black,g);});
    // Keep the selected Ci160QR pair, with ear-height wall-baffle design reservations.
    // These housings are not asserted to be manufacturer-approved acoustic enclosures.
    const surrounds=open?['SR','SL'].map(id=>{const s=openSpec.audio.floorSpeakers.find(s=>s.id===id);return [s.cx,s.cy];}):rotating?[[1066,432],[1066,754]]:[[773,438],[1066,438]];
    surrounds.forEach(([x,y],i)=>{
      const g=group('耳平環繞 Ci160QR '+(i+1));g.position.copy(pos(x,y,0));g.rotation.y=angles[rotating?'W':'S'];
      if(open)g.userData.channel=i?'SL':'SR';
      g.userData.surround={centerHeight:110,installation:'獨立落地支架＋定製背腔提案，非Ci160QR原廠腳架'};
      const stand=group('環繞獨立落地支架',g);
      part(stand,-14,-12,28,24,0,1.5,graphite);part(stand,-1.5,-1.5,3,3,1.5,92.5,graphite);part(stand,-14,-6,28,12,94,1,graphite);
      const housing=part(g,-14,-6,28,12,95,30,M.black.clone());info(housing,'Ci160QR 定製背腔示意','由落地細鋼架支撐，走線穿立柱至地面；喇叭中心110cm，朝沙發。Ci160QR是嵌入式，背腔、固定與抗傾倒須由影音商設計，不能固定在玻璃上。');covers.push(housing);
      const cone=round(g,0,110,-6.3,11.73,.6,M.rubber);info(cone,'Ci160QR 耳平環繞預排','兩顆耳平環繞＋四顆天花高度；現在補上獨立落地支架。這不是重低音，也非已選定的原廠腳架套裝。');
      allowance('環繞固定與背腔待核',x-14,y-12,28,24,0,125,'落地腳架、定製背腔與抗傾倒待影音商；不以玻璃承重');
    });
  }
  function rotatingTV(){
    const base=consoleBase(true),pivot=group('83吋電視與背板旋轉組');pivot.position.copy(pos(647,560,0));
    function rbox(x,y,w,d,z,h,mat,name){const m=box(x,y,w,d,z,h,mat,pivot,name);m.position.sub(pivot.position);return m;}
    // 1.5 mm aluminium skin, non-structural. Segmented panels leave actual apertures.
    // The frame and independent support, not this cosmetic skin, carry the display.
    // Two aligned, recessed horizontal vents. No opaque plate behind the slots.
    for(const [yy,dd,zz,hh] of [[463,194,77,7],[463,10,84,6],[647,10,84,6],[463,194,90.2,85.6],[463,10,176,8],[647,10,176,8],[463,194,184,9]]){
      const skin=protectedFinish(rbox(640.85,yy,.15,dd,zz,hh,tvFinish,'可拆石墨灰鋁背殼・整片中央檢修面'),'tv-graphite');covers.push(skin);
    }
    for(const yy of [463,655.8])rbox(641,yy,6,1.2,77,116,tvFinish,'金屬周框');
    for(const zz of [77,191.8])rbox(641,463,6,194,zz,1.2,tvFinish,'金屬周框');
    for(const [z,h,count] of [[84,6,3],[176,8,3]]){
      const band=group(z===84?'背殼下方連續進氣帶':'背殼上方連續排氣帶',pivot);
      // band remains in pivot-local space, like each rbox-created part.
      for(let k=0;k<count;k++){
        const blade=rbox(641.2,473,1.4,174,z+1+k*2,.6,M.rubber,'內縮水平散熱葉片');
        pivot.remove(blade);band.add(blade);
      }
      band.userData.ventilation={width:174,height:h,bladeCount:count,bladeHeight:.6,netArea:174*(h-count*.6)};
    }
    refinements.tvBack={width:194,height:116,inletNetCm2:730.8,outletNetCm2:1078.8,previousInletNetCm2:372,previousOutletNetCm2:864,finish:'tv-graphite'};
    rbox(641,542,3,36,96,74,M.steel,'VESA 400×400 掛架與走線預留');
    const screen=product('tv',648.4,560,82.15,'E',pivot,open?'中心高135cm；TV重37.2kg。Q6已移入固定底櫃，旋轉部分由独立鋼架承托。':'中心高135cm；TV重37.2kg。下方固定Q6頂72cm，背殼底77cm，靜態垂直淨距5cm。');screen.position.sub(pivot.position);
    // Keep the coaxial bearing below the screen; connect the VESA plate from behind.
    // The old tall shaft pierced the lower screen at x650.4, in front of its face.
    const shaft=cyl(647,560,76,3.4,4,M.steel,pivot);shaft.position.sub(pivot.position);info(shaft,'落地鋼構旋轉支承示意','下軸承停在螢幕下方，經後置立板接VESA。支承落至樓板；承重、偏心、錨栓、限位鎖、動態線材需五金／結構設計，不以木櫃或石膏天花承重。');
    rbox(641.5,556.5,5.5,7,78,2,M.steel,'旋轉支承下接板');
    rbox(641.5,556.5,3,7,80,38,M.steel,'旋轉支承後置連接板');
    box(622,547,16,26,0,2,M.steel,base,'結構固定底板・待錨固設計');box(626.5,556.5,7,7,2,73,M.steel,base,'獨立後置鋼構立柱');box(630,556.5,20.5,7,74,2,M.steel,base,'繞開固定中置的支承橋架・待結構核算');
    // A hollow, removable sleeve organizes the fixed lower post and cable route.
    for(const [x,y,w,d] of [[624.8,554.8,.15,10.4],[635.05,554.8,.15,10.4],[624.95,554.8,10.1,.15],[624.95,565.05,10.1,.15]])protectedFinish(cover(x,y,w,d,2,71,tvFinish,base,'影音立柱可拆金屬走線罩'),'tv-graphite');
    allowance('旋轉機構與維修範圍',630,541+(open?23:0),34,38,0,117,'機構未選型，需核總重、偏心、軸承、鎖定及走線');
    if(open)pivot.position.z+=23;
    const meshes=[];pivot.traverse(o=>{if(o.isMesh){o.userData.dynamicDoor=true;o.userData.rotatingTV=true;meshes.push(o);}});
    return {base,pivot,screen,rotatingMeshes:meshes};
  }
  function coffee(rotating){const g=group('升降茶几 45／65cm'),x=fixed?openSpec.audio.coffee.x:rotating?819:916,y=fixed?openSpec.audio.coffee.y:rotating?549:751;box(x-19,y-19,38,38,0,4,graphite,g);cyl(x,y,4,5,38,M.steel,g);const lift=group('茶几可升降桌面',g);cyl(x,y,42,fixed?openSpec.audio.coffee.radiusCm:rotating?31:43,3,M.blackglass,lift);info(lift,'用餐升降茶几','預設45cm，按控制可升至65cm。造型與機構為家具選型提案，直徑'+(fixed?openSpec.audio.coffee.radiusCm*2:rotating?62:86)+'cm。');return lift;}
  function projector(){box(167.5,0,45,40,190,3,M.steel,fittings,'投影機層板 · 深40cm');product('projector',190,23.1,193,'S',fittings,'24.3×21×23.8cm；暫以鏡頭平面y33.6放樣。實際鏡頭位移與校正需現場。');box(88.2,278,203.6,1,108,114.525,M.white,fittings,'投影幕先以92吋有效畫面放樣','保守92吋：1.2投射比需244.3cm。98吋需約260.4cm，鏡頭與後方散熱未核定前不宣稱可滿版。');box(80,279,220,3,225,5,M.black,fittings,'保留98吋幕盒尺度・有效畫面先92吋');}
  function closet(){
    allowance('管道保守外包絡79×51',546,69,79,51,0,275,'來源輪廓60×40與家具表79×51不一致。保留原結構，木作避開較大包絡');
    // Long-hang bay: no middle shelf through garments.
    box(580,0,110,55,0,8,M.black);for(const xx of [580,688])box(xx,0,2,55,0,243,M.steel);box(580,0,110,55,240,3,M.black);box(584,26,102,2,198,2,M.steel,fittings,'長衣獨立吊掛・淨高188cm');
    for(const xx of [600,625,650]){box(xx,12,4,30,29,162,M.cloth,fittings,'長衣示意');box(xx+1.5,26.5,1,1,191,7,M.steel,fittings,'長衣吊掛連接件');}
    const shallow=group('更衣入口淺櫃 · 15cm');box(743,55,2,75,0,240,M.black,shallow,'更衣入口淺櫃 · 15cm');for(const y of [55,128])box(730,y,13,2,0,240,M.black,shallow);for(const z of [0,238])box(730,57,13,71,z,2,M.black,shallow);for(const zz of [30,70,110,150,190])box(730,57,15,71,zz,1.8,M.steel);
    allowance('更衣室保守105cm入口',625,69,105,51,0,190,'以較大管道外包絡625至淺櫃730，木作方案淨距105cm；非現場量測');
  }
  function closetMirror(){
    const g=group('更衣室側移滑鏡',architecture);
    g.userData.slidingDoor={name:'更衣室滑鏡',key:'closet-mirror',axis:'x',distance:-50};
    const leaf=box(581,200,58,1.6,18,216,M.steel,g,'更衣室滑鏡','58cm鏡門沿櫃前側移50cm；上下導軌與止擋，移開可取左側衣物。滑鏡五金及承載由木作商核定。');
    leaf.userData.slideRatio=1;leaf.userData.walkDoor=true;
    function child(x,y,w,d,z,h,mat,name){const m=box(x,y,w,d,z,h,mat,leaf,name);m.position.sub(leaf.position);return m;}
    child(582,199.7,56,.3,19,214,M.mirror,'更衣鏡鏡面');
    child(583,199.1,1.2,.6,100,16,M.steel,'滑鏡內縮指拉邊');
    for(const z of [16,236])box(580,199.5,110,3,z,2,M.steel,architecture,z===16?'滑鏡下導軌':'滑鏡上吊軌');
    for(const x of [580,689])box(x,199.5,1,3,18,216,M.steel,architecture,'滑鏡端部止擋');
    for(const x of [588,630])child(x,200.4,1.5,1,234,2,M.steel,'滑鏡吊掛連接');
    refinements.closetMirror={width:58,travel:50,closed:{x:581,y:199.1},openX:631,trackWidth:110};
    return g;
  }
  function collectionBack(x,back,w,h,g,name,bags){
    const publicDisplay=['收藏室連續展示面','玄關延伸玻璃展示櫃'].includes(name);
    const innerBag=name==='收藏室精品包櫃';
    const backPanel=box(x,back,w,publicDisplay?1.7:2,0,h,innerBag?collectionFinish:M.black,g);
    if(innerBag)protectedFinish(backPanel,'collection-inner');
    if(publicDisplay){
      protectedFinish(box(x+.1,back+1.7,w-.2,.3,7,h-10,collectionFinish,g,'收藏室內側連續淺灰櫃背'),'collection-inner');
      refinements.collection={externalDepth:40,frontY:753,rearY:793,skinWithinOriginalEnvelope:true,finish:'collection-inner'};
    }
    return backPanel;
  }
  function luggage(){const g=group('收藏室 B 行李箱專用格');for(const yy of [793,874,953.2])cover(215,yy,60,1.8,0,245,M.black,g);for(const zz of [0,92,148,202,243.2])cover(215,793,60,162,zz,1.8,M.black,g);cover(215,793,1.8,162,0,245,M.black,g);for(const yy of [794,875]){const door=protectedFinish(cover(274,yy,1,78,5,236,collectionFinish,g,'收藏室行李箱門'),'collection-inner');door.userData.swingFront={name:'收藏室深收納',face:'E',hinge:'min'};}box(223,805,45,65,2,85,M.black,g,'85cm高行李箱放入櫃內');box(224,886,42,60,2,75,M.grey,g,'75cm高行李箱放入櫃內');}
  function guestDoor(){
    const g=group('客浴外掛雙聯滑門',architecture);g.position.copy(pos(0,0,0));
    g.userData.slidingDoor={name:'客浴雙聯滑門',key:'bath2',distance:43,opening:{x:490,y:365,w:80,d:10,h:215}};
    for(let i=0;i<2;i++){
      const leaf=box(487+i*41,376+i*3,45,2.5,.3,217.4,M.black,g,'客浴雙聯滑門','80cm開口；兩片45cm門扇，側邊各搭接3cm、片間搭接4cm，向左連動收門43／86cm。底部留3mm，門頂搭接封板。五金與毛刷條仍需廠商放樣。');
      leaf.position.sub(g.position);leaf.userData.slideRatio=i+1;leaf.userData.walkDoor=true;leaf.userData.guestDoorClosure=true;
      if(i===1){const seal=box(528.3,378.55,.6,.45,.3,217.4,M.black,leaf,'客浴雙聯門片背側搭接條');seal.position.sub(g.position).sub(leaf.position);seal.userData.guestDoorClosure=true;}
    }
    const rail=box(440,375,136,8,218,4,M.steel,architecture,'雙聯滑門上軌');rail.userData.guestDoorClosure=true;
    const stop=box(573.3,374.8,.8,7.5,.3,217.4,M.steel,architecture,'客浴拉門右側止口','收邊接回已補齊的牆角；門片端部預留3mm滑動間隙，遮住斜向可見的門後空隙。');stop.userData.guestDoorClosure=true;
    return g;
  }
  function kitchenDoor(){
    // Surface mounted on the kitchen side: one leaf parks north, clear of C cabinets.
    const g=group('廚房電動玻璃滑門',architecture);
    g.userData.slidingDoor={name:'廚房電動玻璃門',key:'kitchen',axis:'z',distance:122,electric:true,opening:{x:210,y:625,w:10,d:120},parking:{x:203.5,y:501,w:3,d:124}};
    const glass=M.glass.clone();glass.opacity=.23;glass.transparent=true;glass.depthWrite=false;
    const leaf=box(204.6,623, .8,124,.6,212.4,glass,g,'廚房電動玻璃門','120cm門洞；124cm單片玻璃含兩端搭接，向北滑122cm。窄黑框、上吊軌、無跨門檻；門機及固定方式待廠商放樣。');
    leaf.userData.slideRatio=1;leaf.userData.walkDoor=true;
    function frame(x,y,w,d,z,h,name){const m=box(x,y,w,d,z,h,M.steel,leaf,name);m.position.sub(leaf.position);return m;}
    for(const y of [623,745])frame(203.5,y,3,2,.6,212.4,'電動玻璃門細框');
    for(const z of [.6,211])frame(203.5,625,3,120,z,2,'電動玻璃門橫框');
    for(const z of [96,108])frame(204,625,2,120,z,1,'玻璃門防撞識別線');
    const rail=box(202.5,499,7.5,250,214,9,M.steel,architecture,'廚房電動門機與上吊軌','北向外掛收門；位於廚房240cm天花下，不與吊櫃共用承重。');
    rail.userData.kitchenDoorFixed=true;
    for(const [x,y,d,h] of [[208.7,747.5,3,3],[220,607,7,11]]){const pad=box(x,y,1.3,d,108,h,M.blackglass,architecture,'廚房電動門牆面開關','廚房側在南門柱，避開北側收門區；中島側在北牆。步行時對準按 E，或用畫面上的開關。');pad.userData.doorControl='kitchen';}
    for(const yy of [615,737])box(207.5,yy,2.5,2,35,3,M.black,architecture,'電動門防夾感應點・示意');
    return g;
  }
  function kitchenEquipment(){
    // Full carcass construction: the oven body is no longer buried in a solid cabinet.
    for(const x of [81.85,141.85]){
      const g=group('C區開放設備格');for(const xx of [x,x+58.2])cover(xx,493,1.8,61,12,225.7,M.black,g);cover(x,493,60,1.8,12,225.7,M.black,g);
      box(x+4,496,52,50,0,12,M.black,g,'廚房C櫃內縮落地底座');
      for(const zz of [12,40.2,101.5,163.3,235.9])cover(x,493.8,60,60.2,zz,1.8,M.black,g);
      cover(x+1,554,58,1,13,26,M.steel,g,'C區底抽');cover(x+1,554,58,1,165.1,70,M.steel,g,'C區設備上方收納');
      for(const zz of [42,103.3]){if(x===81.85&&zz===103.3){product('oven',111.85,529.6,103.3,'S',g,'59.4×54.8×59.5cm；機身入槽、前唇覆框。插座、門開與取熱盤站位須核安裝圖。');}else cover(x+1,554,58,1,zz,58,M.blackglass,g,'Best G-931503 電器收納門・機器型號未定');}
    }
    const g=group('ICNh5123 淨洞與貫通散熱示意');
    // 55cm clear niche plus a real 5cm chimney, both entirely west of wall x210.
    for(const yy of [751.25,809.45]){
      box(150,yy,60,1.8,0,12,M.black,g,'內嵌冰箱櫃落地底座');
      cover(150,yy,60,1.8,12,225.7,M.black,g);
    }
    for(const [z,h] of [[12,2],[192.8,1.8],[219.6,1.8],[235.9,1.8]])cover(150,753.05,55,56.4,z,h,M.black,g,'冰箱櫃前部層板・後方風道保持貫通');
    for(const [z,h] of [[14,69.5],[84.5,107.3],[194.6,25]]){const door=cover(149,753.05,1,56.4,z,h,M.steel,g,'ICNh5123 外覆門板分割');door.userData.swingFront={name:'ICNh5123預留櫃',face:'W',hinge:'min'};}
    cover(149,753.05,1,56.4,219.6,5.4,M.steel,g,'冰箱櫃排氣帶下收口');
    cover(149,753.05,1,56.4,233,2.9,M.steel,g,'冰箱櫃排氣帶上收口');
    function grille(z,name){
      const v=group(name,g),x=148.8,y=753.05,w=56.4,h=8,t=.6;
      for(const yy of [y,y+w-t])box(x,yy,.2,t,z,h,M.steel,v,'通風框側邊');
      for(const zz of [z,z+h-t])box(x,y+t,.2,w-2*t,zz,t,M.steel,v,'通風框橫邊');
      for(const zz of [z+2,z+4,z+6])box(x+.2,y+t,1,w-2*t,zz,.5,M.steel,v,'可拆進排氣水平葉片');
      v.userData.ventilation={outerWidth:w,outerHeight:h,frame:t,bladeCount:3,bladeHeight:.5,netArea:(w-2*t)*(h-2*t-1.5)};
    }
    grille(2,'內嵌冰箱踢腳進氣格柵');grille(225,'內嵌冰箱櫃頂前向排氣格柵');
    bay('ICNh5123 安裝淨洞（非機身）',150,753.05,55,56.4,14,178.8,'55cm安裝淨深與5cm後風道分開；淨洞56.4寬×178.8高。台灣110V出貨版五金與安裝圖仍需確認。');
    const shaft=allowance('ICNh5123 後方通風道',205,753.05,5,56.4,2,233.9,'有效5cm後風道，位於牆外；踢腳進氣、向上貫通，櫃頂前方排回廚房，未排進封閉天花。');
    shaft.userData.airPath=true;
    allowance('ICNh5123 底部進氣靜壓箱',150,753.05,55,56.4,2,10,'支承在兩側；底部不放實心墊塊阻斷空氣。').userData.airPath=true;
    allowance('ICNh5123 頂部前向排氣靜壓箱',150,753.05,55,56.4,221.4,14.5,'上層收納高度調低，保留完整前向排氣通道。').userData.airPath=true;
    refinements.fridgeAir={niche:{x:150,y:753.05,z:14,w:55,d:56.4,h:178.8},shaft:{x:205,y:753.05,z:2,w:5,d:56.4,h:233.9},shaftAreaCm2:282,grilleNetCm2:292.56,counterA:65,counterB:148.5,nominalAisleCm:83.5,previousNominalAisleCm:85,frontYUnchanged:true,reference:'https://assets-cdn.liebherr.com/versions/6b5fb1c0-719b-4e95-9c30-b5aaf676997f/original/'};

  }
  function finish(){const originalMaterials=new Map();window.HOME_EQUIPMENT={items,covers,allowances,bays,units,switchStation,refinements,revision:'20260910',setInspection(value){covers.forEach(m=>{if(value){if(!originalMaterials.has(m))originalMaterials.set(m,m.material);else return;m.material=m.material.clone();m.material.transparent=true;m.material.opacity=.13;m.material.depthWrite=false;}else if(originalMaterials.has(m)){m.material.dispose();m.material=originalMaterials.get(m);originalMaterials.delete(m);}m.material.needsUpdate=true;});allowances.forEach(m=>m.visible=value);window.HOME_REALISM?.invalidate();},getSchedule(){return items.map(g=>({name:g.name,...g.userData.equipment}));}};}
  return {refinements,units,group,part,product,cover,allowance,bay,appliances,receivingSink,consoleBase,audio,rotatingTV,coffee,projector,vanity,closet,closetMirror,collectionBack,luggage,guestDoor,kitchenDoor,kitchenEquipment,finish,items};
};
