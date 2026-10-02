'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),build=require('./home-test-fixture.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20261002廚房五視角KP02');
const versions=JSON.parse(fs.readFileSync(path.join(P,'version-registry.json'),'utf8')).versions;
const overrides={'kitchen-plan-corrections.js':'','kitchen-plan-finalize.js':''};
for(const f of ['design.js','提案/旋轉電視與直線中島/design.js','equipment-models.js','curtains.js','interaction.js'])overrides[f]=fs.readFileSync(path.join(R,'before',f),'utf8');
function sig(f,root,architecture=false){f.V.scene.updateMatrixWorld(true);const a=[];root.traverse(o=>{if(!o.isMesh)return;const b=f.bounds(o);if(architecture?b.x>=-12.1&&b.x+b.w<=.1&&b.y>=641.9&&b.y+b.d<=897.1:b.x>=-.1&&b.x+b.w<=211&&b.y>=492.8&&b.y+b.d<=955.2)return;a.push([o.name,o.userData.name,Array.from(o.geometry.attributes.position.array),o.matrixWorld.elements]);});return crypto.createHash('sha256').update(JSON.stringify(a)).digest('hex');}
(async()=>{const report={passed:false,versions:[],limits:['指定構件與啟閉抽樣，非工程認證','門窗霧化只用於圖集比較','新窗位置／尺寸按未標尺寸廚具圖推估','現有83.5cm檯面前緣距保持，與圖面85cm差異待丈量']};
for(const v of versions){const old=await build(v.fixture,overrides),f=await build(v.fixture),K=f.c.HOME_KITCHEN_PLAN;
 assert.equal(sig(f,f.V.architecture,true),sig(old,old.V.architecture,true),'outside kitchen window architecture retained');
 assert.equal(sig(f,f.V.fittings),sig(old,old.V.fittings),'other rooms fittings retained');
 assert.equal(f.E.units.dishwasher.name,'Bosch SMI8ZCS00X · 半嵌式');
 assert(f.V.scene.getObjectByName('KP02 半嵌洗碗機外露面板'));
 const pantry=[];f.V.fittings.traverse(o=>{if(o.userData.swingFront?.name.startsWith('C區80cm'))pantry.push(o);});assert.equal(pantry.length,4);assert(pantry.every(o=>o.userData.swingFront.noPull));
 const garages=[];f.V.fittings.traverse(o=>{if((o.userData.name||'').startsWith('Best G-931503'))garages.push(o);});assert.equal(garages.length,3);
 f.c.HOME_GREY_STONE.apply();for(const [o,m] of K.finishes)assert.equal(o.material,m,'finish override persistent');
 f.near(f.E.refinements.fridgeAir.nominalAisleCm,83.5,'existing clear aisle');
 const kitchenDoor=f.c.HOME_INTERACTION.getState().entries.find(e=>e.key==='kitchen');assert(kitchenDoor);f.c.HOME_INTERACTION.setDoor('kitchen',true);f.tick(100,40);assert(f.c.HOME_INTERACTION.getState().entries.find(e=>e.key==='kitchen').angle>.99);f.c.HOME_INTERACTION.setDoor('kitchen',false);f.tick(100,40);
 assert(!f.c.HOME_CURTAINS.getState().some(e=>e.id==='kitchen'),'incorrect floor-length kitchen curtains removed');
 const handles=[];f.V.fittings.traverse(o=>{if(o.name==='KP02 冰箱48.8cm橫把示意')handles.push(o);});assert.equal(handles.length,2);assert(handles.every(o=>o.parent.userData.swingFront),'handles follow appliance doors');
 report.versions.push({version:v.id,otherRoomsGeometryUnchanged:true,doorOperation:true,pantryDoors:4,silverStorageAppliances:3,semiIntegratedFascia:true,existingFridgeAirPath:true,window:K.window});console.log(v.id+' KP02 verified');
}
report.passed=true;fs.writeFileSync(path.join(R,'模型驗證.json'),JSON.stringify(report,null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
