'use strict';
(() => {
const T=THREE,V=HOME_VIEWER,C=V.finishContext,F=C.industrialFinishes;
const version=window.HOME_LAYOUT.proposal;
const names={v1:'圓弧酒吧・深木與透明收藏櫃',v2:'精密影音・黑鈦旋轉電視',v3:'開放酒廊・石墨大中島',v4:'南牆影音・黑玻與大中島'};
const stone=C.stoneMaterial.clone();stone.name='中島石墨灰細紋石材';stone.color.set(({v1:'#858b92',v2:'#747c85',v3:'#626a74',v4:'#717983'})[version]).convertSRGBToLinear();stone.userData.finishId='industrial-island-stone';
const tvMetal=F.steel.clone();tvMetal.color.set('#353c46').convertSRGBToLinear();tvMetal.name='旋轉電視黑鈦金屬外殼';tvMetal.roughness=.43;tvMetal.metalness=.78;tvMetal.userData.finishId='industrial-tv-titanium';
const touched=new Set();
function apply(){
 stone.map=C.stoneMaterial.map;stone.bumpMap=C.stoneMaterial.bumpMap;stone.needsUpdate=true;
 if(window.HOME_FLOORING){HOME_FLOORING.tileMaterial.map=C.materials.floor.map||null;HOME_FLOORING.tileMaterial.needsUpdate=true;}
 V.scene.updateMatrixWorld(true);
 V.fittings.traverse(o=>{
  if(!o.isMesh)return;const n=o.userData.name||o.name||'';
  if(o.userData.islandSurface==='countertop'||/^(260×160.2 曲線中島|81×189 直線中島)/.test(n)){
   o.material=stone;F.worldUV(o,180);o.userData.industrialRole='island-stone';touched.add(o);
  }else if(version==='v1'&&o.userData.islandExterior){
   o.material=F.darkVeneer;F.cabinetUV(o);o.userData.industrialRole='curved-smoked-wood';touched.add(o);
  }else if(o.userData.finishGroup==='tv-graphite'||/金屬周框/.test(n)){
   o.material=tvMetal;o.userData.industrialRole='tv-metal';touched.add(o);
  }else if(o.userData.finishGroup==='entry-graphite'){
   o.material=F.black;o.userData.industrialRole='entry-matte';touched.add(o);
  }else if(o.userData.finishGroup==='collection-inner'){
   o.material.color.set('#737a83').convertSRGBToLinear();o.material.name='中灰收藏櫃內襯';o.userData.industrialRole='collection-grey';touched.add(o);
  }else if(version==='v4'&&/V4 南牆(灰礦物塗料背牆|反射黑玻完成面)/.test(n)){
   o.material=C.materials.blackglass;o.userData.name='V4 南牆反射黑玻完成面';o.userData.desc='沿用原南牆完成面尺寸，改反射黑玻，與深木影音櫃整合。';o.userData.industrialRole='fixed-tv-black-glass';touched.add(o);
  }else if(/影音櫃可拆上板/.test(n)){
   o.material=F.darkVeneer;F.cabinetUV(o);o.userData.industrialRole='media-smoked-wood';touched.add(o);
  }
 });
 window.HOME_STORAGE_MODEL?.root.traverse(o=>{if(o.isMesh){o.material.color.set(o.material.roughness>.75?'#737b85':'#424b56').convertSRGBToLinear();o.material.name=o.material.roughness>.75?'中灰金屬層板':'黑鈦可調孔柱';}});
 V.scene.userData.industrialDesign={revision:'20260911-industrial',version,title:names[version],palette:'黑灰白・黑鈦・黑玻・煙燻木',geometry:'保留格局、門洞及設備尺寸',surfaces:touched.size};
 window.HOME_REALISM?.registerMaterials?.();window.HOME_REALISM?.invalidate();
}
window.HOME_INDUSTRIAL={apply,materials:{stone,tvMetal},getState:()=>({...V.scene.userData.industrialDesign})};
apply();window.HOME_REALISM.ready?.then(apply);
})();
