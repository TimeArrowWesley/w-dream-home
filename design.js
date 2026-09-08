'use strict';
(() => {
const $=id=>document.getElementById(id), D=window.HOME_DATA, T=window.THREE;
if(!T){$('error').style.display='block';$('error').textContent='3D 引擎未載入，請將 assets 資料夾與本檔一起保留。';return;}
const canvas=$('view'), renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#262d34');
const camera=new T.PerspectiveCamera(48,1,2,9000), center=new T.Vector3();
const architecture=new T.Group(), beams=new T.Group(), ceiling=new T.Group(), labels=new T.Group(), fittings=new T.Group();
scene.add(architecture,beams,ceiling,labels,fittings);
const pickables=[], wallParts=[], roomLights=[], roofParts=[];
let current='all',mode='orbit',az=1.15,pol=.66,radius=1900,night=false,selected=null;
const pos=(x,y,z)=>new T.Vector3(x-482.5,z,y-480);
const mat=(color,rough=.65,metal=0)=>new T.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const M={steel:mat('#171c22',.34,.8),black:mat('#23282e',.65,.15),grey:mat('#666b70'),white:mat('#d8dcdf',.36),cloth:mat('#4f535b',.97),linen:mat('#bfc4ca',.97),darkcloth:mat('#30353c',1),ceramic:mat('#e4e8eb',.2),screen:mat('#080b11',.12,.35),glass:new T.MeshPhysicalMaterial({color:'#9caab6',transparent:true,opacity:.2,roughness:.08,metalness:.12,side:T.DoubleSide,depthWrite:false}),blackglass:new T.MeshPhysicalMaterial({color:'#10151c',roughness:.07,metalness:.72,clearcoat:1}),mirror:mat('#c1ccd5',.04,1),light:new T.MeshBasicMaterial({color:'#e3edff'}),rubber:mat('#080a0d',.9),water:new T.MeshPhysicalMaterial({color:'#7f9dba',transparent:true,opacity:.7,roughness:.12,metalness:.1})};
// Deterministic procedural material textures; no outside textures or account access.
function noiseTexture(base,grain,tiles){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),im=ctx.createImageData(256,256);let seed=193;
for(let i=0;i<im.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const v=base+((seed>>>24)/255-.5)*grain;im.data[i]=v;im.data[i+1]=v+1;im.data[i+2]=v+3;im.data[i+3]=255;}ctx.putImageData(im,0,0);if(tiles){ctx.strokeStyle='#30353a';ctx.lineWidth=2;ctx.strokeRect(0,0,256,256);}const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(tiles?12:3,tiles?10:3);tex.encoding=T.sRGBEncoding;return tex;}
M.floor=new T.MeshStandardMaterial({color:'#abb0b4',map:noiseTexture(115,12,true),roughness:.68});M.concrete=new T.MeshStandardMaterial({color:'#8e9196',map:noiseTexture(119,17,false),roughness:.92});
Object.values(M).forEach(m=>{m.color.convertSRGBToLinear();if('envMapIntensity' in m)m.envMapIntensity=.25;});
// Studio environment gives black glass readable reflections even in overview mode.
const envScene=new T.Scene();envScene.background=new T.Color('#78818b');
[[500,200,0,300,900],[0,250,500,700,500],[-450,80,0,100,700]].forEach(a=>{const p=new T.Mesh(new T.PlaneGeometry(a[3],a[4]),new T.MeshBasicMaterial({color:'#eef3ff',side:T.DoubleSide}));p.position.set(a[0],a[1],a[2]);p.lookAt(0,100,0);envScene.add(p);});
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(envScene,.12).texture;
const hemi=new T.HemisphereLight('#e7efff','#444b55',.8);scene.add(hemi);
const sun=new T.DirectionalLight('#f0f5ff',1.4);sun.position.set(700,1300,-150);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-950,right:950,top:1000,bottom:-1000,near:50,far:3000});sun.shadow.bias=-.0002;scene.add(sun);
const fill=new T.DirectionalLight('#d9e3f4',.55);fill.position.set(-900,700,900);scene.add(fill);
function info(mesh,name,desc,source='本次設計提案'){mesh.userData={name,desc,source};pickables.push(mesh);return mesh;}
function softGeometry(w,h,d){const r=Math.min(4,h/3,w/8,d/8),s=new T.Shape(),a=-w/2,b=-d/2;s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+d-r);s.quadraticCurveTo(a+w,b+d,a+w-r,b+d);s.lineTo(a+r,b+d);s.quadraticCurveTo(a,b+d,a,b+d-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);const geo=new T.ExtrudeGeometry(s,{depth:h-2*r,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:r*.4,bevelThickness:r,curveSegments:6});geo.rotateX(-Math.PI/2);geo.translate(0,-(h-2*r)/2,0);geo.computeBoundingBox();const bounds=geo.boundingBox;geo.scale(w/(bounds.max.x-bounds.min.x),1,d/(bounds.max.z-bounds.min.z));return geo;}
function box(x,y,w,d,z,h,material=M.black,parent=fittings,name,desc){const soft=[M.cloth,M.darkcloth,M.linen].includes(material)&&Math.min(w,d)>15&&h>5;const mesh=new T.Mesh(soft?softGeometry(w,h,d):new T.BoxGeometry(w,h,d),material);mesh.position.copy(pos(x+w/2,y+d/2,z+h/2));mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);if(name)info(mesh,name,desc||`${w} × ${d} × ${h} cm`);return mesh;}
function ball(x,y,z,rx,ry,rz,material,parent=fittings){const mesh=new T.Mesh(new T.SphereGeometry(1,20,14),material);mesh.scale.set(rx,rz,ry);mesh.position.copy(pos(x,y,z));mesh.castShadow=true;parent.add(mesh);return mesh;}
function cyl(x,y,z,r,h,material,parent=fittings){const mesh=new T.Mesh(new T.CylinderGeometry(r,r,h,32),material);mesh.position.copy(pos(x,y,z+h/2));mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function line(x,y,z,w,d=1,parent=fittings){return box(x,y,w,d,z,.7,M.light,parent);}
function upright(x,y,z,len,material=M.light){return box(x,y,1,1,z,len,material);}
function panel(x,y,w,d,z,h,material,name){return box(x,y,w,d,z,h,material,fittings,name);}
function wall(x,y,w,d,h=275,z=0,material=M.concrete){const m=box(x,y,w,d,z,h,material,architecture);wallParts.push({m,z,h});return m;}
function glazing(x,y,w,d,z,h,study=false){const horizontal=w>d,fw=3;
wall(x,y,w,d,fw,z,M.steel);wall(x,y,w,d,fw,z+h-fw,M.steel);
if(horizontal){wall(x,y,fw,d,h,z,M.steel);wall(x+w-fw,y,fw,d,h,z,M.steel);}else{wall(x,y,w,fw,h,z,M.steel);wall(x,y+d-fw,w,fw,h,z,M.steel);}
const g=wall(x+(horizontal?fw:w*.35),y+(horizontal?d*.35:fw),horizontal?w-2*fw:w*.3,horizontal?d*.3:d-2*fw,h-2*fw,z+fw,M.glass);if(study)g.userData.study=true;return g;}
function windowV(x,y,len,z=75,h=160){if(z>0)wall(x,y,10,len,z);glazing(x,y,10,len,z,h);wall(x,y,10,len,275-z-h,z+h);}
function windowH(x,y,len,z=75,h=160){if(z>0)wall(x,y,len,10,z);glazing(x,y,len,10,z,h);wall(x,y,len,10,275-z-h,z+h);}
function finishHeight(x,y){let top=x<215&&x>=0&&y>=493&&y<=955?240:275;for(const b of D.beams){if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.d&&b.z0>215)top=Math.min(top,b.z0);}return top;}
function door(x,y,w,axis='H',glass=false,name='室內門（示意）'){const cx=x+(axis==='H'?w/2:2),cy=y+(axis==='H'?2:w/2),top=finishHeight(cx,cy);const covered=wallParts.some(part=>{const b=new T.Box3().setFromObject(part.m);return b.min.x<=cx-482.5&&b.max.x>=cx-482.5&&b.min.z<=cy-480&&b.max.z>=cy-480&&b.min.y<=215&&b.max.y>=top;});if(!covered&&top>215){const head=wall(x,y,axis==='H'?w:10,axis==='H'?10:w,top-215,215,M.concrete);head.userData.name=name+'・門頂封板';}const pivot=new T.Group();pivot.position.copy(pos(x,y,0));pivot.userData.interactiveDoor={name,openAngle:axis==='H'?-1.45:1.45,initialAngle:0};architecture.add(pivot);const m=box(x,y,axis==='H'?w:4,axis==='H'?4:w,0,215,glass?M.glass:M.black,pivot,name,'門洞依圖面配置；門片與五金為示意。');m.position.sub(pivot.position);m.userData.walkDoor=true;const handle=box(x+(axis==='H'?w-12:0),y+(axis==='H'?0:w-12),axis==='H'?9:5,axis==='H'?5:9,100,2,M.steel,pivot);handle.position.sub(pivot.position);handle.userData.walkDoor=true;return m;}
function openDoor(x,y,w,axis,glass,name,angle){const m=door(x,y,w,axis,glass,name);m.parent.rotation.y=angle;m.parent.userData.interactiveDoor.openAngle=angle;m.parent.userData.interactiveDoor.initialAngle=angle;return m;}
function cabinet(x,y,w,d,z,h,name,face='S',finish=M.blackglass){if(z+h>=218)h=Math.max(h,finishHeight(x+w/2,y+d/2)-z);const g=new T.Group();g.userData.cabinet={name,w,d,h};fittings.add(g);const side=face==='E'||face==='W',th=1.8;const carc=box(side?(face==='E'?x:x+w-th):x,side?y:(face==='S'?y:y+d-th),side?th:w,side?d:th,z,h,M.black,g,name,`${w} × ${d} × ${h} cm；霧黑櫃身＋黑玻門片；櫃內層板為示意。`);if(side){box(x,y,w,th,z,h,M.black,g);box(x,y+d-th,w,th,z,h,M.black,g);}else{box(x,y,th,d,z,h,M.black,g);box(x+w-th,y,th,d,z,h,M.black,g);}box(x,y,w,d,z,th,M.black,g);box(x,y,w,d,z+h-th,th,M.black,g);for(let zz=z+38;zz<z+h-15;zz+=38)box(x+th,y+th,w-2*th,d-2*th,zz,th,M.black,g);const n=Math.max(1,Math.round((side?d:w)/60));
for(let i=0;i<n;i++){let leaf;if(!side)leaf=box(x+i*w/n+.8,face==='S'?y+d:y-1,w/n-1.6,1,z+8,h-9,finish,g);else leaf=box(face==='E'?x+w:x-1,y+i*d/n+.8,1,d/n-1.6,z+8,h-9,finish,g);leaf.userData.swingFront={name,face,hinge:i%2?'max':'min'};}return carc;}
function pointLight(x,y,z,power=.35,range=550){const l=new T.PointLight('#dde8ff',power,range,1.5);l.position.copy(pos(x,y,z));scene.add(l);roomLights.push(l);return l;}
function track(x,y,w,d,z=267){box(x,y,w,d,z,3,M.steel,ceiling);const n=Math.max(2,Math.floor(Math.max(w,d)/110));for(let i=0;i<n;i++)cyl(x+(w>d?(i+.5)*w/n:w/2),y+(d>w?(i+.5)*d/n:d/2),z-5,3,5,M.black,ceiling);}
function roomLabel(text,x,y){const c=document.createElement('canvas');c.width=512;c.height=100;const ctx=c.getContext('2d');ctx.fillStyle='rgba(18,25,32,.88)';ctx.fillRect(0,0,512,100);ctx.fillStyle='#e7f0f9';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='32px Microsoft JhengHei';ctx.fillText(text,256,50);const s=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:false}));s.position.copy(pos(x,y,330));s.scale.set(160,31,1);labels.add(s);}
// Slab follows the residence outline, not the bounding rectangle of the source model.
const outline=[[-110,-15],[1185,-15],[1185,315],[1085,315],[1085,580],[1185,580],[1185,650],[1085,650],[1085,880],[1185,880],[1185,970],[545,970],[545,955],[445,955],[445,970],[-210,970],[-210,415],[-90,415],[-90,85],[-110,85]];
const shape=new T.Shape();outline.forEach((p,i)=>i?shape.lineTo(p[0]-482.5,-(p[1]-480)):shape.moveTo(p[0]-482.5,-(p[1]-480)));shape.closePath();
const slabGeo=new T.ExtrudeGeometry(shape,{depth:12,bevelEnabled:false});const uv=slabGeo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/1300,uv.getY(i)/1000);const slab=new T.Mesh(slabGeo,M.floor);slab.rotation.x=-Math.PI/2;slab.position.y=-12;slab.receiveShadow=true;scene.add(slab);
// Clean architectural reconstruction: omit automatically extracted furniture and window lines.
D.cols.forEach(c=>wall(c[0],c[1],c[2],c[3],315,0,M.concrete));
wall(0,-15,405,15);windowH(775,-10,310,0,245);wall(580,-15,195,15);wall(405,0,10,80);wall(415,65,70,15);wall(405,207,10,158);
windowV(-85,85,197,75,158);wall(-85,282,10,30.6);wall(-85,392.4,10,22.6);info(wall(-210,415,135,83,315),'主浴旁結構柱','黃圈由業主確認為柱。平面約135×83cm依圖面比例，高度暫沿用315cm，待實測。','業主圈圖確認');wall(-210,498,12,402,95);glazing(-210,498,8,402,95,15);
wall(0,955,445,15);wall(700,955,385,15);door(553,955,107,'H',false,'入戶門');wall(545,955,8,15);wall(660,955,40,15);
wall(1085,0,15,88);glazing(1085,88,10,224,0,245);wall(1085,312,15,63);
// Owner-identified living-room windows flank a full-height structural column.
windowV(1085,375,205,0,245);
info(wall(1085,580,100,70,315,0,M.concrete),'客廳窗間結構柱','綠圈由業主確認為柱。平面100×70cm依既有圖面位置重建；高度315cm暫沿用結構基準，待現場複量。','業主圈圖確認');
windowV(1085,650,230,0,245);
// Study-side exterior area retained; living-room window exterior is empty (owner correction).
glazing(1180,85,5,230,0,110);glazing(1085,315,100,5,0,110);
// Master bath, guest bath, wardrobe and storage.
wall(80,282,225,10);wall(-75,282,75,10);wall(0,282,80,10,60,215);openDoor(0,282,80,'H',false,'主浴80cm門洞',-1.2);wall(305,292,10,191);wall(-75,483,380,10);glazing(-85,312.6,10,79.8,90,140);
wall(405,207,165,10);wall(570,217,10,148);wall(415,365,75,10);door(490,365,80);wall(580,260,165,10);wall(745,0,10,365);
wall(580,365,75,10);door(655,365,80);wall(735,365,20,10);openDoor(405,123,84,'V',false,'更衣室門',.95);openDoor(405,365,90,'H',false,'主臥走道入口門',Math.PI/2);
wall(755,365,33,10);door(788,365,84,'H',true,'書房玻璃門');glazing(872,365,213,10,0,275,true);
// Kitchen/collection partitions, corrected front display and east collection door.
// Refrigerator niche opens west into the kitchen instead of covering the appliance face.
wall(210,492,10,3);wall(210,593,10,32);wall(210,495,10,98,91,184);wall(210,745,10,210);
wall(-8,493,8,64);door(-8,558,84,'V',true,'後陽台門');wall(-8,642,8,90);glazing(-8,733,8,164,0,215);wall(-8,897,8,58);
openDoor(450,795,80,'V',false,'收藏室東側入口',-1.15);wall(450,793,10,2);wall(450,795,10,80,60,215);wall(435,875,110,10);
D.beams.forEach(b=>box(b.x,b.y,b.w,b.d,b.z0,b.z1-b.z0,M.concrete,beams));
const roof=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:5,bevelEnabled:false}),M.concrete);roof.rotation.x=-Math.PI/2;roof.position.y=275;ceiling.add(roof);box(0,493,215,462,240,4,M.concrete,ceiling);
// Whole-house base cabinets, with detailed room-specific replacements below.
D.cabs.filter(c=>!(/廚房|床頭|書房|更衣室|收藏室 A|收藏室 C|電視牆|頂天包冰箱|投影機|傘架/.test(c.n))).forEach(c=>{const side=/玄關/.test(c.n)?'S':'E';const m=cabinet(c.x,c.y,c.w,c.d,c.z0,c.z1-c.z0,c.n,side);m.userData.source='既有 HTML 規劃';m.userData.desc=c.s.replace(/<[^>]*>/g,' ');});
// Main refrigerator opens west toward kitchen; full-height enclosure with upper storage.
cabinet(225,493,90,102,184,61,'主冰箱上櫃','E');box(222,493,3,102,0,184,M.black);box(225,493,90,2,0,184,M.black);box(225,593,90,2,0,184,M.black);
const fridgeFirst=fittings.children.length;
// LG GR-AQC82BS: official W90.8 x H178.5 x D87.4 cm, facing west.
const fridgeMetal=new T.MeshPhysicalMaterial({color:new T.Color('#343536').convertSRGBToLinear(),roughness:.32,metalness:.5,clearcoat:.25,clearcoatRoughness:.3});
const fridgeGlass=new T.MeshPhysicalMaterial({color:new T.Color('#151c21').convertSRGBToLinear(),roughness:.1,metalness:.38,clearcoat:1});
info(box(225.6,498,83.4,90.8,0,178.5,fridgeMetal),'LG GR-AQC82BS 主冰箱','782L 星夜黑；寬90.8×高178.5×深87.4cm，門面朝中島（東）。右上InstaView鏡面玻璃、左側給水區、下方變溫及冷凍抽屜。外觀細節為建模示意，安装淨空與水線依原廠要求。','LG官方 GR-AQC82BS 產品規格');
// Front panels plus the body occupy exactly 87.4 cm in depth.
for(const y of [498,543.8])panel(221.6,y,4,45,81.5,97,fridgeMetal,'GR-AQC82BS 冷藏門');
panel(221.6,498,4,90.8,54.5,26,fridgeMetal,'GR-AQC82BS 變溫抽屜');panel(221.6,498,4,90.8,1,52.5,fridgeMetal,'GR-AQC82BS 冷凍抽屜');
panel(221.45,547.5,.15,37,86,88,fridgeGlass,'InstaView 敲敲看玻璃');
// Recessed water/ice dispenser and hidden pull channels.
panel(221.35,506,.25,28,105,43,M.rubber,'冰水與冰塊給水區');panel(221.1,508,.25,24,141,5,M.screen);panel(221,507,.35,26,105,1.2,fridgeMetal);panel(221.1,519,.25,2.5,129,9,fridgeMetal);
for(const z of [53.5,80.5])panel(221.3,504,.3,78,z,.8,M.rubber);
const fridgeBadge=document.createElement('canvas');fridgeBadge.width=256;fridgeBadge.height=64;const fridgeBadgeCtx=fridgeBadge.getContext('2d');fridgeBadgeCtx.fillStyle='#c4c7c9';fridgeBadgeCtx.font='22px Arial';fridgeBadgeCtx.fillText('LG  ThinQ',10,30);const fridgeBadgeTex=new T.CanvasTexture(fridgeBadge);fridgeBadgeTex.encoding=T.sRGBEncoding;const fridgeLabel=new T.Mesh(new T.PlaneGeometry(15,3.75),new T.MeshBasicMaterial({map:fridgeBadgeTex,transparent:true,depthWrite:false}));fridgeLabel.rotation.y=-Math.PI/2;fridgeLabel.position.copy(pos(221.25,509,173));fittings.add(fridgeLabel);const fridgeAssembly=new T.Group();fridgeAssembly.name="LG冰箱朝向中島";const fridgeParts=fittings.children.slice(fridgeFirst);fridgeAssembly.position.copy(pos(272.3,543.4,0));fittings.add(fridgeAssembly);for(const part of fridgeParts){part.position.sub(pos(265.3,543.4,0));fridgeAssembly.add(part);}fridgeAssembly.rotation.y=Math.PI;
// Restore the south-side curved full-height cabinet shown beside the fridge in the owner's plan.
// Approximate 90 x 30 cm footprint follows the fridge enclosure; southeast corner radius 28 cm.
const curvedCabShape=new T.Shape();curvedCabShape.moveTo(225-482.5,-(595-480));curvedCabShape.lineTo(315-482.5,-(595-480));curvedCabShape.lineTo(315-482.5,-(597-480));curvedCabShape.quadraticCurveTo(315-482.5,-(625-480),287-482.5,-(625-480));curvedCabShape.lineTo(225-482.5,-(625-480));curvedCabShape.closePath();
const curvedCab=new T.Mesh(new T.ExtrudeGeometry(curvedCabShape,{depth:275,bevelEnabled:false,curveSegments:32}),M.black);curvedCab.rotation.x=-Math.PI/2;curvedCab.castShadow=true;curvedCab.receiveShadow=true;fittings.add(curvedCab);info(curvedCab,'冰箱旁圓弧頂天櫃','依業主補圖恢復，與主冰箱南側相接；暫用90×30cm佔位、275cm到頂，圓角28cm。尺寸及門片分割待立面確認。','業主提供平面截圖');
// Umbrella recess instead of solid door.
box(675,753,35,2,0,120,M.black);box(675,753,2,50,0,120,M.black);box(708,753,2,50,0,120,M.black);box(675,753,35,50,118,2,M.blackglass);box(678,758,29,42,3,2,M.steel,fittings,'可抽式長傘滴水盤');[683,695].forEach(x=>{cyl(x,782,7,2,85,M.steel);});
// Entry face facing living room is flush black steel; back face opens to foyer.
panel(460,751,150,2,8,267,M.black,'玄關面客廳封板');panel(610,751,100,2,8,112,M.blackglass,'玄關低櫃背面');line(610,750,118,100);
// Owner correction: no freestanding mirror/panel in the entry-to-living passage.
// Display cabinets: framed transparent doors, glass shelves, items and LED.
function display(x,y,w,d,h,name,front='N',bags=false){if(h>=218)h=finishHeight(x+w/2,y+d/2);const g=new T.Group();fittings.add(g);const back=front==='N'?y+d-2:y;
info(box(x,back,w,2,0,h,M.black,g),name,`${w} × ${d} × ${h} cm；黑鐵框、透視玻璃、層板照明。`);
box(x,y,2,d,0,h,M.steel,g);box(x+w-2,y,2,d,0,h,M.steel,g);box(x,y,w,d,0,7,M.black,g);box(x,y,w,d,h-3,3,M.steel,g);
const levels=[42,84,124,164,204].filter(v=>v<h-15),n=Math.max(2,Math.round(w/61));for(let k=1;k<n;k++)box(x+k*w/n,y,2,d,0,h,M.steel,g);
box(x+2,front==='N'?y:y+d,w-4,1,7,h-10,M.glass,g);
for(const z of levels){box(x+2,y+2,w-4,d-4,z,1,M.glass,g);line(x+3,front==='N'?y+4:y+d-5,z+2,w-6,1,g);
for(let k=0;k<n;k++){const cx=x+(k+.5)*w/n,cy=y+d/2;if(bags||z<85){box(cx-12,cy-6,24,12,z+2,18,k%2?M.grey:M.black,g);const hnd=new T.Mesh(new T.TorusGeometry(6,.7,6,18,Math.PI),M.steel);hnd.position.copy(pos(cx,cy,z+23));g.add(hnd);}else{cyl(cx,cy,z+2,7,2,M.black,g);box(cx-4,cy-3,8,6,z+4,12,M.white,g);ball(cx,cy,z+20,5,4,5,M.grey,g);box(cx-8,cy-2,4,4,z+7,12,M.steel,g);box(cx+4,cy-2,4,4,z+7,12,M.steel,g);}}}
return g;}
display(215,753,245,40,245,'收藏室連續展示面','N');display(275,905,160,50,245,'收藏室精品包櫃','N',true);
// Owner-confirmed island north-side 260 x 30 floor-to-ceiling double-sided glass display.
const doubleGlass=new T.Group();doubleGlass.name='中島頂天雙面玻璃櫃';fittings.add(doubleGlass);
info(box(405,460,260,30,0,7,M.black,doubleGlass),'中島頂天雙面玻璃櫃','260×30cm 原圖櫃位；目前天花275cm。南北雙面透視玻璃、無實背板，黑鐵細框及玻璃層板。實際高度隨天花完成面調整。','業主紅框確認＋客變260×30櫃位');
box(405,460,260,30,270,5,M.black,doubleGlass);
for(let i=0;i<=5;i++){const x=405+i*51.4;box(x,460,3,3,7,263,M.steel,doubleGlass);box(x,487,3,3,7,263,M.steel,doubleGlass);}
for(const y of [460,489]){for(let i=0;i<5;i++){box(408+i*51.4,y,48.4,1,8,261,M.glass,doubleGlass);box(451+i*51.4,y===460?458:490,1.5,2,125,18,M.black,doubleGlass);}}
box(405,463,1,24,8,261,M.glass,doubleGlass);box(664,463,1,24,8,261,M.glass,doubleGlass);
for(const z of [48,92,136,180,224,268]){box(408,463,254,24,z,1,M.glass,doubleGlass);line(409,463,z+1,252,.6,doubleGlass);}
for(const [x,z] of [[433,48],[536,92],[587,180],[485,224]]){cyl(x,475,z+1,5,15,M.glass,doubleGlass);cyl(x+13,475,z+1,4,12,M.glass,doubleGlass);}
for(const [x,z] of [[487,48],[637,136],[433,180]]){ball(x,475,z+10,7,6,10,M.black,doubleGlass);cyl(x,475,z+17,3,5,M.black,doubleGlass);}

// Living room media installation, 315+70 cabinet split follows original geometry.
cabinet(690,915,70,40,0,245,'電箱整合櫃','N');cabinet(760,920,315,35,170,75,'電視上櫃','N',M.black);
panel(760,951,315,2,45,125,M.blackglass,'黑玻電視背牆');cabinet(820,900,195,55,0,45,'影音設備矮櫃','N',M.steel);
[[820,60],[880,75],[955,60]].forEach(([x,w],i)=>{panel(x+2,898,w-4,1,9,28,M.rubber,i===1?'中置透聲布':'設備散熱面板');if(i!==1)for(let j=0;j<8;j++)panel(x+5+j*6,897,1,1,12,21,M.grey);});box(887,902,60,25,10,20,M.black,fittings,'中置喇叭');
[[820,440],[1010,440],[820,610],[1010,610],[820,820],[1010,820]].forEach(([x,y])=>{info(cyl(x,y,273,11,1.5,M.white,ceiling),'嵌入式喇叭','兩環繞＋四天空，依後移沙發重新配置；角度待影音調校。');});
panel(825,946,185,4,47,106,M.screen,'83 吋電視');line(760,918,169,315);line(822,899,5,191);
function speaker(x,y){const m=box(x,y,30,32,0,100,M.black,fittings,'落地喇叭','依既有配置兩側設置；型號與箱體尺寸需複核。');for(const z of [25,55,80]){const a=new T.Mesh(new T.CylinderGeometry(z===80?5:9,z===80?5:9,2,24),M.rubber);a.rotation.x=Math.PI/2;a.position.copy(pos(x+15,y-1,z));fittings.add(a);}return m;}speaker(775,916);speaker(1030,916);
box(785,855,32,35,0,36,M.black,fittings,'重低音（暫置）');
// Owner correction: remove the unrequested rear subwoofer beside the sofa.
// Owner-requested move toward study; chaise runs along the window side.
info(box(797,490,240,95,9,29,M.darkcloth),'L 型沙發','依紅框向書房方向後移約70cm。總寬240cm、主座深95cm、靠窗貴妃段總深160cm，尺寸為配置提案，實品待選。','業主圈圖位置＋本次 L 型配置');
box(949,581,88,69,9,29,M.darkcloth);box(797,490,240,18,38,46,M.cloth);
for(let i=0;i<2;i++)box(817+i*66,510,64,72,38,10,M.cloth);
box(951,510,66,137,38,10,M.cloth);box(797,508,18,77,38,26,M.darkcloth);box(1019,508,18,142,38,26,M.darkcloth);
[805,1025].forEach(x=>[498,574].forEach(y=>box(x,y,3,3,0,9,M.steel)));[957,1025].forEach(x=>box(x,640,3,3,0,9,M.steel));
box(789,550,265,340,.3,.7,M.cloth,fittings,'265×340短毛地毯');cyl(916,751,20,43,3,M.blackglass);cyl(916,751,0,20,20,M.steel);info(cyl(916,751,23,43,1,M.blackglass),'黑玻茶几','直徑86cm；位置与尺寸為提案。');
// Curved island uses the original vector contour rather than a rectangular substitute.
const IS=D.island,is=new T.Shape();[...IS.north,...IS.south.slice().reverse()].forEach((p,i)=>i?is.lineTo(p[0]-482.5,-(p[1]-480)):is.moveTo(p[0]-482.5,-(p[1]-480)));is.closePath();
function islandLayer(z,h,material){const m=new T.Mesh(new T.ExtrudeGeometry(is,{depth:h,bevelEnabled:false}),material);m.rotation.x=-Math.PI/2;m.position.y=z;m.castShadow=true;m.receiveShadow=true;fittings.add(m);return m;}
info(islandLayer(5,82,M.blackglass),'弧形中島','沿用白模輪廓：佔位260 × 168、右端接合後方玻璃櫃、等寬70、檯面高90cm（暫定）。','既有 HTML 幾何');islandLayer(87,3,M.grey);
panel(410,654,55,2,12,62,M.black,'中島酒櫃');panel(413,657,49,1,17,52,M.glass);for(let h=23;h<64;h+=12)line(414,657,h,47);
cyl(438,629,90,10,.8,M.steel);cyl(438,629,90.8,8,.3,M.rubber);cyl(438,612,90,1.1,22,M.steel);box(438,612,1.5,12,110,1.5,M.steel);panel(480,605,28,36,90,.4,M.screen,'中島 IH 爐（配置提案）');
function stool(x,y){cyl(x,y,64,19,4,M.cloth);for(const dx of [-12,12])for(const dy of [-12,12])box(x+dx,y+dy,2,2,0,64,M.steel);box(x-15,y+13,30,4,68,18,M.darkcloth);}// Owner request: remove both island stools to clear the passage.
// Master bedroom: compact king bed and split side storage.
for(const c of [{x:0,w:100},{x:280,w:125}]){cabinet(c.x,0,c.w,35,0,70,'床頭抽屜','S',M.black);cabinet(c.x,0,c.w,35,85,160,'床頭黑玻高櫃','S');panel(c.x,0,c.w,2,70,15,M.steel);line(c.x+3,32,84,c.w-6);}
panel(100,0,180,10,40,90,M.cloth,'床頭軟包');box(100,10,180,202,4,28,M.darkcloth,fittings,'180 × 202 KING 床');box(100,10,180,202,32,23,M.linen);box(101,68,178,143,55,3,M.white);box(102,166,176,43,58,2,M.cloth);for(const x of [112,198]){const p=box(x,26,70,38,56,12,M.linen);p.rotation.x=-.08;}
box(170,0,40,35,190,3,M.steel,fittings,'投影機層板','40 × 35cm，h190，沿用原規劃。');box(176,6,28,20,193,10,M.black);cyl(189,18,203,3,1,M.screen);[108,270].forEach(x=>{box(x,10,3,8,132,5,M.steel);});
box(82,278,217,2,108,122,M.white,fittings,'98 吋投影幕','217 × 122cm，依白模；投影實際光學需複核。');
// Study: two separate desks and opposite-facing workstations, glass partition.

// Samsung S57CG952NC: real 1000R curved geometry; dimensions are centimetres.
function odyssey57(x,y,rotation){
 const g=new T.Group();g.name='Samsung S57CG952NC Odyssey Neo G9';g.position.copy(pos(x,y,76));g.rotation.y=rotation;g.userData.monitor={model:'S57CG952NC',radiusCm:100,widthCm:132.75,heightWithStandCm:60.1,depthWithStandCm:49.96};fittings.add(g);
 const white=new T.MeshStandardMaterial({color:'#e3e2df',roughness:.42}),rim=new T.MeshStandardMaterial({color:'#14171a',roughness:.5});
 rim.color.convertSRGBToLinear();white.color.convertSRGBToLinear();const shell=new T.BoxGeometry(132.75,42.95,8.64,96,1,1),p=shell.attributes.position;
 for(let i=0;i<p.count;i++){const xx=p.getX(i),sag=100-Math.sqrt(10000-xx*xx);p.setZ(i,sag+p.getZ(i)-4.32);}shell.computeVertexNormals();shell.type="CurvedMonitorGeometry";
 const body=new T.Mesh(shell,white);body.position.y=38.625;body.castShadow=true;body.receiveShadow=true;g.add(body);info(body,'Samsung 57吋 Odyssey Neo G9 S57CG952NC','1000R真曲面、32:9、7680×2160；機身132.75×42.95×33.84cm，含座132.75×60.10×49.96cm。黑正面／白背殼／黑底座，支架及外觀細節為示意。','Samsung台灣官方LS57CG952NCXZW規格');
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=576;const ctx=canvas.getContext('2d');const gradient=ctx.createLinearGradient(0,576,2048,0);gradient.addColorStop(0,'#0a152d');gradient.addColorStop(.5,'#153d63');gradient.addColorStop(1,'#417e9a');ctx.fillStyle=gradient;ctx.fillRect(0,0,2048,576);for(let i=0;i<7;i++){ctx.strokeStyle='rgba(99,201,219,'+(.09+i*.018)+')';ctx.lineWidth=10+i*3;ctx.beginPath();ctx.ellipse(1050,770,500+i*150,380+i*100,-.18,Math.PI,Math.PI*2);ctx.stroke();}
 const tex=new T.CanvasTexture(canvas);tex.encoding=T.sRGBEncoding;const screenMat=new T.MeshBasicMaterial({map:tex,toneMapped:false});
 const bezelGeo=new T.PlaneGeometry(132.75,42.95,96,1),bp=bezelGeo.attributes.position;for(let i=0;i<bp.count;i++){const xx=bp.getX(i);bp.setZ(i,100-Math.sqrt(10000-xx*xx)+.03);}bezelGeo.computeVertexNormals();const bezel=new T.Mesh(bezelGeo,rim);bezel.position.y=38.625;g.add(bezel);const screenGeo=new T.PlaneGeometry(131.3,41.2,96,1),sp=screenGeo.attributes.position;for(let i=0;i<sp.count;i++){const xx=sp.getX(i);sp.setZ(i,100-Math.sqrt(10000-xx*xx)+.08);}screenGeo.computeVertexNormals();const face=new T.Mesh(screenGeo,screenMat);face.position.y=38.625;g.add(face);
 function part(w,h,d,px,py,pz){const m=new T.Mesh(new T.BoxGeometry(w,h,d),rim);m.position.set(px,py,pz);m.castShadow=true;g.add(m);return m;}
 part(6,34,6,0,18,-6);part(9,1.2,49.96,0,.6,12);for(const sign of [-1,1]){const leg=part(3,1.6,36,sign*13,.8,16);leg.rotation.y=sign*.68;}
 const ring=new T.Mesh(new T.TorusGeometry(5,.6,8,40),new T.MeshBasicMaterial({color:'#65c9da'}));ring.position.set(0,38,-9);g.add(ring);
}

function desk(x,y,w,d,face){box(x,y,w,d,73,3,M.black,fittings,'180 × 80 升降桌','位置依原方案 K；鐵腳與灰黑桌板為材質提案。');const along=w>d;[.15,.85].forEach(t=>{box(x+(along?w*t:w*.5)-3,y+(along?d*.5:d*t)-3,6,6,8,65,M.steel);box(x+(along?w*t-3:5),y+(along?8:d*t-3),along?6:w-10,along?d-16:6,4,4,M.steel);});
odyssey57(face==='W'?x+25:x+w/2,face==='W'?y+d/2:y+d-20,face==='W'?Math.PI/2:Math.PI);
box(x+15,y+15,30,13,76,1,M.grey);box(x+w-32,y+d-40,24,36,0,56,M.black);}
desk(755,0,80,180,'W');desk(905,285,180,80,'S');
function chair(x,y,rot=0,white=false){const g=new T.Group();g.position.copy(pos(x,y,0));g.rotation.y=rot;fittings.add(g);function b(px,pz,w,d,z,h,m){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.set(px+w/2,z+h/2,pz+d/2);g.add(mesh);return mesh;}const cloth=white?M.linen:M.darkcloth;info(b(-24,-23,48,46,45,7,cloth),'人體工學椅','位置及外型為示意。');b(-24,18,48,7,52,48,cloth);b(-12,18,24,7,104,14,cloth);b(-3,-3,6,6,10,35,M.steel);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leg=b(-1,-1,2,32,8,2,M.steel);leg.rotation.y=a;}b(-30,-10,5,32,64,4,M.steel);b(25,-10,5,32,64,4,M.steel);}chair(875,100,Math.PI/2);chair(980,243,Math.PI,true);
box(755,180,36,185,8,67,M.black);for(let i=0;i<3;i++)for(let j=0;j<3;j++){panel(791,181+i*61.3,1,59.8,9+j*22,20.5,M.steel,'書房九抽收納');}
// Build the study cabinet directly on the west wall, facing east.
panel(755,180,2,185,75,110,M.black);panel(790,180,1,185,75,110,M.glass,'書房模型玻璃門');for(let z=75;z<=185;z+=36){box(755,180,36,185,z,1.5,M.glass);line(787,181,z+2,1,183);for(let yy=207;yy<365;yy+=61){box(767,yy,8,8,z+2,18,M.grey);ball(771,yy+4,z+25,5,5,5,M.white);}}
for(let yy=180;yy<=365;yy+=61)box(789,yy,2,2,75,110,M.steel);
for(let z=185;z<245;z+=28){box(755,0,36,365,z,2,M.steel);for(let yy=4;yy<360;yy+=8)box(760,yy,24,5,z+2,20,[M.grey,M.black,M.white][Math.floor(yy/8)%3]);}box(755,0,2,365,185,60,M.black);
// Walk-in closet: open steel shelving and rails instead of solid white masses.
function wardrobe(x,y,w,d,face){const along=w>d;box(x,y,w,d,0,8,M.black);box(x,y,w,d,240,3,M.black);if(along){box(x,y,2,d,0,245,M.steel);box(x+w-2,y,2,d,0,245,M.steel);}else{box(x,y,w,2,0,245,M.steel);box(x,y+d-2,w,2,0,245,M.steel);}for(const z of [100,205]){if(along){box(x+4,y+d/2,w-8,2,z,2,M.steel);for(let xx=x+10;xx<x+w-5;xx+=10)box(xx,y+9,3,d-18,z-67,61,(xx/10)%2?M.cloth:M.grey);}else{box(x+w/2,y+4,2,d-8,z,2,M.steel);for(let yy=y+10;yy<y+d-5;yy+=11)box(x+9,yy,w-18,3,z-67,61,(yy/11)%2?M.grey:M.darkcloth);}}info(box(x,y,w,d,215,2,M.steel),'開放式更衣櫃','55cm深；開放吊衣配置依既有規劃，衣物為示意。');}
info(wall(555,80,60,40,275),'更衣室管道間','按客變輪廓補入，60×40cm原圖配準輪廓，截面待複量。','客變P-02');wardrobe(580,0,110,55,'S');wardrobe(690,0,55,260,'W');wardrobe(580,205,110,55,'N');panel(582,207,58,1,20,180,M.mirror,'更衣鏡');cabinet(420,81,60,35,0,100,'飾品櫃（暫置）','S');display(420,81,60,35,75,'首飾展示（暫置）','S',true).position.y=100;
// Kitchen rebuilt from 2026 elevations. Dimensions cm; side filler retained.
function drawer(x,y,w,d,z,h,face,name){box(x,y,w,d,z,h,M.black);const front=face==='E'?x+w:x-1;panel(front,y+.6,1,d-1.2,z+.6,h-1.2,M.steel,name);panel(face==='E'?front+1:front-1,y+3,1,d-6,z+h-2,1,M.black);}
box(0,646.3,65,308.7,84,2.4,M.grey,fittings,'A區308.7cm石材檯面');
cabinet(0,648.15,63,120,12,72,'A區120cm雙開水槽櫃','E',M.steel);
info(box(0,768.15,60,60,0,84,M.black),'SMI8ZCS00X半嵌洗碗機','60cm獨立設備位，保留外露操作面板。','2026廚具圖／revised報價');panel(63,768.8,1,58.6,12,60.6,M.steel);panel(64,768.8,1,58.6,73,10,M.blackglass);line(65,775,78,1,20);
drawer(0,828.15,63,100,12,48,'E','爐下深抽');drawer(0,828.15,63,100,60,24,'E','爐下淺抽');cabinet(0,928.15,63,20,12,72,'20cm側拉籃','E',M.steel);box(0,948.15,65,6.85,0,84,M.steel);
box(9,843,49,90,86.5,.8,M.screen,fittings,'三口瓦斯爐');[854,888,921].forEach(y=>{cyl(33,y,87.3,8.5,1,M.steel);box(20,y-1,26,2,89,1,M.black);box(32,y-12,2,24,89,1,M.black);});
info(box(0,833.15,42,90,162,24,M.steel),'BELEGA水幕式油煙機','90cm寬；吊掛底162cm，雙風管示意。','廚具立面A');box(0,848.15,37,60,186,54,M.steel);[864,895].forEach(y=>cyl(18,y,215,7.6,25,M.steel));panel(1,833.15,1,90,87,15.4,M.steel);
box(11,653,45,78,86.5,.7,M.steel,fittings,'78cm雙層水槽');box(14,656,39,72,86.9,.4,M.rubber);box(16,658,35,68,87.3,.15,M.grey);cyl(8,692,86.4,1.2,32,M.black);box(8,691,22,2,116,2,M.black,fittings,'FRANKE PT193G霧黑伸縮龍頭');cyl(29,692,108,1.4,10,M.black);
cabinet(0,650,37,80,186,32,'烘碗機上方80cm雙開櫃','E',M.steel);box(0,650,37,80,146,40,M.black,fittings,'Rinnai RKD-186S(B)懸吊烘碗機');panel(37,652,1,76,149,33,M.blackglass);line(39,654,148,1,72);
// B: north-to-south fridge, separator, 70+70 drawer cabinets and fillers.
box(155,751.25,60,60,12,225.7,M.black,fittings,'Liebherr嵌入冰箱櫃');for(const [z,h] of [[12,57],[70,107.7],[178.7,59]])panel(154,751.85,1,58.8,z,h-1,M.steel,'Liebherr上下門／上方收納');[67,81].forEach(z=>panel(152,757,2,48.8,z,1.5,M.steel));for(let i=0;i<8;i++)panel(153,755+i*6.5,1,3,2,8,M.rubber,'冰箱踢腳通風');box(155,811.25,60,1.9,0,239.7,M.steel);
for(const [y,levels] of [[813.15,[18,18,36]],[883.15,[36,36]]]){let z=12;for(const h of levels){drawer(152,y,63,70,z,h,'W','B區70cm抽屜');z+=h;}box(180,y,35,70,177.7,60,M.black);panel(178,y+1,1,68,179,57,M.glass,'70cm電動上掀玻璃櫃');for(const yy of [y+1,y+68])box(176,yy,2,2,177.7,60,M.steel);box(176,y,2,70,177.7,2,M.steel);box(176,y,2,70,235.7,2,M.steel);line(177,y+2,177,1,66);}
box(150,813.15,65,141.85,84,2.4,M.grey,fittings,'B區141.85cm檯面');box(190,813.15,25,141.85,141.7,2,M.steel,fittings,'B區36cm高層架');panel(214,813.15,1,141.85,86.4,55.3,M.grey);line(189,814,141,1,138);
// C: 80+60+60, one oven and three appliance garages.
cabinet(1.85,492,80,60,12,225.7,'C區80cm收納高櫃','S',M.steel);
for(const x of [81.85,141.85]){box(x,492,60,62,12,225.7,M.black);cabinet(x,492,60,62,163.3,74.4,'C區上櫃','S',M.steel);panel(x+1,554,58,1,13,28,M.steel,'C區底抽');for(const z of [42,103.3]){const isOven=x===81.85&&z===103.3;panel(x+.25,555,59.5,1,z,59.5,M.blackglass,isOven?'BOSCH HSG7361B1':'Best G-931503電器收納櫃');panel(x+5,556,50,1,z+5,43,M.screen);line(x+7,557,z+51,46);if(isOven){const knob=new T.Mesh(new T.CylinderGeometry(3,3,2,20),M.steel);knob.rotation.x=Math.PI/2;knob.position.copy(pos(x+30,557,z+55));fittings.add(knob);}}}
// Bath fixtures and shower screens are proposals aligned to plan equipment zones.
function basin(x,y,w=60,d=48,face='S'){const north=face==='N',back=north?y+d:y,fy=north?back-4:back+4;const c=cabinet(x,y,w,d,25,50,'懸吊浴櫃',face,M.black);if(north){c.userData.desc='主浴檯面約130×60cm，依原圖比例估算；靠圖面下側牆，使用側朝上。尺寸待實測。';c.userData.source='業主指正＋客變平面圖';}box(x-1,y-1,w+2,d+2,75,3,M.grey);ball(x+w/2,y+d/2,79,Math.min(w*.34,28),d*.28,5,M.ceramic);ball(x+w/2,y+d/2,82,Math.min(w*.27,23),d*.22,2,M.grey);cyl(x+w/2,fy,78,1.2,16,M.black);box(x+w/2-1,north?fy-12:fy,2,12,92,2,M.black);panel(x,back-1,w,1,100,80,M.mirror,'浴室鏡櫃');line(x,back-2,99,w);}
function toilet(x,y,north=false){if(north){box(x+3,y+52,32,18,0,72,M.ceramic,fittings,'主浴馬桶・朝北');ball(x+19,y+29,25,19,31,24,M.ceramic);ball(x+19,y+28,45,17,25,4,M.ceramic);ball(x+19,y+28,48,11,18,1.6,M.grey);return;}box(x+3,y,32,18,0,72,M.ceramic,fittings,'馬桶（設備示意）');ball(x+19,y+34,25,19,31,24,M.ceramic);ball(x+19,y+35,45,17,25,4,M.ceramic);ball(x+19,y+35,48,11,18,1.6,M.grey);}
basin(-75,423,130,60,'N');toilet(70,406,true);glazing(140,373,4,100,0,220);openDoor(140,300,73,'V',true,'主浴淋浴玻璃門',-.9);box(155,313,139,151,.4,1,M.grey);const tubShape=new T.Shape();tubShape.absellipse(0,0,39,76,0,Math.PI*2,false);const hole=new T.Path();hole.absellipse(0,0,33,68,0,Math.PI*2,true);tubShape.holes.push(hole);const tub=new T.Mesh(new T.ExtrudeGeometry(tubShape,{depth:47,bevelEnabled:true,bevelSize:1,bevelThickness:1,bevelSegments:3,curveSegments:32}),M.ceramic);tub.rotation.x=-Math.PI/2;tub.position.copy(pos(247,390,0));fittings.add(tub);info(tub,'浴缸','依平面浴缸區配置；78×152cm為代理幾何，實品待確認。');ball(247,390,9,32,66,3,M.white);box(161,310,2,2,80,132,M.steel);box(161,310,16,2,210,2,M.steel);cyl(169,311,208,8,2,M.steel);
basin(496,218,66,45);toilet(426,235);box(421,295,141,64,.2,.8,M.grey,fittings,'客浴地面');
// Storage utility shelves and suitcases.
for(const z of [8,55,105,155,205])box(584,274,55,85,z,2,M.steel,fittings,z===8?'儲藏室鐵件層架':undefined);for(const x of [584,637])for(const y of [274,357])box(x,y,2,2,0,240,M.steel);for(let z=57;z<205;z+=50)box(590,282,40,55,z,32,M.grey);box(657,274,60,45,0,85,M.black,fittings,'儲藏收納（暫置）');
box(290,817,30,50,0,75,M.black,fittings,'行李箱收納');box(329,817,30,42,0,60,M.grey);box(292,822,4,3,75,12,M.steel);
// Rear balcony: open outer edge, laundry tower facing the access aisle.
info(box(-78,812,70,80,0,185,M.steel),'LG洗衣塔','靠廚房側，塔式洗乾衣機；型號及外徑待選。','客變P-03／原HTML');
for(const z of [45,140]){const a=new T.Mesh(new T.CylinderGeometry(23,23,2,32),M.blackglass);a.rotation.x=Math.PI/2;a.position.copy(pos(-43,811,z));fittings.add(a);}
panel(-75,810,64,1,89,9,M.blackglass);basin(-190,508,65,55);cabinet(-125,498,117,56,0,275,"後陽台水槽右側頂天收納櫃","S",M.black);
for(const y of [662,780]){box(-200,y,43,98,8,66,M.white,fittings,'室外機（2台）');for(const yy of [y+25,y+73]){const fan=new T.Mesh(new T.CylinderGeometry(18,18,2,28),M.rubber);fan.rotation.z=Math.PI/2;fan.position.copy(pos(-155,yy,42));fittings.add(fan);}for(const yy of [y+5,y+88])box(-202,yy,49,5,0,8,M.steel);}
// Additional concrete beam proxies and integrated ceiling equipment bands.
[[0,910,445,45],[700,910,385,45],[1040,375,45,505],[315,365,725,40]].forEach(([x,y,w,d])=>info(box(x,y,w,d,245,70,M.concrete,beams),'補入樑體・待竣工複量','依結構圖位置補示意，梁寬深及完成面高度仍待確認。'));
[[770,390,260,20],[790,55,20,210]].forEach(([x,y,w,d])=>{box(x,y,w,d,259,15,M.black,ceiling);for(let k=0;k<3;k++)box(x+2+k*4,y+2,w>20?w-4:1,d>20?d-4:1,258,1,M.rubber,ceiling);});
box(652,295,50,50,273,1,M.grey,ceiling,'設備檢修口');
// Curtains use actual small repeated pleats, not opaque flat slabs over the openings.
for(let y=847;y<880;y+=7)cyl(1074,y,0,3,245,M.cloth);for(let y=89;y<130;y+=8)cyl(1077,y,0,4,235,M.cloth);for(let y=90;y<140;y+=7)cyl(-70,y,0,3.5,235,M.cloth);
track(780,415,240,3);track(770,690,3,180);track(375,430,260,3);track(775,60,260,3);track(775,60,3,260);track(70,60,280,3);track(70,60,3,150);
[[830,720],[560,590],[915,180],[190,150],[645,135],[100,740],[355,847],[490,292],[210,385],[668,314],[-145,700]].forEach(p=>pointLight(p[0],p[1],240,.42,480));
line(780,415,266,250,1,ceiling);line(70,60,266,280,1,ceiling);line(580,28,238,100);line(711,60,238,1,175);

// Close the gaps above custom built-in cabinets to the local ceiling / beam underside.
for(const [x,y,w,d,z,name] of [[755,0,36,365,245,'書房整面櫃頂封板'],[580,0,110,55,245,'更衣北櫃頂封板'],[690,0,55,260,245,'更衣東櫃頂封板'],[580,205,110,55,245,'更衣南櫃頂封板'],[155,751.25,60,60,237.7,'廚房冰箱櫃頂封板'],[180,813.15,35,141.85,237.7,'廚房玻璃上櫃頂封板']]){const top=finishHeight(x+w/2,y+d/2);if(top>z)box(x,y,w,d,z,top-z,M.black,fittings,name);}

// BEGIN INTERIOR FINISH
// Runs inside the model closure. Physical finishes use centimetre-scaled UVs.
let finishSeed=7291;
function finishRandom(){finishSeed=(1664525*finishSeed+1013904223)>>>0;return finishSeed/4294967296;}
function finishTexture(kind){
 const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),im=ctx.createImageData(512,512);
 const grids=[8,24,64].map(n=>({n,v:Array.from({length:n*n},finishRandom)}));
 function noise(x,y,g){const u=x/512*g.n,v=y/512*g.n,i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j;const f=t=>t*t*(3-2*t),at=(i,j)=>g.v[(j%g.n)*g.n+i%g.n];return (at(i,j)*(1-f(a))+at(i+1,j)*f(a))*(1-f(b))+(at(i,j+1)*(1-f(a))+at(i+1,j+1)*f(a))*f(b);}
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const grain=finishRandom()-.5;
  const cloud=(noise(x,y,grids[0])-.5)*2+(noise(x,y,grids[1])-.5)+(noise(x,y,grids[2])-.5)*.5;
  let v=kind==='fabric'?180+grain*35+((x%4<2)===(y%4<2)?17:-17):kind==='metal'?192+grain*9+Math.sin(y*2.4)*5:185+cloud*(kind==='floor'?4:9)+grain*12;
  if(kind==='stone'){const vein=noise(x,y,grids[0])+noise(x,y,grids[1])*.2;v+=Math.max(0,1-Math.abs(vein-.53)*95)*20;}
  const i=(y*512+x)*4;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;
 }
 ctx.putImageData(im,0,0);
 if(kind==='floor'){ctx.strokeStyle='#696b6c';ctx.lineWidth=1.2;ctx.strokeRect(0,0,512,512);}
 const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
const finishMaps={stone:finishTexture('stone'),concrete:finishTexture('concrete'),fabric:finishTexture('fabric'),metal:finishTexture('metal'),floor:finishTexture('floor')};
function applyFinish(m,kind,color,roughness,scale,bump){m.color.set(color).convertSRGBToLinear();m.map=finishMaps[kind];m.bumpMap=finishMaps[kind];m.bumpScale=bump;m.roughness=roughness;m.envMapIntensity=.65;m.userData.finishScale=scale;m.needsUpdate=true;}
applyFinish(M.floor,'floor','#a6a6a3',.57,90,.11);
applyFinish(M.concrete,'concrete','#747572',.91,110,.08);
applyFinish(M.black,'metal','#272828',.49,75,.025);
applyFinish(M.steel,'metal','#383a3c',.36,65,.018);M.steel.metalness=.68;
applyFinish(M.cloth,'fabric','#737573',.95,45,.075);
applyFinish(M.darkcloth,'fabric','#424544',.98,45,.065);
applyFinish(M.linen,'fabric','#e2dfd6',.96,35,.06);
const stoneFinish=mat('#8d8e89',.36,.02);applyFinish(stoneFinish,'stone','#8d8e89',.4,100,.04);
const ceilingFinish=M.concrete.clone();applyFinish(ceilingFinish,'concrete','#454746',.96,130,.025);roof.material=ceilingFinish;
const rugFinish=M.cloth.clone();applyFinish(rugFinish,'fabric','#a29e94',1,9,.08);
const duvetFinish=M.linen.clone();
M.glass.color.set('#d4ddde').convertSRGBToLinear();M.glass.opacity=.13;M.glass.roughness=.04;M.glass.metalness=.05;M.glass.envMapIntensity=.7;
M.blackglass.color.set('#171a1b').convertSRGBToLinear();M.blackglass.roughness=.19;M.blackglass.metalness=.42;M.blackglass.envMapIntensity=.7;
M.light.color.set('#fff1d7');
// Assign stone to horizontal counters; preserve all existing dimensions.
scene.updateMatrixWorld(true);
fittings.traverse(o=>{if(!o.isMesh)return;const b=new T.Box3().setFromObject(o),sz=b.getSize(new T.Vector3());if(o.material===M.grey&&sz.y<5&&Math.max(sz.x,sz.z)>55)o.material=stoneFinish;if(o.userData.name==='265×340短毛地毯')o.material=rugFinish;if(o.material===M.white&&sz.x>170&&sz.z>130&&sz.y<5)o.material=duvetFinish;});
// Upholstered back cushions and piping fit within the approved sofa footprint.
for(const [x,w] of [[819,60],[885,60],[952,62]]){const p=box(x,508,w,17,49,31,M.cloth);p.rotation.x=-.12;}
for(const [x,y,a] of [[819,528,.18],[985,533,-.24]]){const p=box(x,y,29,18,49,29,M.linen);p.rotation.z=a;p.rotation.x=-.18;}
for(const [x,y,w,d] of [[817,510,64,72],[883,510,64,72],[951,510,66,137]]){
 const pts=[[x+3,y+3],[x+w-3,y+3],[x+w-3,y+d-3],[x+3,y+d-3],[x+3,y+3]].map(([a,b])=>pos(a,b,48.2));
 const seam=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:'#858782'}));fittings.add(seam);
}
// Fine ribbing on media speaker fronts gives their acoustic fabric a readable surface.
for(const x of [775,1030])for(let j=0;j<12;j++)box(x+2+j*2.2,915.6,.35,.3,6,86,M.rubber);
// Centimetre UVs on each face prevent stretched grain across walls and countertops.
scene.updateMatrixWorld(true);
scene.traverse(o=>{if(!o.isMesh||!o.material.userData.finishScale)return;const g=o.geometry.clone(),p=g.attributes.position,n=g.attributes.normal;const uv=[];const scale=o.material.userData.finishScale;
 for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const normal=new T.Vector3().fromBufferAttribute(n,i).transformDirection(o.matrixWorld);const a=[Math.abs(normal.x),Math.abs(normal.y),Math.abs(normal.z)];if(a[1]>=a[0]&&a[1]>=a[2])uv.push(v.x/scale,v.z/scale);else if(a[0]>=a[2])uv.push(v.z/scale,v.y/scale);else uv.push(v.x/scale,v.y/scale);}
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.type=o.geometry.type;g.parameters=o.geometry.parameters;o.geometry=g;
});
// Local shadowed downlights add depth while retaining navigation performance.
const finishLights=[];
for(const [x,y,tx,ty] of [[920,645,925,620],[535,570,535,490],[190,120,190,35]]){
 const l=new T.SpotLight('#fff1dc',.65,650,Math.PI*.38,.72,1);l.position.copy(pos(x,y,266));l.target.position.copy(pos(tx,ty,35));l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.bias=-.0003;l.shadow.normalBias=.3;scene.add(l,l.target);finishLights.push(l);
}
roomLights.forEach(l=>l.color.set('#fff2df'));
hemi.color.set('#f3f5f7');hemi.groundColor.set('#706d67');
scene.userData.interiorFinish={version:1,style:'黑白灰現代工業風',physicalMaterials:true,worldScaleTextures:true,sofaDetail:true,shadowedDownlights:3};

// END INTERIOR FINISH
const ROOMS=[
{id:'all',n:'全戶鳥瞰',en:'OVERVIEW',p:[1350,1500,1400],t:[485,465,30],note:'整戶材質與配置總覽；拖曳旋轉、點選物件可查看設計依據。',label:[500,470]},
{id:'living',n:'客廳・中島',en:'LIVING',p:[570,700,157],t:[961,651,113],note:'L 型沙發依紅框後移約70cm，貴妃段靠窗；中島側保留通道，家具尺寸待選。',label:[925,700]},
{id:'island',n:'中島・雙面櫃',en:'ISLAND DISPLAY',p:[720,725,158],t:[535,474,130],note:'260×30cm頂天雙面玻璃櫃：前後透視、黑鐵框與玻璃層板，保留後方通道。',label:[535,474]},
{id:'entry',n:'玄關',en:'ENTRY',p:[676,935,155],t:[558,770,108],note:'250cm 連續收納：150cm 高櫃＋100cm 低櫃，維持進門開闊視線。',label:[610,865]},
{id:'kitchen',n:'廚房',en:'KITCHEN',p:[109,930,158],t:[112,533,122],note:'依 2026-09-01 圖重排 A／B／C 區；黑色金屬、黑玻電器及灰石檯面。',label:[100,704]},
{id:'bed',n:'主臥',en:'BEDROOM',p:[360,264,155],t:[190,20,115],note:'180×202 床、左右黑玻高櫃、灰軟包與投影層板；床尾通道依原規劃。',label:[185,140]},
{id:'closet',n:'更衣室',en:'WARDROBE',p:[632,180,155],t:[655,75,125],note:'開放吊衣、黑鐵層架與飾品櫃；左段及管道間鄰接處仍需現場複核。',label:[625,132]},
{id:'study',n:'雙人書房',en:'STUDY',p:[1035,220,160],t:[785,142,130],note:'兩張180×80升降桌、超寬螢幕、模型櫃及漫畫牆；可切換玻璃霧化。',label:[930,170]},
{id:'collection',n:'收藏室',en:'COLLECTION',p:[425,853,152],t:[285,885,120],note:'公共面245cm玻璃展示，內部精品包與行李收納；入口依東側改門提案。',label:[350,845]},
{id:'bath1',n:'主浴',en:'BATH 01',p:[49,314,158],t:[172,449,103],note:'灰石紋、黑鐵玻璃淋浴隔間、浴缸與鏡櫃；衛浴外型為新增提案。',label:[170,390]},
{id:'bath2',n:'客浴',en:'BATH 02',p:[548,345,151],t:[468,245,98],note:'保留原設備區位；以黑灰浴櫃、白色陶瓷及鏡面補足明暗層次。',label:[490,286]},
{id:'storage',n:'儲藏室',en:'STORAGE',p:[706,350,155],t:[610,294,115],note:'黑鐵開放層架與封閉收納；內容物為示意，設備檢修空間需整合。',label:[665,315]},
{id:'back',n:'後陽台',en:'UTILITY',p:[-95,605,155],t:[-102,840,98],note:'洗衣、洗手台與設備區概念；外機及給排水依正式機電圖複核。',label:[-130,690]},
];
ROOMS.slice(1).forEach(r=>roomLabel(r.n,...r.label));
function updateWalls(){const cut=$('cut').checked;wallParts.forEach(({m,z,h})=>{const hh=cut?Math.max(0,Math.min(z+h,85)-z):h;m.visible=hh>.1;m.scale.y=hh/h;m.position.y=z+hh/2;});beams.visible=$('ceiling').checked;ceiling.visible=$('ceiling').checked;labels.visible=$('labels').checked;}
function applyCam(){camera.position.set(center.x+radius*Math.sin(pol)*Math.cos(az),center.y+radius*Math.cos(pol),center.z+radius*Math.sin(pol)*Math.sin(az));camera.lookAt(center);}
function selectRoom(id){camera.fov=['closet','collection','bath1','bath2','storage'].includes(id)?65:(id==='island'?55:48);camera.updateProjectionMatrix();current=id;const r=ROOMS.find(r=>r.id===id);center.copy(pos(r.t[0],r.t[1],id==='all'?r.t[2]:165));const p=pos(r.p[0],r.p[1],id==='all'?r.p[2]:165),v=p.clone().sub(center);radius=v.length();pol=Math.acos(v.y/radius);az=Math.atan2(v.z,v.x);camera.fov=id==='all'?48:55;camera.updateProjectionMatrix();$('cut').checked=id==='all';$('ceiling').checked=id!=='all';$('labels').checked=id==='all';mode=id==='all'?'orbit':'look';$('orbit').classList.toggle('active',mode==='orbit');$('look').classList.toggle('active',mode==='look');$('roomtitle').textContent=r.n;$('roomnote').textContent=r.note;document.querySelectorAll('#rooms button').forEach(b=>b.classList.toggle('active',b.dataset.id===id));$('hint').textContent=id==='all'?'拖曳旋轉 · 右鍵拖曳平移 · 滾輪縮放 · 點選物件看規格':'拖曳環視 · W/A/S/D 移動 · 滾輪前後移動 · 可切回旋轉或其他房間';updateWalls();applyCam();window.dispatchEvent(new CustomEvent('roomchange',{detail:id}));}
ROOMS.forEach(r=>{const b=document.createElement('button');b.dataset.id=r.id;b.innerHTML=`<span>${r.n}</span><small>${r.en}</small>`;b.onclick=()=>selectRoom(r.id);$('rooms').appendChild(b);});
['cut','ceiling','labels'].forEach(id=>$(id).onchange=updateWalls);
$('glass').onchange=()=>{wallParts.forEach(({m})=>{if(m.userData.study)m.material=$('glass').checked?M.white:M.glass;});};
['orbit','look'].forEach(id=>$(id).onclick=()=>{mode=id;$('orbit').classList.toggle('active',mode==='orbit');$('look').classList.toggle('active',mode==='look');});
function lighting(){hemi.intensity=night?.24:.57;sun.intensity=night?.08:1.1;fill.intensity=night?.18:.35;roomLights.forEach(l=>l.intensity=night?.8:.58);finishLights.forEach(l=>l.intensity=night?.95:.65);scene.background.set(night?'#151b25':'#262d34');$('day').classList.toggle('active',!night);$('night').classList.toggle('active',night);}
$('day').onclick=()=>{night=false;lighting();};$('night').onclick=()=>{night=true;lighting();};$('brightness').oninput=()=>{renderer.toneMappingExposure=1.05*Number($('brightness').value)/100;$('ev').textContent=$('brightness').value+'%';};
let drag=null;canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,dist:0,pan:e.button===2||e.shiftKey};});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;drag.dist+=Math.abs(dx)+Math.abs(dy);if(drag.pan){const right=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(camera.quaternion);center.addScaledVector(right,-dx*radius*.0012).addScaledVector(up,dy*radius*.0012);}else if(mode==='look'){const p=camera.position.clone();az-=dx*.004;pol=Math.max(.12,Math.min(3.02,pol-dy*.004));center.set(p.x-radius*Math.sin(pol)*Math.cos(az),p.y-radius*Math.cos(pol),p.z-radius*Math.sin(pol)*Math.sin(az));}else{az-=dx*.005;pol=Math.max(.05,Math.min(3.05,pol-dy*.005));}applyCam();});
canvas.addEventListener('pointerup',e=>{if(drag&&drag.dist<5)pick(e);drag=null;});canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();if(mode==='look'){const v=new T.Vector3();camera.getWorldDirection(v);center.addScaledVector(v,e.deltaY>0?-20:20);}else radius=Math.max(70,Math.min(4200,radius*(e.deltaY>0?1.08:.925)));applyCam();},{passive:false});
window.addEventListener('keydown',e=>{if(window.HOME_TOUR&&HOME_TOUR.getMode()!=='model')return;if(!['w','a','s','d','W','A','S','D'].includes(e.key)||e.target.closest('input,textarea,select,[contenteditable]'))return;e.preventDefault();const v=new T.Vector3();camera.getWorldDirection(v);v.y=0;v.normalize();if(e.key.toLowerCase()==='a'||e.key.toLowerCase()==='d')v.cross(camera.up).normalize();center.addScaledVector(v,['w','d'].includes(e.key.toLowerCase())?15:-15);applyCam();});
const ray=new T.Raycaster();function pick(e){const rect=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hits=ray.intersectObjects(pickables.filter(m=>m.parent&&m.visible));const hit=hits[0];if(!hit){$('detail').style.display='none';return;}const u=hit.object.userData;$('detail').style.display='block';$('detail').innerHTML='<button aria-label="關閉">×</button><strong></strong><div></div><small></small>';$('detail').querySelector('strong').textContent=u.name;$('detail').querySelector('div').textContent=u.desc;$('detail').querySelector('small').textContent=u.source;$('detail').querySelector('button').onclick=()=>{$('detail').style.display='none';};}
$('export').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='W夢想之家_'+current+'_'+(night?'夜間':'日間')+'.png';a.href=canvas.toDataURL('image/png');a.click();};$('full').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});};
function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(canvas.parentElement);lighting();selectRoom('all');resize();

function doorPlan(){scene.updateMatrixWorld(true);const paths=[];architecture.traverse(m=>{if(!m.isMesh||!m.userData.name||!m.userData.name.includes('門')||m.geometry.type!=='BoxGeometry')return;m.geometry.computeBoundingBox();const bb=m.geometry.boundingBox;const pts=[[bb.min.x,bb.min.z],[bb.max.x,bb.min.z],[bb.max.x,bb.max.z],[bb.min.x,bb.max.z]].map(([x,z])=>{const p=new T.Vector3(x,0,z).applyMatrix4(m.matrixWorld);return [p.x+482.5,p.z+480];});paths.push({name:m.userData.name,points:pts});});return paths;}
function capturePlan(){
 const cut=100,c=new T.OrthographicCamera(-740,740,545,-545,1,5000);c.position.copy(pos(490,475,2500));c.up.set(0,0,-1);c.lookAt(pos(490,475,0));
 const vis=[beams.visible,ceiling.visible,labels.visible],ws=wallParts.map(w=>[w.m.visible,w.m.scale.y,w.m.position.y]),oldClip=renderer.clippingPlanes,oldShadow=renderer.shadowMap.enabled,oldBg=scene.background;
 const caps=new T.Group();scene.add(caps);scene.updateMatrixWorld(true);const hidden=[];
 fittings.traverse(m=>{if(!m.isMesh)return;const bb=new T.Box3().setFromObject(m);if(bb.min.y>=cut){hidden.push([m,m.visible]);m.visible=false;}else if(bb.max.y>cut&&m.geometry.type==='BoxGeometry'){const w=bb.max.x-bb.min.x,d=bb.max.z-bb.min.z;if(w>3&&d>3){const cap=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({color:m.material.color}));cap.rotation.x=-Math.PI/2;cap.position.set((bb.min.x+bb.max.x)/2,cut-.05,(bb.min.z+bb.max.z)/2);caps.add(cap);}}});
 beams.visible=ceiling.visible=labels.visible=false;wallParts.forEach(({m,z,h})=>{const hh=Math.max(0,Math.min(z+h,cut)-z);m.visible=hh>0;m.scale.y=hh/h;m.position.y=z+hh/2;});renderer.clippingPlanes=[new T.Plane(new T.Vector3(0,-1,0),cut)];renderer.shadowMap.enabled=false;scene.background=new T.Color('#e3e6e7');
 const size=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio();renderer.setPixelRatio(1);renderer.setSize(1924,1417,false);renderer.render(scene,c);const url=canvas.toDataURL('image/png');
 hidden.forEach(([m,v])=>m.visible=v);scene.remove(caps);caps.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});renderer.clippingPlanes=oldClip;renderer.shadowMap.enabled=oldShadow;scene.background=oldBg;[beams.visible,ceiling.visible,labels.visible]=vis;wallParts.forEach((w,i)=>{[w.m.visible,w.m.scale.y,w.m.position.y]=ws[i];});renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);renderer.render(scene,camera);return url;
}
function captureRoom(id){
 selectRoom(id);const vis=[labels.visible,beams.visible,ceiling.visible];labels.visible=false;if(id==='all'){beams.visible=ceiling.visible=false;}
 const size=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;renderer.setPixelRatio(1);renderer.setSize(1920,1440,false);camera.aspect=4/3;camera.updateProjectionMatrix();renderer.render(scene,camera);const url=canvas.toDataURL('image/png');renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();[labels.visible,beams.visible,ceiling.visible]=vis;return url;
}

function frame(){requestAnimationFrame(frame);if(!window.HOME_PANORAMA||!HOME_PANORAMA.getState().active){if(window.HOME_REALISM)HOME_REALISM.render();else renderer.render(scene,camera);}}frame();window.HOME_VIEWER={finishContext:{materials:M,stoneMaterial:stoneFinish,ceilingMaterial:ceilingFinish,rugMaterial:rugFinish,duvetMaterial:duvetFinish,hemi,sun,fill,roomLights,finishLights},syncWalkCamera:()=>{const d=new T.Vector3();camera.getWorldDirection(d);radius=100;center.copy(camera.position).addScaledVector(d,radius);const v=camera.position.clone().sub(center);pol=Math.acos(v.y/radius);az=Math.atan2(v.z,v.x);mode="look";},doorPlan,capturePlan,captureRoom,selectRoom,scene,camera,renderer,rooms:ROOMS,wallParts,architecture,fittings,beams,ceiling,labels,pos,nudge:(action)=>{if(action==='home'){selectRoom(current);return;}if(action==='left'||action==='right'){const p=camera.position.clone();az+=(action==='left'?-.25:.25);if(mode==='look')center.set(p.x-radius*Math.sin(pol)*Math.cos(az),p.y-radius*Math.cos(pol),p.z-radius*Math.sin(pol)*Math.sin(az));}else if(mode==='look'){const v=new T.Vector3();camera.getWorldDirection(v);center.addScaledVector(v,action==='in'?25:-25);}else radius=Math.max(70,Math.min(4200,radius*(action==='in'?.9:1.1)));applyCam();},getCurrent:()=>current};
})();


