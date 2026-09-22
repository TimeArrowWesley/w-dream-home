'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const out=path.resolve('調整紀錄/20260922全版本模型與AI複核'),folder=path.resolve('成品圖集/20260914暗色現代工業'),manifest=JSON.parse(fs.readFileSync(fs.existsSync(path.join(out,'album-before.json'))?path.join(out,'album-before.json'):path.join(folder,'album-manifest.json'),'utf8'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');fs.mkdirSync(path.join(out,'model'),{recursive:true});
(async()=>{const captures=[];for(let v=0;v<=4;v++){
 const f=await build(v===0?0:v+1);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');if(v===1){f.c.HOME_INTERACTION.setDoor('study-slide-r05',true);f.tick(80,50);}else f.tick(3);
 for(const e of manifest.entries.filter(e=>e.version==='v'+v)){
  if(e.room==='storage'){f.c.HOME_INTERACTION.setDoor('storage',true);f.tick(80,50);}
  if(e.room==='closet'&&!f.mirrorOpened){const m=f.V.scene.getObjectByName('更衣室側移滑鏡')?.children[0];if(m)m.position.x+=50;f.mirrorOpened=true;}
  const view={id:e.key.slice(3)+'-qa03',room:e.room,name:e.name,p:e.p,t:e.t,fov:e.fov,direction:e.direction};
  const [rec]=render({T:f.T,V:f.V,version:e.version,out:path.join(out,'model'),views:[view],width:1152,height:768,textured:true});const modelHash=sha(path.join(out,'model',rec.file));
  captures.push({...e,...rec,modelHash,previousAiKey:e.aiKey,previousModelHash:e.modelHash,changed:modelHash!==e.modelHash});
  fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify(captures,null,2)+'\n');console.log(e.key+' '+(modelHash!==e.modelHash?'changed':'retained'));
 }
}const changed=captures.filter(e=>e.changed);console.log(JSON.stringify({captures:captures.length,changed:changed.length,uniqueChanged:new Set(changed.map(e=>e.modelHash)).size}));})().catch(e=>{console.error(e);process.exitCode=1;});
