'use strict';
(()=>{
 function init(){
  const model=window.HOME_FIXED_LIVING,I=window.HOME_INTERACTION,V=window.HOME_VIEWER;
  if(!model||!I||window.HOME_A_CONTROLS)return;
  const button=document.createElement('button');button.id='aStoolToggle';button.type='button';
  const visible=()=>model.stools.some(g=>g.visible);
  function blocksPoint(x,z,r){return visible()&&model.stools.some(g=>{const b=g.userData.footprint;return Math.hypot(x+482.5-b.x-b.w/2,z+480-b.y-b.d/2)<r+20;});}
  const original=I.blocksPoint;I.blocksPoint=(x,z,r)=>original(x,z,r)||blocksPoint(x,z,r);
  function paint(){button.textContent=visible()?'收起中島活動椅':'加入中島兩張活動椅';button.setAttribute('aria-pressed',String(visible()));}
  function toggleStools(show=!visible()){
   model.stools.forEach(g=>g.traverse(o=>o.visible=!!show));
   if(show&&window.HOME_WALK?.getState().active&&blocksPoint(V.camera.position.x,V.camera.position.z,18)){
    model.stools.forEach(g=>g.traverse(o=>o.visible=false));button.title='請先離開座椅位置，再加入活動椅。';paint();return false;
   }
   button.title='座椅放在東側留膝區，南端通道保留。';paint();window.HOME_REALISM?.invalidate();return true;
  }
  button.onclick=()=>toggleStools();document.getElementById('equipmentControls').appendChild(button);paint();
  window.HOME_A_CONTROLS={toggleStools,blocksPoint,getState:()=>({stoolsVisible:visible(),fixedTV:true})};
 }
 if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',init);else init();
})();
