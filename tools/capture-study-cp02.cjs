'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20261001電競房CP02'),out=path.join(R,'model');
const versions=JSON.parse(fs.readFileSync(path.join(P,'version-registry.json'),'utf8')).versions;
const views=[
 {id:'study-A-cp02',angle:'A',p:[1040,350,160],t:[775,160,110],fov:48},
 {id:'study-B-cp02',angle:'B',p:[800,315,160],t:[1015,70,120],fov:74},
 {id:'study-C-cp02',angle:'C',p:[1040,120,157],t:[778,226,125],fov:28},
 {id:'study-D-cp02',angle:'D',p:[920,190,150],t:[775,70,112],fov:65},
 {id:'study-E-cp02',angle:'E',p:[895,75,160],t:[1045,323,115],fov:46}
];
(async()=>{for(const v of versions.filter(v=>v.id!=='v0'&&(!process.argv[2]||process.argv[2]===v.id))){
 const f=await build(v.fixture);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');f.tick(3);f.c.HOME_STUDY_CP.apply();
 // Existing privacy-glass display state, recorded explicitly for this shared gallery.
 f.get('glass').checked=true;f.get('glass').onchange();
 const records=render({T:f.T,V:f.V,version:v.id,out,views,width:1152,height:768,textured:true}).map(q=>({...q,room:'study',key:v.id+'-study-'+q.angle,direction:Math.atan2(q.t[1]-q.p[1],q.t[0]-q.p[0])*180/Math.PI,modelHash:crypto.createHash('sha256').update(fs.readFileSync(path.join(out,q.file))).digest('hex')}));
 fs.writeFileSync(path.join(R,'captures-'+v.id+'.json'),JSON.stringify(records,null,2));console.log(v.id+' captured');
}})().catch(e=>{console.error(e);process.exitCode=1;});
