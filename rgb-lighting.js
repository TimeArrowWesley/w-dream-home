'use strict';
(()=>{
const T=THREE,V=HOME_VIEWER,$=id=>document.getElementById(id);
const presets={living:{name:'客廳',bounds:[765,415,1020,865],color:'#55ccff'},study:{name:'電腦房',bounds:[815,60,1022,338],color:'#ac65ff'}};
const modes={static:'恆亮',breathe:'呼吸',rainbow:'彩虹循環',wave:'彩虹波浪',chase:'流光追逐'};
const defaults=id=>({on:true,color:presets[id].color,mode:'static',brightness:65,speed:1});
const storageKey=window.HOME_LAYOUT?.comfort?'home-rgb-comfort-v1':'home-rgb-v1';
const states={living:defaults('living'),study:defaults('study')};
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');for(const id in states)if(saved?.[id])Object.assign(states[id],saved[id]);}catch{}
function valid(s){s.on=!!s.on;if(!/^#[\da-f]{6}$/i.test(s.color))s.color='#55ccff';if(!modes[s.mode])s.mode='static';s.brightness=Math.max(0,Math.min(100,Number(s.brightness)||0));s.speed=Math.max(.2,Math.min(3,Number(s.speed)||1));}
Object.values(states).forEach(valid);
const hardware=new T.Group();hardware.name='客廳與電腦房 RGB 天花燈槽';V.ceiling.add(hardware);
const fixtures={};const black=new T.MeshStandardMaterial({color:0x10151a,roughness:.65,metalness:.6});
const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;const ctx=glowCanvas.getContext('2d');const gradient=ctx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(255,255,255,.32)');gradient.addColorStop(.4,'rgba(255,255,255,.12)');gradient.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const glowMap=new T.CanvasTexture(glowCanvas);
function mesh(w,h,d,x,y,z,material,parent=hardware){const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.copy(V.pos(x,y,z));parent.add(m);return m;}
for(const [id,p] of Object.entries(presets)){
 const [x1,y1,x2,y2]=p.bounds,points=[[x1,y1],[x2,y1],[x2,y2],[x1,y2]],segments=[],lights=[];
 for(let edge=0;edge<4;edge++){
  const a=points[edge],b=points[(edge+1)%4],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),n=Math.ceil(length/45);
  mesh(Math.abs(dx)||5,2,Math.abs(dy)||5,(a[0]+b[0])/2,(a[1]+b[1])/2,270,black);
  for(let k=0;k<n;k++){
   const t=(k+.5)/n,x=a[0]+dx*t,y=a[1]+dy*t,material=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false});
   const strip=mesh(dx?length/n-.25:2,1,dy?length/n-.25:2,x,y,268.7,material);strip.name=p.name+' RGB 燈條';
   const gm=new T.MeshBasicMaterial({map:glowMap,transparent:true,depthWrite:false,toneMapped:false,side:T.DoubleSide,blending:T.AdditiveBlending});
   const glow=new T.Mesh(new T.PlaneGeometry(dx?length/n+28:58,dy?length/n+28:58),gm);glow.rotation.x=-Math.PI/2;glow.position.copy(V.pos(x,y,274.7));hardware.add(glow);
   segments.push({material,glow,phase:(edge+t)/4});
  }
  const l=new T.PointLight(0xffffff,0,240,1.6);l.position.copy(V.pos((a[0]+b[0])/2,(a[1]+b[1])/2,258));V.scene.add(l);lights.push({light:l,phase:(edge+.5)/4});
 }
 fixtures[id]={segments,lights};
}
const panel=document.createElement('section');panel.id='homeControls';panel.hidden=true;panel.setAttribute('aria-label','燈光與窗簾');
panel.innerHTML='<div class="hcHeading"><strong>燈光與窗簾</strong><button id="homeControlsClose" aria-label="關閉控制面板">✕</button></div><p id="rgbViewNote">即時控制適用於 3D／步行；AI 設計效果圖不會隨設定變色。</p><button id="rgbShowModel">查看即時 3D</button><h3>天花 RGB 燈條</h3><label>控制空間 <select id="rgbRoom"><option value="living">客廳</option><option value="study">電腦房</option></select></label><label><input id="rgbOn" type="checkbox"> 開啟燈條</label><label>顏色 <input id="rgbColor" type="color" aria-label="RGB 燈條顏色"></label><label>效果 <select id="rgbMode">'+Object.entries(modes).map(([v,n])=>'<option value="'+v+'">'+n+'</option>').join('')+'</select></label><label>亮度 <output id="rgbBrightnessValue"></output><input id="rgbBrightness" type="range" min="0" max="100" step="1"></label><label>速度 <output id="rgbSpeedValue"></output><input id="rgbSpeed" type="range" min="0.2" max="3" step="0.1"></label><p id="rgbColorHint"></p><h3>窗簾</h3><div id="homeCurtainSlot"></div>';
document.body.appendChild(panel);const toggle=document.createElement('button');toggle.id='homeControlsToggle';toggle.textContent='燈光與窗簾';toggle.setAttribute('aria-controls','homeControls');toggle.setAttribute('aria-expanded','false');document.body.appendChild(toggle);
const curtains=$('curtainControls');if(curtains)$('homeCurtainSlot').appendChild(curtains);
const css=document.createElement('style');css.textContent='#homeControlsToggle{position:fixed;right:18px;bottom:100px;z-index:120;padding:10px 16px;background:#233039;border:1px solid #69b9cc;border-radius:24px;box-shadow:0 3px 15px #0008}#homeControls{position:fixed;z-index:121;right:18px;bottom:148px;width:300px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 180px);overflow:auto;box-sizing:border-box;background:#172127f5;border:1px solid #586b77;border-radius:14px;padding:16px;box-shadow:0 10px 40px #0008;color:#eef3f6;font-size:13px}#homeControls[hidden]{display:none}.hcHeading{display:flex;justify-content:space-between;align-items:center}#homeControls h3{font-size:14px;margin:18px 0 10px}#homeControls p{font-size:11px;line-height:1.6;color:#b5c4cc}#homeControls label{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 0}#homeControls select{background:#25323a;color:white;border:1px solid #647785;border-radius:5px;padding:7px;max-width:100%}#homeControls input[type=range]{width:100%;accent-color:#61d3e5}#homeControls input[type=color]{width:54px;height:32px;border:0;background:none;padding:0}#homeControls output{margin-left:auto}#homeControls button{font-size:12px}#homeControls #curtainState{width:100%}@media(max-width:600px){#homeControlsToggle{bottom:110px;right:10px}#homeControls{right:10px;bottom:155px;max-height:calc(100dvh - 180px)}}';document.head.appendChild(css);
function show(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open&&document.pointerLockElement)document.exitPointerLock();}
toggle.onclick=()=>show(panel.hidden);$('homeControlsClose').onclick=()=>show(false);
const selected=()=>$('rgbRoom').value;
function sync(){const s=states[selected()];$('rgbOn').checked=s.on;$('rgbColor').value=s.color;$('rgbMode').value=s.mode;$('rgbBrightness').value=s.brightness;$('rgbSpeed').value=s.speed;$('rgbBrightnessValue').textContent=s.brightness+'%';$('rgbSpeedValue').textContent=s.speed.toFixed(1)+'×';$('rgbColor').disabled=['rainbow','wave'].includes(s.mode);$('rgbSpeed').disabled=s.mode==='static';$('rgbColorHint').textContent=['rainbow','wave'].includes(s.mode)?'此效果自動循環彩虹色；恆亮、呼吸和追逐可自行選色。':'設定會記在這台瀏覽器，兩個空間可分別控制。';}
function update(id,patch){if(!states[id])return;Object.assign(states[id],patch);valid(states[id]);try{localStorage.setItem(storageKey,JSON.stringify(states));}catch{}sync();paint(performance.now());}
$('rgbRoom').onchange=sync;
for(const [element,key,type] of [['rgbOn','on','check'],['rgbColor','color','string'],['rgbMode','mode','string'],['rgbBrightness','brightness','number'],['rgbSpeed','speed','number']])$(element).addEventListener('input',e=>update(selected(),{[key]:type==='check'?e.target.checked:type==='number'?Number(e.target.value):e.target.value}));
$('rgbShowModel').onclick=()=>{window.HOME_TOUR?.setMode('model');V.selectRoom(selected());V.camera.lookAt(V.pos(920,selected()==='living'?610:180,262));V.syncWalkCamera();};
const color=new T.Color();
function sample(s,phase,seconds){let power=s.on?s.brightness/100:0;const cycle=seconds*s.speed*.12;let hue=null;
 if(s.mode==='breathe')power*=.12+.88*(.5-.5*Math.cos(seconds*s.speed*Math.PI));
 if(s.mode==='rainbow')hue=cycle%1;
 if(s.mode==='wave')hue=(cycle+phase)%1;
 if(s.mode==='chase'){const distance=((phase-cycle)%1+1)%1;power*=.04+.96*Math.exp(-distance*distance/ .012);}
 if(hue===null)color.set(s.color);else color.setHSL(hue,.95,.58);
 color.convertSRGBToLinear();return power;
}
function paint(now){for(const id in fixtures){const s=states[id],f=fixtures[id];for(const e of f.segments){const power=sample(s,e.phase,now/1000);e.material.color.copy(color).multiplyScalar(power*1.6);e.glow.material.color.copy(color);e.glow.material.opacity=power;e.glow.visible=power>0;}for(const e of f.lights){const power=sample(s,e.phase,now/1000);e.light.color.copy(color);e.light.intensity=hardware.parent.visible?power*.85:0;}}}
let last=0;function frame(now){requestAnimationFrame(frame);if(document.hidden||now-last<33)return;last=now;paint(now);}sync();paint(0);requestAnimationFrame(frame);
window.HOME_RGB={update,getState:()=>JSON.parse(JSON.stringify(states)),fixtures,show};
})();
