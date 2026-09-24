'use strict';
// VN01: new public V3. Base remains the former V4 construction recipe.
// Curved contour, double-sided display and outer stools are copied verbatim from V1 R05.
(()=>{
const base=window.HOME_OPEN_ISLAND_BUILD;let arcSeats=[],arcGroups={},arcFinishes;
window.HOME_OPEN_ISLAND_BUILD={...base,
 island(ctx){
 const {T,M,pos,box,cyl,ball,info,EQ,fittings}=ctx,comfort=true,revision='V3-VN01',groups={},stools=[];
 const line=(x,y,z,w,d=1,parent=fittings)=>box(x,y,w,d,z,.7,M.light,parent);
 const makeMat=(hex,r=.75,m=0)=>new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness:r,metalness:m});
 const finishes={wood:makeMat('#443a32'),graphite:makeMat('#343c40'),back:makeMat('#666a68'),metal:makeMat('#737d85',.38,.75),fabric:makeMat('#535a60',.95),box:makeMat('#8c7760'),warm:new T.MeshBasicMaterial({color:'#ffe2b5'}),cool:new T.MeshBasicMaterial({color:'#dbeaff'})};
 function group(id,label){const g=new T.Group();g.name=label;g.userData={reviewRevision:revision,reviewGroup:id};fittings.add(g);groups[id]=g;return g;}
 function b(g,x,y,w,d,z,h,mat,label,extra={}){const o=box(x,y,w,d,z,h,mat,g,label);o.userData={...o.userData,reviewRevision:revision,reviewFinish:Object.keys(finishes).find(k=>finishes[k]===mat),...extra};return o;}
const doubleGlass=new T.Group();doubleGlass.name='中島頂天雙面玻璃櫃';doubleGlass.position.set(-.2,0,8.1);fittings.add(doubleGlass);
info(box(405,460,260,30,0,7,M.black,doubleGlass),'中島頂天雙面玻璃櫃','260×30cm 原圖櫃位；目前天花275cm。南北雙面透視玻璃、無實背板，黑鐵細框及玻璃層板。實際高度隨天花完成面調整。','業主紅框確認＋客變260×30櫃位');
box(405,460,260,30,270,5,M.black,doubleGlass);
const glassParts=4,glassPitch=257/glassParts;
for(let i=0;i<=glassParts;i++){const x=405+i*glassPitch;box(x,460,3,3,7,263,M.steel,doubleGlass);box(x,487,3,3,7,263,M.steel,doubleGlass);}
for(const y of [460,489]){for(let i=0;i<glassParts;i++){box(408+i*glassPitch,y,glassPitch-3,1,8,261,M.glass,doubleGlass);box(405+(i+1)*glassPitch-5,y===460?458:490,1.5,2,125,18,M.black,doubleGlass);}}
box(405,463,1,24,8,261,M.glass,doubleGlass);box(664,463,1,24,8,261,M.glass,doubleGlass);
for(const z of (comfort?[48,136,224]:[48,92,136,180,224,268])){box(408,463,254,24,z,1,M.glass,doubleGlass);line(409,467,z-1.3,252,.6,doubleGlass);box(408,465,254,1,z-2,2,M.steel,doubleGlass,'雙面展示層板遮光收邊');}
for(const [x,z] of (comfort?[[433,48],[485,224]]:[[433,48],[536,92],[587,180],[485,224]])){cyl(x,475,z+1,5,15,M.glass,doubleGlass);cyl(x+13,475,z+1,4,12,M.glass,doubleGlass);}
for(const [x,z] of (comfort?[[637,136]]:[[487,48],[637,136],[433,180]])){ball(x,475,z+10,7,6,10,M.black,doubleGlass);cyl(x,475,z+17,3,5,M.black,doubleGlass);}

const IS={"h":95,"north":[[404.8,588.1],[524.9,588.1],[530.63,587.87],[536.24,587.18],[541.7,586.07],[547,584.54],[552.12,582.6],[557.04,580.29],[561.75,577.62],[566.22,574.61],[570.43,571.26],[574.38,567.61],[578.03,563.67],[581.38,559.46],[584.4,554.99],[587.08,550.29],[589.39,545.36],[591.33,540.24],[592.86,534.93],[593.98,529.46],[594.67,523.85],[594.9,518.1],[594.9,498.1]],"south":[[404.8,658.3],[524.8,658],[536.28,657.54],[547.5,656.17],[558.44,653.94],[569.04,650.87],[579.29,647.01],[589.13,642.39],[598.54,637.05],[607.47,631.02],[615.9,624.34],[623.79,617.04],[631.09,609.16],[637.78,600.74],[643.82,591.81],[649.17,582.41],[653.8,572.57],[657.66,562.33],[660.73,551.73],[662.97,540.8],[664.34,529.58],[664.8,518.1],[664.8,498.1]],"n":"中島（彎曲檯面）","s":"2026-09-09 讀取使用者目前 Claude 白模：260×160.2cm，檯面約70cm寬，北端延伸20cm至y498.1，与玻璃櫃南側接合。設備整合稿檯高95cm。"},is=new T.Shape();[...IS.north,...IS.south.slice().reverse()].forEach((p,i)=>i?is.lineTo(p[0]-482.5,-(p[1]-480)):is.moveTo(p[0]-482.5,-(p[1]-480)));is.closePath();

 EQ.appliances(true,is,IS);
 const dining=group('dining','V1 圓弧外側兩席・依業主示意');
 const center=[524.8,518.1],outer=IS.south;
 const i0=outer.findIndex(p=>p[0]===547.5),i1=outer.findIndex(p=>p[0]===643.82);
 const angle=p=>Math.atan2(p[0]-center[0],p[1]-center[1]);
 if(i0<0||i1<0)throw Error('Missing curved counter knots');
 const arc=outer.slice(i0,i1+1),theta0=angle(arc[0]),theta1=angle(arc.at(-1));
 const island=fittings.children.find(g=>g.name==='曲線設備中島'),skins=[];
 island.traverse(o=>{if(!o.isMesh||!o.userData.islandExterior)return;const q=angle([o.position.x+482.5,o.position.z+480]);if(q>theta0&&q<theta1)skins.push(o);});skins.forEach(o=>o.parent.remove(o));
 const inward=p=>{const v=[p[0]-center[0],p[1]-center[1]],r=Math.hypot(...v);return p.map((x,i)=>x-v[i]*25/r);};
 function segment(a,c,z,h,name,mat=finishes.graphite,th=1.6){const dx=c[0]-a[0],dy=c[1]-a[1],len=Math.hypot(dx,dy);const m=b(dining,(a[0]+c[0])/2-th/2,(a[1]+c[1])/2-len/2,th,len,z,h,mat,name);m.rotation.y=Math.atan2(dx,dy);return m;}
 for(let i=1;i<arc.length;i++)segment(inward(arc[i-1]),inward(arc[i]),0,88,'V1 圓弧留膝內縮背板');
 for(const p of [arc[0],arc.at(-1)])segment(inward(p),p,0,88,'V1 留膝側收口');
 for(const i of [0,Math.floor(arc.length/2),arc.length-1])segment(inward(arc[i]),arc[i],88,4,'V1 檯下補強示意・待工程設計',finishes.graphite,3);
 for(const [i,deg] of [23,46].entries()){
  const a=deg*Math.PI/180,n=[Math.sin(a),Math.cos(a)],cx=center[0]+174*n[0],cy=center[1]+174*n[1];
  const g=group('stool-'+i,'V1 圓弧外側圓凳 '+(i+1));g.userData.seatNormal=n;
  for(const [z,r,h,mat,label] of [[0,18,1.2,finishes.graphite,'止滑底座'],[1.2,2.5,58.8,finishes.graphite,'支柱'],[60,20,5,finishes.fabric,'65cm高圓凳座面']]){const m=cyl(cx,cy,z,r,h,mat,g);info(m,'V1 '+label,'依業主外弧兩席示意試排；Ø40座面、座高65cm為提案外形，未選商品。');m.userData.reviewFinish=mat===finishes.fabric?'fabric':'graphite';}
  const foot=new T.Mesh(new T.TorusGeometry(13.5,.8,8,32),finishes.graphite);foot.rotation.x=Math.PI/2;foot.position.copy(pos(cx,cy,27));g.add(foot);foot.userData.reviewFinish='graphite';stools.push(g);
 }

 arcSeats=stools;arcGroups=groups;arcFinishes=finishes;
 const g=fittings.children.find(o=>o.name==='曲線設備中島');
 window.HOME_HYBRID={revision:'20260924-vn01',island:g,glass:doubleGlass,stools,groups,finishes,contour:IS};
 return g;
 },
 living(ctx){
 const f=base.living(ctx);for(const g of f.stools)g.parent.remove(g);f.stools=arcSeats;
 return f;
 }
};
})();
