'use strict';
(()=>{
 const A=window.HOME_LIVING_AUDIO,V=window.HOME_VIEWER;if(!A||A.finalized)return;A.finalized=true;
 if(A.version==='v4'){
  const light=V.fittings.children.find(o=>o.name==='GR06 灰石洗牆燈試案');if(light)light.position.x+=45;
  const r=V.rooms.find(r=>r.id==='living');r.p[0]+=45;r.t[0]+=45;r.label[0]+=45;
 }
 window.HOME_WALK?.refreshColliders();window.HOME_REALISM?.invalidate();
})();
