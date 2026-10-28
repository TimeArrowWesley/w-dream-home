const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync('viewer-assets.js','utf8');
for(const v of JSON.parse(fs.readFileSync('version-registry.json','utf8')).versions){
 const html=fs.readFileSync(v.path,'utf8');
 assert(html.includes('src="viewer-assets.js?v=20261028-pf04"'),v.id+' cache loader included');
 assert(html.indexOf('viewer-assets.js')<html.indexOf('assets/three.min.js'),v.id+' early loading');
 assert(html.includes('href="viewer-ui.css?v=20261028-pf04"'),v.id+' stylesheet uses existing root base');
}
const stores=new Map(),storage=new Map();let downloads=0;
const caches={keys:async()=>[...stores.keys()],delete:async n=>stores.delete(n),open:async n=>{
 if(!stores.has(n))stores.set(n,new Map());const store=stores.get(n);
 return {match:async k=>store.get(k)?.clone(),put:async(k,r)=>store.set(k,new Response(await r.arrayBuffer()))};
}};
function fixture(version='v1',options={}){
 const c={URL,URLSearchParams,Response,Blob,document:{baseURI:'https://example.test/'},location:{search:options.original?'?lightQuality=original':''},HOME_LAYOUT:{displayVersion:version},matchMedia:()=>({matches:!!options.mobile}),caches,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},fetch:async()=>{downloads++;return new Response('model-payload',{headers:{'content-length':'13'}});}};
 if(options.noCache)c.caches={keys:async()=>{throw Error('storage denied');}};
 c.window=c;vm.createContext(c);vm.runInContext(source,c);return c.HOME_ASSETS;
}
(async()=>{
 let a=fixture(),pair=await Promise.all([a.fetch('/mesh.bin.gz'),a.fetch('/mesh.bin.gz')]);
 assert.equal(downloads,1);assert.equal(await pair[0].text(),'model-payload');assert.equal(await pair[1].text(),'model-payload');
 await new Promise(r=>setImmediate(r));
 a=fixture();assert.equal(await(await a.fetch('/mesh.bin.gz')).text(),'model-payload');assert.equal(a.getState().hits,1);assert.equal(downloads,1);
 for(const id of ['v2','v3','v4']){a=fixture(id);await a.fetch('/mesh.bin.gz');await new Promise(r=>setImmediate(r));}
 assert.equal(stores.size,3);assert(!stores.has('home-assets-pf04-v1'));assert(stores.has('home-assets-pf04-v4'));
 a=fixture('v5',{noCache:true});assert.equal(await(await a.fetch('/mesh.bin.gz')).text(),'model-payload');
 assert.equal(fixture('v1',{mobile:true}).lightPath('general'),'pf04/mobile/general.webp');
 assert.equal(fixture('v1',{original:true}).lightPath('general'),'general.webp?layout=cw01');
 console.log('PF04: concurrent request deduplication, response copies, persistent reuse, three-version eviction, blocked-storage fallback and device profiles passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
