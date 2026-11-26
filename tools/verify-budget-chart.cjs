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
assert.equal(totals.min,3777972);assert.equal(totals.max,3871372);assert.equal(totals.pending,30);
// 已定案：只算「已定案／已購買」，衛浴欣加整單議價後含稅 760,000，主浴＋客浴各自分攤稅金與折讓。
const settled=C.budget(seed.items,{settled:true}),settledRooms=C.budgetByRoom(seed,{settled:true});
assert.equal(settled.min,760000);assert.equal(settled.max,760000);
for(const key of ['min','max','count'])assert.equal(settledRooms.reduce((n,r)=>n+r[key],0),settled[key]);
assert.equal(settledRooms.find(r=>r.room.id==='mbath').max,447574);assert.equal(settledRooms.find(r=>r.room.id==='gbath').max,312426);
assert(C.statuses.includes('已定案')&&C.isSettled({status:'已購買'})&&!C.isSettled({status:'已選型'}));
for(const version of ['v0','v1','v2','v3','v4','v5']){
 const {d,c,button}=app(version),before=JSON.stringify(c.HOME_CATALOG.getState().data);
 assert.equal(d.querySelectorAll('[data-budget-panel="all"] .fcBudgetLegend .fcBudgetRoom').length,8);assert.equal(d.querySelectorAll('[data-budget-panel="settled"] .fcBudgetLegend .fcBudgetRoom').length,2);assert(d.querySelector('[data-budget-panel="settled"] .fcBudgetPie').getAttribute('aria-label').includes('760,000'));assert(d.querySelector('[data-budget-panel="settled"] [data-budget-room="mbath"]').textContent.includes('447,574'));assert([...d.querySelectorAll('.fcMetric')].some(m=>m.textContent.includes('已定案金額')&&m.textContent.includes('760,000')));assert.equal(d.querySelectorAll('.fcBudgetUnpriced .fcBudgetRoom').length,4);
 assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes('3,871,372'));
 assert(d.querySelector('[data-budget-room="kitchen"]').textContent.includes('46.6%'));
 button('金額下限').click();assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes('3,777,972'));assert(d.querySelector('[data-budget-room="kitchen"]').textContent.includes('47.8%'));
 button('金額上限').click();assert.equal(JSON.stringify(c.HOME_CATALOG.getState().data),before,'Chart controls cannot mutate prices');
 const search=d.querySelector('[aria-label="搜尋家具"]');search.value='不存在的品項';search.oninput();assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes('3,871,372'),'Row search must not change whole-home chart');
 // 點右圖的主浴：只列出已定案品項，且定案項目的狀態標籤有綠色樣式。
 d.querySelector('[data-budget-panel="settled"] [data-budget-room="mbath"]').click();assert.equal(d.querySelector('.fcMain h3').textContent,'主浴');assert.equal(d.querySelector('[aria-label="清單篩選"]').value,'settled');assert.equal(d.querySelectorAll('.fcTable tbody tr').length,13);assert.equal(d.querySelectorAll('.fcTable tbody .fcTag.fcSettled').length,13);assert.equal(d.querySelectorAll('.fcTable tbody tr.fcSettledRow').length,13);assert.equal([...d.querySelectorAll('.fcTable tbody tr.fcSettledRow .fcName')].filter(n=>n.textContent.endsWith('（已定案）')).length,13);d.querySelector('.fcSidebar button').click();
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
// 整區已定案：現況主浴、客浴都還有待報價品項，側欄不應變灰；把客浴剩下的品項改成已定案後才變灰。
assert(!C.isRoomSettled(seed.items.filter(i=>i.room==='gbath'))&&!C.isRoomSettled(seed.items.filter(i=>i.room==='mbath')));
{const done=C.clone(seed);for(const i of done.items)if(i.room==='gbath'&&!i.archived&&!['不採用','資料參考','已含工程'].includes(i.status))i.status='已定案';
 const side=src=>[...app('v1',src).d.querySelectorAll('.fcSidebar button')].filter(b=>b.classList.contains('fcRoomSettled')).map(b=>b.firstChild.textContent);
 const sideAll=src=>[...app('v1',src).d.querySelectorAll('.fcSidebar button')].map(b=>b.firstChild.textContent);
 assert.deepEqual(side(seed),[]);assert.deepEqual(side(done),['客浴（已定案）']);assert(sideAll(seed).includes('主浴（定案 13/15）')&&sideAll(seed).includes('客浴（定案 9/12）')&&sideAll(seed).includes('廚房')&&!sideAll(seed).some(t=>t.includes('已定案')));
 assert.deepEqual(C.roomSettlement(seed.items.filter(i=>i.room==='mbath')),{done:13,total:15});assert(sideAll(done).includes('主浴（定案 13/15）'));}
console.log(JSON.stringify({versions:6,range:[totals.min,totals.max],pending:totals.pending,checks:'room totals reconcile; settled chart, settled filter, grey settled rows and fully settled rooms; range switches, excluded rows, unknown/zero/negative values, one slice, search independence, room navigation and live price edits passed'}));
