'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs'),extra=require('./capture-five-room-views.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20260922灰石全屋'),N=path.join(P,'調整紀錄/20260922全屋五視角');
const old=JSON.parse(fs.readFileSync(path.join(N,'album-before.json'),'utf8'));
const arg=name=>process.argv.find(x=>x.startsWith('--'+name+'='))?.split('=')[1];
const preview=process.argv.includes('--preview'),dir=preview?'preview':'model',report=path.join(R,preview?'preview.json':'captures.json');
fs.mkdirSync(path.join(R,dir),{recursive:true});
async function main(){const records=fs.existsSync(report)?JSON.parse(fs.readFileSync(report,'utf8')):[];
 for(const v of arg('versions')?arg('versions').split(',').map(Number):[0,1,2,3,4]){
  const f=await build(v===0?0:v+1);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');if(v===1){f.c.HOME_INTERACTION.setDoor('study-slide-r05',true);f.tick(80,50);}else f.tick(3);f.c.HOME_GREY_STONE.apply();
  const title=old.entries.find(e=>e.version==='v'+v).versionTitle;
  const all=[...old.entries.filter(e=>e.version==='v'+v),...extra.views(v)].sort((a,b)=>{const rooms=['entry','living','island','kitchen','bed','closet','study','collection','bath1','bath2','storage','back'];return rooms.indexOf(a.room)-rooms.indexOf(b.room)||a.angle.localeCompare(b.angle);});
  for(const q of all.filter(q=>(!arg('rooms')||arg('rooms').split(',').includes(q.room))&&(!arg('angles')||arg('angles').includes(q.angle)))){
   if(q.room==='storage'){f.c.HOME_INTERACTION.setDoor('storage',true);f.tick(80,50);}
   if(q.room==='closet'&&!f.mirrorOpened){const m=f.V.scene.getObjectByName('更衣室側移滑鏡')?.children[0];if(m)m.position.x+=50;f.mirrorOpened=true;}
   if(!process.argv.includes('--force')&&records.some(e=>e.key===q.key))continue;
   const {room,name,p,t,fov,direction,angle,key}=q,id=room+'-'+(room==='entry'?'door5':'')+angle+'-gr06';
   const [rec]=render({T:f.T,V:f.V,version:'v'+v,out:path.join(R,dir),views:[{id,room,name,p,t,fov,direction,angle,key,...(q.entryFan?{entryFan:true,directionLabel:q.directionLabel}:{})}],width:preview?576:1152,height:preview?384:768,textured:true});
   const modelHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(R,dir,rec.file))).digest('hex');
   const e={...rec,versionTitle:title,model:dir+'/'+rec.file,modelHash,width:preview?576:1152,height:preview?384:768,sourceRevision:'20260922-gr06',captureRevision:'20260922-f05',status:'source-captured'};
   const i=records.findIndex(e=>e.key===q.key);if(i<0)records.push(e);else records[i]=e;
   fs.writeFileSync(report,JSON.stringify(records,null,2)+'\n');console.log(q.key);
  }
 }
 console.log(JSON.stringify({slots:records.length,unique:new Set(records.map(e=>e.modelHash)).size}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
