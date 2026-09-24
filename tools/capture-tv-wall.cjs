'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20260924電視牆統一');
const before=JSON.parse(fs.readFileSync(path.join(R,'album-before.json'),'utf8'));
(async()=>{
 const v=process.argv[2];if(!['v1','v4'].includes(v))throw Error('Select v1 or v4');
 const f=await build(v==='v1'?2:5);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');
 if(v==='v1'){f.c.HOME_INTERACTION.setDoor('study-slide-r05',true);f.tick(80,50);}else f.tick(3);
 f.c.HOME_GREY_STONE.apply();f.c.HOME_INDUSTRIAL.apply();f.c.HOME_R05?.applyFinishes();
 const out=path.join(R,'model'),file=path.join(R,'captures-'+v+'.json'),records=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
 for(const q of before.entries.filter(q=>q.version===v)){
  if(q.room==='storage'){f.c.HOME_INTERACTION.setDoor('storage',true);f.tick(80,50);}
  if(q.room==='closet'&&!f.mirrorOpened){const m=f.V.scene.getObjectByName('更衣室側移滑鏡')?.children[0];if(m)m.position.x+=50;f.mirrorOpened=true;}
  if(records.some(e=>e.key===q.key))continue;
  const id=q.room+'-'+(q.room==='entry'?'door5':'')+q.angle+'-tw01';
  const [rec]=render({T:f.T,V:f.V,version:v,out,views:[{...q,id}],width:1152,height:768,textured:true});
  const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,rec.file))).digest('hex');
  records.push({...q,...rec,model:'model/'+rec.file,modelHash:h,changed:h!==q.modelHash,previousModelHash:q.modelHash,previousAI:q.aiKey,sourceRevision:'20260923-tw01',status:'source-captured'});
  fs.writeFileSync(file,JSON.stringify(records,null,2));console.log(q.key+' '+(h===q.modelHash?'retained':'CHANGED'));
 }
 console.log(JSON.stringify({v,captured:records.length,changed:records.filter(e=>e.changed).length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
