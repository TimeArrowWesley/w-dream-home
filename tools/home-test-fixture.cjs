'use strict';
// Runs source geometry and interaction code offline. No browser, network or GPU.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),noop=()=>{};
const T={...require(path.join(root,'assets/three.min.js'))};
T.WebGLRenderer=class{constructor(){this.shadowMap={};this.capabilities={getMaxAnisotropy:()=>1};this.domElement={};}setPixelRatio(n){this.ratio=n;}getPixelRatio(){return this.ratio;}setSize(){}render(){this.draws=(this.draws||0)+1;this.shadowMap.needsUpdate=false;}setRenderTarget(){}getRenderTarget(){return null;}getDrawingBufferSize(v){return v.set(960,720);}};
T.PMREMGenerator=class{fromScene(){return {texture:new T.Texture()};}};
const ctx2d=new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),measureText:()=>({width:100})},{get:(o,k)=>k in o?o[k]:noop});
const bounds=o=>{const b=new T.Box3().setFromObject(o);return {x:b.min.x+482.5,y:b.min.z+480,z:b.min.y,w:b.max.x-b.min.x,d:b.max.z-b.min.z,h:b.max.y-b.min.y};};
const overlap=(a,b,t=.04)=>a.x<b.x+b.w-t&&a.x+a.w>b.x+t&&a.y<b.y+b.d-t&&a.y+a.d>b.y+t&&a.z<b.z+b.h-t&&a.z+a.h>b.z+t;
const near=(a,b,msg,t=.03)=>assert(Math.abs(a-b)<t,`${msg}: ${a} vs ${b}`);

module.exports=async function build(n,overrides={}){
 const nodes=new Map(),events=new Map(),raf=new Set(),images=[];let time=0,mode='model';
 function element(){const classes=new Set(),e={style:{},dataset:{},children:[],value:'',checked:false,hidden:false,width:1024,height:512,addEventListener:noop,dispatchEvent:noop,setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},getContext(){if(!this._ctx)this._ctx=new Proxy({putImageData:im=>this.__pixels=im},{get:(o,k)=>k in o?o[k]:ctx2d[k]});return this._ctx;},getBoundingClientRect:()=>({width:960,height:720,left:0,top:0}),appendChild(o){this.children.push(o);o.parentElement=this;return o;},insertBefore(o){return this.appendChild(o);},prepend(o){this.children.unshift(o);},append(...xs){xs.forEach(x=>this.appendChild(x));},after:noop,querySelector:()=>element(),querySelectorAll:()=>[],focus:noop,click(){this.onclick?.();},classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,v){if(v===undefined)v=!classes.has(k);v?classes.add(k):classes.delete(k);return v;}}};Object.defineProperty(e,'id',{get(){return this._id;},set(id){this._id=id;nodes.set(id,this);}});return e;}
 function get(id){if(!nodes.has(id)){const e=element();e.id=id;nodes.set(id,e);}return nodes.get(id);}
 const document={readyState:'complete',currentScript:{src:'https://example.invalid/equipment-controls.js'},body:element(),head:element(),getElementById:get,createElement:element,createElementNS:element,querySelector:()=>element(),querySelectorAll:()=>[],addEventListener:noop};get('view').parentElement=element();get('rgbRoom').value='living';get('curtainSelect').value='all';
 const c={THREE:T,document,console,URL,URLSearchParams,location:{hash:'',search:''},localStorage:{getItem:()=>null,setItem:noop},performance:{now:()=>time},setTimeout:noop,setInterval:noop,clearInterval:noop,devicePixelRatio:1,ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>raf.add(fn),CustomEvent:class{constructor(type){this.type=type;}},Image:class{set src(v){this.onerror?.();}},HOME_LAYOUT:{comfort:true,isV2:n%2===0,version:n%2?'v1':'v2',proposal:'v'+n,entryDoorY:955},addEventListener:(type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn);},dispatchEvent:e=>{for(const fn of events.get(e.type)||[])fn(e);}};
 const OriginalImage=c.Image;c.Image=class extends OriginalImage{constructor(){super();this.width=1024;this.height=512;images.push(this);}};
 c.window=c;c.Event=c.CustomEvent;vm.createContext(c);
 function run(f){vm.runInContext(overrides[f]??read(f),c,{filename:f,timeout:60000});}
 run(n<3?'layout-version.js':'提案/旋轉電視與直線中島/layout-version.js');
 for(const f of ['model-data.js','equipment-models.js',n<3?'design.js':'提案/旋轉電視與直線中島/design.js'])run(f);
 const V=c.HOME_VIEWER,E=c.HOME_EQUIPMENT;
 c.HOME_TOUR={getMode:()=>mode,setMode:m=>mode=m};
 for(const f of ['walk.js','interaction.js','realism.js','flooring.js','curtains.js','rgb-lighting.js','comfort-controls.js','equipment-controls.js',...(n>2?['提案/旋轉電視與直線中島/rotating-tv.js']:[])])run(f);await Promise.resolve();await Promise.resolve();

return {T,c,V,E,events,raf,get,run,bounds,overlap,near,tick(count=1,step=16){for(let i=0;i<count;i++){time+=step;for(const fn of [...raf])fn(time);}V.scene.updateMatrixWorld(true);},setTime(t){time=t;}};
};
