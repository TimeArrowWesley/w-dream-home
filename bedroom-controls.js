'use strict';
(()=>{
 const B=window.HOME_BEDROOM_MODEL,V=window.HOME_VIEWER;if(!B||!V)return;
 const $=id=>document.getElementById(id),state={scene:'daily',mirror:false,stool:false,drawer:false,closetDrawer:false,closetLight:true};
 const labels={daily:'日常',makeup:'化妝',reading:'閱讀',projection:'投影',night:'起夜'};
 const presets={daily:{ambient:.36,task:0,mirror:0,reading:0,night:0},makeup:{ambient:.28,task:.60,mirror:1,reading:0,night:0},reading:{ambient:.10,task:.32,mirror:0,reading:.8,night:.08},projection:{ambient:.015,task:0,mirror:0,reading:0,night:.025},night:{ambient:0,task:.025,mirror:0,reading:0,night:.12}};
 const host=document.createElement('section');host.id='bedroomControls';host.innerHTML='<h3>主臥與更衣室</h3><div id="bedroomScenes" role="group" aria-label="主臥燈光情境">'+Object.entries(labels).map(([id,label])=>'<button type="button" data-bedroom-scene="'+id+'" aria-pressed="false">'+label+'</button>').join('')+'</div><div id="vanityActions"><button id="vanityMirrorToggle" type="button">化妝鏡拉近</button><button id="vanityStoolToggle" type="button">椅凳拉出</button><button id="vanityDrawerToggle" type="button">打開飾品抽屜</button></div><div id="wardrobeActions"><button id="wardrobeDrawerToggle" type="button">打開內衣抽屜</button><button id="wardrobeLightToggle" type="button">櫃內燈關閉</button></div><p id="bedroomControlStatus" role="status" aria-live="polite"></p><small>投影會關閉主臥窗簾，其他情境保留窗簾狀態。鏡燈為功能示意；燈具與電源位置待選型。</small>';
 ($('homeControls')||document.querySelector('aside')).appendChild(host);
 const style=document.createElement('style');style.textContent='#bedroomControls{border-top:1px solid #46564f;padding-top:12px;margin-top:12px}#bedroomControls h3{font-size:13px}#bedroomScenes,#vanityActions,#wardrobeActions{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#bedroomControls button{background:#263733;border:1px solid #687e73;color:#e6eee9;padding:8px;border-radius:5px;font:inherit}#bedroomControls [aria-pressed=true]{background:#c4d8ce;color:#17251f}#bedroomControls small,#bedroomControlStatus{font-size:11px;line-height:1.7;color:#b9c8c0}';document.head.appendChild(style);
 function light(){const p=presets[state.scene];for(const l of V.finishContext.roomLights){const x=l.position.x+482.5,y=l.position.z+480;if(x>=-75&&x<405&&y<282)l.intensity=p.ambient;}
  for(const type of ['mirror','reading','night'])for(const m of B.diffusers[type])m.material.emissiveIntensity=p[type]*1.5;
  for(const m of B.diffusers.closet)m.material.emissiveIntensity=state.closetLight?.65:0;
  B.closetTask.intensity=state.closetLight?.20:0;B.task.intensity=p.task;
  const point=state.scene==='reading'?[190,53,125]:state.scene==='night'?[48,249,12]:[-23+(state.mirror?35:0),185,118];B.task.position.copy(V.pos(...point));
  window.HOME_REALISM?.setBedroomAccent?.(state.scene==='projection'?0:state.scene==='night'?.03:state.scene==='reading'?.18:1);
  window.HOME_REALISM?.invalidate(false);
 }
 function sync(message){for(const b of document.querySelectorAll('[data-bedroom-scene]'))b.setAttribute('aria-pressed',String(b.dataset.bedroomScene===state.scene));
  for(const [id,key,a,b] of [['vanityMirrorToggle','mirror','化妝鏡拉近','化妝鏡推回'],['vanityStoolToggle','stool','椅凳拉出','椅凳收回'],['vanityDrawerToggle','drawer','打開飾品抽屜','收回飾品抽屜'],['wardrobeDrawerToggle','closetDrawer','打開內衣抽屜','收回內衣抽屜'],['wardrobeLightToggle','closetLight','櫃內燈開啟','櫃內燈關閉']]){$(id).textContent=state[key]?b:a;$(id).setAttribute('aria-pressed',String(state[key]));}
  $('bedroomControlStatus').textContent=message||('主臥：'+labels[state.scene]+'。'+(state.stool?'椅凳使用中，床側剩55cm。':'椅凳收妥，床側淨距90cm。')+(state.drawer?' 飾品抽屜前剩55cm。':'')+(state.closetDrawer?' 更衣抽屜使用中，入口保留；先收回再取鏡後衣物。':''));
 }
 function move(key,value){const g=B.groups[key];if(!g)return false;value=!!value;
  // Sample the translation before applying it so a walker is never enclosed by a moved object.
  const axis='x',travel={mirror:35,stool:48,drawer:35,closetDrawer:-35}[key],old=g.position[axis],next=value?travel:0;
  if(key==='closetDrawer'&&value){const e=window.HOME_INTERACTION?.getState().entries.find(e=>e.key==='closet-mirror');if(e&&Math.abs(e.angle)>.01){sync('請先將更衣鏡移回左側，再拉出抽屜。');return false;}}
  if(window.HOME_WALK?.getState().active){const p=V.camera.position;for(let i=1;i<=12;i++){g.position[axis]=old+(next-old)*i/12;g.updateWorldMatrix(true,true);let blocked=false;g.traverse(o=>{if(!o.isMesh)return;const b=new THREE.Box3().setFromObject(o);if(b.max.y<12||b.min.y>180)return;const x=p.x-Math.max(b.min.x,Math.min(p.x,b.max.x)),z=p.z-Math.max(b.min.z,Math.min(p.z,b.max.z));if(x*x+z*z<18*18)blocked=true;});if(blocked){g.position[axis]=old;g.updateWorldMatrix(true,true);sync('請先退開一點，再收放家具。');return false;}}}
  g.position[axis]=next;g.updateWorldMatrix(true,true);state[key]=value;V.scene.updateMatrixWorld(true);window.HOME_WALK?.refreshColliders?.();light();sync();window.HOME_REALISM?.invalidate(true);return true;
 }
 function setScene(id){if(!presets[id])return false;state.scene=id;if(id==='projection')window.HOME_CURTAINS?.set(1,'bed');light();sync();return true;}
 for(const b of document.querySelectorAll('[data-bedroom-scene]'))b.onclick=()=>setScene(b.dataset.bedroomScene);
 for(const [id,key] of [['vanityMirrorToggle','mirror'],['vanityStoolToggle','stool'],['vanityDrawerToggle','drawer'],['wardrobeDrawerToggle','closetDrawer']])$(id).onclick=()=>move(key,!state[key]);
 $('wardrobeLightToggle').onclick=()=>{state.closetLight=!state.closetLight;light();sync();};
 // Keep the mirror from sliding through an extended drawer in the adjacent corner.
 const guard=()=>{if(state.closetDrawer){sync('請先收回更衣抽屜，再移開滑鏡。');return false;}return true;};B.groups.closetDrawer.userData.preventClosetMirror=guard;
 window.HOME_BEDROOM={setScene,setFurniture:move,reapplyScene:light,getState:()=>({...state}),canMoveClosetMirror:guard,controls:host};
 function scope(){const all=$('uiAllControls')?.checked||V.getCurrent()==='all',room=V.getCurrent();host.hidden=!all&&!['bed','closet'].includes(room);$('vanityActions').hidden=!all&&room==='closet';$('bedroomScenes').hidden=!all&&room==='closet';$('wardrobeActions').hidden=!all&&room==='bed';}
 window.addEventListener('roomchange',scope);window.addEventListener('homecontrolscope',scope);for(const id of ['day','night'])$(id).addEventListener('click',light);scope();light();sync();
})();
