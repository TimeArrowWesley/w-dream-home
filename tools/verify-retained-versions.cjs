'use strict';
// Actual source geometry; optional baseline confirms that renumbering preserves layouts.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),cp=require('child_process');
const build=require('./home-test-fixture.cjs'),root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8'),out=path.join(root,'調整紀錄/20260910版本精簡');
const ref=process.argv.find(a=>a.startsWith('--baseline='))?.slice(11);
const baselineDirectory=process.argv.find(a=>a.startsWith('--snapshot='))?.slice(11);
const snapshot=JSON.parse(read('提案/開放大中島/格局尺寸.json'));
const report={method:'Actual retained model geometry, source layout bootstraps and concept dimensions. No GPU rendering.',baseline:ref||baselineDirectory||null,versions:{}};
function signatures({V,bounds},old=false){
 V.scene.updateMatrixWorld(true);const entries=[];
 V.scene.traverse(o=>{if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(p.name==='主浴南牆淋浴組')return;
  const b=bounds(o),eq=(v,w)=>Math.abs(v-w)<.02;
  if(old&&((eq(b.x,161)&&eq(b.y,310)&&[80,210].some(z=>eq(z,b.z)))||(eq(b.x,161)&&eq(b.y,303)&&eq(b.z,208))))return;
  entries.push(JSON.stringify({position:crypto.createHash('sha256').update(Buffer.from(o.geometry.attributes.position.array.buffer)).digest('hex'),matrix:o.matrixWorld.elements,color:o.material?.color?.getHex(),opacity:o.material?.opacity}));
 });return entries.sort();
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 for(const [n,id,low] of [[2,'v1',true],[3,'v2',false]]){
  const f=await build(n),{V,c,bounds}=f;
  assert.equal(c.HOME_LAYOUT.version,id);assert.equal(c.HOME_LAYOUT.isV2,low);
  const shower=V.scene.getObjectByName('主浴南牆淋浴組');assert(shower);
  const b=bounds(shower);assert(b.x>=165&&b.x+b.w<212,'shower left of bathtub');assert(b.y>440&&b.y+b.d<=483.01,'shower inside south wall');
  const mounts=shower.children.filter(o=>o.userData.name==='淋浴桿固定座');assert.equal(mounts.length,2);
  for(const m of mounts){const q=bounds(m);assert(Math.abs(q.y+q.d-483)<.01,'mount touches wall at y483');}
  assert(V.wallParts.some(({m})=>{const q=bounds(m);return q.x<166&&q.x+q.w>202&&Math.abs(q.y-483)<.01;}),'actual backing wall');
  for(const angle of [0,-Math.PI/2]){const door=V.architecture.children.find(g=>g.userData.interactiveDoor?.name==='主浴淋浴玻璃門');door.rotation.y=angle;V.scene.updateMatrixWorld(true);const q=bounds(door);assert(q.y+q.d<b.y,'door does not swing into new shower');}
  // Return doors to their initial positions before comparing untouched geometry.
  for(const g of V.architecture.children)if(g.userData.interactiveDoor)g.rotation.y=g.userData.interactiveDoor.initialAngle;
  let baselinePreserved=null;
  if(ref||baselineDirectory){
   const file=n<3?'design.js':'提案/旋轉電視與直線中島/design.js';
   const oldSource=baselineDirectory?fs.readFileSync(path.join(root,baselineDirectory,file),'utf8'):cp.execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
   const old=await build(n,{[file]:oldSource});
   const before=signatures(old,true),after=signatures(f);assert.equal(crypto.createHash('sha256').update(after.join('\n')).digest('hex'),crypto.createHash('sha256').update(before.join('\n')).digest('hex'),'all non-shower mesh geometry/transforms/material colors preserved from retained original');baselinePreserved=before.length;
  }
  report.versions[id]={sourceOriginalVersion:'v'+n,lowEntrance:low,showerBounds:b,wallMounts:2,clearOfTubAndDoor:true,unchangedNonShowerMeshes:baselinePreserved};
  if(n===2)require('./render-home-review.cjs')({T:f.T,V,version:id,out,views:[{id:'bath-south-wall',room:'bath1',name:'主浴南牆淋浴位置',p:[192,328,168],t:[192,480,137]}]});
 }
 const c={window:{}};vm.runInNewContext(read('assets/ai-interiors/catalog.js'),c);
 assert.deepEqual(Object.keys(c.window.HOME_AI_PHOTOS),['v1','v2']);
 for(const [id,photos] of Object.entries(c.window.HOME_AI_PHOTOS)){assert.equal(new Set(photos.map(p=>p.room)).size,12);for(const p of photos)assert(fs.existsSync(path.join(root,p.src)),id+': missing photo '+p.src);}
 assert(c.window.HOME_AI_PHOTOS.v1.find(p=>p.room==='entry').src.includes('entry-v2'));
 assert(c.window.HOME_AI_PHOTOS.v2.find(p=>p.room==='entry').src.includes('entry-v3'));
 const {island:i,preservedColumn:p,cabinets}=snapshot;
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.d&&a.y+a.d>b.y;
 for(const a of [p,...cabinets])assert(!overlap(i,a),'island overlaps fixed item');
 assert.equal(i.w*i.d,28500);assert.equal(i.x-315,110);assert.equal(619.5-(i.x+i.w),99.5);
 assert(Math.abs(p.y-(i.y+i.d)-100.1)<.001);assert(Math.abs(665-(p.x+p.w)-119.8)<.001);
 // Walk the two intended centerlines with an 18cm body radius, against proposal solids.
 const obstacles=[i,p,...cabinets,{x:619.5,y:460,w:55,d:200},{x:900,y:464,w:95,d:240},{x:835,y:620,w:65,d:84}];
 for(const route of [[[603,943],[603,840],[578,818],[562,758],[714,735]],[[350,700],[350,845],[423,845],[555,845],[603,840]]]){
  for(let k=1;k<route.length;k++){const a=route[k-1],b=route[k],length=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let u=0;u<=length;u+=1){const x=a[0]+(b[0]-a[0])*u/length,y=a[1]+(b[1]-a[1])*u/length;for(const o of obstacles){const dx=Math.max(o.x-x,0,x-o.x-o.w),dy=Math.max(o.y-y,0,y-o.y-o.d);assert(Math.hypot(dx,dy)>=18,'concept centerline meets obstacle');}}}
 }
 report.concept={footprintCm:snapshot.island,clearances:snapshot.nominalClearances,routesChecked:2,routeBodyRadius:18,actual3DChanged:false};
 report.hashes=Object.fromEntries(['layout-version.js','提案/旋轉電視與直線中島/layout-version.js','design.js','提案/旋轉電視與直線中島/design.js','assets/ai-interiors/catalog.js','提案/開放大中島/格局尺寸.json'].map(f=>[f,crypto.createHash('sha256').update(read(f)).digest('hex')]));
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.versions,null,2));console.log('Two current versions, retained layout fingerprints, south-wall shower, 24 photo mappings and V3 proposal clearances passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
