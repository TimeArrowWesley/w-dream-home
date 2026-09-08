'use strict';
(()=>{
const V=HOME_VIEWER,T=THREE,$=id=>document.getElementById(id),canvas=$('view'),keys=new Set();
let active=false,yaw=0,pitch=0,last=0,drag=null,blocks=[],doors=[],savedDoors=[],messageUntil=0;
const EYE_HEIGHT=165,radius=18,speed=105,outline=[[-110,-15],[1185,-15],[1185,315],[1085,315],[1085,580],[1185,580],[1185,650],[1085,650],[1085,880],[1185,880],[1185,970],[545,970],[545,955],[445,955],[445,970],[-210,970],[-210,415],[-90,415],[-90,85],[-110,85]];
const button=document.createElement('button');button.textContent='真人步行';button.dataset.viewmode='walk';document.querySelector('.viewTabs').appendChild(button);
const hud=document.createElement('div');hud.id='walkHUD';hud.innerHTML='<strong>真人步行 · 3D 即時畫面</strong><div>按住 W/A/S/D 行走 · 拖曳轉頭 · Shift 慢走</div><button id="walkLock">滑鼠跟隨視線</button><button id="walkExit">退出步行</button><div id="walkMessage" role="status"></div>';
canvas.parentElement.appendChild(hud);
const pad=document.createElement('div');pad.id='walkPad';pad.innerHTML='<button data-walk-key="w" aria-label="向前走">↑</button><div><button data-walk-key="a" aria-label="向左走">←</button><button data-walk-key="s" aria-label="向後走">↓</button><button data-walk-key="d" aria-label="向右走">→</button></div>';canvas.parentElement.appendChild(pad);
const style=document.createElement('style');style.textContent='#walkHUD,#walkPad{display:none;position:absolute;z-index:6;background:#152025dc;border:1px solid #65796f;border-radius:9px;padding:10px;color:#e4eee9}#walkHUD{top:12px;left:12px;max-width:calc(100% - 24px);font-size:11px;line-height:1.8}#walkHUD strong{font-size:14px}#walkHUD button{font-size:11px;padding:5px 8px;margin:5px 5px 0 0}#walkPad{bottom:22px;right:16px;text-align:center;touch-action:none}#walkPad button{margin:3px;width:42px;height:42px;touch-action:none}#scenePanel[data-mode=walk] #walkHUD,#scenePanel[data-mode=walk] #walkPad{display:block}#scenePanel[data-mode=walk] #caption,#scenePanel[data-mode=walk] #hint,#scenePanel[data-mode=walk] #cameraControls{display:none!important}#scenePanel[data-mode=walk] #view{cursor:crosshair}';document.head.appendChild(style);
function notice(text){$('walkMessage').textContent=text;messageUntil=performance.now()+1800;}
function inside(x,z){x+=482.5;z+=480;let yes=false;for(let i=0,j=outline.length-1;i<outline.length;j=i++){const a=outline[i],b=outline[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function gather(){V.scene.updateMatrixWorld(true);blocks=[];doors=[];for(const group of [V.architecture,V.fittings])group.traverse(m=>{if(!m.isMesh||!m.visible||m.userData.dynamicDoor)return;const box=new T.Box3().setFromObject(m);if(box.max.y<12||box.min.y>180)return;if(m.userData.walkDoor){doors.push({mesh:m,box});return;}blocks.push(box);});}
function free(x,z){if(window.HOME_INTERACTION&&HOME_INTERACTION.blocksPoint(x,z,radius))return false;if(!inside(x-radius,z)||!inside(x+radius,z)||!inside(x,z-radius)||!inside(x,z+radius))return false;return !blocks.some(b=>{const dx=x-Math.max(b.min.x,Math.min(x,b.max.x)),dz=z-Math.max(b.min.z,Math.min(z,b.max.z));return dx*dx+dz*dz<radius*radius;});}
function pose(){V.camera.position.y=EYE_HEIGHT;V.camera.rotation.order='YXZ';V.camera.rotation.set(pitch,yaw,0);V.syncWalkCamera();}
function spawn(){keys.clear();gather();const p=V.camera.position;const spacious=(x,z)=>free(x,z)&&free(x+20,z)&&free(x-20,z)&&free(x,z+20)&&free(x,z-20);let found=spacious(p.x,p.z);if(!found){const x=p.x,z=p.z;outer:for(let r=10;r<=220;r+=10)for(let a=0;a<Math.PI*2;a+=Math.PI/16){if(spacious(x+Math.cos(a)*r,z+Math.sin(a)*r)){p.x=x+Math.cos(a)*r;p.z=z+Math.sin(a)*r;found=true;break outer;}}}const d=new T.Vector3();V.camera.getWorldDirection(d);yaw=Math.atan2(-d.x,-d.z);pitch=0;pose();notice(found?'視點高 165 cm；對準門片按 E 開關。':'此處通道較窄，請從平面圖選擇其他起點。');}
function enter(){if(active)return;if(V.getCurrent()==='all')V.selectRoom('living');active=true;V.camera.fov=55;V.camera.updateProjectionMatrix();canvas.tabIndex=0;$('cut').checked=false;$('cut').dispatchEvent(new Event('change'));savedDoors=[];spawn();canvas.focus();}
function exit(){active=false;keys.clear();drag=null;for(const [m,visible] of savedDoors)m.visible=visible;savedDoors=[];if(document.pointerLockElement===canvas)document.exitPointerLock();V.syncWalkCamera();}
const setMode=HOME_TOUR.setMode;HOME_TOUR.setMode=m=>{if(m!=='walk'&&active)exit();setMode(m);if(m==='walk')enter();};
document.querySelectorAll('[data-viewmode]').forEach(b=>b.onclick=()=>HOME_TOUR.setMode(b.dataset.viewmode));
button.onclick=()=>HOME_TOUR.setMode('walk');$('walkExit').onclick=()=>HOME_TOUR.setMode('model');
$('walkLock').onclick=()=>{if(canvas.requestPointerLock){const promise=canvas.requestPointerLock();if(promise?.catch)promise.catch(()=>notice('請使用拖曳轉頭。'));}else notice('此瀏覽器請使用拖曳轉頭。');};
document.addEventListener('pointerlockerror',()=>notice('無法鎖定滑鼠，仍可拖曳轉頭。'));
document.addEventListener('pointerlockchange',()=>{keys.clear();$('walkLock').textContent=document.pointerLockElement===canvas?'Esc 解除滑鼠跟隨':'滑鼠跟隨視線';});
window.addEventListener('roomchange',()=>{if(!active)return;if(V.getCurrent()==='all'){HOME_TOUR.setMode('model');return;}spawn();});
function editable(e){return e.target.closest?.('input,textarea,select,[contenteditable]');}
window.addEventListener('keydown',e=>{if(!active||editable(e)||e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(['w','a','s','d','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();e.stopImmediatePropagation();keys.add(k);}},true);
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()),true);
window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>keys.clear());
canvas.addEventListener('pointerdown',e=>{if(!active)return;e.stopImmediatePropagation();drag={x:e.clientX,y:e.clientY,distance:0};canvas.setPointerCapture(e.pointerId);canvas.focus();},true);
canvas.addEventListener('pointermove',e=>{if(!active)return;e.stopImmediatePropagation();if(document.pointerLockElement===canvas)return;if(!drag)return;drag.distance+=Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y);look(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;},true);
for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,e=>{if(!active)return;e.stopImmediatePropagation();if(type==="pointerup"&&drag&&drag.distance<5&&window.HOME_INTERACTION)HOME_INTERACTION.activateAt(e);drag=null;},true);
document.addEventListener('mousemove',e=>{if(active&&document.pointerLockElement===canvas)look(e.movementX,e.movementY);});
function look(dx,dy){yaw-=dx*.0025;pitch=Math.max(-1.35,Math.min(1.35,pitch-dy*.0025));pose();}
canvas.addEventListener('wheel',e=>{if(active){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,passive:false});
pad.querySelectorAll('button').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.walkKey);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.walkKey);});
// Resolve horizontal movement in short substeps so even thin walls cannot be skipped.
function advance(dx,dz){const p=V.camera.position,n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/4));let hit=false;for(let i=0;i<n;i++){if(free(p.x+dx/n,p.z))p.x+=dx/n;else if(dx)hit=true;if(free(p.x,p.z+dz/n))p.z+=dz/n;else if(dz)hit=true;}pose();if(hit)notice('前方有牆面或家具，可沿側邊繞行。');}
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!active)return;if(HOME_TOUR.getMode()!=='walk'){exit();return;}let f=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown')),r=Number(keys.has('d'))-Number(keys.has('a'));if(keys.has('arrowleft'))yaw+=dt*1.2;if(keys.has('arrowright'))yaw-=dt*1.2;if(f||r){const length=Math.hypot(f,r),distance=speed*dt*(keys.has('shift')?.45:1);f/=length;r/=length;advance((-Math.sin(yaw)*f+Math.cos(yaw)*r)*distance,(-Math.cos(yaw)*f-Math.sin(yaw)*r)*distance);}else pose();if(now>messageUntil)$('walkMessage').textContent='';}
requestAnimationFrame(frame);
window.HOME_WALK={enter:()=>HOME_TOUR.setMode('walk'),exit:()=>HOME_TOUR.setMode('model'),getState:()=>({active,eyeHeight:EYE_HEIGHT,position:V.camera.position.toArray(),yaw,pitch,colliders:blocks.length}),canStand:free};
})();



