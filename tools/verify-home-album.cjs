/* Offline gallery verification. No browser, network, server or GPU is launched. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),{pathToFileURL,fileURLToPath}=require('url');
const root=path.resolve(__dirname,'../成品圖集/20260914暗色現代工業');
const window={};vm.runInNewContext(fs.readFileSync(path.join(root,'album-data.js'),'utf8'),{window});
const data=window.HOME_ALBUM;
assert.equal(data.complete,true);assert.equal(data.entries.length,144);assert.equal(data.uniqueImages,82);
for(const v of data.versions)for(const r of data.rooms){
 const e=data.entries.filter(e=>e.version===v.id&&e.room===r.id);assert.equal(e.length,3,v.id+'/'+r.id);assert.equal(new Set(e.map(x=>x.angle)).size,3);assert.equal(new Set(e.map(x=>x.sourceHash)).size,3);
 // A narrow bathroom can show a different zone from a translated camera even
 // with a modest heading change: B is beside the vanity, C is by the tub.
 // Reject repeated camera poses while accounting for that visible parallax.
 for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){const d=Math.abs(e[a].camera.heading-e[b].camera.heading)%360,turn=Math.min(d,360-d),shift=Math.hypot(...e[a].camera.position.map((n,i)=>n-e[b].camera.position[i]));assert.ok(turn>5&&(turn>25||shift>100),'Views insufficiently distinct: '+e[a].key+'/'+e[b].key);}
}
const hashes=new Map();for(const e of data.entries){if(hashes.has(e.sourceKey))assert.equal(hashes.get(e.sourceKey),e.sourceHash);hashes.set(e.sourceKey,e.sourceHash);for(const t of ['ai','model','thumb'])assert.ok(fs.statSync(path.join(root,e[t])).size>1000,e.key+'/'+t);}
class E{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.events={};this.classList={add(){},remove(){},toggle(){}};}
 append(...xs){this.children.push(...xs);}replaceChildren(...xs){this.children=xs;}setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,f){this.events[k]=f;}showModal(){this.open=true;}close(){this.open=false;}
 querySelectorAll(q){return this.children.flatMap(c=>[...(q==='button'&&c.tag==='button'?[c]:[]),...c.querySelectorAll(q)]);}
 querySelector(q){if(q==='option[value="collection"]')return this.children.find(c=>c.value==='collection');throw Error(q);}
}
const ids=Object.fromEntries(['versions','room','gallery','count','detailTitle','detailVersion','detailImages','download','detailPosition','detail','close','previous','next','provenance'].map(k=>[k,new E(k)]));
const modes=['ai','model'].map(m=>{const b=new E('button');b.dataset.mode=m;return b;}),details=['ai','model','compare'].map(m=>{const b=new E('button');b.dataset.detailMode=m;return b;});
const document={currentScript:{src:pathToFileURL(path.join(root,'album.js')).href},body:new E('body'),createElement:t=>new E(t),getElementById:k=>{assert.ok(ids[k],k);return ids[k];},querySelectorAll:q=>q==='[data-mode]'?modes:details,addEventListener(){}};
const location={search:''},history={replaceState(){}};
vm.runInNewContext(fs.readFileSync(path.join(root,'album.js'),'utf8'),{window,document,location,history,URL,URLSearchParams});
const imgs=n=>[...(n.tag==='img'?[n]:[]),...n.children.flatMap(imgs)];
let checks=0;
for(const vb of ids.versions.children){vb.onclick();assert.equal(imgs(ids.gallery).length,36);for(const room of data.rooms){ids.room.value=room.id;ids.room.onchange();assert.equal(imgs(ids.gallery).length,3);for(const m of modes){m.onclick();const cards=ids.gallery.children[0].children[1].children;for(const c of cards){
 c.onclick();assert.equal(ids.detail.open,true);const key=data.entries.find(e=>e.version===vb.dataset.version&&e.room===room.id&&ids.detailTitle.textContent.endsWith(e.angle));assert.ok(key);assert.equal(imgs(ids.detailImages)[0].src,pathToFileURL(path.join(root,key[m.dataset.mode])).href);
 details[2].onclick();assert.equal(imgs(ids.detailImages).length,2);assert.equal(imgs(ids.detailImages)[0].src,pathToFileURL(path.join(root,key.model)).href);assert.equal(imgs(ids.detailImages)[1].src,pathToFileURL(path.join(root,key.ai)).href);
 ids.next.onclick();assert.notEqual(ids.detailTitle.textContent.split('方向 ')[1],key.angle);ids.previous.onclick();assert.ok(ids.detailTitle.textContent.endsWith(key.angle));ids.close.onclick();assert.equal(ids.detail.open,false);checks++;
 }} }ids.room.value='all';ids.room.onchange();}
console.log(JSON.stringify({views:data.entries.length,uniqueImages:hashes.size,roomVersionGroups:48,detailInteractions:checks,sourceAndEffectAssetsVerified:true,method:'Offline DOM stub; browser visual QA not performed'}));
