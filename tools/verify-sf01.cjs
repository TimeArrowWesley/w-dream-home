'use strict';
// SF01 actual runtime: targeted atlas, preserved footprint and live controls.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
process.env.HOME_TEST_BW03='1';process.env.HOME_TEST_BW04='1';
const build=require('./home-test-fixture.cjs'),fixtures={v0:0,v1:2,v2:5,v3:6,v4:3,v5:4};
(async()=>{
 const rows=[];
 for(const version of process.argv.slice(2).length?process.argv.slice(2):Object.keys(fixtures)){
  const {c,V,T,get}=await build(fixtures[version]),A=c.HOME_BLENDER_V1,L=c.HOME_FULLHOUSE_LIGHT;
  assert.equal(A.getState().state,'ready');assert.equal(A.getState().detailRevision,'SF01');assert.equal(L.getState().state,'ready');
  const selected=A.records.filter(r=>r.sf01Detail);assert(selected.length>=17);
  for(const r of A.records){
   const expected=r.expectedWorldBounds||r.sourceWorldBounds;
   for(const side of ['min','max'])for(const axis of ['x','y','z']){
    assert(Math.abs(expected[side][axis]-r.replacementWorldBounds[side][axis])<.035);
    const change=Math.abs(r.sourceWorldBounds[side][axis]-r.replacementWorldBounds[side][axis]);
    assert(change<(r.sf01Detail?(axis==='y'?2.5:.12):.035));
   }
  }
  const targetMaterials=selected.flatMap(r=>[].concat(r.material));assert(targetMaterials.every(m=>m.userData.sf01Atlas));
  const shader={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};targetMaterials[0].onBeforeCompile(shader);
  assert(shader.uniforms.bwDay.value);assert(shader.fragmentShader.includes('bwIrradiance'));
  const ordinary=A.records.find(r=>!r.sf01Detail&&!Array.isArray(r.material)&&r.material.transmission!==.9);assert(ordinary);
  const other={uniforms:{},vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader};ordinary.material.onBeforeCompile(other);
  assert.notEqual(shader.uniforms.bwDay.value,other.uniforms.bwDay.value,'Selected objects must not sample the old atlas');
  const cabinet=A.records.flatMap(r=>[].concat(r.material)).filter(m=>m.userData.sf01Reflection!==undefined);assert(cabinet.length>10);
  get('night').classList.remove('active');L.update();
  for(const m of cabinet){assert(m.roughness>=.34);assert.equal(m.envMapIntensity,m.userData.sf01Reflection);}
  const keep=A.records.filter(r=>r.room==='kitchen');assert(keep.every(r=>!r.sf01Detail&&[].concat(r.material).every(m=>m.userData.sf01Reflection===undefined)));
  c.HOME_BLACK_INDUSTRIAL.apply();A.reapply();L.update();for(const r of A.records)assert.equal(r.o.material,r.material);
  rows.push({version,passed:true,selectedMeshes:selected.length,finishMaterials:cabinet.length,geometry:A.getState(),separateAtlas:true,orderedKitchenUnchanged:true});
 }
 const dir=path.resolve(process.env.HOME_TEST_REPORT_DIR||'調整紀錄/20261008工業細節修整SF01/runtime');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'SF01-接入驗證.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
