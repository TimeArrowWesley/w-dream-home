'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {parseHTML}=require(path.join(process.env.HOME_UI_TEST_MODULES||path.join(process.env.TEMP,'w-home-ui-dom-tests/node_modules'),'linkedom'));
const P=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(P,f),'utf8'),C=require('../furniture-core.js'),seed=C.validate(JSON.parse(read('家具清單.json')));
function app(version='v1',source=seed,ledger=''){
 const {document,window:dom}=parseHTML('<html><head></head><body><main id="catalogStandalone"'+(ledger?' data-ledger="'+ledger+'"':'')+'></main></body></html>'),storage=new Map();
 Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{get(){return this._value??this.querySelector('option[selected]')?.value??this.querySelector('option')?.value??'';},set(v){this._value=String(v);},configurable:true});
 Object.defineProperty(document,'currentScript',{value:{src:'https://test.invalid/furniture-app.js'}});Object.defineProperty(document,'readyState',{value:'complete'});
 const c={document,URL,URLSearchParams,Blob,console,Date,Math,Set,JSON,location:{search:'?version='+version},navigator:{},setTimeout:()=>0,addEventListener(){},confirm:()=>true,HOME_FURNITURE_DATA:C.clone(source),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};c.window=c;vm.createContext(c);
 for(const f of ['version-registry.js','furniture-core.js','furniture-app.js'])vm.runInContext(read(f),c,{filename:f});
 const button=label=>{const b=[...document.querySelectorAll('button')].find(n=>n.textContent===label);assert(b,label);return b;};
 return {d:document,c,button};
}
// 家具清單頁只算家具與設備帳本；裝潢帳本另列在裝潢報價頁。
const F=seed.items.filter(i=>C.inLedger(i,'furniture')),R=seed.items.filter(i=>C.inLedger(i,'renovation')),furn={...seed,items:F};
assert.equal(F.length+R.length,seed.items.length);assert.equal(R.length,20);assert(!R.some(i=>['mb08-shower-glass','claude-3872'].includes(i.id)),'淋浴隔間與電動曬衣架留在家具清單');
const totals=C.budget(F),rooms=C.budgetByRoom(furn);
for(const key of ['min','max','pending','included','invalid','count'])assert.equal(rooms.reduce((n,r)=>n+r[key],0),totals[key]);
assert.equal(totals.min,3766555);assert.equal(totals.max,3855555);assert.equal(totals.pending,14);
// 已定案：只算「已定案／已購買」，衛浴欣加整單議價後含稅 760,000，主浴＋客浴各自分攤稅金與折讓。
const settled=C.budget(F,{settled:true}),settledRooms=C.budgetByRoom(furn,{settled:true});
// 定案另含藍海淨水 11/21 三台（已購買）：中島 58,797＋廚房 45,186＋全室 32,600＝刷卡 136,583。
assert.equal(settled.min,896583);assert.equal(settled.max,896583);
{const sr=id=>settledRooms.find(r=>r.room.id===id).max;assert.equal(sr('island')+sr('kitchen')+sr('balcony'),136583);}
for(const key of ['min','max','count'])assert.equal(settledRooms.reduce((n,r)=>n+r[key],0),settled[key]);
assert.equal(settledRooms.find(r=>r.room.id==='mbath').max,447574);assert.equal(settledRooms.find(r=>r.room.id==='gbath').max,312426);
assert(C.statuses.includes('已定案')&&C.isSettled({status:'已購買'})&&!C.isSettled({status:'已選型'}));
for(const version of ['v0','v1','v2','v3','v4','v5']){
 const {d,c,button}=app(version),before=JSON.stringify(c.HOME_CATALOG.getState().data);
 assert.equal(d.querySelectorAll('[data-budget-panel="all"] .fcBudgetLegend .fcBudgetRoom').length,8);assert.equal(d.querySelectorAll('[data-budget-panel="settled"] .fcBudgetLegend .fcBudgetRoom').length,5);assert(d.querySelector('[data-budget-panel="settled"] .fcBudgetPie').getAttribute('aria-label').includes('896,583'));assert(d.querySelector('[data-budget-panel="settled"] [data-budget-room="mbath"]').textContent.includes('447,574'));assert([...d.querySelectorAll('.fcMetric')].some(m=>m.textContent.includes('已定案金額')&&m.textContent.includes('896,583')));assert.deepEqual([...d.querySelectorAll('.fcBudgetUnpriced .fcBudgetRoom')].map(b=>b.dataset.budgetRoom??b.getAttribute('data-budget-room')),['bed']);
 assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes('3,855,555'));
 assert(d.querySelector('[data-budget-panel="all"] [data-budget-room="kitchen"]').textContent.includes('48.0%'));
 button('金額下限').click();assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes('3,766,555'));assert(d.querySelector('[data-budget-panel="all"] [data-budget-room="kitchen"]').textContent.includes('49.1%'));
 button('金額上限').click();assert.equal(JSON.stringify(c.HOME_CATALOG.getState().data),before,'Chart controls cannot mutate prices');
 const search=d.querySelector('[aria-label="搜尋家具"]');search.value='不存在的品項';search.oninput();assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes('3,855,555'),'Row search must not change whole-home chart');
 // 點右圖的主浴：只列出已定案品項，且定案項目的狀態標籤有綠色樣式。
 d.querySelector('[data-budget-panel="settled"] [data-budget-room="mbath"]').click();assert.equal(d.querySelector('.fcMain h3').textContent,'主浴');assert.equal(d.querySelector('[aria-label="清單篩選"]').value,'settled');assert.equal(d.querySelectorAll('.fcTable tbody tr').length,13);assert.equal(d.querySelectorAll('.fcTable tbody .fcTag.fcSettled').length,13);assert.equal(d.querySelectorAll('.fcTable tbody tr.fcSettledRow').length,13);assert.equal([...d.querySelectorAll('.fcTable tbody tr.fcSettledRow .fcName')].filter(n=>n.textContent.endsWith('（已定案）')).length,13);d.querySelector('.fcSidebar button').click();
 d.querySelector('[data-budget-room="whole"]').click();assert(!d.querySelector('.fcBudgetChart'));assert.equal(d.querySelector('.fcMain h3').textContent,'全屋');
 // Apply a real price edit, then return to overview: chart reads live draft data.
 const edit=[...d.querySelectorAll('button')].find(n=>n.textContent==='查看／編輯');edit.click();
 const price=[...d.querySelectorAll('.fcEditor label')].find(l=>l.textContent.startsWith('整列金額')).querySelector('input');price.value='12000';price.oninput();
 const include=[...d.querySelectorAll('.fcEditor label')].find(l=>l.textContent.includes('納入預算總計')).querySelector('input');include.checked=true;include.oninput();
 const status=[...d.querySelectorAll('.fcEditor label')].find(l=>l.textContent.startsWith('目前狀態')).querySelector('select');
 status.value='已選型';status.oninput();
 button('套用修改').click();d.querySelector('.fcSidebar button').click();const edited=C.budget(c.HOME_CATALOG.getState().data.items.filter(i=>C.inLedger(i,'furniture')));
 assert.equal(edited.max,totals.max+12000);assert(d.querySelector('.fcBudgetPie').getAttribute('aria-label').includes(edited.max.toLocaleString('zh-TW')));
}
const sample=C.clone(seed);sample.items=sample.items.map(i=>({...i,priceText:'待報價'}));assert(!app('v1',sample).d.querySelector('.fcBudgetPie'));
sample.items[0]={...sample.items[0],priceText:'-5000',includeInBudget:true,status:'已選型'};assert(app('v1',sample).d.querySelector('.fcBudgetEmpty').textContent.includes('負金額'));
sample.items[0].priceText='25000';assert(app('v1',sample).d.querySelector('.fcBudgetPie').style.background.includes('100%'));
sample.items.push({...sample.items[0],id:'test-excluded',priceText:'999999',archived:true});assert.equal(C.budgetByRoom(sample).reduce((n,r)=>n+r.max,0),25000);
// 整區已定案：現況主浴、客浴都還有待報價品項，側欄不應變灰；把客浴剩下的品項改成已定案後才變灰。
// 客浴吊櫃、拉門、手機平台移到裝潢帳本，家具清單的客浴品項全部定案；主浴還有淋浴玻璃未定（浴櫃已移到裝潢）。
assert(C.isRoomSettled(F.filter(i=>i.room==='gbath'))&&!C.isRoomSettled(F.filter(i=>i.room==='mbath')));
{const done=C.clone(seed);for(const i of done.items)if(i.room==='mbath'&&!i.archived&&!['不採用','資料參考','已含工程'].includes(i.status))i.status='已定案';
 const side=src=>[...app('v1',src).d.querySelectorAll('.fcSidebar button')].filter(b=>b.classList.contains('fcRoomSettled')).map(b=>b.firstChild.textContent);
 const sideAll=src=>[...app('v1',src).d.querySelectorAll('.fcSidebar button')].map(b=>b.firstChild.textContent);
 assert.deepEqual(side(seed),['客浴（已定案）']);assert.deepEqual(side(done),['主浴（已定案）','客浴（已定案）']);assert(sideAll(seed).includes('主浴（定案 13/14）')&&sideAll(seed).includes('客浴（已定案）')&&sideAll(seed).includes('廚房（定案 1/6）')&&sideAll(seed).includes('中島（定案 1/7）')&&sideAll(seed).includes('後陽台（定案 1/4）')&&sideAll(seed).filter(t=>t.includes('已定案')).length===1);
 assert.deepEqual(C.roomSettlement(F.filter(i=>i.room==='mbath')),{done:13,total:14});assert(sideAll(done).includes('主浴（已定案）'));}
// 裝潢報價頁：同一份資料只顯示裝潢帳本，兩張圓餅圖（總價、已定案），可把品項移回家具清單。
{const {d,c,button}=app('v1',seed,'renovation');
 assert.equal(d.querySelector('.fcHeader h2').textContent,'裝潢報價');assert.equal(d.querySelector('.fcMain h3').textContent,'裝潢總覽');
 const names=[...d.querySelectorAll('.fcSidebar button')].map(b=>b.firstChild.textContent);
 assert.equal(names.length,11);assert(!names.includes('選購條件')&&!names.includes('廚房')&&names.includes('更衣室'));
 assert.equal(d.querySelectorAll('.fcTable tbody tr').length,R.filter(i=>!i.archived).length);
 assert(d.querySelector('[data-budget-panel="all"]')&&d.querySelector('[data-budget-panel="settled"]'));
 assert(d.querySelector('[data-budget-panel="all"] .fcBudgetPie').getAttribute('aria-label').includes('100,000'));
 assert(d.querySelector('[data-budget-panel="settled"] .fcBudgetEmpty'));assert(!d.querySelector('[data-budget-room="kitchen"]')&&!d.querySelector('[data-budget-room="whole"]'),'沒有裝潢品項的區域不列在圖表');
 assert(d.querySelector('.fcPageLink').href.includes(encodeURI('家具清單.html')));
 assert([...d.querySelectorAll('.fcMetric')].some(m=>m.textContent.includes('已定案金額')&&m.textContent.includes('尚無')));
 const row=[...d.querySelectorAll('.fcTable tbody tr')].find(r=>r.textContent.includes('下牆隔間'));row.querySelector('button').click();
 const led=[...d.querySelectorAll('.fcEditor label')].find(l=>l.textContent.startsWith('帳本')).querySelector('select');assert.equal(led.value,'renovation');
 led.value='furniture';led.oninput();button('套用修改').click();
 const st=c.HOME_CATALOG.getState().data;assert.equal(st.items.find(i=>i.id==='claude-4811').ledger,'furniture');
 assert.equal(d.querySelectorAll('.fcTable tbody tr').length,R.filter(i=>!i.archived).length-1);
 assert.equal(C.budget(st.items.filter(i=>C.inLedger(i,'furniture'))).max,totals.max+100000);}
{const {d}=app('v1');assert.equal(d.querySelector('.fcHeader h2').textContent,'家具與設備清單');assert(d.querySelector('.fcPageLink').href.includes(encodeURI('裝潢報價.html')));
 assert(![...d.querySelectorAll('.fcTable tbody tr')].some(r=>r.textContent.includes('衣櫃系統')));}
console.log(JSON.stringify({versions:6,range:[totals.min,totals.max],pending:totals.pending,checks:'room totals reconcile; renovation page split; settled chart, settled filter, grey settled rows and fully settled rooms; range switches, excluded rows, unknown/zero/negative values, one slice, search independence, room navigation and live price edits passed'}));
