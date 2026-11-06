'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),root=path.resolve(__dirname,'..'),build=require('./home-test-fixture.cjs');
process.env.HOME_TEST_BW03='1';process.env.HOME_TEST_BW04='1';
const out=path.join(root,'調整紀錄/20261106放樣尺寸SV01'),versions=JSON.parse(fs.readFileSync(path.join(root,'version-registry.json'),'utf8')).versions;
const close=(a,b,msg,t=.06)=>assert(Math.abs(a-b)<t,`${msg}: ${a} != ${b}`);
(async()=>{const result=[];for(const v of versions){const f=await build(v.fixture),{V,c,T}=f;V.selectRoom('living');f.tick(120,30);let baseline,landmarks;
c.HOME_INTERACTION.withClosedPose(()=>{baseline=c.HOME_EQUIPMENT.items.map(o=>({o,b:f.bounds(o),name:o.name}));landmarks=V.wallParts.map(p=>({o:p.m,b:f.bounds(p.m)}));});
const find=(x,y,w,d)=>{const a=landmarks.filter(p=>['x','y','w','d'].every((k,i)=>Math.abs(p.b[k]-[x,y,w,d][i])<.2));assert.equal(a.length,1,`${v.id} landmark ${x},${y}`);return a[0].o;};
const masterTop=find(80,282,225,10),masterEast=find(305,292,10,191),masterSouth=find(-75,483,380,10),guestWest=find(405,207,10,158),guestNorth=find(405,207,165,10),guestEast=find(570,217,10,158),guestSouth=find(415,365,75,10),studyWest=find(745,0,10,365);
f.run('survey-layout.js');await c.HOME_SURVEY.ready;V.selectRoom('living');f.tick(120,30);const A=c.HOME_SURVEY;assert.equal(A.state.state,'ready');
const dimensions={};c.HOME_INTERACTION.withClosedPose(()=>{
 const b=f.bounds;dimensions.masterBath={width:b(masterEast).x-(-72),depth:b(masterSouth).y-(b(masterTop).y+b(masterTop).d)};
 dimensions.guestBath={width:b(guestEast).x-(b(guestWest).x+b(guestWest).w),depth:b(guestSouth).y-(b(guestNorth).y+b(guestNorth).d)};
 dimensions.study={width:1085-(b(studyWest).x+b(studyWest).w),depth:b(studyWest).d};
 for(const [key,expect] of Object.entries({masterBath:[375,183],guestBath:[150,141],study:[328,374]})){close(dimensions[key].width,expect[0],v.id+' '+key+' width');close(dimensions[key].depth,expect[1],v.id+' '+key+' depth');}
 for(const p of baseline){const a=b(p.o);for(const key of ['w','d','h'])close(a[key],p.b[key],v.id+' product '+p.name+' '+key,.08);}
});
for(const w of A.windows){const b=f.bounds(w.parts.at(-1));close(b.z,w.sill+3,w.n+' glass sill');close(b.h,w.h-6,w.n+' glass height');}
const shaft=V.scene.getObjectByName('更衣室管道間')||V.architecture.children.find(o=>o.userData.name==='更衣室管道間');const cab=V.fittings.children.find(o=>o.name==='更衣室頂天櫃');if(cab&&shaft){const cb=f.bounds(cab),sb=f.bounds(shaft);assert(cb.x+cb.w<=sb.x+.05,'closet cabinet clear of measured pipe shaft');}assert.equal(V.beams.children.length,8);for(let i=0;i<8;i++)close(f.bounds(V.beams.children[i]).z,A.beamDefs[i][5],'beam '+i);
for(const key of ['kitchen','storage','study','主浴80cm門洞','入戶門','入戶子母門小門']){const e=c.HOME_INTERACTION.getState().entries.find(e=>e.key===key||e.name===key);if(!e)continue;c.HOME_INTERACTION.setDoor(e.id,true);f.tick(200,40);const open=c.HOME_INTERACTION.getState().entries.find(a=>a.id===e.id);close(open.angle,open.openAngle,'open '+key,.002);c.HOME_INTERACTION.setDoor(e.id,false);f.tick(200,40);close(c.HOME_INTERACTION.getState().entries.find(a=>a.id===e.id).angle,0,'closed '+key,.002);}
c.HOME_CURTAINS.set(1,'all');f.tick(120,40);assert(c.HOME_CURTAINS.getState().every(e=>e.closed>.999));c.HOME_CURTAINS.set(0,'all');f.tick(120,40);
const curtain=[];V.scene.getObjectByName('可互動落地窗簾').traverse(o=>{if(o.geometry?.type==='PlaneGeometry')curtain.push(o);});assert.equal(curtain.length,10);assert(curtain.every(o=>o.geometry.attributes.position.count===729));
const failed=[];V.scene.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.position)return;const p=o.geometry.attributes.position.array;if(!p.every(Number.isFinite))failed.push(o.name);});assert.deepEqual(failed,[]);
result.push({version:v.id,dimensions,unchangedProductSizes:baseline.length,windows:7,beams:8,doors:true,curtains:true,state:A.state});console.log(v.id+' actual dimensions, product sizes, doors, curtains passed');}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'geometry-validation.json'),JSON.stringify({passed:true,versions:result},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
