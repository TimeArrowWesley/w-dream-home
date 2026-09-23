'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),{collision}=require('./verify-model-repairs.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20260923V1V4影音統一');
const mesh=g=>{const a=[];g.traverse(o=>{if(o.isMesh)a.push(o);});return a;};
const sig=gs=>gs.flatMap(mesh).map(o=>{o.updateWorldMatrix(true,false);return JSON.stringify([o.userData.name||o.name,crypto.createHash('sha256').update(Buffer.from(o.geometry.attributes.position.array.buffer)).digest('hex'),o.matrixWorld.elements]);}).sort();
function blockers(f,extra=[]){const a=[];for(const g of [f.V.architecture,f.V.fittings])g.traverse(o=>{if(!o.isMesh||o.userData.allowance||o.geometry.type==='PlaneGeometry')return;for(let p=o;p;p=p.parent)if(!p.visible)return;const b=f.bounds(o);if(b.z<180&&b.z+b.h>8&&b.y+b.d>350)a.push({name:o.userData.name||o.name||o.parent.name,b});});return a.concat(extra.map(b=>({name:'兩席使用包絡',b})));}
function findRoute(f,start,end,extra=[]){const solids=blockers(f,extra),step=5,points=[],nodes=new Map();
 const blocked=(x,y)=>solids.some(({b})=>{const dx=x-Math.max(b.x,Math.min(x,b.x+b.w)),dy=y-Math.max(b.y,Math.min(y,b.y+b.d));return dx*dx+dy*dy<900-.05;});
 const ix=p=>p.map(x=>Math.round(x/step)*step),s=ix(start),e=ix(end),key=p=>p.join(','),q=[s];nodes.set(key(s),null);let found=false;
 for(let i=0;i<q.length;i++){const p=q[i];if(key(p)===key(e)){found=true;break;}for(const [dx,dy] of [[5,0],[-5,0],[0,5],[0,-5]]){const n=[p[0]+dx,p[1]+dy],k=key(n);if(n[0]<550||n[0]>1085||n[1]<325||n[1]>950||nodes.has(k)||blocked(...n))continue;nodes.set(k,p);q.push(n);}}
 if(found){let p=e;while(p){points.unshift(p);p=nodes.get(key(p));}}
 let samples=0,hit=null;for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];for(let j=0;j<=5;j++){const p=[a[0]+(b[0]-a[0])*j/5,a[1]+(b[1]-a[1])*j/5];samples++;if(blocked(...p))hit=p;}}
 return {found,samples,hit,path:points,diameterCm:60};
}
(async()=>{const report={revision:'20260923-au01',units:'cm',limits:'指定60cm通行包絡與模型幾何比較，非人体、聲學或施工核定；窗側48cm不算主要通道。',versions:[]};
for(const [n,v] of [[2,'v1'],[5,'v4']]){
 const before=await build(n,{'living-audio-unification.js':'','living-audio-finalize.js':''}),f=await build(n);
 for(const x of [before,f]){x.c.HOME_REALISM.render=()=>{};x.c.HOME_REALISM.invalidate=()=>{};for(const p of x.V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}x.V.scene.updateMatrixWorld(true);}
 assert.deepEqual(sig([before.V.beams]),sig([f.V.beams]),'beams unchanged');
 const keep=x=>x.E.items.filter(o=>!['tv','q6','q7','sub','avr','ps5','switch2','switch2dock'].includes(o.userData.equipment.key));const ka=sig(keep(before)),kb=sig(keep(f)),kd={before:ka.filter(x=>!kb.includes(x)),after:kb.filter(x=>!ka.includes(x))};fs.writeFileSync(path.join(R,v+'-equipment-diff.json'),JSON.stringify(kd,null,2));if(kd.before.length||kd.after.length)console.log(JSON.stringify(kd));assert.equal(kd.before.length+kd.after.length,0,'kitchen/private equipment unchanged');
 const storage=x=>x.V.fittings.children.filter(o=>/收藏|行李|精品包|展示/.test(o.name));assert.deepEqual(sig(storage(before)),sig(storage(f)),'storage unchanged');
 const A=f.c.HOME_LIVING_AUDIO.audio;
 const actual=f.E.items.filter(o=>['tv','q7','sub'].includes(o.userData.equipment.key)).map(o=>({key:o.userData.equipment.key,b:JSON.parse(JSON.stringify(f.bounds(o),(k,v)=>typeof v==='number'?Math.round(v*1000)/1000:v))})).sort((a,b)=>a.key.localeCompare(b.key)||a.b.x-b.b.x);
 const r={version:v,audio:A,actual,retained:{beams:true,storage:true,kitchenPrivateEquipment:true},routes:{},ceilingBeamHits:[]};
 for(const s of f.V.ceiling.children.filter(o=>o.name.includes('高度聲道')))for(const a of mesh(s))for(const b of mesh(f.V.beams))if(collision(f,a,b))r.ceilingBeamHits.push(s.name);
 assert.equal(r.ceilingBeamHits.length,0,'height speaker/beam');
 for(const d of f.c.HOME_INTERACTION.getState().entries.filter(d=>/入戶|書房|廚房/.test(d.name)))f.c.HOME_INTERACTION.setDoor(d.id,true);f.tick(80,50);
 const extra=v==='v4'?f.c.HOME_V4_PUBLIC.seatedProxies:[];
 r.routes.entryToStudy=findRoute(f,[605,925],[830,350],extra);
 r.routes.pulledSeats=findRoute(f,[605,925],[830,350],extra.map(b=>({...b,x:b.x+20})));
 r.routes.islandToStudy=findRoute(f,v==='v4'?[680,700]:[730,700],[830,350],extra);
 r.windowGapCm=1085-A.sofa.x-A.sofa.w;r.frontAngles=A.front.map(p=>Math.atan2(Math.abs(p.x-A.listener.x),p.y-A.listener.y)*180/Math.PI);
 r.screenHorizontalAngle=2*Math.atan(184.7/2/A.viewingDistanceCm)*180/Math.PI;
 r.rearAngles=A.surrounds.map(p=>90+Math.atan2(A.listener.y-p.y,Math.abs(p.x-A.listener.x))*180/Math.PI);
 report.versions.push(r);fs.writeFileSync(path.join(R,'驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({version:v,routes:Object.fromEntries(Object.entries(r.routes).map(([k,a])=>[k,{found:a.found,samples:a.samples,hit:a.hit}])),angles:r.frontAngles,viewAngle:r.screenHorizontalAngle,rear:r.rearAngles,window:r.windowGapCm}));
 assert(Object.values(r.routes).every(r=>r.found&&!r.hit),'Main routes');
}
assert.equal(JSON.stringify(report.versions[0].actual),JSON.stringify(report.versions[1].actual),'V1/V4 TV, front speakers and subs positions identical');
assert.equal(JSON.stringify(report.versions[0].audio),JSON.stringify(report.versions[1].audio),'Shared audiovisual specification');
report.passed=true;fs.writeFileSync(path.join(R,'驗證.json'),JSON.stringify(report,null,2));console.log('AU01 checks passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
