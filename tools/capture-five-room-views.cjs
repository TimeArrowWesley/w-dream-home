'use strict';
// F05 adds two authored camera views per non-entry space; no design geometry edits.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const P=path.resolve(__dirname,'..'),R=path.join(P,'調整紀錄/20260922全屋五視角'),A=path.join(P,'成品圖集/20260914暗色現代工業');
fs.mkdirSync(path.join(R,'model'),{recursive:true});
const before=path.join(R,'album-before.json');if(!fs.existsSync(before))fs.copyFileSync(path.join(A,'album-manifest.json'),before);
const manifest=JSON.parse(fs.readFileSync(before,'utf8'));
const names={living:'客廳',island:'中島',kitchen:'廚房',bed:'主臥',closet:'更衣室',study:'雙人書房',collection:'收藏室',bath1:'主浴',bath2:'客浴',storage:'儲藏室',back:'後陽台'};
const common={
 kitchen:[[[130,850,158],[195,790,120]],[[130,655,158],[30,590,115]]],
 bed:[[[95,265,158],[370,265,110]],[[325,115,155],[345,290,110]]],
 closet:[[[670,70,155],[735,75,120]],[[675,195,155],[610,195,120]]],
 study:[[[1035,290,160],[1090,170,130]],[[825,85,160],[930,320,100]]],
 bath1:[[[65,395,158],[0,345,125]],[[245,365,155],[60,320,125]]],
 bath2:[[[492,338,150],[475,225,115]],[[438,272,150],[570,337,110]]],
 storage:[[[707,382,153],[608,345,125]],[[650,340,155],[745,412,120]]],
 back:[[[-95,785,158],[-205,730,130]],[[-130,750,158],[-25,825,110]]]
};
function views(v){
 const rot=v===2||v===3;
 const poses={...common,
  living:rot?[[[1040,725,160],[660,475,110]],[[800,480,160],[1020,780,110]]]:[[[850,565,160],[970,880,110]],[[1050,880,160],[770,765,105]]],
  island:v<=1?[[[440,690,155],[665,590,110]],[[700,555,155],[500,690,100]]]:v===2?[[[550,500,158],[385,575,110]],[[535,650,158],[475,455,110]]]:[[[590,730,158],[400,550,110]],[[605,535,158],[430,735,110]]],
  collection:v===0?[[[350,780,150],[230,890,90]],[[275,830,155],[400,900,120]]]:v<3?[[[375,890,155],[230,770,130]],[[620,790,155],[360,780,120]]]:[[[620,900,160],[280,815,115]],[[325,865,155],[360,940,100]]]
 };
 const overridesFile=path.join(R,'camera-overrides.json'),overrides=fs.existsSync(overridesFile)?JSON.parse(fs.readFileSync(overridesFile,'utf8')):{};
 return Object.keys(names).flatMap(room=>poses[room].map(([p,t],i)=>{const angle='DE'[i],key='v'+v+'-'+room+'-'+angle;const q={key,room,angle,p,t,fov:['closet','bath1','bath2','storage','back'].includes(room)?86:74,...overrides[key]};return {...q,id:room+'-'+angle+'-f05',name:(v===0&&room==='collection'?'貓房':names[room])+'・視角 '+angle,direction:Math.atan2(q.t[1]-q.p[1],q.t[0]-q.p[0])*180/Math.PI};}));
}
async function main(){
 const only=process.argv.find(a=>a.startsWith('--version='))?.split('=')[1],roomFilter=process.argv.find(a=>a.startsWith('--rooms='))?.split('=')[1]?.split(',');
 const file=path.join(R,'captures.json'),captures=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[];
 for(const v of only?[Number(only)]:[0,1,2,3,4]){
  const f=await build(v===0?0:v+1);f.c.HOME_REALISM.render=()=>{};f.c.HOME_REALISM.invalidate=()=>{};f.c.HOME_COMFORT.setScene('daily');if(v===1){f.c.HOME_INTERACTION.setDoor('study-slide-r05',true);f.tick(80,50);}else f.tick(3);
  for(const q of views(v).filter(q=>!roomFilter||roomFilter.includes(q.room))){
   if(q.room==='storage'){f.c.HOME_INTERACTION.setDoor('storage',true);f.tick(80,50);}
   if(q.room==='closet'&&!f.mirrorOpened){const m=f.V.scene.getObjectByName('更衣室側移滑鏡')?.children[0];if(m)m.position.x+=50;f.mirrorOpened=true;}
   if(!process.argv.includes('--force')&&captures.some(e=>e.key===q.key))continue;
   const [rec]=render({T:f.T,V:f.V,version:'v'+v,out:path.join(R,'model'),views:[q],width:1152,height:768,textured:true});
   const modelHash=crypto.createHash('sha256').update(fs.readFileSync(path.join(R,'model',rec.file))).digest('hex'),previous=captures.findIndex(e=>e.key===q.key);
   const e={...rec,key:q.key,version:'v'+v,versionTitle:manifest.entries.find(e=>e.version==='v'+v).versionTitle,model:'model/'+rec.file,modelHash,width:1152,height:768,sourceRevision:'20260922-qa03',captureRevision:'20260922-f05',status:'source-captured'};
   if(previous>=0)captures[previous]=e;else captures.push(e);
   fs.writeFileSync(file,JSON.stringify(captures,null,2)+'\n');console.log(q.key);
  }
 }
 console.log(JSON.stringify({newSlots:captures.length,uniqueSourceImages:new Set(captures.map(e=>e.modelHash)).size}));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={views};
