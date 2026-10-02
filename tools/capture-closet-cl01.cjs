'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20261002更衣室CL01');
const views=[
 {id:'closet-A-cl01',angle:'A',name:'更衣室・吊衣與滑鏡全景',p:[647,74,154],t:[655,207,121],fov:78},
 {id:'closet-B-cl01',angle:'B',name:'更衣室・長衣與上層包包',p:[666,193,153],t:[641,25,130],fov:75},
 {id:'closet-C-cl01',angle:'C',name:'更衣室・短衣抽屜與手拿包櫃',p:[582,158,145],t:[735,156,108],fov:80},
 {id:'closet-D-cl01',angle:'D',name:'更衣室・滑鏡移開取衣',p:[683,64,153],t:[580,225,126],fov:78,mirrorOpen:true},
 {id:'closet-E-cl01',angle:'E',name:'更衣室・窗邊收納近景',p:[450,198,150],t:[463,0,135],fov:75}
];
(async()=>{const vs=JSON.parse(fs.readFileSync(path.join(P,'version-registry.json'),'utf8')).versions;
 for(const v of vs.filter(v=>!process.argv[2]||v.id===process.argv[2])){
  const f=await build(v.fixture);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');f.tick(3);
  const roomDoor=f.c.HOME_INTERACTION.getState().entries.find(e=>e.name==='更衣室門');
  if(roomDoor)f.c.HOME_INTERACTION.setDoor(roomDoor.id,false);
  const records=[];
  for(const view of views.filter(v=>!process.argv[3]||process.argv[3].includes(v.angle))){
   f.c.HOME_INTERACTION.setDoor('closet-mirror',!!view.mirrorOpen);f.tick(120);
   const rec=render({T:f.T,V:f.V,version:v.id,out:path.join(R,'model'),views:[view],width:1152,height:768,textured:true})[0];
   records.push({...rec,room:'closet',key:v.id+'-closet-'+view.angle,captureState:'Room entrance door closed. '+(view.mirrorOpen?'Sliding mirror moved right by 50cm; drawers closed.':'Sliding mirror at left; drawers closed.'),direction:Math.atan2(view.t[1]-view.p[1],view.t[0]-view.p[0])*180/Math.PI,modelHash:crypto.createHash('sha256').update(fs.readFileSync(path.join(R,'model',rec.file))).digest('hex')});
  }
  const dest=path.join(R,'captures-'+v.id+'.json');
  const previous=process.argv[3]&&fs.existsSync(dest)?JSON.parse(fs.readFileSync(dest,'utf8')).filter(e=>!process.argv[3].includes(e.angle)):[];
  fs.writeFileSync(dest,JSON.stringify([...previous,...records].sort((a,b)=>a.angle.localeCompare(b.angle)),null,2));console.log(v.id+' closet captured');
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
