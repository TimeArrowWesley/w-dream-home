'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {parseHTML}=require(path.join(process.env.HOME_UI_TEST_MODULES||path.join(process.env.TEMP,'w-home-ui-dom-tests','node_modules'),'linkedom'));
const T=require('../assets/three.min.js'),root=path.resolve(__dirname,'..'),folder='成品圖集/20260914暗色現代工業/',read=f=>fs.readFileSync(path.join(root,f),'utf8');
const {document,window:dom}=parseHTML(read(folder+'index.html'));
Object.defineProperty(document,'currentScript',{value:{src:''},writable:true});
dom.HTMLElement.prototype.showModal=function(){this.open=true;};dom.HTMLElement.prototype.close=function(){this.open=false;};
Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{get(){return this._value||'all';},set(v){this._value=v;}});
const c={document,URL,URLSearchParams,location:{search:'?version=v1&room=closet'},history:{replaceState(){}},console};c.window=c;vm.createContext(c);
function run(file){document.currentScript={src:new URL(file,'https://home.test/').href};vm.runInContext(read(file),c,{filename:file});}
run(folder+'album-data.js');run('assets/ai-interiors/catalog.js');run(folder+'viewpoint-plan.js');
const {pose}=c.HOME_VIEWPOINT_PLAN,manifest=JSON.parse(read(folder+'album-manifest.json'));
const plain=o=>JSON.parse(JSON.stringify(o)),near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
let cameras=0;
for(const e of c.HOME_ALBUM.entries){
 const original=manifest.entries.find(o=>o.key===e.key),item=c.HOME_AI_PHOTOS[e.version].find(o=>o.id===e.key);
 assert.deepEqual(plain(e.camera),plain(item.camera));assert.deepEqual(plain(e.camera.position),original.p);assert.deepEqual(plain(e.camera.target),original.t);
 assert.equal(e.camera.fov,original.fov);assert.equal(e.camera.aspect,original.width/original.height);
 const p=pose(e.camera);assert(p,e.key);
 // Independent Three.js unprojection of the two horizontal mid-height rays.
 const camera=new T.PerspectiveCamera(original.fov,original.width/original.height,2,4000);
 const xyz=a=>new T.Vector3(a[0],a[2],a[1]);camera.position.copy(xyz(original.p));camera.lookAt(xyz(original.t));camera.updateMatrixWorld(true);
 for(const side of [-1,1]){const ray=new T.Vector3(side,0,.5).unproject(camera).sub(camera.position);const heading=Math.atan2(ray.z,ray.x);const delta=Math.atan2(Math.sin(heading-p.heading),Math.cos(heading-p.heading));near(Math.abs(delta),p.half);}
 cameras++;
}
for(const [target,heading] of [[[1,0,160],0],[[0,1,160],Math.PI/2],[[-1,0,160],Math.PI],[[0,-1,160],-Math.PI/2]])near(pose({position:[0,0,160],target,fov:60,aspect:1.5}).heading,heading);
for(const invalid of [null,{}, {position:[0,0,160],target:[0,0,0],fov:70,aspect:1.5},{position:[0,0,160],target:[1,1,160],fov:70},{position:[0,0,NaN],target:[1,1,160],fov:70,aspect:1.5}])assert.equal(pose(invalid),null);
run(folder+'album.js');
const $=id=>document.getElementById(id);let interactions=0;
for(const v of c.HOME_ALBUM.versions){
 $('versions').querySelector(`[data-version=${v.id}]`).click();
 for(const r of c.HOME_ALBUM.rooms){
  $('room').value=r.id;$('room').onchange();
  for(const card of $('gallery').querySelectorAll('.photo')){
   card.click();const e=c.HOME_ALBUM.entries.find(e=>e.key===$('detailPlan').dataset.viewId);assert.equal(e.version,v.id);assert.equal(e.room,r.id);
   const marker=$('detailPlan').querySelector('.vpMarker'),p=pose(e.camera);assert.equal(marker.getAttribute('transform'),`translate(${p.x} ${p.y}) rotate(${p.heading*180/Math.PI})`);
   assert($('detailPlan').querySelector('image').getAttribute('href').endsWith(`/plans/${v.id}-vp01.webp`));
   const zoom=$('detailPlan').querySelector('.vpZoom');zoom.click();assert.equal(zoom.textContent,'看全屋');const box=$('detailPlan').querySelector('svg').getAttribute('viewBox').split(' ').map(Number);assert(box[0]<=p.x&&p.x<=box[0]+box[2]&&box[1]<=p.y&&p.y<=box[1]+box[3]);assert(box[0]>=-250&&box[1]>=-70&&box[0]+box[2]<=1230&&box[1]+box[3]<=1020);zoom.click();
   const id=e.key;$('next').click();assert.notEqual($('detailPlan').dataset.viewId,id);$('previous').click();assert.equal($('detailPlan').dataset.viewId,id);
   document.querySelector('[data-detail-mode=compare]').click();assert.equal($('detailImages').children.length,2);assert.equal($('detailPlan').dataset.viewId,id);$('close').click();interactions++;
  }
 }
}
const empty=document.createElement('aside');document.body.append(empty);const card=c.HOME_VIEWPOINT_PLAN.create(empty);card.update({id:'missing'},'v1','缺資料');assert.equal(empty.querySelector('.vpMarker').children.length,0);assert(empty.querySelector('.vpZoom').disabled);card.update(null,'v1','');assert(empty.hidden);
const result={cameras,detailInteractions:interactions,cardinalDirections:4,independentThreeJSRayProjection:true,missingMetadataHandled:true,method:'Offline DOM and real Three.js projection; visual layout verified separately'};
const out=path.resolve(process.env.HOME_TEST_REPORT_DIR||path.join(root,'調整紀錄/20261002AI取景定位VP01'));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'取景定位驗證.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
