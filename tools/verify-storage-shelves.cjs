'use strict';
// Check the shared storage geometry and existing door/walking code without a browser.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto'),cp=require('child_process');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'調整紀錄/20260911儲藏室可調層架');
const baseline='09b45775041891b2e82ba8981406899414feef3c';
function objects(f){const a=[];for(const g of [f.V.architecture,f.V.fittings])g.traverse(o=>{if(o.isMesh)a.push(o);});return a;}
function recordsOutsideStorage(f){f.V.scene.updateMatrixWorld(true);return objects(f).filter(o=>{const b=f.bounds(o);return !(b.x>=580&&b.x+b.w<=745&&b.y>=270&&b.y+b.d<=365);}).map(o=>JSON.stringify({name:o.userData.name||o.name,geometry:crypto.createHash('sha256').update(Buffer.from(o.geometry.attributes.position.array.buffer)).digest('hex'),matrix:o.matrixWorld.elements,color:o.material?.color?.getHex()})).sort();}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const snapshot=process.argv.indexOf('--before');
 const files=snapshot>=0?JSON.parse(fs.readFileSync(process.argv[snapshot+1],'utf8').replace(/^\uFEFF/,'')).files:{};
 if(snapshot<0)for(const f of ['bedroom-model.js','design.js','提案/旋轉電視與直線中島/design.js'])files[f]=cp.execFileSync('git',['show',baseline+':'+f],{cwd:root,encoding:'utf8',maxBuffer:8e6});
 const report={method:'Actual Three.js meshes and walk colliders; CPU review omits GPU materials and lighting.',baseline,versions:[]};
 for(const n of [2,3,4,5]){
  const before=await build(n,files),f=await build(n),{V,c,bounds,near,overlap}=f,S=c.HOME_STORAGE_MODEL;
  assert(S);assert.equal(S.shelves.length,6);assert(S.shelves.every(g=>g.userData.adjustableShelf.removable&&g.userData.adjustableShelf.pitch===5));
  near(bounds(S.root).z,0,'uprights reach floor');near(bounds(S.root).h,235,'upright height');
  assert.deepEqual(recordsOutsideStorage(f),recordsOutsideStorage(before),'Other rooms, openings and equipment unchanged');
  assert(!objects(f).some(o=>o.userData.name==='儲藏收納（暫置）'),'Temporary cabinet removed');
  const parking={...S.spec.parking,z:.3,h:139.6};
  for(const o of objects(f))assert(!overlap(parking,bounds(o),.1),'Reserved parking intersects '+(o.userData.name||o.name));
  const left=S.shelves.filter(g=>g.userData.adjustableShelf.side==='west'),north=S.shelves.filter(g=>g.userData.adjustableShelf.side==='north');
  near(bounds(north[0]).z,140,'Actual clearance to lowest bracket');near(bounds(north[0]).d,46.2,'Panel and bracket depth');
  assert.deepEqual(Array.from(left,g=>g.userData.adjustableShelf.clearHeight),[45,100,155,210]);
  c.HOME_INTERACTION.setDoor('storage',false);f.tick(80,50);assert(!c.HOME_WALK.canStand(695-482.5,377-480),'Closed sliding door blocks access');
  c.HOME_INTERACTION.setDoor('storage',true);f.tick(80,50);near(c.HOME_INTERACTION.getState().entries.find(e=>e.key==='storage').angle,1,'Door fully open');
  for(let y=340;y<=420;y+=5)assert(c.HOME_WALK.canStand(695-482.5,y-480),'Existing walk access blocked at '+y);
  // A generic roll-in envelope, not a claimed Dolphin specification. Floor finishes excluded.
  const solid=objects(f).filter(o=>bounds(o).z+bounds(o).h>2&&!o.userData.allowance);
  for(let y=274;y<=380;y+=2)for(const o of solid)assert(!overlap({x:657.5,y,z:2,w:75,d:70,h:128},bounds(o),.1),'Sample roll-in route blocked by '+(o.userData.name||o.name));
  const state={version:'v'+(n-1),shelves:6,pitchCm:5,parking:S.spec.parking,doorWidthCm:80,otherRoomsUnchanged:true,walkAccess:true,sampleRollInEnvelope:{w:75,d:70,h:130},actualDolphinEnvelopeVerified:false};report.versions.push(state);
  if(n===2&&process.argv.includes('--images')){
   before.c.HOME_INTERACTION.setDoor('storage',true);before.tick(80,50);
   const views=[{id:'storage',room:'storage',name:'儲藏室由門口看入',p:[695,415,170],t:[657,293,116]}];
   render({T:before.T,V:before.V,version:'before',out,views});render({T:f.T,V,version:'after',out,views});
  }
 }
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.versions,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
