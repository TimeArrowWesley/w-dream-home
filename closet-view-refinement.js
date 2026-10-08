'use strict';
// CL01 changes the initial viewing position only. All geometry stays unchanged.
(()=>{
 const V=window.HOME_VIEWER,r=V?.rooms.find(r=>r.id==='closet');if(!r)return;
 r.p=[647,74,154];r.t=[655,207,121];r.reviewFov=78;
 r.note='開放吊衣、三層內衣抽屜、淺玻璃手拿包櫃及58cm滑鏡。先收抽屜再移鏡；CW01校正柱旁凹槽窗位與靠客浴側門鉸鏈，窗邊矮櫃與高櫃保留。尺寸為模型試配，管道、窗洞、五金與有效容量待丈量。';
 function frame(){if(V.getCurrent()!=='closet'||window.HOME_WALK?.getState().active)return;V.camera.position.copy(V.pos(...r.p));V.camera.lookAt(V.pos(...r.t));V.camera.fov=r.reviewFov;V.camera.updateProjectionMatrix();V.syncWalkCamera();window.HOME_REALISM?.invalidate(true);}
 window.addEventListener('roomchange',frame);frame();
 window.HOME_CLOSET_VIEW={revision:'20261002-cl01',position:r.p.slice(),target:r.t.slice(),fov:r.reviewFov};
})();
