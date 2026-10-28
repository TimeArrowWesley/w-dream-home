'use strict';
// PF04: version-scoped, bounded caches for immutable model payloads only.
// Documents/manifests stay on the normal HTTP update path. No service worker.
(() => {
 const mobile=window.matchMedia?.('(max-width: 760px)').matches||false;
 const full=new URLSearchParams(location.search).get('lightQuality')==='original';
 const state={revision:'PF04',profile:full?'original':mobile?'mobile':'desktop',hits:0,downloads:0,bytes:0};
 const inflight=new Map();let cachePromise=null;
 function cache(){
  if(cachePromise)return cachePromise;
  cachePromise=(async()=>{
   if(!window.caches)return null;
   const name='home-assets-pf04-'+(window.HOME_LAYOUT?.displayVersion||'v1');
   const keys=await caches.keys();
   // Retain the current and two most recently visited versions, not six GPU scenes.
   let visited=[];try{visited=JSON.parse(localStorage.getItem('home-assets-pf04-lru')||'[]');}catch{}
   visited=[name,...visited.filter(n=>n!==name)].slice(0,3);
   try{localStorage.setItem('home-assets-pf04-lru',JSON.stringify(visited));}catch{}
   await Promise.all(keys.filter(n=>n.startsWith('home-assets-')&&!visited.includes(n)).map(n=>caches.delete(n)));
   return caches.open(name);
  })().catch(()=>null);return cachePromise;
 }
 async function assetFetch(url){
  const key=new URL(url,document.baseURI).href;
  if(inflight.has(key))return (await inflight.get(key)).clone();
  const promise=(async()=>{
   const store=await cache();let hit;try{hit=await store?.match(key);}catch{}
   if(hit){state.hits++;return hit;}
   const response=await fetch(key);if(!response.ok)throw Error('模型資產 '+response.status+' '+key);
   state.downloads++;state.bytes+=Number(response.headers.get('content-length')||0);
   if(store)store.put(key,response.clone()).catch(()=>{});
   return response;
  })();
  inflight.set(key,promise);
  try{return (await promise).clone();}finally{inflight.delete(key);}
 }
 async function imageURL(url){return URL.createObjectURL(await (await assetFetch(url)).blob());}
 function texture(T,url,onLoad,onError){
  imageURL(url).then(blob=>new T.TextureLoader().load(blob,t=>{URL.revokeObjectURL(blob);onLoad(t);},undefined,e=>{URL.revokeObjectURL(blob);onError?.(e);}),onError);
 }
 async function cube(T,urls,onLoad,onError){
  const results=await Promise.allSettled(urls.map(imageURL)),blobs=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
  const clean=()=>blobs.forEach(u=>URL.revokeObjectURL(u));
  const bad=results.find(r=>r.status==='rejected');if(bad){clean();onError?.(bad.reason);return;}
  new T.CubeTextureLoader().load(blobs,t=>{clean();onLoad(t);},undefined,e=>{clean();onError?.(e);});
 }
 window.HOME_ASSETS={fetch:assetFetch,texture,cube,getState:()=>({...state}),lightPath:name=>full?name+'.webp?layout=cw01':'pf04/'+state.profile+'/'+name+'.webp'};
})();
