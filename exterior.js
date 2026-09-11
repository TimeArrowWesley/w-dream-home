'use strict';
(()=>{
const T=THREE,V=HOME_VIEWER,S=V.scene,groundY=-3900;
const group=new T.Group();group.name='14樓窗外草地樹群';S.add(group);
V.camera.far=180000;V.camera.updateProjectionMatrix();
const sky=S.getObjectByName('窗外天空');if(sky)sky.scale.setScalar(30);
// All exterior heights are relative to the apartment floor, in centimetres.
const groundMat=new T.MeshStandardMaterial({color:0x8a9665,roughness:1,metalness:0});
const ground=new T.Mesh(new T.PlaneGeometry(240000,240000,1,1),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=groundY;group.add(ground);
let seed=74114;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
const treeCount=430,crownsPerTree=5;
const crowns=new T.InstancedMesh(new T.IcosahedronGeometry(1,2),new T.MeshStandardMaterial({color:0xffffff,roughness:1}),treeCount*crownsPerTree);
const trunks=new T.InstancedMesh(new T.CylinderGeometry(1,1.5,1,6),new T.MeshStandardMaterial({color:0x645840,roughness:1}),treeCount);
const dummy=new T.Object3D();
for(let i=0;i<treeCount;i++){
const angle=rand()*Math.PI*2,distance=2200+Math.pow(rand(),.7)*76000,x=Math.cos(angle)*distance,z=Math.sin(angle)*distance;
const height=450+rand()*900,width=height*(.3+rand()*.15);
dummy.rotation.set(0,0,0);dummy.position.set(x,groundY+height*.35,z);dummy.scale.set(height*.025,height*.7,height*.025);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
for(let j=0;j<crownsPerTree;j++){dummy.position.set(x+(rand()-.5)*width,groundY+height*(.62+rand()*.23),z+(rand()-.5)*width);dummy.scale.set(width*(.55+rand()*.25),height*(.23+rand()*.13),width*(.55+rand()*.25));dummy.rotation.set(rand(),rand()*6,rand());dummy.updateMatrix();crowns.setMatrixAt(i*crownsPerTree+j,dummy.matrix);crowns.setColorAt(i*crownsPerTree+j,new T.Color().setHSL(.22+rand()*.07,.24+rand()*.19,.18+rand()*.12).convertSRGBToLinear());}
}
group.add(trunks,crowns);
// Distance haze applies only to exterior surfaces, leaving indoor materials unchanged.
for(const m of [groundMat,crowns.material,trunks.material]){m.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying float landscapeDistance;').replace('#include <project_vertex>','#include <project_vertex>\nlandscapeDistance=length(mvPosition.xyz);');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float landscapeDistance;').replace('#include <dithering_fragment>','#include <dithering_fragment>\nfloat haze=1.0-exp(-landscapeDistance*.000005);gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.69,.76,.76),haze*.65);');};}
const state={groundBelowFloorCm:3900,trees:treeCount,buildings:0,textureLoaded:false};
const image=new Image();image.onload=()=>{const map=new T.Texture(image);map.encoding=T.sRGBEncoding;map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(12,12);map.anisotropy=Math.min(8,V.renderer.capabilities.getMaxAnisotropy());map.needsUpdate=true;groundMat.map=map;groundMat.color.set(0xffffff);groundMat.needsUpdate=true;state.textureLoaded=true;window.HOME_REALISM?.invalidate(false);};image.src=window.EXTERIOR_GROUND;
window.HOME_EXTERIOR={getState:()=>({...state})};
})();
