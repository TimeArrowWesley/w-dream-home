/* Offline gallery verification. No browser, network, server or GPU is launched. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),{pathToFileURL,fileURLToPath}=require('url');
const root=path.resolve(__dirname,'../成品圖集/20260914暗色現代工業');
const window={};vm.runInNewContext(fs.readFileSync(path.join(root,'album-data.js'),'utf8'),{window});
const data=window.HOME_ALBUM;
vm.runInNewContext(fs.readFileSync(path.resolve(root,'../../assets/ai-interiors/catalog.js'),'utf8'),{window});
for(const e of data.entries){
 const c=window.HOME_AI_PHOTOS[e.version].find(c=>c.id===e.key);
 assert.ok(c,'Main viewer catalog entry missing: '+e.key);
 for(const [target,source] of [['src','ai'],['modelSrc','model'],['thumb','thumb']])
  assert.equal(c[target],'成品圖集/20260914暗色現代工業/'+e[source],'Main viewer/album mismatch: '+e.key+'/'+target);
}
assert.equal(data.complete,true);assert.equal(data.entries.length,360);assert.deepEqual(Array.from(data.versions,v=>v.id),['v0','v1','v2','v3','v4','v5']);assert.equal(data.uniqueImages,new Set(data.entries.map(e=>e.sourceKey)).size);
for(const v of data.versions)for(const r of data.rooms){
 const expected=5,e=data.entries.filter(e=>e.version===v.id&&e.room===r.id);assert.equal(e.length,expected,v.id+'/'+r.id);assert.equal(new Set(e.map(x=>x.angle)).size,expected);assert.equal(new Set(e.map(x=>x.sourceHash)).size,expected);
 if(r.id==='entry'){
  assert.deepEqual(Array.from(e,x=>x.directionLabel),['左','左前','正前','右前','右']);
  assert.deepEqual(Array.from(e,x=>x.camera.heading),[180,-135,-90,-45,0]);
  for(const x of e){assert.deepEqual(Array.from(x.camera.position),[606.5,925,165]);assert.equal(x.camera.fov,70);assert.equal(x.entryFan,true);}
 }
 // A narrow bathroom can show a different zone from a translated camera even
 // with a modest heading change: B is beside the vanity, C is by the tub.
 // Reject repeated camera poses while accounting for that visible parallax.
 // R05 collection A looks at boxes inside the room; B looks at the public
 // display face, across the partition. Their headings happen to be similar,
 // but the camera stations are over 250 cm apart and show different zones.
 for(let a=0;a<e.length;a++)for(let b=a+1;b<e.length;b++){const d=Math.abs(e[a].camera.heading-e[b].camera.heading)%360,turn=Math.min(d,360-d),shift=Math.hypot(...e[a].camera.position.map((n,i)=>n-e[b].camera.position[i]));const acrossCollectionPartition=v.id==='v1'&&r.id==='collection'&&shift>250;assert.ok((turn>5&&(turn>25||shift>100))||acrossCollectionPartition,'Views insufficiently distinct: '+e[a].key+'/'+e[b].key);}
}
const hashes=new Map();for(const e of data.entries){if(hashes.has(e.sourceKey))assert.equal(hashes.get(e.sourceKey),e.sourceHash);hashes.set(e.sourceKey,e.sourceHash);for(const t of ['ai','model','thumb'])assert.ok(fs.statSync(path.join(root,e[t])).size>1000,e.key+'/'+t);}
class E{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.events={};this.classList={add(){},remove(){},toggle(){}};}
 append(...xs){this.children.push(...xs);}replaceChildren(...xs){this.children=xs;}setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,f){this.events[k]=f;}showModal(){this.open=true;}close(){this.open=false;}
 querySelectorAll(q){return this.children.flatMap(c=>[...(q==='button'&&c.tag==='button'?[c]:[]),...c.querySelectorAll(q)]);}
 querySelector(q){const m=q.match(/^option\[value="(\w+)"\]$/);if(m)return this.children.find(c=>c.value===m[1]);throw Error(q);}
}
const ids=Object.fromEntries(['versions','room','gallery','count','detailTitle','detailVersion','detailImages','download','detailPosition','detail','close','previous','next','provenance'].map(k=>[k,new E(k)]));
const modes=['ai','model'].map(m=>{const b=new E('button');b.dataset.mode=m;return b;}),details=['ai','model','compare'].map(m=>{const b=new E('button');b.dataset.detailMode=m;return b;});
const document={currentScript:{src:pathToFileURL(path.join(root,'album.js')).href},body:new E('body'),createElement:t=>new E(t),getElementById:k=>{assert.ok(ids[k],k);return ids[k];},querySelectorAll:q=>q==='[data-mode]'?modes:details,addEventListener(){}};
const location={search:''},history={replaceState(){}};
vm.runInNewContext(fs.readFileSync(path.join(root,'album.js'),'utf8'),{window,document,location,history,URL,URLSearchParams});
const imgs=n=>[...(n.tag==='img'?[n]:[]),...n.children.flatMap(imgs)];
let checks=0;
for(const vb of ids.versions.children){vb.onclick();assert.equal(imgs(ids.gallery).length,60);for(const room of data.rooms){ids.room.value=room.id;ids.room.onchange();assert.equal(imgs(ids.gallery).length,5);for(const m of modes){m.onclick();const cards=ids.gallery.children[0].children[1].children;for(const c of cards){
 c.onclick();assert.equal(ids.detail.open,true);const key=data.entries.find(e=>e.version===vb.dataset.version&&e.room===room.id&&ids.detailTitle.textContent.endsWith(e.angle));assert.ok(key);assert.equal(imgs(ids.detailImages)[0].src,pathToFileURL(path.join(root,key[m.dataset.mode])).href);
 details[2].onclick();assert.equal(imgs(ids.detailImages).length,2);assert.equal(imgs(ids.detailImages)[0].src,pathToFileURL(path.join(root,key.model)).href);assert.equal(imgs(ids.detailImages)[1].src,pathToFileURL(path.join(root,key.ai)).href);
 ids.next.onclick();assert.ok(!ids.detailTitle.textContent.endsWith(key.angle));ids.previous.onclick();assert.ok(ids.detailTitle.textContent.endsWith(key.angle));ids.close.onclick();assert.equal(ids.detail.open,false);checks++;
 }} }ids.room.value='all';ids.room.onchange();}
console.log(JSON.stringify({views:data.entries.length,uniqueImages:hashes.size,roomVersionGroups:72,detailInteractions:checks,sourceAndEffectAssetsVerified:true,method:'Offline DOM stub; browser visual QA not performed'}));
