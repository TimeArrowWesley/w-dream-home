'use strict';
// BW04: Cycles transport for all twelve spaces; room-specific reflections.
(()=>{
 const version=window.HOME_LAYOUT?.displayVersion;
 if(!['v0','v2','v3','v4','v5'].includes(version)||!window.HOME_BLENDER_HOME)return;
 const T=THREE,V=HOME_VIEWER,B=HOME_BLENDER_V1,R=HOME_REALISM;
 const base=new URL('assets/blender-home/bw04/'+version+'/',document.currentScript.src);
 const state={revision:'BW04',state:'loading',ready:false},materials=[],probes={},targets=[];
 const U={bwDay:{value:null},bwGeneral:{value:null},bwDisplay:{value:null},bwRGB:{value:null},bwPower:{value:new T.Vector3(1,1,1)},bwTint:{value:new T.Color(1,.91,.76)},bwRGBPower:{value:0}};
 function texture(name){return new Promise((ok,bad)=>new T.TextureLoader().load(new URL(name+'.webp?layout=cw01',base).href,t=>{t.encoding=T.LinearEncoding;t.generateMipmaps=false;t.minFilter=t.magFilter=T.LinearFilter;ok(t);},undefined,bad));}
 function cube(room){return new Promise((ok,bad)=>new T.CubeTextureLoader().load(['px','nx','py','ny','pz','nz'].map(f=>new URL(room+'-'+f+'.webp'+(room==='closet'?'?layout=cw01':''),base).href),t=>{t.encoding=T.RGBM16Encoding;t.format=T.RGBAFormat;t._needsFlipEnvMap=false;t.isRenderTargetTexture=true;const gen=new T.PMREMGenerator(V.renderer),p=gen.fromCubemap(t);gen.dispose();t.dispose();targets.push(p);ok(p.texture);},undefined,bad));}
 function update(){
  if(!state.ready)return;
  const s=HOME_COMFORT.getState(),night=document.getElementById('night').classList.contains('active'),curtains=HOME_CURTAINS.getState(),rgb=HOME_RGB.getState().study;
  const closed=curtains.length?curtains.reduce((v,w)=>v+w.closed,0)/curtains.length:0;
  U.bwPower.value.set((night?.04:1)*(1-.88*closed),s.brightness/85,s.display/55);
  const warm=(4000-s.kelvin)/1800;U.bwTint.value.setRGB(1,.91-warm*.19,.76-warm*.36);
  U.bwRGBPower.value=version!=='v0'&&rgb.on&&rgb.mode==='cyberpunk'?rgb.brightness/65:0;
  // Match the dark display response in the Cycles reference. This is a WebGL
  // reflection approximation, not a measured coating specification.
  for(const m of materials)m.envMapIntensity=(m.userData.sourceMaterialId===-3500?.035:m.transmission>0?.72:.58)*(night?Math.max(.025,(s.brightness+s.display)/140):1);
  const foot=document.querySelector('.uiSideFoot');if(foot){foot.textContent=version.toUpperCase()+' · BW04 全屋細化／CW01窗門校正 · 工程待核';foot.title='全屋 Blender 材質、家具細化與分區光影；烘焙間接光不隨門片完整重算。';}
  R.invalidate(false);
 }
 async function start(){
  await B.ready;if(B.getState().state!=='ready')throw Error('BW04 geometry not ready');
  const rooms=['public','bed','closet','study','kitchen','bath1','bath2','collection','storage','back'];
  const maps=await Promise.all(['daylight','general','display','rgb'].map(texture));[U.bwDay.value,U.bwGeneral.value,U.bwDisplay.value,U.bwRGB.value]=maps;
  await Promise.all(rooms.map(async r=>{probes[r]=await cube(r);}));
  const cache=new Map();
  function convert(old,room){
   const probeRoom=probes[room]?room:'public',key=old.uuid+'-'+probeRoom;if(cache.has(key))return cache.get(key);
   const m=old.clone();m.userData.bw03RoomProbe=true;m.envMap=probes[probeRoom];m.envMapIntensity=.58;
   if(m.transmission>0){
    m.opacity=.22;m.transmission=.9;
    m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;','vec3 outgoingLight = reflectedLight.directSpecular + reflectedLight.indirectSpecular;').replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );','float bwGlassAlpha=clamp(.035+linearToRelativeLuminance(outgoingLight)*.4,.035,.38);gl_FragColor=vec4(outgoingLight/max(bwGlassAlpha,.035),bwGlassAlpha);');};
    m.customProgramCacheKey=()=> 'bw03-glass';
   }else{
    m.lightMap=maps[0];m.lightMapIntensity=0;m.aoMap=null;const previous=old.onBeforeCompile;
    m.onBeforeCompile=shader=>{
     previous.call(old,shader);Object.assign(shader.uniforms,U);
     shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      uniform sampler2D bwDay,bwGeneral,bwDisplay,bwRGB;uniform vec3 bwPower,bwTint;uniform float bwRGBPower;
      vec3 bwHDR(sampler2D t,vec2 uv){vec4 p=texture2D(t,uv);return p.rgb*p.a*16.;}`);
     shader.fragmentShader=shader.fragmentShader.replace('vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;',`vec3 bwIrradiance=bwHDR(bwDay,vUv2)*bwPower.x+(bwHDR(bwGeneral,vUv2)*bwPower.y+bwHDR(bwDisplay,vUv2)*bwPower.z)*bwTint+bwHDR(bwRGB,vUv2)*bwRGBPower;
      vec3 outgoingLight = bwIrradiance*diffuseColor.rgb*(1.-metalnessFactor)+reflectedLight.directDiffuse*.1+reflectedLight.directSpecular+reflectedLight.indirectSpecular+totalEmissiveRadiance;`);
    };
    m.customProgramCacheKey=()=> 'bw04-light-'+(old.userData.sourceMaterialId===85?'stone-joints-fine':old.userData.bw03FineStone?'fine-stone':'surface');
   }
   m.needsUpdate=true;materials.push(m);cache.set(key,m);return m;
  }
  for(const r of B.records){r.material=Array.isArray(r.material)?r.material.map(m=>convert(m,r.room)):convert(r.material,r.room);r.o.material=r.material;}
  state.state='ready';state.ready=true;state.materials=materials.length;state.reflectionRooms=rooms;
  const reset=B.reapply;B.reapply=function(...args){const result=reset.apply(this,args);update();return result;};
  for(const key of ['reapply','update','setScene']){const old=HOME_COMFORT[key];HOME_COMFORT[key]=function(...args){const result=old.apply(this,args);update();return result;};}
  for(const id of ['day','night','comfortBrightness','comfortKelvin','comfortDisplay'])document.getElementById(id).addEventListener(['day','night'].includes(id)?'click':'input',update);
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-comfort-scene]'))update();});window.addEventListener('rgblightingchange',update);window.addEventListener('roomchange',update);document.getElementById('glass').addEventListener('change',update);
  B.reapply();update();
 }
 const api=window.HOME_FULLHOUSE_LIGHT={getState:()=>({...state,power:U.bwPower.value.toArray(),rgb:U.bwRGBPower.value,tint:U.bwTint.value.toArray()}),update,ready:null};
 api.ready=start().catch(error=>{state.state='fallback';state.error=String(error);console.error('全屋光影未載入完成',error);const n=document.createElement('div');n.setAttribute('role','status');n.textContent='全屋光影載入未完成，請重新整理；目前畫面尚非完整版。';n.style.cssText='position:fixed;bottom:12px;left:280px;right:16px;padding:12px;background:#4c3625;z-index:10000';document.body.append(n);});
})();
