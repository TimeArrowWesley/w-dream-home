'use strict';
(()=>{
 const q=window.HOME_VANITY;if(!q)return;
 function apply(){q.apply();window.HOME_BEDROOM?.reapplyScene();}
 for(const [owner,key] of [[window.HOME_BLACK_INDUSTRIAL,'apply'],[window.HOME_GREY_STONE,'apply'],[window.HOME_INDUSTRIAL,'apply'],[window.HOME_R05,'applyFinishes']])if(owner?.[key]){const base=owner[key];owner[key]=function(...args){base.apply(this,args);apply();};}
 window.addEventListener('DOMContentLoaded',apply,{once:true});window.HOME_REALISM?.ready?.then(apply);apply();
})();
