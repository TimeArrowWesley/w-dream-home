'use strict';
(()=>{
 const p=window.HOME_V4_PUBLIC,V=window.HOME_VIEWER;if(!p||p.finalized)return;p.finalized=true;
 const g=V.fittings.children.find(o=>o.name==='GR06 灰石洗牆燈試案');if(g)g.position.x-=45;
 const r=V.rooms.find(r=>r.id==='living');r.p[0]-=45;r.t[0]-=45;r.label[0]-=45;
 window.HOME_WALK?.refreshColliders();window.HOME_REALISM?.invalidate();
})();
