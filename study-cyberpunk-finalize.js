'use strict';
(()=>{
 const cp=window.HOME_STUDY_CP;if(!cp)return;
 function sync(){const s=window.HOME_RGB?.getState().study,p=s?.on?s.brightness/100:0;for(const e of cp.accent)e.material.color.copy(e.color).multiplyScalar(p);window.HOME_REALISM?.invalidate(false,true);}
 function apply(){cp.apply();sync();window.HOME_REALISM?.registerMaterials?.();}
 const owner=window.HOME_BLACK_INDUSTRIAL;if(owner){const base=owner.apply;owner.apply=function(){base();apply();};}
 // Earlier palette wrappers capture their own apply closure; finish their public calls too.
 for(const [o,k] of [[window.HOME_GREY_STONE,'apply'],[window.HOME_INDUSTRIAL,'apply'],[window.HOME_R05,'applyFinishes']])if(o?.[k]){const base=o[k];o[k]=function(...args){base.apply(this,args);apply();};}
 window.addEventListener('rgblightingchange',sync);
 window.addEventListener('DOMContentLoaded',apply,{once:true});
 window.HOME_REALISM?.ready?.then(apply);apply();
})();
