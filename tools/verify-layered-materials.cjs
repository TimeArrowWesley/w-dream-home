'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const out=path.resolve('調整紀錄/20260911工業材質層次');
const baselineFile=path.join(os.tmpdir(),'w-home-industrial-layered-before.json');
const baseline=fs.existsSync(baselineFile)?JSON.parse(fs.readFileSync(baselineFile,'utf8')).files:null;
const filter=process.argv.find(x=>x.startsWith('--versions='));
const versions=filter?filter.split('=')[1].split(',').map(Number):[1,2,3,4];
function shape(f){const all=[];f.V.scene.updateMatrixWorld(true);for(const g of [f.V.architecture,f.V.fittings])g.traverse(o=>{if(o.isMesh)all.push(JSON.stringify({points:Array.from(o.geometry.attributes.position.array),index:o.geometry.index?Array.from(o.geometry.index.array):null,matrix:o.matrixWorld.elements}));});return crypto.createHash('sha256').update(all.sort().join('\n')).digest('hex');}
function textureRange(t){const p=t.image.__pixels.data;let min=255,max=0;for(let i=0;i<p.length;i+=4){min=Math.min(min,p[i]);max=Math.max(max,p[i]);}return max-min;}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const report={method:'Offline source geometry, actual procedural map pixels and perspective-correct UV software rendering. Reflections, GPU shaders and final lighting are not visually verified.',versions:[]};
 for(const version of versions){
  const old=baseline?await build(version+1,baseline):null,f=await build(version+1),{V,c,T,E}=f,A=c.HOME_INDUSTRIAL;
  assert.equal(A.getState().revision,'20260911-layered');assert.equal(A.getState().references,22);
  if(old)assert.equal(shape(f),shape(old),'Materials cannot change the approved geometry');
  assert.equal(E.items.length,24);assert.equal(c.HOME_CURTAINS.getState().length,6);assert.equal(c.HOME_STORAGE_MODEL.shelves.length,6);
  const walnut=A.materials.walnut.color.clone().convertLinearToSRGB();assert(walnut.r-walnut.b>.15,'Wood must read as deep brown, not neutral grey');
  assert(A.materials.stainless.metalness>.8);assert(A.materials.stainless.roughness<.4);assert(A.materials['matte-black'].roughness>.7);
  assert(textureRange(A.textures['smoked-walnut'])>50);assert(textureRange(A.textures['island-v'+version])>70,'Stone veins must remain visible');
  assert.equal(Object.keys(A.textures).length,6);for(const t of Object.values(A.textures)){assert(t.image.width<=512);assert(t.image.height<=1024);}
  const roles={};V.fittings.traverse(o=>{const role=o.userData.industrialRole;if(role)roles[role]=(roles[role]||0)+1;if(o.isMesh&&o.material?.userData?.finishId&&o.geometry.attributes.uv)for(const v of o.geometry.attributes.uv.array)assert(Number.isFinite(v));});
  assert(roles['island-stone']===1);assert(roles['sink-stainless']>=3);assert(roles['bath-walnut']>0);assert(roles['kitchen-stainless']>0);
  if(version===2)assert(roles['small-island-stainless']>=5);if(version>=3)assert(roles['island-reeded-wood']>=3);
  if(version===4)assert(roles['fixed-tv-black-glass']===1);if(version===2||version===3)assert(roles['tv-metal']>=10);
  c.HOME_COMFORT.setScene('bar');assert.equal(c.HOME_COMFORT.getState().brightness,14);assert(V.finishContext.hemi.intensity<.1);
  c.HOME_COMFORT.update({kelvin:4000});assert.equal(c.HOME_COMFORT.getState().brightness,14);c.HOME_COMFORT.setScene('daily');
  for(const id of ['kitchen','storage']){c.HOME_INTERACTION.setDoor(id,true);f.tick(80,50);assert(c.HOME_INTERACTION.getState().entries.find(e=>e.key===id).angle>.99);c.HOME_INTERACTION.setDoor(id,false);f.tick(80,50);}
  const ray=new T.Raycaster(),floorMeshes=[c.HOME_FLOORING.floor,...c.HOME_FLOORING.entry.children];V.scene.updateMatrixWorld(true);let samples=0;
  for(let x=547;x<714;x+=3.7)for(let y=807;y<954;y+=3.7){if(c.HOME_FLOORING.finishAt(x,y)!=='large-format-stone')continue;ray.set(V.pos(x,y,2),new T.Vector3(0,-1,0));const hits=ray.intersectObjects(floorMeshes);assert(hits.length);assert(hits.filter(h=>h.point.y>.19).length<=1);samples++;}
  const state={version:'v'+version,geometryUnchanged:old?true:null,equipment:24,entryFloorSamples:samples,roles,textures:6,woodIsBrown:true,stoneVeins:true,independentLighting:true,doors:true};report.versions.push(state);console.log(JSON.stringify(state));
  if(!process.argv.includes('--no-images')){
   const living=version===1?{p:[750,745,161],t:[535,515,114]}:version===4?{p:[735,727,167],t:[917,945,104]}:{p:[1010,735,165],t:[540,565,100]};
   const island=version===1?{p:[748,685,165],t:[551,583,80]}:version===2?{p:[588,706,157],t:[470,558,77]}:{p:[657,838,169],t:[465,624,75]};
   const views=[{id:'v'+version,room:'living',name:'V'+version+'公共區',...living},{id:'v'+version+'-island',room:'island',name:'V'+version+'中島材質',...island}];
   if(old)render({T:old.T,V:old.V,version:'before',out,views,textured:true});render({T,V,version:'after',out,views,textured:true});
   if(version===1)render({T,V,version:'after',out,textured:true,views:[{id:'entry',room:'entry',name:'玄關',p:[746,863,159],t:[572,773,93]},{id:'bedroom',room:'bed',name:'主臥',p:[360,264,155],t:[185,22,103]},{id:'kitchen',room:'kitchen',name:'廚房',p:[109,930,158],t:[110,533,120]},{id:'study',room:'study',name:'書房',p:[1038,319,155],t:[770,150,135]}]});
  }
 }
 fs.writeFileSync(path.join(out,filter?'partial-verification.json':'驗證.json'),JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
