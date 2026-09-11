'use strict';
// Source meshes, door motion and walk collision; no browser or GPU.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'調整紀錄/20260911主臥隔牆'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const expression="info(wall(405,0,10,123),'主臥與更衣室連續隔牆','補齊窗前矮櫃側方至門框的43cm牆段；全段長123、厚10、高275cm沿用模型基準，現場尺寸待複量。','業主紅框客變圖');";
function records(V,omitVanity=false){V.scene.updateMatrixWorld(true);const a=[];V.scene.traverse(o=>{if(o.isMesh&&!(omitVanity&&o.userData.masterVanity))a.push(JSON.stringify({p:sha(Buffer.from(o.geometry.attributes.position.array.buffer)),m:o.matrixWorld.elements,c:o.material?.color?.getHex(),opacity:o.material?.opacity,visible:o.visible}));});return a.sort();}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const versions=[];
 for(const n of [2,3,4,5]){
  const file=n===2?'design.js':'提案/旋轉電視與直線中島/design.js',src=read(file);assert(src.includes(expression));
  const old=await build(n,{[file]:src.replace(expression,'wall(405,0,10,80);')}),f=await build(n),{T,V,c,bounds,near,overlap,get}=f;
  const a=records(old.V),b=records(V),removed=a.filter(x=>!b.includes(x)),added=b.filter(x=>!a.includes(x));assert.equal(removed.length,1);assert.equal(added.length,1);assert.equal(a.length,b.length);
  const baselineWithoutVanity=sha(records(V,true).join('\n'));
  const wall=V.wallParts.find(p=>p.m.userData.name==='主臥與更衣室連續隔牆');assert(wall);
  V.selectRoom('bed');V.scene.updateMatrixWorld(true);const w=bounds(wall.m);
  for(const [k,v] of Object.entries({x:405,y:0,w:10,d:123,z:0,h:275}))near(w[k],v,'Wall '+k);
  const ray=new T.Raycaster(V.pos(390,101.5,165),new T.Vector3(1,0,0),0,50);assert.equal(ray.intersectObject(wall.m)[0]?.object,wall.m,'Eye-level ray hits the formerly missing wall');
  const door=[];V.architecture.traverse(o=>{if(o.userData.interactiveDoor?.name==='更衣室門')door.push(o);});assert.equal(door.length,1);
  assert(c.HOME_INTERACTION.setDoor('更衣室門',false));f.tick(40,50);
  let samples=0;c.HOME_INTERACTION.setDoor('更衣室門',true);
  for(let i=0;i<45;i++){f.tick(1,50);door[0].traverse(o=>{if(o.isMesh&&o.userData.dynamicDoor)assert(!overlap(bounds(o),bounds(wall.m),.1),'Moving door intersects return wall');});samples++;}
  const state=c.HOME_INTERACTION.getState().entries.find(e=>e.name==='更衣室門');near(state.angle,Math.PI/2,'Closet door opens 90 degrees');
  c.HOME_TOUR.setMode('walk');await Promise.resolve();
  for(let x=370;x<=455;x+=5)assert(c.HOME_WALK.canStand(x-482.5,170-480),'Doorway blocked at '+x);
  for(const y of [85,100,115])assert(!c.HOME_WALK.canStand(410-482.5,y-480),'Wall cannot be walked through');
  c.HOME_TOUR.setMode('model');V.selectRoom('all');V.scene.updateMatrixWorld(true);near(bounds(wall.m).h,85,'Overview wall cut follows common control');
  V.selectRoom('bed');V.scene.updateMatrixWorld(true);near(bounds(wall.m).h,275,'Room view restores full-height wall');
  get('cut').checked=true;get('cut').onchange();V.scene.updateMatrixWorld(true);near(bounds(wall.m).h,85,'Manual cutaway');
  get('cut').checked=false;get('cut').onchange();V.scene.updateMatrixWorld(true);near(bounds(wall.m).h,275,'Manual full wall');
  const saved={scale:wall.m.scale.y,y:wall.m.position.y},captureHeights=[];
  V.renderer.getSize=v=>v.set(960,720);get('view').toDataURL=()=>'';
  const originalRender=V.renderer.render.bind(V.renderer);V.renderer.render=(...args)=>{V.scene.updateMatrixWorld(true);captureHeights.push(bounds(wall.m).h);originalRender(...args);};
  V.capturePlan();V.renderer.render=originalRender;assert(captureHeights.some(h=>Math.abs(h-100)<.01),'Plan includes 100cm wall section');assert.equal(wall.m.scale.y,saved.scale);assert.equal(wall.m.position.y,saved.y,'Plan capture restores wall');
  versions.push({version:'v'+(n-1),wall:w,filledGapCm:43,changedMeshes:1,addedMeshes:0,allOtherMeshesUnchanged:true,baselineWithoutVanity,doorAngleDegrees:state.angle*180/Math.PI,doorSweepSamples:samples,doorwayWalkSamples:18,cutawayAndPlanRestore:true});
  if(n===2&&!process.argv.includes('--no-images')){const views=[{id:'bed-wall',room:'bed',name:'主臥看向更衣室門旁隔牆',p:[275,202,165],t:[411,99,138]}];render({T,V,version:'after',out,views});render({T:old.T,V:old.V,version:'before',out,views});}
 }
 const report={date:new Date().toISOString(),method:'Actual Three.js meshes, raycast, real door/walk handlers, cutaway and plan-capture state restoration. Images are CPU geometry/base-color checks, without GPU textures or reflections.',versions};
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
