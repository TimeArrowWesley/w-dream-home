'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20261001全版本化妝桌VT02');
const before=JSON.parse(fs.readFileSync(path.join(R,'album-before.json'),'utf8'));
const versions=JSON.parse(fs.readFileSync(path.join(P,'version-registry.json'),'utf8')).versions;
(async()=>{for(const v of versions.filter(v=>!process.argv[2]||v.id===process.argv[2])){
 const f=await build(v.fixture);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');f.tick(3);f.c.HOME_VANITY.apply();
 const out=path.join(R,'model'),records=[];
 for(const q of before.entries.filter(e=>e.version===v.id&&e.room==='bed')){
  const id='bed-'+q.angle+'-vt02';const [rec]=render({T:f.T,V:f.V,version:v.id,out,views:[{...q,id}],width:1152,height:768,textured:true});
  const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,rec.file))).digest('hex');
  records.push({...q,...rec,key:q.key,version:v.id,model:'model/'+rec.file,modelHash:h,changed:h!==q.modelHash,previousModelHash:q.modelHash,previousAI:q.aiKey,sourceRevision:'20261001-vt02',status:'source-captured'});
  fs.writeFileSync(path.join(R,'captures-'+v.id+'.json'),JSON.stringify(records,null,2));console.log(q.key+' '+(h===q.modelHash?'retained':'CHANGED'));
 }
}})().catch(e=>{console.error(e);process.exitCode=1;});
