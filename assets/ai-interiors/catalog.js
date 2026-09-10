'use strict';
// Shared images are used only when the captured geometry is identical.
(() => {
  const photo = (room,key,label) => ({id:key,room,label,src:`assets/ai-interiors/${key}-20260910.webp`});
  const common = [
    photo('kitchen','kitchen','廚房'),photo('bed','bed','主臥'),
    photo('closet','closet','更衣室'),photo('study','study','雙人書房'),
    photo('collection','collection','收藏室'),photo('bath1','bath1','主浴'),
    photo('bath2','bath2','客浴'),photo('storage','storage','儲藏室'),photo('back','back','後陽台')
  ];
  window.HOME_AI_PHOTOS = Object.fromEntries(['v1','v2'].map(version => {
    const rotating=version==='v2',low=version==='v1';
    return [version,[
      photo('entry','entry-'+(low?'v2':'v3'),'玄關・'+(low?'90cm 矮櫃':'高矮櫃')),
      photo('living',rotating?'living-rotating':'living-v2',rotating?'客廳・旋轉電視':'客廳・L 型沙發'),
      photo('island',rotating?'island-rotating':'island-curved',rotating?'直線中島・電視背面':'圓弧中島・雙面玻璃櫃'),
      ...common.map(item=>({...item}))
    ]];
  }));
})();


// Only unchanged rooms are eligible as V3 material references.
window.HOME_AI_PHOTOS.v3=window.HOME_AI_PHOTOS.v2.filter(p=>!['entry','living','island','collection'].includes(p.room)).map(p=>({...p}));
