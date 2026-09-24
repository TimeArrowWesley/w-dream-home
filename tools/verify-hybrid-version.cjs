'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),{collision}=require('./verify-model-repairs.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20260924版本重編與V3');
const mesh=g=>{const a=[];g.traverse(o=>{if(o.isMesh)a.push(o);});return a;};
const sig=gs=>gs.flatMap(mesh).map(o=>{o.updateWorldMatrix(true,false);return JSON.stringify([o.userData.name||o.name,crypto.createHash('sha256').update(Buffer.from(o.geometry.attributes.position.array.buffer)).digest('hex'),o.matrixWorld.elements]);}).sort();
function blockers(f,extra=[]){const a=[];for(const g of [f.V.architecture,f.V.fittings])g.traverse(o=>{if(!o.isMesh||o.userData.allowance||o.geometry.type==='PlaneGeometry')return;for(let p=o;p;p=p.parent)if(!p.visible)return;const b=f.bounds(o);if(b.z<180&&b.z+b.h>8&&b.y+b.d>350)a.push({name:o.userData.name||o.name||o.parent.name,b});});return a.concat(extra.map(b=>({name:'兩席使用包絡',b})));}
function findRoute(f,start,end,extra=[],minX=550){const solids=blockers(f,extra),step=5,points=[],nodes=new Map();
 const blocked=(x,y)=>solids.some(({b})=>{const dx=x-Math.max(b.x,Math.min(x,b.x+b.w)),dy=y-Math.max(b.y,Math.min(y,b.y+b.d));return dx*dx+dy*dy<900-.05;});
 const ix=p=>p.map(x=>Math.round(x/step)*step),s=ix(start),e=ix(end),key=p=>p.join(','),q=[s];nodes.set(key(s),null);let found=false;
 for(let i=0;i<q.length;i++){const p=q[i];if(key(p)===key(e)){found=true;break;}for(const [dx,dy] of [[5,0],[-5,0],[0,5],[0,-5]]){const n=[p[0]+dx,p[1]+dy],k=key(n);if(n[0]<minX||n[0]>1085||n[1]<325||n[1]>950||nodes.has(k)||blocked(...n))continue;nodes.set(k,p);q.push(n);}}
 if(found){let p=e;while(p){points.unshift(p);p=nodes.get(key(p));}}
 let samples=0,hit=null;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];for(let j=0;j<=5;j++){const p=[a[0]+(b[0]-a[0])*j/5,a[1]+(b[1]-a[1])*j/5];samples++;if(blocked(...p))hit=p;}}
 return {found,samples,hit,path:points,diameterCm:60};
}

(async()=>{
 const [old,f,v1]=await Promise.all([build(5),build(6),build(2)]);
 for(const x of [old,f,v1]){x.c.HOME_REALISM.render=()=>{};x.c.HOME_REALISM.invalidate=()=>{};for(const p of x.V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}x.V.scene.updateMatrixWorld(true);}
 assert.deepEqual(sig([old.V.architecture,old.V.beams,old.V.ceiling]),sig([f.V.architecture,f.V.beams,f.V.ceiling]),'fixed shell unchanged');
 const islandName=o=>o.name==='V4 開放長中島'||o.name==='V4 中島東側活動椅'||o.name==='中島頂天雙面玻璃櫃'||o.name==='曲線設備中島'||/^V1 圓弧/.test(o.name);
 const keep=x=>x.V.fittings.children.filter(o=>!islandName(o)&&!(o.userData.allowance&&/酒櫃|掃地機|中島|飲水|IH/.test(o.name)));
 const a=sig(keep(old)),b=sig(keep(f));const diff={before:a.filter(x=>!b.includes(x)),after:b.filter(x=>!a.includes(x))};fs.writeFileSync(path.join(R,'outside-island-diff.json'),JSON.stringify(diff,null,2));
 assert.equal(diff.before.length+diff.after.length,0,'other fittings unchanged');
 const donor=x=>x.V.fittings.children.filter(o=>o.name==='中島頂天雙面玻璃櫃'||o.name==='曲線設備中島'||/^V1 圓弧/.test(o.name));
 const geometry=gs=>gs.flatMap(mesh).map(o=>{o.updateWorldMatrix(true,false);return JSON.stringify([crypto.createHash('sha256').update(Buffer.from(o.geometry.attributes.position.array.buffer)).digest('hex'),o.matrixWorld.elements]);}).sort();
 assert.deepEqual(geometry(donor(f)),geometry(donor(v1)),'V1 island, glass and stool geometry copied exactly');
 assert.deepEqual(JSON.parse(JSON.stringify(f.c.HOME_LIVING_AUDIO.audio)),JSON.parse(JSON.stringify(old.c.HOME_LIVING_AUDIO.audio)),'AU01 preserved');
 for(const d of f.c.HOME_INTERACTION.getState().entries.filter(d=>/入戶|書房|廚房/.test(d.name)))f.c.HOME_INTERACTION.setDoor(d.id,true);f.tick(80,50);
 const H=f.c.HOME_HYBRID,extra=f.c.HOME_V4_PUBLIC.seatedProxies,pulled=extra.map((p,i)=>({...p,x:p.x+20*H.centers[i].n[0],y:p.y+20*H.centers[i].n[1]}));
 const routes={entryToStudy:findRoute(f,[605,925],[830,350],extra),pulledSeats:findRoute(f,[605,925],[830,350],pulled),islandToStudy:findRoute(f,[735,700],[830,350],extra),entryToKitchen:findRoute(f,[605,925],[180,680],extra,125)};
 // Kitchen access is checked with a wider search domain than the public-area route helper.
 const report={revision:'20260924-vn01',units:'cm',fixedShell:true,nonIslandFittings:true,donorGeometry:true,AU01:true,routes,island:f.bounds(H.island),glass:f.bounds(H.glass),nominal:f.c.HOME_OPEN_ISLAND_SPEC.nominalClearances,limits:'60cm通行包絡、5cm網格與1cm路徑取樣；坐席包絡為模型假設，非人體／施工核定。冰箱開門與中島酒櫃同時使用、雙面玻璃門五金待深化。'};
 fs.writeFileSync(path.join(R,'驗證.json'),JSON.stringify(report,null,2));
 assert(Object.values(routes).every(r=>r.found&&!r.hit),'main routes');report.passed=true;
 fs.writeFileSync(path.join(R,'驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,routes:Object.fromEntries(Object.entries(routes).map(([k,v])=>[k,v.found]))}));
})().catch(e=>{console.error(e);process.exitCode=1;});
