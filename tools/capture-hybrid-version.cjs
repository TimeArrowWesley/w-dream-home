'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20260924版本重編與V3');
const before=JSON.parse(fs.readFileSync(path.join(R,'album-before.json'),'utf8'));
(async()=>{
 const v='v3';
 const f=await build(6);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');
 if(v==='v1'){f.c.HOME_INTERACTION.setDoor('study-slide-r05',true);f.tick(80,50);}else f.tick(3);
 f.c.HOME_GREY_STONE.apply();f.c.HOME_INDUSTRIAL.apply();f.c.HOME_R05?.applyFinishes();
 const out=path.join(R,'model'),file=path.join(R,'captures-'+v+'.json'),records=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
 for(const q of before.entries.filter(q=>q.version==='v4').map(q=>q.room==='island'?{...before.entries.find(e=>e.version==='v1'&&e.room==='island'&&e.angle===q.angle),key:q.key}:q)){
  if(q.room==='storage'){f.c.HOME_INTERACTION.setDoor('storage',true);f.tick(80,50);}
  if(q.room==='closet'&&!f.mirrorOpened){const m=f.V.scene.getObjectByName('更衣室側移滑鏡')?.children[0];if(m)m.position.x+=50;f.mirrorOpened=true;}
  const viewKey=q.key.replace(/^v4-/,'v3-');if(records.some(e=>e.key===viewKey))continue;
  const id=q.room+'-'+(q.room==='entry'?'door5':'')+q.angle+'-vn01';
  const [rec]=render({T:f.T,V:f.V,version:v,out,views:[{...q,id}],width:1152,height:768,textured:true});
  const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,rec.file))).digest('hex');
  records.push({...q,...rec,key:viewKey,version:v,model:'model/'+rec.file,modelHash:h,changed:h!==q.modelHash,previousModelHash:q.modelHash,previousAI:q.aiKey,sourceRevision:'20260924-vn01',status:'source-captured'});
  fs.writeFileSync(file,JSON.stringify(records,null,2));console.log(q.key+' '+(h===q.modelHash?'retained':'CHANGED'));
 }
 console.log(JSON.stringify({v,captured:records.length,changed:records.filter(e=>e.changed).length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
