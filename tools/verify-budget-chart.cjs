'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {parseHTML}=require(path.join(process.env.HOME_UI_TEST_MODULES||path.join(process.env.TEMP,'w-home-ui-dom-tests/node_modules'),'linkedom'));
const P=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(P,f),'utf8'),C=require('../furniture-core.js'),seed=C.validate(JSON.parse(read('家具清單.json')));
function app(version='v1',source=seed){
 const {document,window:dom}=parseHTML('<html><head></head><body><main id="catalogStandalone"></main></body></html>'),storage=new Map();
 Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{get(){return this._value??this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(v){this._value=String(v);},configurable:true});
 Object.defineProperty(document,'currentScript',{value:{src:'https://test.invalid/furniture-app.js'}});Object.defineProperty(document,'readyState',{value:'complete'});
 const c={document,URL,URLSearchParams,Blob,console,Date,Math,Set,JSON,location:{search:'?version='+version},navigator:{},setTimeout:()=>0,addEventListener(){},confirm:()=>true,HOME_FURNITURE_DATA:C.clone(source),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};c.window=c;vm.createContext(c);
 for(const f of ['version-registry.js','furniture-core.js','furniture-app.js'])vm.runInContext(read(f),c,{filename:f});
 const button=label=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent===label);assert(b,label);return b;};
 return {d:document,c,button};
}
const totals=C.budget(seed.items),rooms=C.budgetByRoom(seed);
for(const key of ['min','max','pending','included','invalid','count'])assert.equal(rooms.reduce((n,r)=>n+r[key],0),totals[key]);
assert.equal(totals.min,3776738);assert.equal(totals.max,3872938);assert.equal(totals.pending,31);
for(const version of ['v0','v1','v2','v3','v4','v5']){
 const {d,c,button}=app(version),before=JSON.stringify(c.HOME_CATALOG.getState().data);
 assert.equal(d.querySelectorAll('.fcBudgetLegend .fcBudgetRoom').length,8);assert.equal(d.querySelectorAll('.fcBudgetUnpriced .fcBudgetRoom').length,4);
 assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes('3,872,938'));
 assert(d.querySelector('[data-budget-room="kitchen"]').textContent.includes('46.6%'));
 button('金額下限').click();assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes('3,776,738'));assert(d.querySelector('[data-budget-room="kitchen"]').textContent.includes('47.8%'));
 button('金額上限').click();assert.equal(JSON.stringify(c.HOME_CATALOG.getState().data),before,'Chart controls cannot mutate prices');
 const search=d.querySelector('[aria-label="搜尋家具"]');search.value='不存在的品項';search.oninput();assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes('3,872,938'),'Row search must not change whole-home chart');
 d.querySelector('[data-budget-room="whole"]').click();assert(!d.querySelector('.fcBudgetChart'));assert.equal(d.querySelector('.fcMain h3').textContent,'全屋');
 // Apply a real price edit, then return to overview: chart reads live draft data.
 const edit=[...d.querySelectorAll('button')].find(n=>n.textContent==='查看／編輯');edit.click();
 const price=[...d.querySelectorAll('.fcEditor label')].find(l=>l.textContent.startsWith('整列金額')).querySelector('input');price.value='12000';price.oninput();
 const include=[...d.querySelectorAll('.fcEditor label')].find(l=>l.textContent.includes('納入預算總計')).querySelector('input');include.checked=true;include.oninput();
 const status=[...d.querySelectorAll('.fcEditor label')].find(l=>l.textContent.startsWith('目前狀態')).querySelector('select');
 status.value='已選型';status.oninput();
 button('套用修改').click();d.querySelector('.fcSidebar button').click();const edited=C.budget(c.HOME_CATALOG.getState().data.items);
 assert.equal(edited.max,totals.max+12000);assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes(edited.max.toLocaleString('zh-TW')));
}
const sample=C.clone(seed);sample.items=sample.items.map(i=>({...i,priceText:'待報價'}));assert(!app('v1',sample).d.querySelector('.fcBudgetPie'));
sample.items[0]={...sample.items[0],priceText:'-5000',includeInBudget:true,status:'已選型'};assert(app('v1',sample).d.querySelector('.fcBudgetEmpty').textContent.includes('負金額'));
sample.items[0].priceText='25000';assert(app('v1',sample).d.querySelector('.fcBudgetPie').style.background.includes('100%'));
sample.items.push({...sample.items[0],id:'test-excluded',priceText:'999999',archived:true});assert.equal(C.budgetByRoom(sample).reduce((n,r)=>n+r.max,0),25000);
console.log(JSON.stringify({versions:6,range:[totals.min,totals.max],pending:totals.pending,checks:'room totals reconcile; range switches, excluded rows, unknown/zero/negative values, one slice, search independence, room navigation and live price edits passed'}));
