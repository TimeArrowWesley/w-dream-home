'use strict';
(() => {
const T=THREE,V=HOME_VIEWER,C=V.finishContext,F=C.industrialFinishes,$=id=>document.getElementById(id);
const presets={
 daily:{label:'日常',kelvin:4000,brightness:85,display:55,environment:'day',rgb:{on:false}},
 dining:{label:'用餐',kelvin:3000,brightness:55,display:45,environment:'night',rgb:{on:false}},
 bar:{label:'酒吧',kelvin:2400,brightness:14,display:32,environment:'night',rgb:{on:false}},
 movie:{label:'電影',kelvin:2700,brightness:4,display:0,environment:'night',rgb:{on:false}},
 game:{label:'遊戲',kelvin:3500,brightness:28,display:20,environment:'night',rgb:{on:true,color:'#66bbff',brightness:30,mode:'breathe',speed:.35}},
 night:{label:'夜間',kelvin:2200,brightness:3,display:8,environment:'night',rgb:{on:false}}
};
const state={scene:'daily',kelvin:4000,brightness:85,display:55};
const row=document.createElement('section');row.id='comfortScenes';row.setAttribute('aria-label','室內白光與情境');
row.innerHTML='<h3>室內白光與情境</h3><div class="comfortButtons" role="group" aria-label="照明情境">'+Object.entries(presets).map(([id,s])=>'<button type="button" data-comfort-scene="'+id+'" aria-pressed="false">'+s.label+'</button>').join('')+'</div><label for="comfortBrightness">照明亮度 <output id="comfortBrightnessValue"></output><input id="comfortBrightness" type="range" min="0" max="100" value="85"></label><label for="comfortKelvin">光色 <output id="comfortKelvinValue"></output><input id="comfortKelvin" type="range" min="2200" max="4000" step="100" value="4000"></label><label for="comfortDisplay">展示與中島重點光 <output id="comfortDisplayValue"></output><input id="comfortDisplay" type="range" min="0" max="100" value="55"></label><p id="comfortStatus" role="status" aria-live="polite"></p><small>公共區與書房共用；主臥保留獨立情境。酒吧、電影切至夜景，窗簾仍可自行控制。3D 光色為示意。</small>';
$('rgbShowModel').after(row);
const style=document.createElement('style');style.textContent='#comfortScenes{padding-bottom:16px;border-bottom:1px solid #4b525d}#comfortScenes .comfortButtons{display:flex;flex-wrap:wrap;gap:6px}#comfortScenes button{padding:8px 11px;background:#252a31;border:1px solid #657080;color:#eef0f5;border-radius:5px}#comfortScenes [aria-pressed=true]{background:#d2d7df;color:#171c23}#comfortScenes small{display:block;font-size:11px;line-height:1.6;color:#b7c0cc}#comfortScenes input{accent-color:#a4b7d0}';document.head.appendChild(style);
// Display-referred white balance: 4000K is neutral on this viewer; lower values become amber.
// It is not a photometric fixture simulation or a measured Kelvin output.
function lightColor(k){const stops=[[2200,'#ffad53'],[2400,'#ffbd72'],[2700,'#ffd39b'],[3000,'#ffe2bd'],[3500,'#fff0e1'],[4000,'#f5f7ff']];let a=stops[0],b=stops[stops.length-1];for(let i=1;i<stops.length;i++)if(k<=stops[i][0]){a=stops[i-1];b=stops[i];break;}return new T.Color(a[1]).lerp(new T.Color(b[1]),Math.max(0,Math.min(1,(k-a[0])/(b[0]-a[0])))).convertSRGBToLinear();}
function publicLight(l){const x=l.position.x+482.5,y=l.position.z+480;return x>745||y>=375;}
// Only architectural light diffusers are controlled; product screens and RGB strips stay independent.
const displayMaterials=new Set(),lensMaterials=new Set();
V.fittings.traverse(o=>{if(o.isMesh&&o.material===C.materials.light)displayMaterials.add(o.material);});
lensMaterials.add(F.lens);
let applying=false;
function reapply(){
 if(applying)return;applying=true;
 try{
  const c=lightColor(state.kelvin),power=state.brightness/100,display=state.display/100,night=$('night').classList.contains('active');
  for(const l of C.roomLights)if(publicLight(l)){l.color.copy(c);l.intensity=power*.95;}
  for(const l of C.finishLights)if(publicLight(l)){l.color.copy(c);l.intensity=display*1.25;}
  for(const l of F.warmLights)if(publicLight(l)){l.color.copy(c);l.intensity=display*.48;}
  for(const m of displayMaterials){m.color.copy(c);if(m.isMeshBasicMaterial)m.color.multiplyScalar(display);if(m.emissive){m.emissive.copy(c);m.emissiveIntensity=display*1.1;}m.userData.industrialLight='display';}
  for(const m of lensMaterials){m.color.copy(c);m.emissive.copy(c);m.emissiveIntensity=power*1.6;m.userData.industrialLight='ambient';}
  const windows=window.HOME_CURTAINS?.getState()||[],closed=windows.length?windows.reduce((s,w)=>s+w.closed,0)/windows.length:0;
  // Skylight remains independent of electric dimmers. At night, bound ambient fill so BAR can get dark.
  C.hemi.intensity=(night?.045+power*.17:.72)*(1-.78*closed);
  C.fill.intensity=(night?.015+power*.09:.32)*(1-.78*closed);
  C.sun.intensity=(night?.008:1.05)*(1-.94*closed);
  if(night){C.hemi.color.copy(c);C.fill.color.copy(c);}else{C.hemi.color.set('#f0f3ff');C.fill.color.set('#f4f6ff');}
  V.scene.userData.lightingScene={...state};window.HOME_REALISM?.invalidate(false);
 }finally{applying=false;}
}
function sync(){for(const b of row.querySelectorAll('[data-comfort-scene]'))b.setAttribute('aria-pressed',String(b.dataset.comfortScene===state.scene));for(const [key,id,suffix] of [['brightness','comfortBrightness','%'],['kelvin','comfortKelvin',' K'],['display','comfortDisplay','%']]){$(id).value=state[key];$(id+'Value').textContent=state[key]+suffix;}$('comfortStatus').textContent=(presets[state.scene]?.label||'自訂')+' · 亮度與光色可分別調整；RGB 另行控制。';}
function setScene(id){const p=presets[id];if(!p)return false;Object.assign(state,{scene:id,kelvin:p.kelvin,brightness:p.brightness,display:p.display});$(p.environment).click();for(const room of ['living','study'])window.HOME_RGB?.update(room,p.rgb);reapply();sync();window.HOME_REALISM?.refreshReflections();return true;}
function update(patch){for(const [key,lo,hi] of [['brightness',0,100],['kelvin',2200,4000],['display',0,100]])if(patch[key]!==undefined&&Number.isFinite(Number(patch[key])))state[key]=Math.max(lo,Math.min(hi,Number(patch[key])));state.scene='custom';reapply();sync();}
row.querySelectorAll('[data-comfort-scene]').forEach(b=>b.onclick=()=>setScene(b.dataset.comfortScene));
for(const [id,key] of [['comfortBrightness','brightness'],['comfortKelvin','kelvin'],['comfortDisplay','display']])$(id).addEventListener('input',e=>update({[key]:e.target.value}));
window.HOME_COMFORT={setScene,update,reapply,getState:()=>({...state}),presets};
for(const id of ['day','night'])$(id).addEventListener('click',reapply);
const requested=new URLSearchParams(location.search).get('lighting');setScene(presets[requested]?requested:'daily');window.HOME_REALISM.ready?.then(reapply);
})();
