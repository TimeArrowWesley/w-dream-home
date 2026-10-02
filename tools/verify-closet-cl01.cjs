'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),build=require('./home-test-fixture.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20261002更衣室CL01');
(async()=>{const report=[];
 for(const v of JSON.parse(fs.readFileSync(path.join(P,'version-registry.json'),'utf8')).versions){
  const f=await build(v.fixture),{V,c,bounds,near}=f; c.HOME_REALISM.render=()=>{};c.HOME_REALISM.invalidate=()=>{};
  V.selectRoom('closet');near(V.camera.position.x+482.5,647,'Default camera X');near(V.camera.position.z+480,74,'Default camera Y');near(V.camera.fov,78,'Default camera FOV');
  V.nudge('left');V.nudge('home');near(V.camera.position.x+482.5,647,'Home camera return');
  const B=c.HOME_BEDROOM_MODEL,I=c.HOME_INTERACTION,C=c.HOME_BEDROOM;
  const mirror=[];V.architecture.traverse(o=>{if(o.userData.name==='更衣室滑鏡'&&o.isMesh)mirror.push(o);});assert.equal(mirror.length,1);
  I.setDoor('closet-mirror',false);f.tick(30,50);const closed=bounds(mirror[0]),drawerClosed=bounds(B.groups.closetDrawer);
  assert(C.setFurniture('closetDrawer',true));near(bounds(B.groups.closetDrawer).x-drawerClosed.x,-35,'Drawer stroke');
  assert.equal(I.setDoor('closet-mirror',true),false,'Extended drawer blocks mirror');assert(C.setFurniture('closetDrawer',false));
  assert(I.setDoor('closet-mirror',true));f.tick(30,50);near(bounds(mirror[0]).x-closed.x,50,'Mirror rightward stroke');
  assert.equal(C.setFurniture('closetDrawer',true),false,'Shifted mirror blocks drawer');I.setDoor('closet-mirror',false);f.tick(30,50);
  near(bounds(mirror[0]).x,closed.x,'Mirror return');assert(C.setFurniture('closetDrawer',true));assert(C.setFurniture('closetDrawer',false));
  const initial=C.getState().closetLight;f.get('wardrobeLightToggle').onclick();assert.notEqual(C.getState().closetLight,initial);assert.equal(B.closetTask.intensity,0);assert(B.diffusers.closet.every(m=>m.material.emissiveIntensity===0));
  f.get('wardrobeLightToggle').onclick();assert.equal(C.getState().closetLight,initial);assert(B.closetTask.intensity>0);
  report.push({version:v.id,mirrorWidthCm:58,mirrorStrokeCm:50,upperDrawerStrokeCm:35,interlockBothWays:true,cabinetLight:true,scope:'Existing controls and source geometry sampled; no layout change or site approval.'});
 }
 const result={date:'2026-10-02',revision:'CL01',versions:report,dimensions:{conservativeApproach:{from:'管道保守外包絡右緣 X625',to:'淺櫃前緣 X730',cm:105,status:'既有模型避讓值；管道60×40與79×51紀錄冲突，待丈量'},shallowCabinet:{outerDepthCm:15,status:'只供薄手拿包；扣除背板、門片後淨深更小'}},limits:'Offline fixture verifies the actual control code. Does not prove whole-room body clearances, structural feasibility, window operation, capacities, light levels, support or installed hardware.'};
 fs.mkdirSync(R,{recursive:true});fs.writeFileSync(path.join(R,'模型驗證.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
