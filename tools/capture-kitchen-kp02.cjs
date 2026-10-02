'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20261002廚房五視角KP02');
const views=[
 {id:'kitchen-A-kp02',angle:'A',name:'廚房・由爐側望電器高櫃',p:[108,935,154],t:[110,550,125],fov:67},
 {id:'kitchen-B-kp02',angle:'B',name:'廚房・由入口望雙排檯面',p:[108,581,156],t:[107,939,118],fov:72},
 {id:'kitchen-C-kp02',angle:'C',name:'廚房・水槽與半嵌洗碗機',p:[132,792,156],t:[14,711,125],fov:77},
 {id:'kitchen-D-kp02',angle:'D',name:'廚房・冰箱與備餐玻璃櫃',p:[72,886,147],t:[208,842,134],fov:85},
 {id:'kitchen-E-kp02',angle:'E',name:'廚房・電器高櫃',p:[105,735,148],t:[103,506,125],fov:73}
];
(async()=>{const vs=JSON.parse(fs.readFileSync(path.join(P,'version-registry.json'),'utf8')).versions;
for(const v of vs.filter(v=>!process.argv[2]||v.id===process.argv[2])){
 const f=await build(v.fixture);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');f.get('glass').checked=true;f.get('glass').onchange();f.tick(3);f.c.HOME_KITCHEN_PLAN.apply();
 // Comparison-only frosted door/window display avoids substituting another version's adjacent rooms.
 const frost=new f.T.MeshStandardMaterial({color:new f.T.Color('#bbc3c3').convertSRGBToLinear(),roughness:.8,side:f.T.DoubleSide});
 for(const o of f.V.architecture.children){o.traverse(q=>{if(!q.isMesh||Array.isArray(q.material)||!q.material.transparent)return;const b=f.bounds(q);if(b.y>=493&&b.y+b.d<=956&&(b.x+b.w<=5||b.x>=200&&b.x<220))q.material=frost;});}
 const records=render({T:f.T,V:f.V,version:v.id,out:path.join(R,'model'),views,width:1152,height:768,textured:true}).map(q=>({...q,room:'kitchen',key:v.id+'-kitchen-'+q.angle,direction:Math.atan2(q.t[1]-q.p[1],q.t[0]-q.p[0])*180/Math.PI,modelHash:crypto.createHash('sha256').update(fs.readFileSync(path.join(R,'model',q.file))).digest('hex')}));
 fs.writeFileSync(path.join(R,'captures-'+v.id+'.json'),JSON.stringify(records,null,2));console.log(v.id+' five kitchen views captured');
}})().catch(e=>{console.error(e);process.exitCode=1;});
