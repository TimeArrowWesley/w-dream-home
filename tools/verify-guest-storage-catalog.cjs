'use strict';
// Current catalog integrity checks; historical 20260910 UI fixture remains unchanged.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),C=require('../furniture-core.js');
const read=p=>fs.readFileSync(p,'utf8'),d=C.validate(JSON.parse(read('家具清單.json'))),ctx={window:{}};
vm.runInNewContext(read('furniture-data.js'),ctx);assert.deepEqual(JSON.parse(JSON.stringify(ctx.window.HOME_FURNITURE_DATA)),d);
assert.equal(new Set(d.items.map(i=>i.id)).size,d.items.length);
const imported=d.items.filter(i=>i.sourceAxId);assert.equal(imported.length,79);
for(const i of imported)assert(i.original&&i.original.name,'Imported source must remain available');
const shower=d.items.find(i=>i.id==='claude-3665');assert(shower.archived&&!shower.includeInBudget);assert(shower.original.specs.includes('花灑'));
for(const id of ['gb04-spares','gb04-phone-tissue']){
 const i=d.items.find(i=>i.id===id);assert(i&&!i.archived&&i.includeInBudget);assert.equal(i.room,'gbath');assert.equal(i.status,'待確認');assert.equal(C.parsePrice(i.priceText).kind,'pending');assert(i.currentNote.includes('非施工核定'));
}
for(const page of ['index.html','提案/原始格局/index.html','提案/旋轉電視與直線中島/index.html','提案/開放大中島/index.html','提案/南牆電視與開放中島/index.html']){
 const html=read(page);assert(html.includes('equipment-models.js?v=20260921-gbath-r04'));assert(html.includes('furniture-data.js?v=20260921-mr01'));assert(html.includes('catalog.js?v=20260921-mr01'));
}
const m=JSON.parse(read('成品圖集/20260914暗色現代工業/album-manifest.json')),bath=m.entries.filter(e=>e.room==='bath2');
assert.equal(bath.length,15);assert.equal(new Set(bath.map(e=>e.aiKey)).size,5);assert(bath.every(e=>e.aiKey.endsWith('-gb04')));
for(const v of ['v0','v1','v2','v3','v4'])assert.equal(bath.filter(e=>e.version===v).length,3);
const before='調整紀錄/20260921四版動線修正/album-before.json';if(fs.existsSync(before)){const old=JSON.parse(read(before)),canonical=a=>a.map(e=>({...e,sharedWith:[...e.sharedWith].sort()}));assert.deepEqual(canonical(bath),canonical(old.entries.filter(e=>e.room==='bath2')),'MR01 must preserve all GB-R04 guest bathroom slots');}
console.log(JSON.stringify({catalogRows:d.items.length,originalSourceRows:imported.length,newPendingItems:2,historicalShowerArchived:true,synchronizedEntries:5,guestBathroomViewSlots:15,uniqueGuestBathroomImages:5,guestBathroomRetainedDuringMR01:true}));
