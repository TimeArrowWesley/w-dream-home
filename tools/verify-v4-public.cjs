const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs'),{collision}=require('./verify-model-repairs.cjs');
const R=path.resolve(__dirname,'..'),P=path.join(R,'調整紀錄/20260923V4公共區更新');
const overrides={'v4-public-adjustments.js':'','v4-public-finalize.js':''};
const mesh=g=>{const a=[];g.traverse(o=>{if(o.isMesh)a.push(o);});return a;};
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
function sig(objects){return objects.map(o=>{o.updateWorldMatrix(true,false);return JSON.stringify({name:o.userData.name||o.name,geo:crypto.createHash('sha256').update(Buffer.from(o.geometry.attributes.position.array.buffer)).digest('hex'),mat:o.matrixWorld.elements});}).sort();}
function solids(f){const a=[];for(const g of [f.V.architecture,f.V.fittings])g.traverse(o=>{if(o.isMesh&&visible(o)&&!o.userData.allowance&&o.geometry.type!=='PlaneGeometry'){const b=f.bounds(o);if(b.z<180&&b.z+b.h>8&&b.x+b.w>200&&b.y+b.d>350)a.push({o,b});}});return a;}
function route(f,points,extra=[]){const a=[...solids(f),...extra.map((b,i)=>({o:{name:'坐人／拉椅包絡 '+i},b}))];let samples=0,hits=[];for(let n=1;n<points.length;n++){const p=points[n-1],q=points[n],steps=Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/3);for(let k=0;k<=steps;k++){const x=p[0]+(q[0]-p[0])*k/steps,y=p[1]+(q[1]-p[1])*k/steps;samples++;for(const {o,b} of a){const dx=x-Math.max(b.x,Math.min(x,b.x+b.w)),dy=y-Math.max(b.y,Math.min(y,b.y+b.d));if(dx*dx+dy*dy<900-.05){if(hits.length<15)hits.push({at:[x,y],name:o.userData?.name||o.name||o.parent?.name});break;}}}}return {diameter:60,samples,hits};}
(async()=>{const report=fs.existsSync(path.join(P,'驗證.json'))?JSON.parse(fs.readFileSync(path.join(P,'驗證.json'),'utf8')):{revision:'20260923-v4r02',date:'2026-09-23',units:'cm',limits:'Offline source geometry; sampled movement and 60cm conservative route proxies, not human/site/engineering certification.',versions:[]};
for(const [v,n] of [[4,5]]){
 const before=await build(n,overrides),after=await build(n);console.log('built V'+v);
 for(const f of [before,after]){f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};for(const p of f.V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}f.V.scene.updateMatrixWorld(true);}
 const {V,c,T}=after,p=c.HOME_V4_PUBLIC;
 assert.deepEqual(sig(mesh(before.V.beams)),sig(mesh(V.beams)),'fixed beams');
 const wallFilter=o=>!/(南牆灰礦物|南牆灰石完成面|玄關面客廳封板|玄關低櫃背面)/.test(o.userData.name||'');
 const wa=sig(before.V.wallParts.map(p=>p.m).filter(wallFilter)),wb=sig(V.wallParts.map(p=>p.m).filter(wallFilter));
 const wallDiff={beforeOnly:wa.filter(x=>!wb.includes(x)),afterOnly:wb.filter(x=>!wa.includes(x))};if(wallDiff.beforeOnly.length||wallDiff.afterOnly.length){fs.writeFileSync(path.join(P,'wall-diff.json'),JSON.stringify(wallDiff,null,2));throw Error('Unexpected fixed wall changes; see wall-diff.json');}
 const safeEquipment=f=>f.E.items.filter(o=>!['tv','q6','avr','ps5','switch2','switch2dock',...(v===4?['q7','sub']:[])].includes(o.userData.equipment.key)).flatMap(mesh);
 const ea=sig(safeEquipment(before)),eb=sig(safeEquipment(after));const equipmentDiff={beforeOnly:ea.filter(x=>!eb.includes(x)),afterOnly:eb.filter(x=>!ea.includes(x))};fs.writeFileSync(path.join(P,'v'+v+'-equipment-diff.json'),JSON.stringify(equipmentDiff,null,2));
 const collection=f=>f.V.fittings.children.filter(o=>/收藏|行李|精品包|展示/.test(o.name)).flatMap(mesh);
 assert.deepEqual(sig(collection(before)),sig(collection(after)),'collection/storage meshes');
 const r={version:'v'+v,records:p.records,retained:{fixedWalls:true,beams:true,kitchenAndPrivateEquipment:equipmentDiff.beforeOnly.length===0&&equipmentDiff.afterOnly.length===0,collectionMeshes:true},routes:{},views:[]};
 const entries=c.HOME_INTERACTION.getState().entries;
 for(const d of entries.filter(d=>/入戶|書房|廚房|收藏室/.test(d.name)))c.HOME_INTERACTION.setDoor(d.id,true);
 after.tick(80,50);
 for(const [name,points] of Object.entries(p.routes)){r.routes[name]=route(after,points,p.seatedProxies);console.log('V'+v+' '+name+': '+r.routes[name].hits.length+' hits');}
 // Pull-out cases include both diners, checked separately from the resting seats.
 const pulled=p.seatedProxies.map(b=>({...b,...(v===2?{y:b.y+20}:{x:b.x+20})}));
 r.routes.pulledChairsMain=route(after,p.routes.entryToStudy,pulled);
 if(v===2){
  const tv=c.HOME_ROTATING_TV,targets=[...mesh(p.table),...p.seats.flatMap(mesh),...mesh(tv.island)],hits=[];
  for(let a=0;a<=90;a++){tv.pivot.rotation.y=-a*Math.PI/180;tv.pivot.updateMatrixWorld(true);for(const x of tv.rotatingMeshes)for(const y of targets)if(collision(after,x,y)){hits.push({deg:-a,other:y.userData.name||y.name});break;}}
  r.tvSweep={samples:91,hits};tv.pivot.rotation.y=0;tv.pivot.updateMatrixWorld(true);
  c.HOME_ROTATING_TV_CONTROLS.setTarget('island');after.tick(100,50);r.controller=c.HOME_ROTATING_TV_CONTROLS.getState();assert.equal(r.controller.angle,-90);assert.equal(r.controller.facing,'island');
  c.HOME_ROTATING_TV_CONTROLS.setTarget('living');after.tick(100,50);
  r.tvSeatAngles=[590,650].map(x=>({seat:[x,760],degreesFromForward:Math.atan2(Math.abs(647-x),760-550)*180/Math.PI}));
 }else{
  const speakers=V.ceiling.children.filter(o=>o.name.includes('高度聲道'));r.ceilingSpeakerBeamHits=[];for(const s of speakers)for(const x of mesh(s))for(const b of mesh(V.beams))if(collision(after,x,b))r.ceilingSpeakerBeamHits.push(s.name);
  r.actual={sofaMinX:Math.min(...c.HOME_SOFA.parts.map(o=>after.bounds(o).x)),windowInnerX:1085};
 }
 assert(Object.values(r.routes).every(x=>x.hits.length===0),'All specified V4 routes');assert.equal(r.ceilingSpeakerBeamHits.length,0);assert(r.retained.kitchenAndPrivateEquipment);
 report.versions=report.versions.filter(q=>q.version!==r.version);report.versions.push(r);fs.writeFileSync(path.join(P,'驗證.json'),JSON.stringify(report,null,2));
}
console.log('report written');})().catch(e=>{console.error(e);process.exitCode=1;});
