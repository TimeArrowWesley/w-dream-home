'use strict';
// Actual application loops and Three.js scene with a counted renderer, not a GPU benchmark.
const assert=require('assert'),fs=require('fs'),path=require('path'),build=require('./home-test-fixture.cjs');
const root=path.resolve(__dirname,'..'),report={method:'Real scene, camera and feature animation loops; renderer submissions counted offline. Not wall-clock FPS, GPU utilization or fan measurements.',versions:{}};
const step=1000/60;
function counters(f){return {draws:f.V.renderer.draws||0,shadows:f.c.HOME_REALISM.getState().shadowUpdates,rgb:f.c.HOME_RGB.getMetrics?.().paints||0,picks:f.c.HOME_INTERACTION.getState().metrics.pickScans||0};}
function sample(f,n,action){const before=counters(f);for(let i=0;i<n;i++){action?.(i);f.tick(1,step);}const after=counters(f);return Object.fromEntries(Object.keys(before).map(k=>[k,after[k]-before[k]]));}
(async()=>{
 if(process.argv.includes('--baseline-json')){
  const baseline=JSON.parse(fs.readFileSync(process.argv[process.argv.indexOf('--baseline-json')+1],'utf8').replace(/^\uFEFF/,''));
  const before=await build(4,baseline.files);before.V.selectRoom('living');before.tick(120,step);
  report.baseline={commit:baseline.commit,idle10Seconds:sample(before,600),moving10Seconds:sample(before,600,()=>before.V.camera.position.x+=.1)};
 }
 for(const n of [2,3,4,5]){
  const f=await build(n),{c,V,get}=f,R=c.HOME_REALISM;V.selectRoom('living');f.tick(120,step);
  assert.equal(R.getState().quality,'eco');const idle=sample(f,600);assert.equal(idle.draws,0,'still scene submits no draws');assert.equal(idle.shadows,0,'still shadows are reused');assert.equal(idle.rgb,0,'static RGB does no repainting');
  const moving=sample(f,600,()=>V.camera.position.x+=.1);assert(moving.draws>=290&&moving.draws<=305,'eco active render ceiling is 30 FPS');assert.equal(moving.shadows,0,'camera motion reuses shadows');
  c.HOME_TOUR.setMode('walk');f.tick(120,step);const walkIdle=sample(f,600);assert.equal(walkIdle.draws,0,'standing still does not redraw');assert.equal(walkIdle.picks,0,'stationary camera does not scan all meshes');
  c.HOME_TOUR.setMode('model');f.tick(30,step);
  c.HOME_INTERACTION.setDoor('kitchen',true);const door=sample(f,240);assert(door.draws>5,'door animates with stationary camera');assert(c.HOME_INTERACTION.getState().entries.some(e=>e.key==='kitchen'&&e.angle>.99));
  c.HOME_CURTAINS.set(1,'all');const curtain=sample(f,120);assert(curtain.draws>20);assert(c.HOME_CURTAINS.getState().every(e=>e.closed>.99));
  c.HOME_RGB.update('living',{on:true,mode:'wave',brightness:65});const rgb=sample(f,180);assert(rgb.draws>70&&rgb.draws<=92);assert.equal(rgb.shadows,0,'RGB colors do not rebuild shadow maps');
  c.HOME_RGB.update('living',{mode:'static'});f.tick(30,step);assert.equal(sample(f,120).draws,0,'animation returns to idle');
  c.HOME_EQUIPMENT.setInspection(true);assert(sample(f,15).draws>0,'inspection updates on demand');c.HOME_EQUIPMENT.setInspection(false);
  const tv=c.HOME_ROTATING_TV_CONTROLS;if(tv){tv.setTarget('island');const turn=sample(f,420);assert(turn.draws>30);assert(Math.abs(tv.getState().angle-180)<.01);tv.setTarget('living');f.tick(420,step);}
  c.HOME_CURTAINS.set(0,'all');c.document.hidden=true;const hidden=sample(f,300);assert.equal(hidden.draws,0);assert.equal(hidden.rgb,0);assert(c.HOME_CURTAINS.getState().every(e=>e.closed>.99),'background animations pause');
  c.document.hidden=false;f.tick(150,step);assert(c.HOME_CURTAINS.getState().every(e=>e.closed<.01),'animations resume');
  c.HOME_TOUR.setMode('photo');assert.equal(sample(f,120).draws,0,'photo view does not render 3D');c.HOME_TOUR.setMode('model');f.tick(30,step);
  get('realismQuality').onclick();assert.equal(R.getState().quality,'balanced');get('realismQuality').onclick();assert.equal(R.getState().quality,'high');f.tick(60,step);assert(R.getState().postPasses>0,'fine postprocess remains available');assert.equal(sample(f,120).draws,0,'fine mode also sleeps at rest');
  get('realismQuality').onclick();assert.equal(R.getState().quality,'eco');const rect=get('view').getBoundingClientRect;get('view').getBoundingClientRect=()=>({width:3840,height:2160});R.resizeBudget();assert(V.renderer.getPixelRatio()**2*3840*2160<=1100001,'4K displays respect pixel budget');get('view').getBoundingClientRect=rect;R.resizeBudget();
  const before=counters(f).draws;R.render(true);assert(counters(f).draws>before,'explicit export forces a fresh frame');
  report.versions[n===5?'a':'v'+(n-1)]={idle10Seconds:idle,moving10Seconds:moving,walkIdle10Seconds:walkIdle,door,curtain,rgb3Seconds:rgb,hidden5Seconds:hidden,checks:'door, curtains, RGB, inspection, TV, hidden/resume, quality cycling, pixel budget and export passed'};
 }
 const out=path.join(root,'調整紀錄/20260911效能優化');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'效能驗證.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exit(1);});
