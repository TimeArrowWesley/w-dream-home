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
 for(const [x,y] of [[230,900],[672,930]])assert(cabinets.some(c=>x>c.x&&x<c.x+c.w&&y>c.y&&y<c.y+c.d),'owner-marked floor recess is closed');
 for(const c of cabinets)assert(!overlap(c,{x:553,y:915,w:107,d:40}),'entrance retains full 107cm threshold');
 const display=cabinets.find(c=>c.id==='display'),deep=cabinets.find(c=>c.id==='deep-storage');assert.equal(deep.y+deep.d,display.y,'left run joins south run');assert.equal(display.x,deep.x+deep.w,'working glass doors clear deep cabinet');
 assert.equal(i.w*i.d,28500);assert.equal(i.x-315,110);assert.equal(619.5-(i.x+i.w),99.5);
 assert(Math.abs(p.y-(i.y+i.d)-100.1)<.001);assert(Math.abs(660-(p.x+p.w)-114.8)<.001);
 // Walk the two intended centerlines with an 18cm body radius, against proposal solids.
 const audio=snapshot.audio, ear=audio.listener;
 const walls=JSON.parse(read('調整紀錄/20260910設備整合/幾何驗證.json')).variants.v2.walls.filter(w=>w.z<=100&&w.h>=1&&!(Math.abs(w.x-435)<1&&Math.abs(w.y-875)<1));
 const fixtures=[i,p,...cabinets,audio.tvBase,{x:900,y:464,w:95,d:240},{x:835,y:620,w:65,d:84},{x:788,y:518,w:62,d:62},{x:230,y:499,w:85,d:91.2},{x:690,y:915,w:385,d:40},...walls];
 for(const q of audio.floorSpeakers){
  for(const b of fixtures)assert(!overlap(q,b),q.id+' overlaps fixed furnishing or wall');
  for(const b of audio.floorSpeakers)if(q!==b)assert(!overlap(q,b),q.id+' overlaps '+b.id);
 }
 const mains=audio.floorSpeakers.filter(q=>q.model==='KEF Q7 Meta');assert.equal(mains.length,2);
 const distances=mains.map(q=>Math.hypot(ear.x-q.x-q.w,ear.y-q.cy));
 assert(Math.abs(distances[0]-distances[1])<.01,'front baffles equidistant from middle sofa seat');
 for(const q of mains){
  assert.equal(q.w,31.5);assert.equal(q.d,31.7);assert.equal(q.height,100.1);
  const angle=Math.atan2(Math.abs(q.cy-ear.y),ear.x-q.x-q.w)*180/Math.PI;
  assert(angle>=22&&angle<=30,'front placement angle around main seat');
  const t=audio.tvPivot,dx=Math.max(q.x-t.x,0,t.x-q.x-q.w),dy=Math.max(q.y-t.y,0,t.y-q.y-q.d);
  assert(Math.hypot(dx,dy)-t.sweepRadius>=10,'actual Q7 footprint clears full TV sweep by >=10cm');
 }
 assert(Math.abs(Math.abs(mains[0].cy-mains[1].cy)-audio.frontCenterSpacing)<.001);
 assert.equal(audio.floorSpeakers.filter(q=>q.model==='SVS SB-2000 Pro').length,2);
 const surrounds=audio.floorSpeakers.filter(q=>q.id==='SL'||q.id==='SR');assert.equal(surrounds.length,2);
 for(const q of surrounds){const angle=Math.acos((ear.x-q.cx+6.3)/Math.hypot(q.cx-6.3-ear.x,q.cy-ear.y))*180/Math.PI;assert(angle>=110&&angle<=120,'surround azimuth behind main seat');assert.equal(q.centerHeight,110);}
 const cc=audio.center,tb=audio.tvBase;assert(cc.x>=tb.x&&cc.x+cc.w<=tb.x+tb.w+.001&&cc.y>=tb.y&&cc.y+cc.d<=tb.y+tb.d,'center speaker fits fixed console');
 const entry=cabinets.find(q=>q.id==='entry'),southMain=mains.find(q=>q.id==='L'),northMain=mains.find(q=>q.id==='R');
 assert(entry.y-southMain.y-southMain.d>=104,'south cross aisle >=104cm');
 assert(northMain.y-375>=90,'north cross aisle not squeezed by Q7');
 assert.equal(audio.tvPivot.y,ear.y);assert.equal(audio.tvBase.y+audio.tvBase.d/2,ear.y);
 const obstacles=[...fixtures,...audio.floorSpeakers];
 for(const route of [[[603,943],[603,840],[578,818],[562,758],[714,735]],[[350,700],[350,845],[423,845],[555,845],[603,840]]]){
  for(let k=1;k<route.length;k++){const a=route[k-1],b=route[k],length=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let u=0;u<=length;u+=1){const x=a[0]+(b[0]-a[0])*u/length,y=a[1]+(b[1]-a[1])*u/length;for(const o of obstacles){const dx=Math.max(o.x-x,0,x-o.x-o.w),dy=Math.max(o.y-y,0,y-o.y-o.d);assert(Math.hypot(dx,dy)>=18,'concept centerline meets obstacle');}}}
 }
 // The entrance ray reaches the finished island end without hitting the retained column.
 const [sx,sy]=snapshot.arrival.eye,[tx,ty]=snapshot.arrival.focus;
 for(let t=0;t<1;t+=.001){const x=sx+(tx-sx)*t,y=sy+(ty-sy)*t;for(const q of [p,...cabinets,audio.tvBase,...audio.floorSpeakers])assert(!(x>q.x&&x<q.x+q.w&&y>q.y&&y<q.y+q.d),'arrival sightline blocked before island end');}
 assert.equal(snapshot.arrival.focus[1],i.y+i.d);
 report.concept={footprintCm:snapshot.island,clearances:snapshot.nominalClearances,routesChecked:2,routeBodyRadius:18,audio:{floorSpeakers:audio.floorSpeakers.length,frontSpacing:audio.frontCenterSpacing,frontDistance:audio.frontBaffleDistance,angle:audio.frontBaffleAngleDegrees,northPassage:audio.northPassage,southPassage:audio.southPassage,minimumTVSweepGap:10,collisionCheckedAgainst:'floor speakers, fixed furniture and retained walls'},arrivalRayClear:true,actual3DChanged:false};
 report.hashes=Object.fromEntries(['layout-version.js','提案/旋轉電視與直線中島/layout-version.js','design.js','提案/旋轉電視與直線中島/design.js','assets/ai-interiors/catalog.js','提案/開放大中島/格局尺寸.json'].map(f=>[f,crypto.createHash('sha256').update(read(f)).digest('hex')]));
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.versions,null,2));console.log('Two current versions, retained layout fingerprints, south-wall shower, 24 photo mappings and V3 proposal clearances passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
