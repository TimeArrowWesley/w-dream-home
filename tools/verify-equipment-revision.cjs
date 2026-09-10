'use strict';
// Offline verification uses the actual Three.js model, not duplicate mock geometry.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'調整紀錄/20260910設備整合');fs.mkdirSync(out,{recursive:true});
const T={...require(path.join(root,'assets/three.min.js'))},noop=()=>{};
T.WebGLRenderer=class{constructor(){this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>1};}setPixelRatio(){}setSize(){}render(){}};T.PMREMGenerator=class{fromScene(){return {texture:new T.Texture()};}};
const context2d=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),measureText:()=>({width:100})},{get:(o,k)=>k in o?o[k]:noop});
const canvas=()=>({style:{},dataset:{},classList:{toggle:noop},appendChild:noop,getBoundingClientRect:()=>({width:960,height:720}),getContext:()=>context2d,addEventListener:noop}),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const bounds=o=>{const b=new T.Box3().setFromObject(o);return {x:b.min.x+482.5,y:b.min.z+480,z:b.min.y,w:b.max.x-b.min.x,d:b.max.z-b.min.z,h:b.max.y-b.min.y};};
const near=(x,y,why,tol=.025)=>assert(Math.abs(x-y)<tol,`${why}: ${x} != ${y}`);
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const result={revision:'20260910',method:'offline actual Three.js geometry including finish and viewer initialization, with DOM and renderer stubs; no browser UI validation',hashes:Object.fromEntries(['design.js','equipment-models.js','提案/旋轉電視與直線中島/design.js'].map(f=>[f,crypto.createHash('sha256').update(read(f)).digest('hex')])),variants:{},checks:[]};
for(const f of ['equipment-models.js','equipment-controls.js','version-changes.js','design.js','interaction.js','ai-views.js','提案/旋轉電視與直線中島/design.js'])new vm.Script(read(f),{filename:f});
for(let n=1;n<=4;n++){
 const win={THREE:T,HOME_LAYOUT:{comfort:true,isV2:n%2===0,version:n%2===0?'v2':'v1',proposal:'v'+n,entryDoorY:955},addEventListener:noop,dispatchEvent:noop};
 const c={window:win,document:{getElementById:canvas,createElement:canvas,addEventListener:noop,querySelectorAll:()=>[]},devicePixelRatio:1,console,requestAnimationFrame:noop,ResizeObserver:class{observe(){}},CustomEvent:class{}};vm.createContext(c);
 for(const f of ['model-data.js','equipment-models.js'])vm.runInContext(read(f),c,{filename:f});
 const file=n<3?'design.js':'提案/旋轉電視與直線中島/design.js';
 const src=read(file).replace(/\}\)\(\);\s*$/,'\nwindow.TEST={scene,fittings,architecture,ceiling,wallParts};})();');vm.runInContext(src,c,{filename:file,timeout:60000});
 const a=win.TEST,E=win.HOME_EQUIPMENT;a.scene.updateMatrixWorld(true);
 const equipment=E.items.map(g=>{const front=new T.Vector3(0,0,-1).applyQuaternion(g.getWorldQuaternion(new T.Quaternion()));return {name:g.name,key:g.userData.equipment.key,expected:g.userData.equipment,bounds:bounds(g),front:{x:front.x,y:front.z,z:front.y}};});
 for(const e of equipment){near(e.bounds.h,e.expected.h,`V${n} ${e.name} height`);const xy=[e.bounds.w,e.bounds.d].sort((a,b)=>a-b),xy0=[e.expected.w,e.expected.d].sort((a,b)=>a-b);near(xy[0],xy0[0],`V${n} ${e.name} width/depth`);near(xy[1],xy0[1],`V${n} ${e.name} depth/width`);}
 for(const [key,count] of Object.entries({tv:1,q6:1,q7:2,sub:2,avr:1,ps5:1,switch2:1,switch2dock:1,wine:1,ih:1,clar:1,robot:1,fridge:1,washer:1,nx:1,ls:1,projector:1,dishwasher:1,oven:1,dishdryer:1,pc:2}))assert.equal(equipment.filter(e=>e.key===key).length,count,`V${n} ${key} count`);
 const overlaps=(a,b)=>a.x<b.x+b.w-.01&&a.x+a.w>b.x+.01&&a.y<b.y+b.d-.01&&a.y+a.d>b.y+.01&&a.z<b.z+b.h-.01&&a.z+a.h>b.z+.01;
 for(let i=0;i<equipment.length;i++)for(let j=i+1;j<equipment.length;j++)assert(!overlaps(equipment[i].bounds,equipment[j].bounds),`V${n} product overlap ${equipment[i].key}/${equipment[j].key}`);
 const wine=equipment.find(e=>e.key==='wine').bounds,bay=E.bays.find(e=>e.name.includes('酒櫃開放艙'));
 assert(wine.x>=bay.x-.01&&wine.x+wine.w<=bay.x+bay.w+.01&&wine.y>=bay.y-.01&&wine.y+wine.d<=bay.y+bay.d+.01&&wine.z>=bay.z&&wine.z+wine.h<bay.z+bay.h,'Wine fits its actual open bay');
 const island=a.scene.getObjectByName(n<3?'曲線設備中島':'直線設備中島');near(island.userData.footprint.h,95,'island height');
 const rawShape=JSON.parse(read('design.js').match(/const IS=(\{.*?\}),is=/)[1]);
 const polygon=n<3?[...rawShape.north,...rawShape.south.slice().reverse()]:[[434,464],[515,464],[515,653],[434,653]];
 function inside(x,y){let ok=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [xi,yi]=polygon[i],[xj,yj]=polygon[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)ok=!ok;}return ok;}
 for(const key of ['wine','robot','clar','ih']){
  const e=equipment.find(e=>e.key===key),b=e.bounds,g=E.items.find(g=>g.userData.equipment.key===key);
  assert.strictEqual(g.parent,island,`V${n} ${key} belongs to island`);
  for(const xx of [b.x+.01,b.x+b.w/2,b.x+b.w-.01])for(const yy of [b.y+.01,b.y+b.d/2,b.y+b.d-.01])assert(inside(xx,yy),`V${n} ${key} under actual countertop at ${xx},${yy}`);
  if(key==='ih')continue;
  near(e.front.x,-1,`V${n} ${key} faces fridge`);near(e.front.y,0,`V${n} ${key} not north/south-facing`);
  const route={x:b.x-60,y:b.y+1,w:60,d:b.d-2,z:b.z+1,h:b.h-2};
  for(const other of equipment.filter(q=>q!==e))assert(!overlaps(route,other.bounds),`V${n} ${key} west opening blocked by ${other.key}`);
  for(const panel of E.covers){if(key==='clar'&&panel.userData.swingFront?.face==='W')continue;assert(!overlaps(route,bounds(panel)),`V${n} ${key} west opening blocked by ${panel.userData.name}`);}
 }
 near(equipment.find(e=>e.key==='robot').bounds.z,0,'Robot dock has a level floor entry');
 assert(E.covers.some(p=>p.userData.name==='飲水機西向檢修門'&&p.userData.swingFront.face==='W'),'Wet service door faces fridge');
 const surrounds=[];a.scene.traverse(g=>{if(g.userData.surround){const stand=g.getObjectByName('環繞獨立落地支架'),sb=bounds(stand),gb=bounds(g);near(sb.z,0,'Surround support reaches floor');near(sb.z+sb.h,95,'Surround support reaches housing');assert.equal(stand.children.length,3,'Base, continuous post and top plate');assert(!equipment.some(e=>overlaps(sb,e.bounds)),'Surround stand avoids other devices');surrounds.push({name:g.name,...g.userData.surround,bounds:gb,support:sb});}});assert.equal(surrounds.length,2);
 const named=[];a.scene.traverse(o=>{if(o.userData.name||o.userData.cabinet||o.name)named.push({name:o.userData.name||o.userData.cabinet?.name||o.name,visible:visible(o),...bounds(o)});});
 assert(!named.some(o=>/隨電視轉向聲霸|SMI8ZCS00X|GR-AQC82BS/.test(o.name)),'No legacy equipment names');
 let sweep=null;if(n>2){const tv=win.HOME_ROTATING_TV;assert.equal(tv.config.base.w,55);assert.equal(tv.config.screenCenterHeight,135);near(tv.pivot.position.x+482.5,647,'axis x');let min=Infinity,at=0;for(let degree=0;degree<=180;degree+=.25){tv.pivot.rotation.y=degree*Math.PI/180;a.scene.updateMatrixWorld(true);const b=bounds(tv.pivot);if(b.x<min){min=b.x;at=degree;}for(const q of equipment.filter(e=>['q6','q7','sub','wine','robot'].includes(e.key))){assert(!overlaps(b,q.bounds),`V${n} TV sweep envelope hits ${q.key} at ${degree}`);}}tv.pivot.rotation.y=0;a.scene.updateMatrixWorld(true);sweep={step:.25,minWest:min,minClearanceToIsland:min-515,atDegree:at};assert(min-515>30,'TV sweep leaves physical gap, not a usable simultaneous walkway');assert.equal(tv.lowerStool.visible,false);}
 const door=a.scene.getObjectByName('客浴外掛雙聯滑門');assert(door&&door.children.length===2,'Telescoping door has two linked leaves');
 // An oven's fascia intentionally covers the opening. Test each real submesh,
 // rather than treating its wider front lip as the width of the entire body.
 for(const g of E.items)g.traverse(m=>{if(m.isMesh&&visible(m))for(const cover of E.covers)assert(!overlaps(bounds(m),bounds(cover)),`V${n} equipment/cabinet overlap: ${g.userData.equipment.key} / ${cover.userData.name}`);});
 const original=E.covers.map(o=>o.material);E.setInspection(true);assert(E.allowances.every(o=>o.visible),'inspection allowances visible');E.setInspection(false);assert(E.allowances.every(o=>!o.visible),'inspection allowances hidden');E.covers.forEach((o,i)=>assert.strictEqual(o.material,original[i],'Restore original material object'));
 // Exercise the real toolbar click handler with a small DOM stub, then use
 // actual camera projection and scene raycasts to check both device fronts.
 const nodes=new Map();function element(){const e={...canvas(),children:[],appendChild(o){this.children.push(o);return o;},insertBefore(o){this.children.push(o);},setAttribute:noop};Object.defineProperty(e,'id',{get(){return this._id;},set(id){this._id=id;nodes.set(id,this);}});return e;}
 const get=id=>{if(!nodes.has(id)){const e=element();e.id=id;}return nodes.get(id);};
 c.document={readyState:'complete',currentScript:{src:'https://example.invalid/equipment-controls.js'},head:element(),getElementById:get,createElement:element,querySelector:()=>get('aside'),querySelectorAll:()=>[],addEventListener:noop};c.URL=URL;
 let selectedMode=null;win.HOME_TOUR={setMode:m=>{selectedMode=m;}};vm.runInContext(read('equipment-controls.js'),c,{filename:'equipment-controls.js'});
 const button=nodes.get('showSwitch2');assert(button&&get('layoutSwitch').children.includes(button),'Switch 2 button is in top toolbar');button.onclick();assert.equal(selectedMode,'model','Switch button exits photo/walk mode');
 a.scene.updateMatrixWorld(true);const cam=win.HOME_VIEWER.camera;cam.updateMatrixWorld(true);const switchVisibility=[];
 for(const key of ['switch2','switch2dock']){
  const g=E.items.find(o=>o.userData.equipment.key===key);let clear=0;
  for(const xx of [-7,0,7])for(const yy of [3,6,10]){
   const point=new T.Vector3(xx,yy,key==='switch2'?-.715:-E.units[key].d/2-.004).applyMatrix4(g.matrixWorld),screen=point.clone().project(cam);
   assert(Math.abs(screen.x)<.96&&Math.abs(screen.y)<.96&&Math.abs(screen.z)<1,`V${n} ${key} fits Switch close-up camera`);
   const ray=new T.Raycaster(cam.position,point.clone().sub(cam.position).normalize());const hit=ray.intersectObjects([a.fittings,a.architecture],true).find(h=>visible(h.object));let owner=hit?.object;while(owner&&owner!==g)owner=owner.parent;
   assert.strictEqual(owner,g,`V${n} ${key} close-up occluded by ${hit?.object.userData.name}`);clear++;
  }
  switchVisibility.push({key,unoccludedFrontSamples:clear});
 }
 get('equipmentSelect').value=String(E.items.findIndex(g=>g.userData.equipment.key==='switch2dock'));get('equipmentSelect').onchange();assert.equal(selectedMode,'model');
 win.HOME_VIEWER.selectRoom('all');a.scene.updateMatrixWorld(true);
 result.variants['v'+n]={equipment,bays:E.bays,island:{...island.userData.footprint,...island.userData.island},surrounds,sweep,switchVisibility,named,walls:a.wallParts.map(({m})=>bounds(m))};
 console.log(`V${n}: ${equipment.length} equipment envelopes, no pair overlaps, bay and rotation checks passed`);
}
// Shared equipment remains identical between tall / low entrance pairs.
for(const [a,b] of [['v1','v2'],['v3','v4']])assert.deepEqual(result.variants[a].equipment,result.variants[b].equipment,`${a}/${b} common equipment`);
result.checks=['JavaScript syntax','all four actual geometry builds','24 product envelopes per version including Switch 2 and dock','selected equipment counts','pairwise equipment volumes','wine fits open bay','TV sweep versus equipment at 0.25 degrees','tall/low variants share equipment','inspection toggles','two linked sliding leaves','product envelopes do not intersect equipment cabinet panels','island equipment fits actual curved/straight footprint','wine, robot and water-service openings face refrigerator with clear 60cm device/panel paths (service door opened)','robot dock sits on floor under island countertop','two surround stands connect housings to floor','actual Switch toolbar button and device selector handlers with DOM stubs','both Switch devices framed and unobstructed at 9 front-face points in each version'];
fs.writeFileSync(path.join(out,'幾何驗證.json'),JSON.stringify(result,null,2));console.log('Saved geometry verification. Browser visual validation remains unavailable.');
