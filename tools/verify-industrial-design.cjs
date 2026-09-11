'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const out=path.resolve('調整紀錄/20260911黑灰工業風'),arg=process.argv.indexOf('--before'),baselinePath=arg>=0?process.argv[arg+1]:path.join(os.tmpdir(),'w-home-industrial-before.json');
const baseline=fs.existsSync(baselinePath)?JSON.parse(fs.readFileSync(baselinePath,'utf8')):null;
if(baseline)baseline.files['industrial-design.js']='';
function shapeHash(f){f.V.scene.updateMatrixWorld(true);const items=[];for(const g of [f.V.architecture,f.V.fittings])g.traverse(o=>{if(o.isMesh)items.push(JSON.stringify({p:crypto.createHash('sha256').update(Buffer.from(o.geometry.attributes.position.array.buffer)).digest('hex'),matrix:o.matrixWorld.elements}));});return crypto.createHash('sha256').update(items.sort().join('\n')).digest('hex');}
const entryPaths=['index.html','提案/旋轉電視與直線中島/index.html','提案/開放大中島/index.html','提案/南牆電視與開放中島/index.html'];
function lightSnapshot(f){return f.V.finishContext.roomLights.map(l=>({power:l.intensity,color:l.color.getHex()}));}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const report={method:'Actual Three.js geometry, material assignments, controls and floor raycasts offline. Review images show source geometry and base colors; GPU texture/reflection/lighting and physical lux are not verified.',versions:[]};
 for(const n of [2,3,4,5]){
  const before=baseline?await build(n,baseline.files):null,f=await build(n),{c,V,T}=f,version='v'+(n-1),L=c.HOME_COMFORT,F=V.finishContext.industrialFinishes;
  if(before)assert.equal(shapeHash(f),shapeHash(before),'Room, equipment and cabinet geometry must stay unchanged: '+version);
  assert.equal(f.E.items.length,24);assert.equal(c.HOME_INDUSTRIAL.getState().version,version);
  const floor=c.HOME_FLOORING.getState();assert.equal(floor.pattern,'herringbone');assert.equal(floor.entry.pattern,'large-format-stone');assert.equal(floor.entry.tileCm,80);
  assert.equal(c.HOME_CURTAINS.getState().length,6);assert.equal(c.HOME_STORAGE_MODEL.shelves.length,6);
  const ray=new T.Raycaster(),floorMeshes=[c.HOME_FLOORING.floor,...c.HOME_FLOORING.entry.children];V.scene.updateMatrixWorld(true);let floorSamples=0;
  for(let x=547;x<714;x+=3.7)for(let y=807;y<954;y+=3.7){if(c.HOME_FLOORING.finishAt(x,y)!=='large-format-stone')continue;ray.set(V.pos(x,y,2),new T.Vector3(0,-1,0));const hits=ray.intersectObjects(floorMeshes);assert(hits.length,'Uncovered entry floor');const high=hits.filter(h=>h.point.y>.19);assert(high.length<=1,'Overlapping wood/tile/trim faces');assert(hits[0].point.y>=.159&&hits[0].point.y<=.201);floorSamples++;}
  assert(c.HOME_INDUSTRIAL.materials.stone.roughness<.6);assert(CSSColor(F.darkVeneer.color).every(Number.isFinite));assert.equal(V.finishContext.materials.blackglass.isMeshPhysicalMaterial,true);
  if(n===2)assert([...V.fittings.children].some(g=>g.name==='中島頂天雙面玻璃櫃'));
  if(n===3||n===4){let count=0;V.fittings.traverse(o=>{if(o.userData.industrialRole==='tv-metal')count++;});assert(count>=10);}
  if(n===5){let backing;V.fittings.traverse(o=>{if(o.userData.industrialRole==='fixed-tv-black-glass')backing=o;});assert(backing);assert.equal(backing.material,V.finishContext.materials.blackglass);}
  const daily=lightSnapshot(f);L.setScene('bar');const bar=lightSnapshot(f);assert.equal(L.getState().kelvin,2400);assert(f.get('night').classList.contains('active'));assert(bar.some((v,i)=>v.power<daily[i].power));
  assert.equal(c.HOME_RGB.getState().living.on,false);assert(V.finishContext.hemi.intensity<.1);
  L.update({kelvin:4000});const white=lightSnapshot(f);assert.deepEqual(white.map(x=>x.power),bar.map(x=>x.power),'Color temperature cannot alter brightness');assert(white.some((x,i)=>x.color!==bar[i].color));
  L.update({brightness:73});assert.equal(L.getState().kelvin,4000);assert.equal(L.getState().display,32);
  L.update({brightness:0,display:0});for(const l of V.finishContext.roomLights)if(l.position.x+482.5>745||l.position.z+480>=375)assert.equal(l.intensity,0);
  assert.equal(V.finishContext.materials.light.color.getHex(),0,'Display strips really dim to zero');
  L.setScene('bar');c.HOME_CURTAINS.set(1,'all');f.tick(100,50);assert.equal(L.getState().scene,'bar');assert(V.finishContext.hemi.intensity<.03,'Closed curtains preserve BAR lighting');c.HOME_CURTAINS.set(0,'all');f.tick(100,50);
  L.setScene('game');assert.equal(c.HOME_RGB.getState().living.mode,'breathe');L.setScene('daily');assert.equal(c.HOME_RGB.getState().living.on,false);
  for(const id of ['kitchen','storage']){c.HOME_INTERACTION.setDoor(id,true);f.tick(80,50);assert(c.HOME_INTERACTION.getState().entries.find(e=>e.key===id).angle>.99);c.HOME_INTERACTION.setDoor(id,false);f.tick(80,50);}
  c.HOME_BEDROOM.setScene('makeup');assert(c.HOME_BEDROOM_MODEL.task.intensity>.5);L.setScene('bar');assert.equal(c.HOME_BEDROOM.getState().scene,'makeup');c.HOME_BEDROOM.setScene('daily');L.setScene('daily');
  const html=fs.readFileSync(entryPaths[n-2],'utf8');assert(html.includes('industrial-design.js?v=20260911-herringbone'));assert(html.includes('comfort-controls.js?v=20260911-industrial'));
  const state={version,structuralGeometryUnchanged:before?true:null,equipment:24,curtains:6,entryFloorSamples:floorSamples,materials:c.HOME_INDUSTRIAL.getState(),floor:floor.pattern,entry:floor.entry.pattern,independentDimmingAndColor:true,doorAndCurtainControls:true,bedroomIndependent:true};report.versions.push(state);console.log(JSON.stringify(state));
  if(process.argv.includes('--images')){
   const view= n===2?{p:[720,725,158],t:[535,515,115]}:n===5?{p:[750,735,170],t:[910,944,112]}:{p:[1010,735,165],t:[590,585,110]};
   const views=[{id:version,room:'living',name:version+'公共區',...view}];if(before)render({T:before.T,V:before.V,version:'before',out,views});render({T,V,version:'after',out,views});
   if(n===2){const sharedViews=[{id:'entry',room:'entry',name:'玄關地坪',p:[750,882,155],t:[620,862,25]},{id:'bedroom',room:'bed',name:'主臥',p:[48,231,165],t:[270,60,106]}];render({T,V,version:'after',out,views:sharedViews});}
  }
 }
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
function CSSColor(c){const x=c.clone().convertLinearToSRGB();return [x.r,x.g,x.b];}
