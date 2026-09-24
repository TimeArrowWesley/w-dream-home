'use strict';
// Load gating and deferred plan work: exercise behavior without a GPU.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const P=path.resolve(__dirname,'..');
async function gate(fail=false){
 const events={},state={removed:false,invalidations:0},message={setAttribute(){},style:{},remove(){state.removed=true;}},nodes=[];
 let finish;const pending=new Promise(resolve=>finish=resolve);
 const c={Promise,document:{createElement:()=>message,body:{append:e=>nodes.push(e)},addEventListener:(n,fn)=>events[n]=fn},addEventListener:(n,fn)=>events[n]=fn,HOME_VIEWER:{},HOME_REALISM:{whenReady:pending,invalidate:()=>state.invalidations++},HOME_EXTERIOR:{ready:Promise.resolve()}};c.window=c;
 vm.runInNewContext(fs.readFileSync(path.join(P,'viewer-startup.js'),'utf8'),c);
 assert(c.HOME_BOOT_PENDING);events.error({message:'ResizeObserver loop completed with undelivered notifications.'});
 if(fail)events.error({target:{tagName:'SCRIPT'}});
 const done=events.DOMContentLoaded();await Promise.resolve();assert(!state.removed);assert(c.HOME_BOOT_PENDING);
 finish();await done;assert(!c.HOME_BOOT_PENDING);assert.equal(state.removed,!fail);assert.equal(state.invalidations,fail?0:1);
}
(async()=>{await gate();await gate(true);console.log('Startup waits for textures, tolerates ResizeObserver notifications, and exposes actual load failures.');})().catch(e=>{console.error(e);process.exitCode=1;});
