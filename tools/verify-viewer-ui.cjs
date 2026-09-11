'use strict';
// Pure DOM regression checks. No browser, renderer, local server or network access.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const modules=process.env.HOME_UI_TEST_MODULES||path.join(process.env.TEMP,'w-home-ui-dom-tests','node_modules');
const {parseHTML}=require(path.join(modules,'linkedom')),CSSOM=require(path.join(modules,'cssom'));
const cssWhat=require(path.join(modules,'css-what'));
const R=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(R,f),'utf8'),T=require('../assets/three.min.js');
const checks=[],geometry=JSON.parse(read('調整紀錄/20260910設備整合/幾何驗證.json'));
function specificity(tokens){return tokens.reduce((n,t)=>n+(t.type==='tag'?1:t.type==='attribute'?(t.name==='id'?10000:100):t.type==='pseudo'?(['is','has','not'].includes(t.name)?Math.max(...t.data.map(specificity)):t.name==='where'?0:100):0),0);}
function selectors(s){const result=[];let depth=0,start=0;for(let i=0;i<s.length;i++){if('(['.includes(s[i]))depth++;if(')]'.includes(s[i]))depth--;if(s[i]===','&&depth===0){result.push(s.slice(start,i));start=i+1;}}result.push(s.slice(start));return result;}
function cssValue(d,node,prop,width=1920){
  let best=null,order=0;
  function scan(rules,enabled=true){for(const rule of rules){if(rule.media){const condition=rule.media.mediaText;const okay=enabled&&(!/prefers-reduced-motion/.test(condition))&&(!/pointer:coarse/.test(condition)||width<760)&&Array.from(condition.matchAll(/(max|min)-width:\s*(\d+)px/g)).every(m=>m[1]==='max'?width<=Number(m[2]):width>=Number(m[2]));scan(rule.cssRules,okay);continue;}if(!enabled||!rule.selectorText||!rule.style?.getPropertyValue(prop))continue;for(const s of selectors(rule.selectorText)){let matches=false;try{matches=node.matches(s);}catch(_){}if(!matches)continue;const priority=rule.style.getPropertyPriority(prop)==='important'?1:0,spec=specificity(cssWhat.parse(s)[0]),entry={priority,spec,order:order++,value:rule.style.getPropertyValue(prop)};if(!best||entry.priority>best.priority||entry.priority===best.priority&&entry.spec>=best.spec)best=entry;}}}
  for(const el of d.head.children){if(el.tagName==='STYLE')scan(CSSOM.parse(el.textContent).cssRules);else if(el.tagName==='LINK'&&el.rel==='stylesheet'){const file=decodeURIComponent(new URL(el.href,'file:///project/').pathname.split('/').pop());if(fs.existsSync(path.join(R,file)))scan(CSSOM.parse(read(file)).cssRules);}}
  return best?.value;
}
function fixture(v,params='') {
  const proposal=v!=='v1',prefix=v==='a'?'提案/南牆電視與開放中島/':v==='v3'?'提案/開放大中島/':proposal?'提案/旋轉電視與直線中島/':'',modelPrefix=proposal?'提案/旋轉電視與直線中島/':'';
  const {document,window:dom}=parseHTML(read(prefix+'index.html'));
  const listeners={},calls=[],storage=new Map();
  let activeElement=null,current='all';
  Object.defineProperty(document,'activeElement',{get:()=>activeElement});
  dom.HTMLElement.prototype.focus=function(){activeElement=this;};
  dom.HTMLElement.prototype.scrollIntoView=function(){};
  dom.HTMLElement.prototype.getBoundingClientRect=function(){return {x:0,y:0,left:0,right:1000,top:0,bottom:700,width:1000,height:700};};
  dom.HTMLElement.prototype.showModal=function(){this.setAttribute('open','');};
  dom.HTMLElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new dom.Event('close'));};
  Object.defineProperty(dom.HTMLElement.prototype,'open',{get(){return this.hasAttribute('open');},set(v){v?this.setAttribute('open',''):this.removeAttribute('open');},configurable:true});
  Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{get(){return this._value??this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(v){this._value=String(v);},configurable:true});
  Object.defineProperty(document,'readyState',{value:'complete',configurable:true});
  Object.defineProperty(document,'currentScript',{value:{src:''},writable:true,configurable:true});
  Object.defineProperty(document,'baseURI',{value:'file:///project/',configurable:true});
  const base=new URL('file:///project/'+prefix+'index.html?layout='+(v)+params);
  const location={href:base.href,search:base.search,hash:base.hash,assign:u=>calls.push(['navigate',u])};
  const c={document,location,history:{replaceState(){}},console,URL,URLSearchParams,Blob,Date,Math,Set,Map,Event:dom.Event,CustomEvent:dom.CustomEvent,MutationObserver:dom.MutationObserver,THREE:T,innerWidth:1920,innerHeight:1080,ResizeObserver:class{observe(){}},requestAnimationFrame:()=>0,setTimeout:()=>0,setInterval:()=>0,clearInterval(){},performance:{now:()=>0},XMLSerializer:class{serializeToString(n){return n.outerHTML;}},navigator:{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},confirm:()=>true};
  c.window=c;c.addEventListener=(n,fn)=>{(listeners[n]??=[]).push(fn);};c.dispatchEvent=e=>{(listeners[e.type]||[]).forEach(fn=>fn(e));};vm.createContext(c);
  function run(f){document.currentScript={src:new URL(f,'file:///project/').href};vm.runInContext(read(f),c,{filename:f});}
  function el(tag,id,html,host=document.body){const n=document.createElement(tag);if(id)n.id=id;if(html)n.innerHTML=html;host.append(n);return n;}
  const $=id=>document.getElementById(id);
  // Actual room metadata and existing tour/walking/AI handlers, with a camera-only scene.
  const layout={isV2:v==='v1'};
  const rooms=vm.runInNewContext(read(modelPrefix+'design.js').match(/const ROOMS=(\[[\s\S]*?\n\]);/)[1],{layout});
  if(['v3','a'].includes(v))for(const [id,n] of [['island','開放大中島'],['collection','展示與深收納']])rooms.find(r=>r.id===id).n=n;
  if(v==='a'){const spec=JSON.parse(read('提案/南牆電視與開放中島/格局尺寸.json'));for(const [id,p] of Object.entries(spec.rooms))Object.assign(rooms.find(r=>r.id===id),p);}
  const scene=new T.Scene(),architecture=new T.Group(),fittings=new T.Group(),camera=new T.PerspectiveCamera();scene.add(architecture,fittings);
  c.HOME_VIEWER={rooms,scene,architecture,fittings,camera,wallParts:[],finishContext:{materials:{steel:new T.MeshBasicMaterial()}},pos:(x,y,z)=>new T.Vector3(x-482.5,z,y-480),capturePlan:()=>'',doorPlan:()=>[],syncWalkCamera(){},nudge:action=>calls.push(['camera',action]),focusObject:g=>calls.push(['focus',g.name]),getCurrent:()=>current,selectRoom:id=>{
    current=id;const r=rooms.find(r=>r.id===id);assert(r,id);camera.position.copy(c.HOME_VIEWER.pos(...r.p));
    $('roomtitle').textContent=r.n;$('roomnote').textContent=r.note;$('hint').textContent='拖曳轉向 · 滾輪縮放';
    document.querySelectorAll('#rooms [data-id]').forEach(b=>b.classList.toggle('active',b.dataset.id===id));c.dispatchEvent(new dom.CustomEvent('roomchange',{detail:id}));
  }};
  for(const r of rooms){const b=el('button','',`<span>${r.n}</span><small>${r.en}</small>`,$('rooms'));b.dataset.id=r.id;}
  $('export').onclick=()=>calls.push(['export']);$('full').onclick=()=>calls.push(['fullscreen']);
  run(prefix+'layout-version.js');
  c.SOURCE_PLAN={walls:{x:0,y:0,w:100,h:100,url:'data:image/svg+xml,'},furniture:{x:0,y:0,w:100,h:100,url:'data:image/svg+xml,'}};
  run('assets/ai-interiors/catalog.js');run(modelPrefix+'tour.js');run('walk.js');run('interaction.js');
  for(const fn of listeners.DOMContentLoaded||[])fn();listeners.DOMContentLoaded=[];
  const raw=read('rgb-lighting.js').split('\n').find(l=>l.startsWith('panel.innerHTML='));
  const html=vm.runInNewContext(raw.slice(raw.indexOf('=')+1).replace(/;\s*$/,''),{modes:{static:'恆亮',breathe:'呼吸',rainbow:'彩虹循環',wave:'彩虹波浪',chase:'流光追逐'}});
  el('section','homeControls',html);el('button','homeControlsToggle','燈光與窗簾');
  el('div','curtainControls','<select id="curtainSelect"><option value="all">全部</option><option value="living1">客廳</option><option value="studyN">書房</option><option value="bed">主臥</option><option value="kitchen">廚房</option></select><button id="curtainOpen">開窗簾</button><button id="curtainClose">關窗簾</button><span id="curtainState"></span>',$('homeCurtainSlot'));
  $('rgbRoom').onchange=()=>calls.push(['rgbRoom',$('rgbRoom').value]);$('curtainSelect').onchange=()=>calls.push(['curtainSelect',$('curtainSelect').value]);
  for(const id of ['curtainOpen','curtainClose','rgbShowModel'])$(id).onclick=()=>calls.push([id]);
  el('div','realismControls','<button id="realismQuality">畫質：精細</button><span id="realismStatus">就緒</span>',$('walkHUD'));
  if(proposal&&v!=='a'){const html=read(modelPrefix+'rotating-tv.js').match(/panel.innerHTML = `([\s\S]*?)`;/)[1];el('section','rotatingTVPanel',html,$('view').parentElement);document.querySelectorAll('[data-tv-facing]').forEach(b=>b.onclick=()=>calls.push(['tv',b.dataset.tvFacing]));}
  run('assets/ai-interiors/catalog.js');run('ai-views.js');
  const equipment=geometry.variants[['v3','a'].includes(v)?'v2':v].equipment.map(e=>{const g=new T.Group();g.name=e.name;g.userData.equipment=e.expected;g.userData.desc=e.name;return g;});
  c.HOME_EQUIPMENT={items:equipment,switchStation:equipment.find(g=>g.userData.equipment.key==='switch2'),setInspection:on=>calls.push(['inspection',on])};
  // Door mechanics are already verified with full geometry. Track dispatch here.
  c.HOME_INTERACTION={blocksPoint:()=>false,toggleDoor:key=>calls.push(['door',key]),getState:()=>({entries:[]})};
  run('equipment-controls.js');if(v==='a'){c.HOME_FIXED_LIVING={stools:[]};run('提案/南牆電視與開放中島/plan-a-controls.js');}run('furniture-core.js');run('furniture-data.js');run('furniture-app.js');
  const originals=Object.fromEntries(['kitchenDoorToggle','closetMirrorToggle','showSwitch2','inspectEquipment','curtainOpen','curtainClose','realismQuality','export'].map(id=>[id,$(id)]));
  run('viewer-ui.js');
  return {c,document,$,calls,originals,run,dom,listeners};
}
(async()=>{
for(const v of ['v1','v2','v3','a']){
  const a=fixture(v),{c,document:d,$,calls,originals}=a;
  assert(c.HOME_UI, v+' initialized');assert.equal(c.HOME_UI.getState().room,'all');
  assert.equal(d.querySelectorAll('.uiPrimary > button').length,3);
  assert.equal($('layoutSwitch').children.length,4);assert.equal(d.querySelectorAll('#uiRoomList [data-id]').length,13);
  assert.equal(cssValue(d,d.querySelector('body > header'),'display'),'flex');assert.equal(cssValue(d,$('uiSidebar'),'display'),'flex');assert.equal(cssValue(d,$('planPanel'),'display'),'none');
  assert.equal(cssValue(d,d.querySelector('.shell'),'height'),'auto');assert.equal(cssValue(d,$('scenePanel'),'grid-template-rows'),'auto minmax(0,1fr) auto');
  const ids=Array.from(d.querySelectorAll('[id]')).map(n=>n.id);assert.equal(new Set(ids).size,ids.length,'No duplicate IDs '+v);
  for(const [id,n]of Object.entries(originals))assert.strictEqual($(id),n,'Preserved original control '+id);
  assert($('uiInspector').contains($('kitchenDoorToggle')));assert($('uiInspector').contains($('curtainOpen')));assert($('uiInspector').contains($('cut')));
  $('planToggle').click();assert(!$('planPanel').hidden);assert($('uiRoomList').hidden);
  $('uiExpandPlan').click();assert($('uiMapDialog').open);assert.equal($('planPanel').parentElement.id,'uiMapDialog');
  $('uiMapDialogClose').click();assert(!$('uiMapDialog').open);assert.equal($('planPanel').parentElement.className,'uiSideContent');
  $('uiRoomsTab').click();assert($('planPanel').hidden);assert(!$('uiRoomList').hidden);
  d.querySelector('[data-id="kitchen"]').click();assert.equal(c.HOME_UI.getState().room,'kitchen');assert.equal($('activeRoom').textContent,'廚房');
  $('uiOpenControls').click();assert(!$('uiInspector').hidden);assert(!$('kitchenDoorToggle').hidden);assert($('closetMirrorToggle').hidden);$('kitchenDoorToggle').click();assert(calls.some(q=>q[0]==='door'&&q[1]==='kitchen'));
  d.querySelector('[data-id="closet"]').click();assert($('kitchenDoorToggle').hidden);assert(!$('closetMirrorToggle').hidden);$('closetMirrorToggle').click();assert(calls.some(q=>q[1]==='closet-mirror'));
  $('uiAllControls').checked=true;$('uiAllControls').dispatchEvent(new a.dom.Event('change'));assert(!$('kitchenDoorToggle').hidden);
  $('inspectEquipment').click();assert(calls.some(q=>q[0]==='inspection'&&q[1]));$('curtainOpen').click();assert(calls.some(q=>q[0]==='curtainOpen'));
  $('uiDisplayTab').click();assert.equal(c.HOME_UI.getState().inspectorView,'display');assert(!$('uiDisplayBody').hidden);
  $('uiInspectorClose').click();assert($('uiInspector').hidden);assert.equal($('uiOpenControls').getAttribute('aria-expanded'),'false');
  d.querySelector('[data-viewmode="walk"]').click();await Promise.resolve();assert.equal(c.HOME_TOUR.getMode(),'walk');assert.equal(c.HOME_WALK.getState().active,true);
  d.body.classList.add('walkImmersive');
  assert.equal(cssValue(d,d.querySelector('body > header'),'display'),'flex','walking keeps primary navigation');
  assert.equal(cssValue(d,$('uiSidebar'),'display'),'flex','walking keeps rooms');
  assert.equal(cssValue(d,$('hint'),'display'),'block','walking help visible');
  $('uiRoomsTab').focus();const key={type:'keydown',key:'ArrowRight',target:$('uiRoomsTab'),preventDefault(){throw Error('Walk intercepted a tablist arrow key');},stopImmediatePropagation(){}};
  for(const fn of a.listeners.keydown||[])fn(key);
  const arrow=new a.dom.Event('keydown',{bubbles:true,cancelable:true});arrow.key='ArrowRight';$('uiRoomsTab').dispatchEvent(arrow);assert(!$('planPanel').hidden,'tablist arrows still work while walking');
  assert.equal(cssValue(d,$('planPanel'),'display'),'flex','walking map must beat the legacy !important hide rule');
  $('uiRoomsTab').click();assert.equal(cssValue(d,$('planPanel'),'display'),'none','room list still hides map while walking');
  $('planToggle').click();assert.equal(cssValue(d,$('planPanel'),'display'),'flex','walking plan button really displays the map');
  const mapRoom=d.querySelector('.planroom[data-room="island"]');assert.equal(typeof mapRoom.onclick,'function');mapRoom.onclick();await Promise.resolve(); // LinkeDOM SVG does not dispatch onclick properties.
  assert.equal(c.HOME_UI.getState().room,'island');assert.equal(c.HOME_TOUR.getMode(),'walk','map room navigation keeps walking');
  assert.equal(cssValue(d,$('planPanel'),'display'),'flex');
  d.body.classList.remove('walkImmersive');
  d.querySelector('[data-viewmode="model"]').click();await Promise.resolve();assert(!c.HOME_WALK.getState().active);assert.equal(c.HOME_TOUR.getMode(),'model');
  const photo=d.querySelector('[data-viewmode="photo"]');if(photo&&!photo.hidden){photo.click();await Promise.resolve();assert.equal(c.HOME_TOUR.getMode(),'photo');$('planToggle').click();$('uiExpandPlan').click();const room=d.querySelector('.planroom[data-room="study"]');room.dispatchEvent(new a.dom.Event('click',{bubbles:true}));assert.equal(c.HOME_AI_VIEWS.getState().requestedRoom,'study');assert(!$('uiMapDialog').open,'choosing a map room closes enlargement during AI browsing');$('uiOpenControls').click();assert.equal(c.HOME_TOUR.getMode(),'model');}
  if(['v3','a'].includes(v)){c.HOME_VIEWER.selectRoom('island');c.HOME_AI_VIEWS.open();assert.equal(c.HOME_AI_VIEWS.getState().imageRoom,null);assert(!$('aiPhotoImage').getAttribute('src'));c.HOME_VIEWER.selectRoom('study');assert.equal(c.HOME_AI_VIEWS.getState().imageRoom,'study');c.HOME_AI_VIEWS.close();}
  $('uiRoomFurniture').click();assert(d.querySelector('.fcDialog').open);assert(d.querySelector('.fcMain h3').textContent.includes('書房'));
  const back=Array.from(d.querySelectorAll('.fcTitleRow button')).find(b=>b.textContent.includes('空間設計'));back.click();assert(!d.querySelector('.fcDialog').open);
  if(v==='a'){assert(!$('rotatingTVPanel'));assert($('aStoolToggle'));}
  $('uiResourcesButton').click();assert($('uiResources').open);assert.equal(d.querySelectorAll('.uiResource').length,8);assert(Array.from(d.querySelectorAll('.uiResource')).some(a=>decodeURI(a.href).endsWith('/提案/拆收藏室替代方案/index.html')),'alternative floor plans linked from every version');$('uiResourcesClose').click();
  $('export').click();assert(calls.some(q=>q[0]==='export'));
  const alt=v==='v2'?'v1':'v2',target=d.querySelector('[data-proposal="'+alt+'"], [data-layout="'+alt+'"]');target.click();const nav=calls.find(q=>q[0]==='navigate');assert(nav);assert(new URL(nav[1]).searchParams.get('uiRoom')==='study');
  if(v!=='v1'&&v!=='a'){assert($('uiInspector').contains($('rotatingTVPanel')));d.querySelector('[data-tv-facing="island"]').click();assert(calls.some(q=>q[0]==='tv'&&q[1]==='island'));}
  c.innerWidth=390;assert.equal(cssValue(d,$('uiSidebar'),'display',390),'none');$('uiMobileNav').click();assert(d.body.classList.contains('uiNavOpen'));assert.equal(cssValue(d,$('uiSidebar'),'display',390),'flex');$('uiNavScrim').click();assert(!d.body.classList.contains('uiNavOpen'));
  checks.push(v.toUpperCase()+': navigation, plan enlargement, all original controls, contextual room actions, walking, AI room switch, furniture return, resources, export and version handoff passed');
}
const deep=fixture('v2','&uiRoom=bed&uiMode=model');assert.equal(deep.c.HOME_UI.getState().room,'bed');checks.push('Switching versions retains selected room; normal startup returns to whole-home overview');
{
 const html=read('版本調整.html'),{document}=parseHTML(html),c={document,location:{search:'?version=v3'},history:{replaceState(){}},URLSearchParams};c.window=c;vm.createContext(c);
 vm.runInContext(read('version-changes.js'),c);vm.runInContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1],c);
 assert(document.getElementById('versionTitle').textContent.startsWith('V3'));
 assert(document.getElementById('openModel').getAttribute('href').includes('開放大中島'));
 assert(document.getElementById('metrics').textContent.includes('300 × 95'));
 for(const v of ['v1','v2','v3','a']){document.getElementById('tab-'+v).click();assert(document.getElementById('versionTitle').textContent.startsWith(v.toUpperCase()));}
 checks.push('Four design comparison tabs render correct names, metrics, drawings and 3D links');
}
for(const f of ['viewer-base.css','viewer-ui.css','furniture.css']){const sheet=CSSOM.parse(read(f));assert(sheet.cssRules.length>20);checks.push(f+': stylesheet parsed successfully');}
const retained=JSON.parse(read('調整紀錄/20260910開放大中島/驗證.json'));assert(Object.keys(retained.retained).length===2);
for(const v of ['v1','v2'])assert(retained.retained[v].meshes>2000);
checks.push('V1/V2 full mesh geometry verified separately; four-design UI and shared furniture handlers preserved');
const files=['viewer-ui.js','viewer-ui.css','viewer-base.css','walk.js','furniture-app.js','furniture.css','index.html','提案/旋轉電視與直線中島/index.html'];
const out=path.join(R,'調整紀錄/20260910介面重整');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'介面驗證.json'),JSON.stringify({date:new Date().toISOString(),method:'LinkeDOM with actual tour, walk, interaction, AI, equipment and furniture UI handlers; camera-only Three.js fixture. No browser layout or GPU rendering.',checks,hashes:Object.fromEntries(files.map(f=>[f,crypto.createHash('sha256').update(read(f)).digest('hex')]))},null,2));
console.log(checks.join('\n'));
})().catch(e=>{console.error(e);process.exitCode=1;});
