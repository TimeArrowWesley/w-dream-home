'use strict';
(() => {
const T=THREE,V=HOME_VIEWER;
// Interior dry areas only. The outline steps around the kitchen and main bath;
// the guest bathroom is a hole. Outdoor / utility balconies retain stone.
// The foyer is a notch in the wood outline, not a coplanar overlay.
const open=!!window.HOME_LAYOUT?.openIsland;
const outline=open?[[0,0],[1085,0],[1085,955],[715,955],[715,805],[545.2,805],[545.2,955],[220,955],[220,493],[315,493],[315,282],[-75,282],[-75,85],[0,85]]:[[0,0],[1085,0],[1085,955],[715,955],[715,803],[555.2,803],[555.2,885],[545.2,885],[545.2,955],[220,955],[220,493],[315,493],[315,282],[-75,282],[-75,85],[0,85]];
const entryOutline=open?[[545.2,805],[715,805],[715,955],[545.2,955]]:[[555.2,803],[715,803],[715,955],[545.2,955],[545.2,885],[555.2,885]];
const guestBath=[[405,207],[580,207],[580,375],[405,375]];
const shape=new T.Shape(outline.map(([x,y])=>new T.Vector2(x-482.5,480-y)));
shape.holes.push(new T.Path(guestBath.map(([x,y])=>new T.Vector2(x-482.5,480-y))));
const geometry=new T.ShapeGeometry(shape);
geometry.rotateX(-Math.PI/2);
const tileCm=120,plankWidthCm=12,plankLengthCm=60;
const positions=geometry.attributes.position,uv=geometry.attributes.uv;
for(let i=0;i<positions.count;i++){
 const x=positions.getX(i)+482.5,y=positions.getZ(i)+480;
 uv.setXY(i,(x+y)/(Math.SQRT2*tileCm),(y-x)/(Math.SQRT2*tileCm));
}
const material=new T.MeshStandardMaterial({color:new T.Color('#aaa08f').convertSRGBToLinear(),roughness:.64,metalness:0,envMapIntensity:.27});
const floor=new T.Mesh(geometry,material);
floor.name='室內暖棕人字拼木地板';floor.position.y=.2;floor.receiveShadow=true;
floor.userData.flooring={pattern:'herringbone',plankWidthCm,plankLengthCm,excluded:['玄關','廚房','主浴','客浴','陽台']};
V.scene.add(floor);
// Actual clipped hexagonal faces: 25cm across flats and a 2mm warm-grey joint.
// All finished faces meet at +0.2cm; the grout alone is recessed 0.4mm.
const entry=new T.Group();entry.name='玄關混色六角磚地坪';V.scene.add(entry);
const palette=[['暖米白','#d9d4c7'],['淺灰','#b4b5af'],['中灰','#858a87'],['炭灰','#3f4648']];
const tileAcrossFlatsCm=25,groutCm=.2,pitch=tileAcrossFlatsCm+groutCm,radius=tileAcrossFlatsCm/Math.sqrt(3),finishLevelCm=.2;
const materials=palette.map(([name,hex])=>{const m=new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness:.83,metalness:0,envMapIntensity:.2});m.name='玄關六角磚・'+name;m.userData.finishId='entry-hex-'+name;return m;});
function surface(points,mat,z,name){const s=new T.Shape(points.map(([x,y])=>new T.Vector2(x-482.5,480-y))),g=new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);const m=new T.Mesh(g,mat);m.name=name;m.position.y=z;m.receiveShadow=true;entry.add(m);return m;}
const grout=new T.MeshStandardMaterial({color:new T.Color('#b1aa9b').convertSRGBToLinear(),roughness:.94});
surface(entryOutline,grout,.16,'玄關暖灰填縫底');
function clipToHex(poly,hex){
 for(let k=0;k<hex.length;k++){
  const a=hex[k],b=hex[(k+1)%hex.length],dist=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]),next=[];
  for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=dist(p),dq=dist(q),inp=dp>=-1e-8,inq=dq>=-1e-8;if(inp)next.push(p);if(inp!==inq){const t=dp/(dp-dq);next.push(p.map((v,j)=>v+(q[j]-v)*t));}}poly=next;
 }return poly;
}
function area(poly){return Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;}
// Clip the single concave room boundary by each convex hex, avoiding artificial
// seams where rectangular subregions would otherwise divide whole tiles.
const tileBoundary=open?[[545.6,805.4],[714.6,805.4],[714.6,955],[545.6,955]]:[[555.6,803],[714.6,803],[714.6,955],[545.2,955],[545.2,885],[555.2,885],[555.2,883],[555.6,883]],tiles=[],counts=[0,0,0,0];
for(let row=-5;row<=5;row++)for(let col=-5;col<=5;col++){
 const cx=610+pitch*(col+((row%2+2)%2)*.5),cy=876+pitch*Math.sqrt(3)/2*row;
 const poly=Array.from({length:6},(_,k)=>[cx+radius*Math.cos(Math.PI/6+k*Math.PI/3),cy+radius*Math.sin(Math.PI/6+k*Math.PI/3)]);
 let seed=Math.imul(row+41,73856093)^Math.imul(col+31,19349663);seed=Math.imul(seed^(seed>>>16),2246822519);const v=(seed>>>0)/4294967296,index=v<.44?0:v<.73?1:v<.88?2:3;
 const pieces=[clipToHex(tileBoundary,poly)].filter(p=>p.length>=3&&area(p)>.01);if(!pieces.length)continue;
 const tile={id:row+':'+col,center:[cx,cy],color:palette[index][0],hex:palette[index][1],pieces};tiles.push(tile);counts[index]++;
 for(const p of pieces){const m=surface(p,materials[index],finishLevelCm,'玄關六角磚 '+tile.id);m.userData.entryTile={id:tile.id,color:tile.color,points:p};}
}
const trimMat=new T.MeshStandardMaterial({color:new T.Color('#69675e').convertSRGBToLinear(),roughness:.55,metalness:.5});
for(const [x,y,w,d,name] of (open?[[714.6,805,.4,150,'客廳交界'],[545.2,805,.4,150,'開放展示交界'],[545.6,805,169,.4,'中島交界']]:[[714.6,803,.4,152,'客廳交界'],[555.2,803,.4,80,'收藏室門口']])){
 const m=surface([[x,y],[x+w,y],[x+w,y+d],[x,y+d]],trimMat,finishLevelCm,'六角磚齊平收邊・'+name);m.userData.floorTransition={widthCm:.4,finishLevelCm};
}
entry.userData.flooring={pattern:'mixed-hexagon',tileAcrossFlatsCm,groutCm,finishLevelCm,outline:entryOutline,palette:palette.map(([name,color],i)=>({name,color,tiles:counts[i]})),tileCount:tiles.length,tiles,transitionWidthCm:.4};
// Keep the existing contact shadow decals just above the new finish.
const details=V.scene.getObjectByName('寫實材質與燈光細節');
details?.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry'&&o.material.transparent&&Math.abs(o.position.y-.15)<.001)o.position.y=.25;});
const state={ready:false,pattern:'herringbone',plankWidthCm,plankLengthCm,textureSize:2048,excluded:floor.userData.flooring.excluded,entry:entry.userData.flooring};
function inside(x,y,points){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
const ready=new Promise(resolve=>{
 const image=new Image();
 image.onload=()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;
  const ctx=canvas.getContext('2d'),unit=canvas.width/10,seam=unit*.0125;
  ctx.fillStyle='#5e5041';ctx.fillRect(0,0,canvas.width,canvas.height);
  // A periodic pair of perpendicular 5:1 planks. Lattice vectors (5,5)
  // and (-1,1) tile the square without gaps, overlaps or chevron cuts.
  const hash=(a,b,k)=>{let n=Math.imul(a+31,73856093)^Math.imul(b+37,19349663)^Math.imul(k+1,83492791);n=Math.imul(n^(n>>>16),2246822519);return (n>>>0)/4294967296;};
  function plank(x,y,vertical){
   const w=vertical?1:5,h=vertical?5:1;
   if(x+w<=0||y+h<=0||x>=10||y>=10)return;
   // Periodic seeds ensure matching boards at all four texture edges.
   const px=(x%10+10)%10,py=(y%10+10)%10;
   const a=hash(px,py,0),b=hash(px,py,1),c=hash(px,py,2);
   ctx.save();ctx.translate(x*unit,y*unit);
   if(!vertical){ctx.translate(0,unit);ctx.rotate(-Math.PI/2);}
   ctx.filter=`saturate(.62) brightness(${.91+c*.16})`;
   ctx.drawImage(image,a*image.width*.65,b*image.height*.15,image.width*.3,image.height*.8,seam/2,seam/2,unit-seam,5*unit-seam);
   ctx.restore();
  }
  for(let i=-3;i<=3;i++)for(let j=-18;j<=18;j++){
   const x=5*i-j,y=5*i+j;
   plank(x,y,false);plank(x+5,y,true);
  }
  const map=new T.CanvasTexture(canvas);map.wrapS=map.wrapT=T.RepeatWrapping;map.encoding=T.sRGBEncoding;
  map.anisotropy=Math.min(8,V.renderer.capabilities.getMaxAnisotropy());
  const bump=map.clone();bump.encoding=T.LinearEncoding;bump.needsUpdate=true;
  material.map=map;material.bumpMap=bump;material.bumpScale=.012;material.needsUpdate=true;
  state.ready=true;window.HOME_REALISM?.invalidate(false);resolve();
 };
 image.onerror=()=>{state.error='木地板材質未載入';resolve();};
 image.src=window.REALISM_WOOD;
});
window.HOME_FLOORING={ready,getState:()=>({...state}),finishAt:(x,y)=>inside(x,y,entryOutline)?'mixed-hexagon':inside(x,y,outline)&&!inside(x,y,guestBath)?'herringbone':'stone'};
})();
