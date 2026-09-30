'use strict';
// Mapping, interaction and export regression. Actual browser layout is checked separately.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const {parseHTML}=require(path.join(process.env.HOME_UI_TEST_MODULES||path.join(process.env.TEMP,'w-home-ui-dom-tests','node_modules'),'linkedom'));
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),checks=[];
const {document,window:dom}=parseHTML('<html><head></head><body><div id="planPanel"><div id="planstage"><svg id="floorplan" viewBox="-250 -70 1480 1090"><g id="hotspots"></g></svg></div></div><dialog id="uiMapDialog"></dialog><button id="uiRoomsTab"></button></body></html>');
const svg=document.getElementById('floorplan'),listeners={},$=id=>document.getElementById(id);
Object.defineProperty(document,'readyState',{value:'complete'});
let source='model',matrix={a:.5,b:0,c:0,d:.5,e:160,f:90};
svg.getScreenCTM=()=>({...matrix,inverse:()=>{const {a,b,c,d,e,f}=matrix,k=a*d-b*c;return {a:d/k,b:-b/k,c:-c/k,d:a/k,e:(c*f-d*e)/k,f:(b*e-a*f)/k};}});
svg.createSVGPoint=()=>({x:0,y:0,matrixTransform(m){return {x:m.a*this.x+m.c*this.y+m.e,y:m.b*this.x+m.d*this.y+m.f};}});
const c={document,console,CustomEvent:dom.CustomEvent,HOME_TOUR:{getSource:()=>source},addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn)};
c.window=c;vm.createContext(c);vm.runInContext(read('plan-measure.js'),c);const api=c.HOME_PLAN_MEASURE;
const json=x=>JSON.parse(JSON.stringify(x));
function pointer(type,x,y,extras={}){const e=new dom.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{clientX:matrix.a*x+matrix.c*y+matrix.e,clientY:matrix.b*x+matrix.d*y+matrix.f,detail:1,shiftKey:false,altKey:false,pointerType:'mouse'},extras);svg.dispatchEvent(e);return e;}
function key(type,key,extras={}){const e={key,target:svg,shiftKey:false,altKey:false,preventDefault(){},stopImmediatePropagation(){},...extras};for(const fn of listeners[type]||[])fn(e);}
function change(kind){source=kind;for(const fn of listeners.plansourcechange||[])fn({detail:kind});}
function check(name,fn){fn();checks.push(name);}
check('SVG affine coordinates survive scale, translation and nonuniform transform',()=>{
 for(const transform of [{a:.5,b:0,c:0,d:.5,e:160,f:90},{a:1.1,b:.2,c:-.1,d:.8,e:700,f:20}]){
  matrix=transform;api.clear();api.setOn(false);pointer('contextmenu',100,100);pointer('click',400,500);
  const p=json(api.points());assert(Math.abs(p[1][0]-400)<1e-8);assert(Math.abs(p[1][1]-500)<1e-8);assert($('pmReadout').textContent.includes('500 cm'));
 }
});
check('Multi-segment total, zero-length prevention, double click finalization',()=>{
 api.clear();pointer('click',0,0);pointer('click',300,400);pointer('click',300,500);
 assert($('pmReadout').textContent.includes('總長 600 cm'));
 pointer('click',300,500,{detail:2});pointer('dblclick',300,500);
 assert.strictEqual(api.completed()[0].length,3);assert.strictEqual(api.points().length,0);
});
check('Shift updates existing hover, preserves committed endpoint and releases',()=>{
 api.clear();pointer('click',0,0);pointer('pointermove',300,100);
 key('keydown','Shift',{shiftKey:true});assert($('pmReadout').textContent.includes('本段 300 cm'));
 key('keyup','Shift');assert($('pmReadout').textContent.includes('316 cm'));
 pointer('click',300,100,{shiftKey:true});assert(Math.abs(api.points()[1][0]-300)<1e-8);assert(Math.abs(api.points()[1][1])<1e-8);
});
check('Backspace, two-stage Escape and input protection',()=>{
 key('keydown','Backspace');assert.strictEqual(api.points().length,1);
 key('keydown','Escape',{target:document.createElement('input')});assert.strictEqual(api.points().length,1);
 key('keydown','Escape');assert(api.on());assert.strictEqual(api.points().length,0);
 key('keydown','Escape');assert(!api.on());
});
check('Original plans cannot be measured; model lines hide without deletion',()=>{
 api.setOn(true);pointer('click',0,0);pointer('click',100,0);api.finish();change('walls');
 assert(!api.on());assert($('pmToggle').disabled);assert.strictEqual($('planMeasure').style.display,'none');
 pointer('contextmenu',50,50);api.setOn(true);assert(!api.on());assert.strictEqual(api.completed().length,1);
 change('furniture');assert($('pmToggle').disabled);change('model');assert(!$('pmToggle').disabled);
});
check('Only local measured endpoints snap; Alt disables snapping',()=>{
 api.setOn(true);pointer('click',102,0);assert(Math.abs(api.points()[0][0]-100)<1e-8);assert(Math.abs(api.points()[0][1])<1e-8);
 api.setOn(false);api.setOn(true);pointer('click',102,0,{altKey:true});assert(Math.abs(api.points()[0][0]-102)<1e-8);
});
check('Right-click first and second point can finish one segment',()=>{
 api.clear();api.setOn(false);pointer('contextmenu',0,0);pointer('contextmenu',100,0);
 assert.strictEqual(api.completed().length,1);assert.strictEqual(api.points().length,0);
});
check('Export has inline styles, confirmed endpoints and unit warning, no hover',()=>{
 pointer('click',20,20);pointer('pointermove',900,900);const clone=svg.cloneNode(true);api.prepareExport(clone);
 assert.strictEqual(clone.querySelectorAll('polyline').length,1);assert(clone.textContent.includes('單位 cm'));
 assert.strictEqual(clone.querySelector('polyline').getAttribute('stroke'),'#e06432');
 change('walls');const original=svg.cloneNode(true);api.prepareExport(original);assert(!original.querySelector('#planMeasure'));change('model');
});
check('Modal closing exits mode; duplicate initialization is harmless',()=>{
 api.setOn(true);$('uiMapDialog').dispatchEvent(new dom.Event('close'));assert(!api.on());
 vm.runInContext(read('plan-measure.js'),c);assert.strictEqual(document.querySelectorAll('#pmToolbar').length,1);
});
check('All six routes load current shared tool; both source/export adapters included',()=>{
 for(const v of JSON.parse(read('version-registry.json')).versions){const html=read(v.path);assert(html.includes('plan-measure.js?v=20260930-pm01'));assert(html.includes('tour.js?v=20260930-pm01'));}
 for(const file of ['tour.js','提案/旋轉電視與直線中島/tour.js']){const s=read(file);assert(s.includes("CustomEvent('plansourcechange'"));assert(s.includes('HOME_PLAN_MEASURE?.prepareExport(clone)'));}
 assert(!/window\.HOME_DATA/.test(read('plan-measure.js')));
});
const report={revision:'PM01',passed:checks.length,checks,limits:'DOM and affine-mapping regression; not browser/GPU or onsite dimensional verification.'};
if(process.env.HOME_TEST_REPORT_DIR){fs.mkdirSync(process.env.HOME_TEST_REPORT_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.HOME_TEST_REPORT_DIR,'plan-measure.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
