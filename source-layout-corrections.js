'use strict';
// CW01: fixed openings follow the source plan; AI images only guide finishes.
(()=>{
 const V=window.HOME_VIEWER,T=window.THREE;if(!V||window.HOME_SOURCE_LAYOUT)return;
 const wallState=V.wallParts.map(p=>[p.m,p.m.scale.y,p.m.position.y]);
 for(const p of V.wallParts){p.m.scale.y=1;p.m.position.y=p.z+p.h/2;}
 V.scene.updateMatrixWorld(true);
 const records=[],remember=o=>{const r={o,before:o.matrixWorld.clone()};records.push(r);return r;};
 const windowParts=V.wallParts.filter(({m})=>{
  const b=new T.Box3().setFromObject(m);
  return b.min.x+482.5>=414.99&&b.max.x+482.5<=485.01&&b.min.z+480>=-15.01&&b.max.z+480<=-4.99;
 });
 if(windowParts.length!==7)throw Error('CW01 closet window parts mismatch: '+windowParts.length);
 for(const {m} of windowParts){
  remember(m);m.position.z=1.5*m.position.z+327.5;m.scale.z*=1.5;
  m.userData.sourceLayout='CW01';m.userData.name='更衣室柱旁凹槽對外窗'+(m.material.transparent?'玻璃':'框／上下牆');
  m.userData.desc='窗位依原始／客變圖移至凹槽內緣；窗寬70、下緣95、上緣245cm仍為模型暫定值，待窗表及現場丈量。';
 }
 let door;V.architecture.traverse(o=>{if(o.userData.interactiveDoor?.name==='更衣室門')door=o;});
 if(!door)throw Error('CW01 closet door missing');
 for(const o of door.children.filter(o=>o.isMesh))remember(o);
 // The plan hinge is at the bathroom-side jamb (y207), not the window-side
 // jamb (y123). Keep the same door opening and leaf size, reverse its sweep.
 door.position.z+=84;
 for(const o of door.children)o.position.z=-o.position.z;
 const meta=door.userData.interactiveDoor;meta.openAngle=-Math.PI/2;meta.initialAngle=meta.initialAngle?-Math.PI/2:0;door.rotation.y=meta.initialAngle;
 door.userData.sourceLayout='CW01';
 V.scene.updateMatrixWorld(true);
 for(const r of records){r.after=r.o.matrixWorld.clone();r.delta=r.after.clone().multiply(r.before.clone().invert());}
 for(const [m,sy,y] of wallState){m.scale.y=sy;m.position.y=y;}V.scene.updateMatrixWorld(true);
 window.HOME_SOURCE_LAYOUT={revision:'20261008-CW01',records,windowParts:windowParts.map(p=>p.m),door,window:{x:415,y:65,w:70,d:15,z:95,h:150},source:'原始格局／2024-10-25客變平面窗槽與房門鉸鏈位置；立面高度待核'};
})();
