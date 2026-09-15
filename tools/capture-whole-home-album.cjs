'use strict';
// V0 through V4: five entry directions and three directions in each other room.
// Offline rendering is used explicitly; this is not a browser screenshot workflow.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const build=require('./home-test-fixture.cjs'),render=require('./render-home-review.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'成品圖集/20260914暗色現代工業');
fs.mkdirSync(path.join(out,'model'),{recursive:true});
const names={entry:'玄關',living:'客廳',island:'中島',kitchen:'廚房',bed:'主臥',closet:'更衣室',study:'雙人書房',collection:'收藏室',bath1:'主浴',bath2:'客浴',storage:'儲藏室',back:'後陽台'};
const titles=['原始格局','圓弧中島酒吧＋玄關矮櫃','旋轉電視＋小中島','旋轉電視＋大中島','大中島'];
const common={
 entry:[[[660,940,160],[550,770,105]],[[780,870,160],[565,800,100]],[[635,850,155],[733,936,105]]],
 kitchen:[[[109,930,158],[112,533,120]],[[110,590,160],[110,940,115]],[[125,775,152],[30,692,105]]],
 bed:[[[360,264,155],[190,20,110]],[[95,265,160],[250,55,105]],[[340,40,160],[60,220,100]]],
 closet:[[[640,75,155],[650,220,125]],[[675,195,155],[610,35,125]],[[620,155,150],[735,174,125]]],
 study:[[[1035,220,160],[785,142,120]],[[800,315,160],[1015,70,120]],[[1020,35,160],[800,280,125]]],
 bath1:[[[45,310,160],[230,445,100]],[[117,354,160],[0,463,105]],[[270,330,160],[180,451,115]]],
 bath2:[[[550,350,155],[470,245,100]],[[430,340,155],[560,250,100]],[[550,245,155],[450,335,100]]],
 storage:[[[695,415,165],[650,293,113]],[[733,350,125],[612,312,115]],[[695,292,122],[687,379,130]]],
 back:[[[-95,605,155],[-102,840,100]],[[-110,900,160],[-90,530,120]],[[-12,675,165],[-188,660,105]]]
};
function views(v){
 const rot=v===2||v===3,cy=v===3?583:560;
 const data={...common,
 living:rot?[[[985,585,160],[647,cy,125]],[[725,cy,160],[970,590,105]],[[845,815,160],[740,500,115]]]:[[[750,730,160],[945,940,105]],[[910,865,160],[910,v<=1?550:600,100]],[[1070,710,160],[770,610,105]]],
 island:v<=1?[[[735,700,160],[545,560,95]],[[355,545,160],[540,610,95]],[[610,410,160],[525,580,100]]]:v===2?[[[580,710,160],[470,560,100]],[[370,590,160],[470,555,95]],[[475,415,160],[475,585,95]]]:[[[650,840,160],[470,630,100]],[[355,650,160],[480,620,95]],[[485,420,160],[480,650,100]]],
 collection:v<3?[[[425,853,152],[300,910,115]],[[312,849,158],[496,790,120]],[[355,817,155],[355,924,115]]]:[[[605,855,160],[315,914,105]],[[320,835,155],[690,860,100]],[[360,885,155],[290,775,115]]]
 };
 if(v===0){
  data.entry=[...data.entry];data.entry[2]=[[658,781,160],[600,955,120]];
  data.island[2]=[[530,532,155],[502,625,95]];
  data.study=[...data.study];data.study[2]=[[1045,230,160],[945,320,95]];
  data.collection[1]=[[280,850,145],[375,773,85]];
  data.collection[2]=[[310,878,140],[231,825,105]];
 }
 // One standing position at the entry/living junction, facing north into the home.
 // Left -> left-front -> front -> right-front -> right, in 45-degree steps.
 const station=[745,850,165],directions=[[-1,0],[-Math.SQRT1_2,-Math.SQRT1_2],[0,-1],[Math.SQRT1_2,-Math.SQRT1_2],[1,0]];
 const entryLabels=['左','左前','正前','右前','右'];
 data.entry=directions.map(([dx,dy])=>[station.slice(),[station[0]+dx*300,station[1]+dy*300,140]]);
 return Object.keys(names).flatMap(room=>data[room].map(([p,t],i)=>({id:room+'-'+(room==='entry'?'5':'')+'ABCDE'[i],room,name:(room==='collection'&&v===0?'貓房':room==='study'&&v===0?'書房・電子琴':room==='collection'&&v>=3?'開放收藏收納':names[room])+'・'+(room==='entry'?entryLabels[i]:'視角 '+'ABCDE'[i]),...(room==='entry'?{directionLabel:entryLabels[i],entryFan:true}:{}),p,t,fov:room==='entry'?70:['closet','bath1','bath2','storage','back'].includes(room)?86:74,direction:Math.atan2(t[1]-p[1],t[0]-p[0])*180/Math.PI})));
}
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
(async()=>{
 const filter=process.argv.find(x=>x.startsWith('--version='));
 const roomFilter=process.argv.find(x=>x.startsWith('--room='))?.split('=')[1];
 const only=process.argv.find(x=>x.startsWith('--view='))?.split('=')[1];
 const selected=filter?[Number(filter.split('=')[1])]:[0,1,2,3,4];
 const jobsFile=path.join(out,'capture-manifest.json');
 const old=fs.existsSync(jobsFile)?JSON.parse(fs.readFileSync(jobsFile,'utf8')):{schema:1,capturedAt:'2026-09-14',modelRevision:process.env.HOME_ALBUM_SOURCE_COMMIT||'workspace',method:'actual source geometry, perspective-correct textured offline render; no reflections, baked shadows or browser/GPU capture',entries:[]};
 for(const v of selected){
  const f=await build(v===0?0:v+1);f.c.HOME_COMFORT.setScene('daily');f.tick(3);
  const authored=views(v).filter(q=>(!roomFilter||roomFilter.split(',').includes(q.room))&&(!only||q.id===only));
  if(authored.some(q=>q.room==='entry')){f.c.HOME_WALK.refreshColliders();if(!f.c.HOME_WALK.canStand(745-482.5,850-480))throw Error('Entry camera station blocked in V'+v);}
  if(authored.some(q=>q.room==='entry'))old.entries=old.entries.filter(e=>e.version!=='v'+v||e.room!=='entry'||/entry-5[A-E]$/.test(e.key));
  for(const q of authored){
   if(q.room==='storage'){f.c.HOME_INTERACTION.setDoor('storage',true);f.tick(80,50);}
   if(q.room==='closet'&&!f.albumMirrorOpened){const mirror=f.V.scene.getObjectByName('更衣室側移滑鏡')?.children[0];if(mirror)mirror.position.x+=50;f.albumMirrorOpened=true;}
   const file='v'+v+'-'+q.id+'.png',target=path.join(out,'model',file);
   if(!process.argv.includes('--force')&&fs.existsSync(target)&&old.entries.some(e=>e.key==='v'+v+'-'+q.id))continue;
   const [record]=render({T:f.T,V:f.V,version:'v'+v,out:path.join(out,'model'),textured:true,width:1152,height:768,views:[q]});
   const key='v'+v+'-'+q.id;old.entries=old.entries.filter(e=>e.key!==key);
   old.entries.push({...record,key,version:'v'+v,versionTitle:titles[v],model:'model/'+file,modelHash:sha(target),angle:q.id.slice(-1),width:1152,height:768,ai:null,status:'source-captured'});
   fs.writeFileSync(jobsFile,JSON.stringify(old,null,2)+'\n');
   console.log(key+' '+record.triangles+' triangles');
  }
 }
 console.log('Captured '+old.entries.length+' / 190 views.');
})().catch(e=>{console.error(e);process.exitCode=1;});
