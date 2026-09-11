'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const out=path.resolve('調整紀錄/20260911客浴拉門收口'),snapshot=path.join(os.tmpdir(),'w-home-door-jamb-before.json');
const before=fs.existsSync(snapshot)?JSON.parse(fs.readFileSync(snapshot,'utf8')).files:null;
function meshes(f){const a=[];f.V.scene.updateMatrixWorld(true);for(const g of [f.V.architecture,f.V.fittings])g.traverse(o=>{if(o.isMesh)a.push(o);});return a;}
function changed(f,o){if(o.userData.guestDoorClosure)return true;const n=o.userData.name||o.name;if(/客浴雙聯滑門|雙聯滑門上軌/.test(n))return true;const b=f.bounds(o);return Math.abs(b.x-570)<.01&&Math.abs(b.y-217)<.01&&Math.abs(b.w-10)<.01;}
function others(f){return meshes(f).filter(o=>!changed(f,o)).map(o=>{const h=crypto.createHash('sha256');h.update(Buffer.from(o.geometry.attributes.position.array.buffer));if(o.geometry.index)h.update(Buffer.from(o.geometry.index.array.buffer));return JSON.stringify({geometry:h.digest('hex'),matrix:o.matrixWorld.elements});}).sort();}
function visible(f,origin,target){const ray=new f.T.Raycaster(),a=f.V.pos(...origin),b=f.V.pos(...target),d=b.clone().sub(a);ray.set(a,d.clone().normalize());ray.far=d.length();return ray.intersectObjects(meshes(f).filter(o=>changed(f,o)),false).length===0;}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const report={method:'Source mesh comparison, oblique sight rays and actual door/walk controls. Images are offline geometry/texture renders; no GPU visual acceptance.',versions:[]};
 for(let v=1;v<=4;v++){
  const old=before?await build(v+1,before):null,f=await build(v+1),{c,V,T}=f;
  V.selectRoom('living');old?.V.selectRoom('living');if(old)assert.deepStrictEqual(others(f),others(old),'All unrelated room and equipment geometry unchanged');
  assert.equal(f.E.items.length,24);assert.equal(c.HOME_CURTAINS.getState().length,6);
  const group=V.scene.getObjectByName('客浴外掛雙聯滑門'),leaves=group.children.filter(o=>o.userData.slideRatio);assert.equal(leaves.length,2);
  assert.equal(c.HOME_INTERACTION.setDoor('bath2',false),true);f.tick(80,50);
  let blocked=0,oldLeaks=0;
  for(const h of [15,70,120,180,208])for(const x of [563,564,565,566]){const from=[610,465,h],to=[x,355,h];assert(!visible(f,from,to),'Closed door must hide the room at an oblique angle');blocked++;if(old&&visible(old,from,to))oldLeaks++;}
  assert(!visible(f,[530,465,230],[530,355,230]),'Header closes the hole above the track');
  if(old)assert(oldLeaks>0,'Regression rays reproduce the photographed gap');
  assert(!c.HOME_WALK.canStand(530-482.5,379-480),'Closed guest door blocks access');
  const views=[{id:'guest-door',room:'bath2',name:'客浴拉門東南斜向檢視',p:[610,465,160],t:[548,374,110]}];
  if(v===1&&!process.argv.includes('--no-images')){if(old)render({T:old.T,V:old.V,version:'before',out,views,textured:true});render({T,V,version:'after',out,views,textured:true});}
  c.HOME_INTERACTION.setDoor('bath2',true);f.tick(80,50);assert.equal(c.HOME_INTERACTION.getState().entries.find(e=>e.key==='bath2').angle,1);
  for(const leaf of leaves){const b=f.bounds(leaf);assert(b.x+b.w<=490,'Both parked leaves clear the complete 80cm opening');assert(b.x>=415,'Parked leaves remain on the existing 75cm wall');}
  for(const x of [511,530,549])for(let y=342;y<=420;y+=6)assert(c.HOME_WALK.canStand(x-482.5,y-480),'Open doorway blocks walking at '+x+','+y);
  if(v===1&&!process.argv.includes('--no-images'))render({T,V,version:'open',out,views:[{id:'guest-door',room:'bath2',name:'客浴雙聯門全開',p:[535,435,160],t:[530,345,108]}],textured:true});
  c.HOME_INTERACTION.setDoor('bath2',false);f.tick(80,50);assert(!visible(f,[610,465,120],[565,355,120]),'Reclosed door still seals the gap');
  report.versions.push({version:'v'+v,otherGeometryUnchanged:old?true:null,oldObliqueLeaks:old?oldLeaks:null,closedSightRaysBlocked:blocked,headerClosed:true,clearOpeningCm:80,closedLeafBounds:leaves.map(o=>{const b=f.bounds(o);return {x:b.x,width:b.w};}),openAndClose:true,walkRouteSamples:42});
  console.log('V'+v+': oblique gap blocked, header closed, 80cm opening and walking passed.');
 }
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
