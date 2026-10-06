'use strict';
// BW04 mirrors follow their existing parent, including the folding vanity lid.
(()=>{
 if(!['v0','v2','v3','v4','v5'].includes(window.HOME_LAYOUT?.displayVersion)||!THREE.Reflector||!window.HOME_BLENDER_HOME)return;
 const T=THREE,V=HOME_VIEWER,B=HOME_BLENDER_V1,mirrors=[];
 let reflecting=false;
 const definitions=[
  ['M0144',[130,200,150]],['M1428',[70,370,140]],
  ['M1457',[480,300,140]],['M1561',[-120,700,140]],['M2111',null]
 ];
 const state={revision:'BW04',ready:false,count:0};
 const ready=B.ready.then(()=>{
  if(B.getState().state!=='ready')return;
  for(const [id,target] of definitions){
   const rec=B.records.find(r=>r.referenceId===id);if(!rec)continue;
   const o=rec.o,g=o.geometry;g.computeBoundingBox();
   const box=g.boundingBox,size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),dims=size.toArray();
   const axis=dims.indexOf(Math.min(...dims)),normal=new T.Vector3().setComponent(axis,1);
   if(target){
    const p=new T.Vector3(target[0]-482.5,target[2],target[1]-480);o.worldToLocal(p);
    if(p.sub(center).dot(normal)<0)normal.negate();
   }else normal.set(0,-1,0); // underside of the existing closed folding lid
   const axes=[0,1,2].filter(i=>i!==axis),width=dims[axes[0]],height=dims[axes[1]];
   const plane=new T.PlaneGeometry(width,height),m=new T.Reflector(plane,{textureWidth:1024,textureHeight:1024,color:0xe4e8e8,clipBias:.003});
   // Build a local orthonormal basis with the plane's +Z facing the room.
   const u=new T.Vector3().setComponent(axes[0],1),v=new T.Vector3().crossVectors(normal,u).normalize();
   m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(u,v,normal));
   m.position.copy(center).addScaledVector(normal,dims[axis]/2+.025);
   m.name='BW04 planar mirror '+id;m.userData.bw03Mirror=true;m.renderOrder=1;
   const draw=m.onBeforeRender;
   m.onBeforeRender=function(renderer,scene,camera,...args){
    if(reflecting)return;
    reflecting=true;const visibility=mirrors.map(p=>p.visible);
    try{for(const p of mirrors)if(p!==m)p.visible=false;draw.call(m,renderer,scene,camera,...args);}
    finally{mirrors.forEach((p,i)=>p.visible=visibility[i]);reflecting=false;}
   };
   o.add(m);mirrors.push(m);
  }
  state.ready=true;state.count=mirrors.length;HOME_REALISM.invalidate();
 });
 window.HOME_FULLHOUSE_MIRRORS={ready,getState:()=>({...state})};
})();
