'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20260923V4公共區更新');
const before=JSON.parse(fs.readFileSync(path.join(R,'album-before.json'),'utf8'));
async function main(){
 const f=await build(5);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');f.tick(3);f.c.HOME_GREY_STONE.apply();
 const records=[],dir=path.join(R,'model');fs.mkdirSync(dir,{recursive:true});
 for(const q of before.entries.filter(e=>e.version==='v4')){
  if(q.room==='storage'){f.c.HOME_INTERACTION.setDoor('storage',true);f.tick(80,50);}
  if(q.room==='closet'&&!f.mirrorOpened){const m=f.V.scene.getObjectByName('更衣室側移滑鏡')?.children[0];if(m)m.position.x+=50;f.mirrorOpened=true;}
  const id=q.room+'-'+(q.room==='entry'?'door5':'')+q.angle+'-v4r02';
  const [rec]=render({T:f.T,V:f.V,version:'v4',out:dir,views:[{...q,id}],width:1152,height:768,textured:true});
  const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,rec.file))).digest('hex');
  records.push({...q,...rec,model:'model/'+rec.file,modelHash:hash,changed:hash!==q.modelHash,previousModelHash:q.modelHash,previousAI:q.aiKey,sourceRevision:'20260923-v4r02',status:'source-captured'});
  fs.writeFileSync(path.join(R,'captures.json'),JSON.stringify(records,null,2)+'\n');console.log(q.key+' '+(hash===q.modelHash?'retained':'CHANGED'));
 }
 console.log(JSON.stringify({captured:records.length,changed:records.filter(e=>e.changed).length}));
}main().catch(e=>{console.error(e);process.exitCode=1;});
