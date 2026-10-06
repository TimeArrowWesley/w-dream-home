'use strict';
// BW02: Cycles diffuse transport and static room reflection probes for V1.
(()=>{
 if(window.HOME_LAYOUT?.displayVersion!=='v1'||!window.HOME_BLENDER_V1)return;
 const T=THREE,V=HOME_VIEWER,R=HOME_REALISM,B=HOME_BLENDER_V1;
 const base=new URL('assets/blender-v1/bw02/',document.currentScript.src),state={revision:'BW02',ready:false,state:'loading'};
 const U={bwDay:{value:null},bwGeneral:{value:null},bwDisplay:{value:null},bwPower:{value:new T.Vector3(1,1,1)},bwTint:{value:new T.Color(1,.92,.8)}};
 const materials=[];let probes,targets=[],enabled=true;
 // Baked transport and probes are static; direct RGB/fixture lights remain live.
 // Keep exact BW01 geometry/UVs, privacy state, and existing object references.
 function lightTex(name){return new Promise((ok,bad)=>new T.TextureLoader().load(new URL(name+'.webp',base).href,t=>{t.encoding=T.LinearEncoding;t.generateMipmaps=false;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;ok(t)},undefined,bad));}
 function cube(mode){return new Promise((ok,bad)=>new T.CubeTextureLoader().load(['px','nx','py','ny','pz','nz'].map(f=>new URL(mode+'-'+f+'.webp',base).href),t=>{t.encoding=T.RGBM16Encoding;t.format=T.RGBAFormat;t._needsFlipEnvMap=false;t.isRenderTargetTexture=true;const gen=new T.PMREMGenerator(V.renderer),p=gen.fromCubemap(t);gen.dispose();t.dispose();targets.push(p);ok(p.texture);},undefined,bad));}
 function update(){
  if(!state.ready)return;const s=HOME_COMFORT.getState(),night=document.getElementById('night').classList.contains('active'),curtains=HOME_CURTAINS.getState();
  const closed=curtains.length?curtains.reduce((v,w)=>v+w.closed,0)/curtains.length:0;
  U.bwPower.value.set((night?.045:1)*(1-.88*closed),s.brightness/85,s.display/55);
  const warm=(4000-s.kelvin)/1800;U.bwTint.value.setRGB(1,.91-warm*.19,.76-warm*.36);
  for(const m of materials){m.envMap=enabled?probes[night?'night':'day']:null;m.envMapIntensity=enabled?(m.transmission>0?.7:.72)*(night?Math.max(.025,(s.brightness+s.display)/140):1):.3;}
  const foot=document.querySelector('.uiSideFoot');if(enabled&&foot){foot.textContent='V1 · BW02 光影／反射 · 工程待核';foot.title='間接光及反射預先計算；門片移動不會重新計算完整光線。';}
 R.invalidate(false);
 }
 function apply(on=true){enabled=on;for(const r of B.records)r.material=on?r.bw02Material:r.bw01Material;B.reapply();update();R.invalidate();}
 async function start(){
  await B.ready;if(B.getState().state!=='ready')throw Error('BW01 not ready');
  const [day,general,display,pday,pnight]=await Promise.all([lightTex('daylight'),lightTex('general'),lightTex('display'),cube('day'),cube('night')]);
  U.bwDay.value=day;U.bwGeneral.value=general;U.bwDisplay.value=display;probes={day:pday,night:pnight};
  const cache=new Map();
  const convert=old=>{
   if(cache.has(old))return cache.get(old);
   const m=old.clone();m.name=old.name.replace('BW01','BW02');m.envMap=pday;m.envMapIntensity=.72;
   if(m.transmission>0){
    m.opacity=.22;m.transmission=.9;m.envMapIntensity=.9;
    m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;','vec3 outgoingLight = reflectedLight.directSpecular + reflectedLight.indirectSpecular;').replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );','float bwGlassAlpha=clamp(.04+linearToRelativeLuminance(outgoingLight)*.45,.04,.42);gl_FragColor=vec4(outgoingLight/max(bwGlassAlpha,.04),bwGlassAlpha);');};m.customProgramCacheKey=()=> 'bw02-clear-glass';
   }
   else{
    m.aoMap=null;m.lightMap=day;m.lightMapIntensity=0;
    const previous=old.onBeforeCompile;
    m.onBeforeCompile=shader=>{previous.call(old,shader);Object.assign(shader.uniforms,U);
     shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      uniform sampler2D bwDay,bwGeneral,bwDisplay;uniform vec3 bwPower,bwTint;
      vec3 bwHDR(sampler2D tex,vec2 uv){vec4 p=texture2D(tex,uv);return p.rgb*p.a*16.;}`);
     shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;',`vec3 bwIrradiance=bwHDR(bwDay,vUv2)*bwPower.x+(bwHDR(bwGeneral,vUv2)*bwPower.y+bwHDR(bwDisplay,vUv2)*bwPower.z)*bwTint;
      vec3 outgoingLight = bwIrradiance*diffuseColor.rgb*(1.-metalnessFactor)+reflectedLight.directDiffuse*.12+reflectedLight.directSpecular+reflectedLight.indirectSpecular+totalEmissiveRadiance;`);
    };
    m.customProgramCacheKey=()=> 'bw02-lighting-'+(old.userData.sourceMaterialId===85?'stone':'regular');
   }
   m.needsUpdate=true;cache.set(old,m);materials.push(m);return m;
  };
  for(const r of B.records){r.bw01Material=r.material;r.bw02Material=Array.isArray(r.material)?r.material.map(convert):convert(r.material);r.material=r.bw02Material;r.o.material=r.material;}
  state.ready=true;state.state='ready';state.materials=materials.length;update();
  for(const key of ['reapply','update','setScene']){const prev=HOME_COMFORT[key];HOME_COMFORT[key]=function(...a){const result=prev.apply(this,a);update();return result;};}
  for(const id of ['day','night','comfortBrightness','comfortKelvin','comfortDisplay'])document.getElementById(id).addEventListener(['day','night'].includes(id)?'click':'input',update);
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-comfort-scene]'))update();});
  document.getElementById('glass').addEventListener('change',update);window.addEventListener('roomchange',update);
  const reset=B.reapply;B.reapply=function(...args){const result=reset.apply(this,args);update();return result;};
 }
 window.HOME_BW02={getState:()=>({...state,power:U.bwPower.value.toArray(),tint:U.bwTint.value.toArray(),staticReflection:true}),apply,update,ready:null};HOME_BW02.ready=start().catch(e=>{state.state='fallback';state.error=String(e);console.error('V1 光影載入未完成，保留 BW01：',e);const note=document.createElement('div');note.setAttribute('role','status');note.textContent='新版光影未載入完成，暫時顯示前版材質；請重新整理。';note.style.cssText='position:fixed;bottom:15px;left:280px;right:15px;padding:12px;background:#4c3625;z-index:10000';document.body.appendChild(note);});
})();
