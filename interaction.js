'use strict';
(()=>{
const T=THREE,V=HOME_VIEWER,$=id=>document.getElementById(id),canvas=$('view'),entries=[],dynamicLeaves=[],ray=new T.Raycaster(),inverse=new T.Matrix4();
let target=null,last=0,activeBefore=false;
const collisionCache=new WeakMap(),localPoint=new T.Vector3();
const metrics={boundsBuilds:0,pickCandidates:0,pickMeshes:0,pickScans:0};
function collider(mesh,worldReady=false){
 if(!worldReady)mesh.updateWorldMatrix(true,false);let c=collisionCache.get(mesh);const matrix=mesh.matrixWorld.elements;
 if(!c||c.geometry!==mesh.geometry||matrix.some((v,i)=>v!==c.matrix[i])){
  if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
  c={geometry:mesh.geometry,matrix:matrix.slice(),local:mesh.geometry.boundingBox,world:mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld),inverse:mesh.matrixWorld.clone().invert()};collisionCache.set(mesh,c);metrics.boundsBuilds++;
 }
 return c;
}
function register(pivot,meta,leaf){const e={id:entries.length,pivot,name:meta.name,openAngle:meta.openAngle,initial:meta.initialAngle||0,current:meta.initialAngle||0,target:meta.initialAngle||0,leaf};entries.push(e);pivot.userData.interactionId=e.id;leaf.userData.dynamicDoor=true;dynamicLeaves.push(leaf);pivot.traverse(o=>{if(o.isMesh)o.userData.dynamicDoor=true;});return e;}
V.architecture.traverse(o=>{if(o.userData.interactiveDoor){const leaf=o.children.find(c=>c.isMesh&&c.userData.name);if(leaf)register(o,o.userData.interactiveDoor,leaf);}});
V.architecture.traverse(o=>{if(o.userData.slidingDoor){const meta=o.userData.slidingDoor,parts=o.children.filter(c=>c.isMesh&&c.userData.slideRatio);if(parts.length){const e=register(o,{name:meta.name,openAngle:1},parts[0]);e.axis=meta.axis||'x';e.key=meta.key;e.electric=!!meta.electric;e.slides=parts.map(m=>({m,start:m.position[e.axis],ratio:m.userData.slideRatio}));e.distance=meta.distance;}}});
V.architecture.traverse(o=>{if(o.userData.doorControl){const e=entries.find(e=>e.key===o.userData.doorControl);if(e)o.userData.interactionId=e.id;}});
function moveEntry(e,value){if(e.slides){for(const s of e.slides)s.m.position[e.axis]=s.start-value*e.distance*s.ratio;}else e.pivot.rotation.y=value;}
function hitsEntry(e,x,z,r){return e.slides?e.slides.some(s=>intersects(s.m,x,z,r)):intersects(e.leaf,x,z,r);}
const leaves=[];V.fittings.traverse(o=>{if(o.isMesh&&o.userData.swingFront)leaves.push(o);});
for(const leaf of leaves){const meta=leaf.userData.swingFront,side=meta.face==='E'||meta.face==='W';leaf.geometry.computeBoundingBox();const bb=leaf.geometry.boundingBox,pivot=new T.Group();pivot.position.copy(leaf.position);if(side)pivot.position.z+=meta.hinge==='max'?bb.max.z:bb.min.z;else pivot.position.x+=meta.hinge==='max'?bb.max.x:bb.min.x;leaf.parent.add(pivot);leaf.position.sub(pivot.position);pivot.add(leaf);let angle={S:-1,N:1,E:1,W:-1}[meta.face]*1.48;if(meta.hinge==='max')angle*=-1;register(pivot,{name:meta.name+'・櫃門',openAngle:angle},leaf);
 const inset=leaf.userData.recessedPull;const pull=new T.Mesh(new T.BoxGeometry(inset?16:(side?2.2:1.2),inset?1:14,inset?.6:(side?1.2:2.2)),V.finishContext.materials.steel);pull.position.copy(leaf.position);if(side){pull.position.x+=meta.face==='E'?1.6:-1.6;pull.position.z+=meta.hinge==='max'?bb.min.z+4:bb.max.z-4;}else{pull.position.z+=meta.face==='S'?1.6:-1.6;pull.position.x+=meta.hinge==='max'?bb.min.x+4:bb.max.x-4;}if(inset){pull.position.x=leaf.position.x;pull.position.y=leaf.position.y+bb.max.y-3;pull.position.z=leaf.position.z+(meta.face==='S'?bb.max.z+.3:bb.min.z-.3);pull.userData.bedroomUpgrade=true;}else pull.position.y+=Math.min(0,110-pull.position.y);pull.userData.dynamicDoor=true;pull.castShadow=true;pivot.add(pull);
}
const overlay=document.createElement('div');overlay.id='walkExperience';overlay.innerHTML='<div class="walkBrand"><strong>W 夢想之家</strong><span>石墨灰・人字拼木地板</span></div><div id="walkTopActions"><button id="walkSettings">設定</button></div><div id="walkBottomBar"><select id="walkRoomSelect" aria-label="選擇漫遊起點"></select><button id="walkReset">回到起點</button><span>視點 165 cm · WASD 移動 · E 開關門 · Shift 慢走</span></div><button id="interactPrompt" hidden></button><div id="walkAim" aria-hidden="true"></div><div id="walkMiniMap" aria-label="目前位置平面圖"></div>';
canvas.parentElement.appendChild(overlay);$('walkTopActions').appendChild($('walkExit'));$('walkBottomBar').prepend($('walkLock'));
for(const r of V.rooms.filter(r=>r.id!=='all')){const o=document.createElement('option');o.value=r.id;o.textContent=r.n;$('walkRoomSelect').appendChild(o);}
$('walkRoomSelect').onchange=()=>{V.selectRoom($('walkRoomSelect').value);canvas.focus();};$('walkReset').onclick=()=>V.selectRoom(V.getCurrent());$('walkSettings').onclick=()=>document.body.classList.toggle('walkSettingsOpen');
const style=document.createElement('style');style.textContent=`
#walkExperience{display:none}body.walkImmersive{overflow:hidden}body.walkImmersive>header,body.walkImmersive aside,body.walkImmersive #planPanel,body.walkImmersive .sceneToolbar,body.walkImmersive .nearbyBar,body.walkImmersive #filmstrip{display:none!important}body.walkImmersive .shell,body.walkImmersive .workspace{display:block;height:100dvh;width:100vw}body.walkImmersive #scenePanel{display:block;width:100vw;height:100dvh;max-height:none;min-height:0}body.walkImmersive #scenePanel main{width:100%;height:100%}body.walkImmersive #walkExperience{display:block;position:absolute;inset:0;pointer-events:none;z-index:7}#walkExperience button,#walkExperience select{pointer-events:auto;background:#17201de0;border:1px solid #c3d3c42b;color:#eff5ee;font-size:12px;padding:10px 13px;border-radius:7px}#walkExperience button:hover{background:#34443d}#walkExperience select{max-width:150px}.walkBrand{position:absolute;left:24px;top:24px;display:grid;gap:6px;text-shadow:0 2px 8px #000}.walkBrand strong{font-size:20px;letter-spacing:.12em;font-weight:500}.walkBrand span{font-size:11px;color:#d0dacf}#walkTopActions{position:absolute;right:22px;top:22px;display:flex;gap:7px}#walkBottomBar{position:absolute;bottom:22px;left:24px;right:215px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}#walkBottomBar span{font-size:11px;background:#17201dc9;padding:10px;color:#e2eadf;border-radius:7px}#walkAim{position:absolute;left:50%;top:50%;width:4px;height:4px;transform:translate(-50%,-50%);border-radius:100%;background:#f6f3e2;box-shadow:0 0 3px #14221c}#interactPrompt{position:absolute;bottom:90px;left:50%;transform:translateX(-50%);background:#17201df0!important}#walkMiniMap{position:absolute;right:22px;bottom:22px;width:168px;height:135px;background:#16201fcd;border:1px solid #ffffff30;border-radius:9px;overflow:hidden}#walkMiniMap svg{width:100%;height:100%}body.walkImmersive #walkHUD{display:none!important;top:78px;left:auto;right:22px;max-width:320px;z-index:8;background:#17201df2}body.walkImmersive.walkSettingsOpen #walkHUD{display:block!important}body.walkImmersive #walkPad{display:none!important}body.walkImmersive #walkHUD>strong{display:none}@media(pointer:coarse){body.walkImmersive #walkPad{display:block!important;bottom:100px;right:16px;z-index:8}}@media(max-width:650px){.walkBrand{left:14px;top:18px}.walkBrand strong{font-size:16px}#walkTopActions{right:12px;top:14px}#walkTopActions button{padding:8px;font-size:11px}#walkBottomBar{left:12px;right:12px;bottom:14px;gap:5px}#walkBottomBar span{display:none}#walkExperience button,#walkExperience select{font-size:11px;padding:9px}#walkMiniMap{right:12px;bottom:100px;width:105px;height:85px}body.walkImmersive #walkPad{right:auto;left:12px;bottom:100px}#interactPrompt{bottom:200px;max-width:90%;width:max-content}.walkBrand span{font-size:9px}body.walkImmersive #walkHUD{right:12px;top:66px}}
`;document.head.appendChild(style);
const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','-235 -30 1470 1050');const diagram=document.createElementNS(ns,'g');diagram.setAttribute('fill','#8fa49a');diagram.setAttribute('opacity','.72');svg.appendChild(diagram);V.scene.updateMatrixWorld(true);for(const part of V.wallParts){const b=new T.Box3().setFromObject(part.m),r=document.createElementNS(ns,'rect');r.setAttribute('x',b.min.x+482.5);r.setAttribute('y',b.min.z+480);r.setAttribute('width',Math.max(3,b.max.x-b.min.x));r.setAttribute('height',Math.max(3,b.max.z-b.min.z));diagram.appendChild(r);}const pin=document.createElementNS(ns,'g');pin.innerHTML='<path d="M0 0 L-38 -72 Q0 -95 38 -72 Z" fill="#e6dd9955"/><circle r="13" fill="#eee7ba" stroke="#263b30" stroke-width="5"/>';svg.appendChild(pin);$('walkMiniMap').appendChild(svg);
function visible(o){while(o){if(!o.visible)return false;o=o.parent;}return true;}
function pick(nx=0,ny=0){metrics.pickScans++;V.scene.updateMatrixWorld(true);ray.setFromCamera(new T.Vector2(nx,ny),V.camera);ray.near=0;ray.far=190;const candidates=[];let meshes=0;for(const group of [V.architecture,V.fittings])group.traverse(o=>{if(!o.isMesh||o.userData.allowance||!visible(o))return;meshes++;const b=collider(o,true).world;if(b.distanceToPoint(ray.ray.origin)<=190&&ray.ray.intersectsBox(b))candidates.push(o);});metrics.pickCandidates=candidates.length;metrics.pickMeshes=meshes;const hit=ray.intersectObjects(candidates,false)[0];if(!hit)return null;let o=hit.object;while(o){if(o.userData.interactionId!==undefined)return entries[o.userData.interactionId];o=o.parent;}return null;}
function intersects(leaf,x,z,radius){const c=collider(leaf),w=c.world;if(w.max.y<12||w.min.y>180||x+radius<w.min.x||x-radius>w.max.x||z+radius<w.min.z||z-radius>w.max.z)return false;const p=localPoint.set(x,100,z).applyMatrix4(c.inverse),b=c.local;const dx=p.x-Math.max(b.min.x,Math.min(p.x,b.max.x)),dz=p.z-Math.max(b.min.z,Math.min(p.z,b.max.z));return dx*dx+dz*dz<radius*radius;}
function doorChanged(){pickRevision++;window.dispatchEvent(new CustomEvent('doorstatechange'));}
function toggle(e){if(!e)return false;if(e.key==='closet-mirror'&&Math.abs(e.target)<.1&&window.HOME_BEDROOM?.canMoveClosetMirror()===false)return false;e.target=Math.abs(e.target)>.1?0:e.openAngle;doorChanged();return true;}
function activateAt(event){const rect=canvas.getBoundingClientRect(),locked=document.pointerLockElement===canvas;return toggle(pick(locked?0:(event.clientX-rect.left)/rect.width*2-1,locked?0:1-(event.clientY-rect.top)/rect.height*2));}
$('interactPrompt').onclick=()=>toggle(target);
window.addEventListener('keydown',e=>{if(HOME_TOUR.getMode()!=='walk'||e.key.toLowerCase()!=='e'||e.repeat||e.target.closest('input,textarea,select,[contenteditable]'))return;e.preventDefault();toggle(pick());});
let pickAt=0,pickRevision=0,lastPickRevision=-1;const pickCamera=new T.Matrix4(),pinDirection=new T.Vector3();let pinKey='';function frame(now){
 requestAnimationFrame(frame);const dt=Math.max(0,Math.min((now-last)/1000,.05));last=now;if(document.hidden)return;const active=HOME_TOUR.getMode()==='walk';
 if(active!==activeBefore){activeBefore=active;document.body.classList.toggle('walkImmersive',active);if(!active)document.body.classList.remove('walkSettingsOpen');}
 const p=V.camera.position;
 for(const e of entries){
  if(Math.abs(e.target-e.current)<.00001){e.blocked=false;continue;}
  const old=e.current,delta=e.target-old;let next=old+(e.electric?Math.sign(delta)*Math.min(Math.abs(delta),dt*45/e.distance):delta*Math.min(1,dt*8));
  if(Math.abs(e.target-next)<.001)next=e.target;
  moveEntry(e,next);e.pivot.updateMatrixWorld(true);
  if(active&&hitsEntry(e,p.x,p.z,18)){
   moveEntry(e,old);e.pivot.updateMatrixWorld(true);
   const opening=Math.abs(e.target)>Math.abs(old);e.blocked=true;
   if(e.electric&&delta<0)e.target=1;else if(!opening)e.target=old;
   // Retain an opening request while the person steps out of the door sweep.
   // Cancelling it at the first obstruction left room doors half open.
   if(!opening)doorChanged();
  }else{e.blocked=false;e.current=next;if(next!==old){pickRevision++;window.HOME_REALISM?.invalidate(true,true);}if(next===e.target)doorChanged();}
 }
 if(!active)return;
 if(now-pickAt>100){
  pickAt=now;V.camera.updateMatrixWorld();const room=V.getCurrent();
  if(pickCamera.equals(V.camera.matrixWorld)&&lastPickRevision===pickRevision&&$('walkRoomSelect').value===room)return;
  pickCamera.copy(V.camera.matrixWorld);lastPickRevision=pickRevision;
  if(!document.body.classList.contains('uiApp')){V.camera.getWorldDirection(pinDirection);const key=`${p.x},${p.z},${pinDirection.x},${pinDirection.z}`;if(key!==pinKey){pinKey=key;pin.setAttribute('transform',`translate(${p.x+482.5},${p.z+480}) rotate(${Math.atan2(pinDirection.x,-pinDirection.z)*180/Math.PI})`);}}
  if($('walkRoomSelect').value!==room)$('walkRoomSelect').value=room;
  target=pick();$('interactPrompt').hidden=!target;if(target)$('interactPrompt').textContent=target.blocked?'請稍退後，門片會繼續開啟':target.name+' · '+(Math.abs(target.target)>.1?'關閉':'開啟')+'（E）';
 }
}
requestAnimationFrame(frame);
const findEntry=key=>entries.find(e=>e.key===key||e.name===key||e.id===key);
window.HOME_INTERACTION={activateAt,toggleDoor:key=>toggle(findEntry(key)),setDoor:(key,open)=>{const e=findEntry(key);if(!e)return false;if(open&&e.key==='closet-mirror'&&window.HOME_BEDROOM?.canMoveClosetMirror()===false)return false;e.target=open?e.openAngle:0;doorChanged();return true;},blocksPoint:(x,z,r)=>entries.some(e=>visible(e.leaf)&&hitsEntry(e,x,z,r)),getState:()=>({count:entries.length,open:entries.filter(e=>Math.abs(e.current)>.1).length,entries:entries.map(e=>({id:e.id,key:e.key,name:e.name,angle:e.current,target:e.target,openAngle:e.openAngle,blocked:!!e.blocked,sliding:!!e.slides,electric:e.electric||false})),metrics:{...metrics},target:target?.id??null})};
})();

