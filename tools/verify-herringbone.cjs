'use strict';
// Exercise source geometry, board coverage and application render scheduling offline.
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),assert=require('assert');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const snapshot=path.join(os.tmpdir(),'w-home-herringbone-before.json');
const before=fs.existsSync(snapshot)?JSON.parse(fs.readFileSync(snapshot,'utf8')).files:null;
const out=path.resolve('調整紀錄/20260911人字拼木地板');
function geometry(f){const hash=crypto.createHash('sha256');let meshes=0;f.V.scene.updateMatrixWorld(true);f.V.scene.traverse(o=>{if(o.isMesh){meshes++;hash.update(Buffer.from(o.geometry.attributes.position.array.buffer));if(o.geometry.index)hash.update(Buffer.from(o.geometry.index.array.buffer));hash.update(JSON.stringify(o.matrixWorld.elements));}});return {hash:hash.digest('hex'),meshes};}
(async()=>{
 fs.mkdirSync(out,{recursive:true});const report={method:'Source geometry and offline texture rendering; no GPU shader execution or measured FPS.',versions:[]};
 for(let v=1;v<=4;v++){
  const old=before?await build(v+1,before):null,f=await build(v+1),{c,V,T}=f,F=c.HOME_FLOORING,s=F.getState();
  assert.equal(s.pattern,'herringbone');assert.equal(s.plankWidthCm,20);assert.equal(s.plankLengthCm,120);assert.equal(s.rotationDeg,45);
  const current=geometry(f);if(old){assert.deepStrictEqual(current,geometry(old));assert.equal(F.floor.material.color.getHex(),old.c.HOME_FLOORING.floor.material.color.getHex());assert.deepStrictEqual(JSON.parse(JSON.stringify(s.entry)),JSON.parse(JSON.stringify(old.c.HOME_FLOORING.getState().entry)));}
  assert.equal(Object.keys(c.HOME_INDUSTRIAL.textures).length,6);assert.equal(c.HOME_EQUIPMENT.items.length,24);
  const shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};F.floor.material.onBeforeCompile(shader);
  assert(shader.fragmentShader.includes('texture2D(map,hbUv)'));assert(shader.fragmentShader.includes('herringboneGradient(dFdx(floorCm))'));assert(shader.fragmentShader.includes('texture2D( bumpMap, hbUv )'));
  let horizontal=0,vertical=0,samples=0;
  // Construct independent staggered rectangles on the unrotated integer grid.
  for(let x=-15.73;x<16;x+=.37)for(let y=-15.51;y<16;y+=.43){
   const wx=(x-y)*20*Math.SQRT1_2,wy=(x+y)*20*Math.SQRT1_2,b=F.sampleBoard(wx,wy),[ix,iy]=b.id;
   assert(b.across>=0&&b.across<20&&b.along>=0&&b.along<120);
   if(b.horizontal){assert(x>=ix-1e-8&&x<ix+6+1e-8&&y>=iy-1e-8&&y<iy+1+1e-8);assert.equal(((ix+iy)%12+12)%12,0);horizontal++;}
   else{assert(x>=ix-1e-8&&x<ix+1+1e-8&&y>=iy-1e-8&&y<iy+6+1e-8);assert.equal(((ix+iy)%12+12)%12,6);vertical++;}
   samples++;
  }
  assert(Math.abs(horizontal-vertical)/samples<.03);
  const ray=new T.Raycaster();let edgeSamples=0;V.scene.updateMatrixWorld(true);
  for(let x=547;x<714;x+=3.7)for(let y=807;y<954;y+=3.7){if(F.finishAt(x,y)!=='large-format-stone')continue;ray.set(V.pos(x,y,2),new T.Vector3(0,-1,0));const hits=ray.intersectObjects([F.floor,...F.entry.children]);assert(hits.length);assert(hits.filter(h=>h.point.y>.19).length<=1);edgeSamples++;}
  V.selectRoom('living');f.tick(150,1000/60);const count=V.renderer.draws||0;f.tick(120,1000/60);assert.equal(V.renderer.draws||0,count,'Still view stops redrawing');
  const moving=V.renderer.draws||0;for(let i=0;i<60;i++){V.camera.position.x+=.1;f.tick(1,1000/60);}const submissions=(V.renderer.draws||0)-moving;assert(submissions>=29&&submissions<=31);
  report.versions.push({version:'v'+v,geometryUnchanged:old?true:null,meshCount:current.meshes,boardSamples:samples,horizontal,vertical,entryBoundarySamples:edgeSamples,textureCount:6,idleDraws:0,movingSubmissionsPerSimulatedSecond:submissions});
  console.log('V'+v+': herringbone coverage, rotated grain mapping, floor boundaries, geometry and render scheduling passed.');
  if(v===1&&!process.argv.includes('--no-images')){const views=[{id:'floor',room:'living',name:'公共區人字拼',p:[675,700,235],t:[675,760,0]}];if(old)render({T:old.T,V:old.V,version:'before',out,views,textured:true});render({T,V,version:'after',out,views,textured:true});}
 }
 fs.writeFileSync(path.join(out,'驗證.json'),JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
