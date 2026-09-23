'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20260923全版本霧黑工業'),before=JSON.parse(fs.readFileSync(path.join(R,'album-before.json'),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),arg=n=>process.argv.find(x=>x.startsWith('--'+n+'='))?.split('=')[1];
const material=m=>JSON.stringify({color:m.color?.toArray(),map:m.map?.id,rough:m.roughness,metal:m.metalness,opacity:m.opacity});
function geometry(f){const a=[];f.V.scene.updateMatrixWorld(true);f.V.scene.traverse(o=>{if(o.isMesh)a.push([o.id,hash(Buffer.from(o.geometry.attributes.position.array.buffer)),o.geometry.index?hash(Buffer.from(o.geometry.index.array.buffer)):null,o.matrixWorld.elements]);});return JSON.stringify(a);}
function equipment(f){const a=[];for(const g of f.E.items)g.traverse(o=>{if(o.isMesh)a.push([o.id,...(Array.isArray(o.material)?o.material:[o.material]).map(material)]);});return JSON.stringify(a);}
(async()=>{
 const records=fs.existsSync(path.join(R,'captures.json'))?JSON.parse(fs.readFileSync(path.join(R,'captures.json'),'utf8')):[],checks=fs.existsSync(path.join(R,'模型核對.json'))?JSON.parse(fs.readFileSync(path.join(R,'模型核對.json'),'utf8')).versions:[];fs.mkdirSync(path.join(R,'model'),{recursive:true});
 for(const v of arg('versions')?arg('versions').split(',').map(Number):[0,1,2,3,4]){
  const overrides={'black-industrial-design.js':''},f=await build(v===0?0:v+1,overrides);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');if(v===1){f.c.HOME_INTERACTION.setDoor('study-slide-r05',true);f.tick(80,50);}else f.tick(3);f.c.HOME_GREY_STONE.apply();
  const geo=geometry(f),eq=equipment(f),floor=material(f.c.HOME_FLOORING.floor.material),stone=material(f.c.HOME_GREY_STONE.materials.stone);delete overrides['black-industrial-design.js'];f.run('black-industrial-design.js');const B=f.c.HOME_BLACK_INDUSTRIAL;
  assert.equal(geometry(f),geo,'Geometry unchanged');assert.equal(equipment(f),eq,'Factory equipment unchanged');assert.equal(material(f.c.HOME_FLOORING.floor.material),floor);assert.equal(material(f.c.HOME_GREY_STONE.materials.stone),stone);assert(B.targets.size>50);
  f.c.HOME_INDUSTRIAL.apply();for(const [o,t] of B.targets)assert.equal(o.material,t.material,'Finish survives scene material reset');assert.equal(geometry(f),geo);assert.equal(equipment(f),eq);
  f.c.HOME_R05?.applyFinishes();for(const [o,t] of B.targets)assert.equal(o.material,t.material,'Finish survives V1 control startup reset');
  const check={version:'v'+v,geometryUnchanged:true,equipmentUnchanged:true,stoneAndFloorUnchanged:true,idempotent:true,...B.getState()},ci=checks.findIndex(x=>x.version==='v'+v);if(ci<0)checks.push(check);else checks[ci]=check;
  for(const q of before.entries.filter(e=>e.version==='v'+v)){
   if(q.room==='storage'){f.c.HOME_INTERACTION.setDoor('storage',true);f.tick(80,50);}
   if(q.room==='closet'&&!f.mirrorOpened){const m=f.V.scene.getObjectByName('更衣室側移滑鏡')?.children[0];if(m)m.position.x+=50;f.mirrorOpened=true;}
   if(!process.argv.includes('--force')&&records.some(e=>e.key===q.key))continue;
   const id=q.room+'-'+(q.room==='entry'?'door5':'')+q.angle+'-bi01';
   const [rec]=render({T:f.T,V:f.V,version:'v'+v,out:path.join(R,'model'),views:[{...q,id}],width:1152,height:768,textured:true});
   const entry={...q,...rec,model:'model/'+rec.file,modelHash:hash(fs.readFileSync(path.join(R,'model',rec.file))),previousAI:q.aiKey,sourceRevision:'20260923-bi01',status:'source-captured'};
   const index=records.findIndex(x=>x.key===q.key);if(index<0)records.push(entry);else records[index]=entry;
   fs.writeFileSync(path.join(R,'captures.json'),JSON.stringify(records,null,2)+'\n');console.log(q.key);
  }
  fs.writeFileSync(path.join(R,'模型核對.json'),JSON.stringify({versions:checks,scope:'模型幾何、設備外觀、灰石與地板保留；未做照度或施工核定'},null,2)+'\n');
 }
 console.log(JSON.stringify({captured:records.length,unique:new Set(records.map(e=>e.modelHash)).size}));
})().catch(e=>{console.error(e);process.exitCode=1;});
