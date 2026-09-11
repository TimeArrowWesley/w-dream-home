'use strict';
(() => {
const T=THREE,V=HOME_VIEWER,F=V.finishContext.industrialFinishes;
const open=!!window.HOME_LAYOUT?.openIsland;
const outline=open?[[0,0],[1085,0],[1085,955],[715,955],[715,805],[545.2,805],[545.2,955],[220,955],[220,493],[315,493],[315,282],[-75,282],[-75,85],[0,85]]:[[0,0],[1085,0],[1085,955],[715,955],[715,803],[555.2,803],[555.2,885],[545.2,885],[545.2,955],[220,955],[220,493],[315,493],[315,282],[-75,282],[-75,85],[0,85]];
const entryOutline=open?[[545.2,805],[715,805],[715,955],[545.2,955]]:[[555.2,803],[715,803],[715,955],[545.2,955],[545.2,885],[555.2,885]];
const guestBath=[[405,207],[580,207],[580,375],[405,375]];
const shape=new T.Shape(outline.map(([x,y])=>new T.Vector2(x-482.5,480-y)));
shape.holes.push(new T.Path(guestBath.map(([x,y])=>new T.Vector2(x-482.5,480-y))));
const geometry=new T.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);
const plankWidthCm=20,plankLengthCm=120,finishLevelCm=.2,positions=geometry.attributes.position,uv=geometry.attributes.uv;
for(let i=0;i<positions.count;i++)uv.setXY(i,(positions.getX(i)+482.5)/60,(positions.getZ(i)+480)/240);
const material=new T.MeshStandardMaterial({color:new T.Color('#686d73').convertSRGBToLinear(),map:F.veneerMap,bumpMap:F.veneerBump,bumpScale:.009,roughness:.72,metalness:0,envMapIntensity:.24});
material.name='煙燻木人字拼';material.userData.finishId='industrial-smoked-floor';
const ratio=plankLengthCm/plankWidthCm,rotationDeg=45,jointCm=.15;
// Rectangular boards meet at right angles; the whole field rotates 45 degrees.
// A single existing floor mesh and wood map serve both grain directions.
function sampleBoard(x,y){
 const px=(x+y)*Math.SQRT1_2/plankWidthCm,py=(y-x)*Math.SQRT1_2/plankWidthCm,ix=Math.floor(px),iy=Math.floor(py),s=((ix+iy)%(2*ratio)+2*ratio)%(2*ratio),horizontal=s<ratio;
 const a=horizontal?py-iy:px-ix,b=horizontal?s+px-ix:s-ratio+py-iy,idX=horizontal?ix-s:ix,idY=horizontal?iy:iy-s+ratio;
 const across=a*plankWidthCm,along=b*plankWidthCm,seed=idX*7.13+idY*3.71;
 return {horizontal,id:[idX,idY],across,along,edge:Math.min(across,plankWidthCm-across,along,plankLengthCm-along),u:across/60+((idX*.173)%1+1)%1,v:along/240+((idY*.317)%1+1)%1,tone:.94+.06*Math.sin(seed)};
}
material.userData.herringbone={sampleAt:sampleBoard,plankWidthCm,plankLengthCm,jointCm,rotationDeg};
material.onBeforeCompile=shader=>{
 shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 floorCm;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloorCm=(modelMatrix*vec4(position,1.0)).xz+vec2(482.5,480.0);');
 const common=`
varying vec2 floorCm;
vec2 hbUv;
float hbHorizontal;
vec4 herringboneBoard(vec2 cm){
 vec2 p=vec2(cm.x+cm.y,cm.y-cm.x)*.7071067811865476/${plankWidthCm.toFixed(1)};
 vec2 cell=floor(p);float band=mod(cell.x+cell.y,${(2*ratio).toFixed(1)});vec2 local=fract(p),id;
 if(band<${ratio.toFixed(1)}){hbHorizontal=1.0;local=vec2(local.y,band+local.x);id=vec2(cell.x-band,cell.y);}
 else{hbHorizontal=0.0;local=vec2(local.x,band-${ratio.toFixed(1)}+local.y);id=vec2(cell.x,cell.y-band+${ratio.toFixed(1)});}
 return vec4(local*${plankWidthCm.toFixed(1)},id);
}
vec2 herringboneGradient(vec2 cm){
 vec2 p=vec2(cm.x+cm.y,cm.y-cm.x)*.7071067811865476;
 return hbHorizontal>.5?vec2(p.y/60.0,p.x/240.0):vec2(p.x/60.0,p.y/240.0);
}`;
 const surface=`
vec4 hb=herringboneBoard(floorCm);
hbUv=hb.xy/vec2(60.0,240.0)+fract(hb.zw*vec2(.173,.317));
#ifdef USE_MAP
 vec4 texelColor=mapTexelToLinear(texture2D(map,hbUv));
 diffuseColor*=texelColor;
#endif
float edge=min(min(hb.x,${plankWidthCm.toFixed(1)}-hb.x),min(hb.y,${plankLengthCm.toFixed(1)}-hb.y));
float aa=max(.015,length(fwidth(floorCm))*.5);
float gap=(1.0-smoothstep(0.0,${(jointCm/2).toFixed(3)}+aa,edge))*min(1.0,${jointCm.toFixed(3)}/aa);
float tone=.94+.06*sin(hb.z*7.13+hb.w*3.71);
diffuseColor.rgb*=mix(tone,.48,gap);`;
 const bump=T.ShaderChunk.bumpmap_pars_fragment.replace(/dFdx\( vUv \)/g,'herringboneGradient(dFdx(floorCm))').replace(/dFdy\( vUv \)/g,'herringboneGradient(dFdy(floorCm))').replace(/\bvUv\b/g,'hbUv');
 shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\n'+common).replace('#include <map_fragment>',surface).replace('#include <bumpmap_pars_fragment>',bump);
};
material.customProgramCacheKey=()=> 'industrial-herringbone-20260911';
const floor=new T.Mesh(geometry,material);floor.name='室內深煙燻木人字拼地板';floor.position.y=finishLevelCm;floor.receiveShadow=true;
floor.userData.flooring={pattern:'herringbone',plankWidthCm,plankLengthCm,rotationDeg,jointCm,excluded:['玄關','廚房','主浴','客浴','陽台']};V.scene.add(floor);
const entry=new T.Group();entry.name='玄關石墨灰大板磚地坪';V.scene.add(entry);
const tileCm=80,groutCm=.2,tiles=[];
const tileMaterial=new T.MeshStandardMaterial({color:new T.Color('#4f565f').convertSRGBToLinear(),roughness:.86,metalness:0,envMapIntensity:.2});
tileMaterial.name='石墨灰80公分霧面大板磚';tileMaterial.userData.finishId='industrial-entry-stone';
const grout=new T.MeshStandardMaterial({color:new T.Color('#33383e').convertSRGBToLinear(),roughness:.97});
function surface(points,mat,z,name){const s=new T.Shape(points.map(([x,y])=>new T.Vector2(x-482.5,480-y))),g=new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);const m=new T.Mesh(g,mat);m.name=name;m.position.y=z;m.receiveShadow=true;entry.add(m);return m;}
surface(entryOutline,grout,.16,'玄關深灰填縫底');
function clip(poly,rect){for(let k=0;k<rect.length;k++){const a=rect[k],b=rect[(k+1)%rect.length],dist=p=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]),next=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dp=dist(p),dq=dist(q),insideP=dp>=-1e-8,insideQ=dq>=-1e-8;if(insideP)next.push(p);if(insideP!==insideQ){const t=dp/(dp-dq);next.push(p.map((v,j)=>v+(q[j]-v)*t));}}poly=next;}return poly;}
function area(poly){return Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;}
// Preserve the exact floor boundary and flush 4mm transition strips.
const boundary=open?[[545.6,805.4],[714.6,805.4],[714.6,955],[545.6,955]]:[[555.6,803],[714.6,803],[714.6,955],[545.2,955],[545.2,885],[555.2,885],[555.2,883],[555.6,883]];
for(let row=-1;row<3;row++)for(let col=-1;col<3;col++){
 const x=550+col*tileCm,y=803+row*tileCm,a=groutCm/2,rect=[[x+a,y+a],[x+tileCm-a,y+a],[x+tileCm-a,y+tileCm-a],[x+a,y+tileCm-a]],points=clip(boundary,rect);
 if(points.length<3||area(points)<.01)continue;
 const id=row+':'+col,m=surface(points,tileMaterial,finishLevelCm,'玄關石墨大板磚 '+id);m.userData.entryTile={id,points};m.updateMatrixWorld(true);F.worldUV(m,180);tiles.push({id,points});
}
const trimMat=new T.MeshStandardMaterial({color:new T.Color('#505963').convertSRGBToLinear(),roughness:.45,metalness:.8});
for(const [x,y,w,d,name] of (open?[[714.6,805,.4,150,'客廳交界'],[545.2,805,.4,150,'開放展示交界'],[545.6,805,169,.4,'中島交界']]:[[714.6,803,.4,152,'客廳交界'],[555.2,803,.4,80,'收藏室門口']])){
 const m=surface([[x,y],[x+w,y],[x+w,y+d],[x,y+d]],trimMat,finishLevelCm,'黑鈦齊平收邊・'+name);m.userData.floorTransition={widthCm:.4,finishLevelCm};
}
entry.userData.flooring={pattern:'large-format-stone',tileCm,groutCm,finishLevelCm,outline:entryOutline,tileCount:tiles.length,tiles,transitionWidthCm:.4};
V.scene.getObjectByName('寫實材質與燈光細節')?.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry'&&o.material.transparent&&Math.abs(o.position.y-.15)<.001)o.position.y=.25;});
function inside(x,y,points){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
window.HOME_FLOORING={ready:Promise.resolve(),floor,entry,tileMaterial,sampleBoard,getState:()=>({ready:true,pattern:'herringbone',plankWidthCm,plankLengthCm,rotationDeg,jointCm,textureSize:floor.material.map?.image?.width||512,entry:entry.userData.flooring}),finishAt:(x,y)=>inside(x,y,entryOutline)?'large-format-stone':inside(x,y,outline)&&!inside(x,y,guestBath)?'herringbone':'stone'};
window.HOME_REALISM?.invalidate();
})();
