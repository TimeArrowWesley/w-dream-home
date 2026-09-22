'use strict';
window.addEventListener('DOMContentLoaded',()=>{
 const R=window.HOME_R05,V=window.HOME_VIEWER;if(!R||!V)return;
 const primary=document.querySelector('.uiPrimary');
 const stools=document.createElement('button');stools.textContent='中島圓凳：拉出檢查';stools.onclick=()=>{const out=R.setDiningPulled(!R.pulled);stools.textContent=out?'中島圓凳：收回':'中島圓凳：拉出檢查';};primary?.append(stools);
 const slide=document.createElement('button');let open=true;slide.textContent='書房滑門：開啟';slide.onclick=()=>{open=!open;window.HOME_INTERACTION.setDoor('study-slide-r05',open);slide.textContent='書房滑門：'+(open?'開啟':'關閉');};primary?.append(slide);
 window.HOME_INTERACTION.setDoor('study-slide-r05',true);
 const room=document.querySelector('#rooms [data-id="island"]');if(room)room.textContent='中島・外弧兩席';
 const desc=document.getElementById('layoutDescription');if(desc)desc.textContent='V1 R05｜高玻璃櫃保留・外弧兩席・書房通道修正';
 const foot=document.querySelector('.uiSideFoot');if(foot)foot.textContent=window.HOME_AUDIT_REPAIRS?'V1 R05＋MR01＋QA03 · 2026.09.22 · 施工尺寸待確認':window.HOME_MODEL_REPAIRS?'V1 R05＋MR01 · 2026.09.21 · 設計試案，尺寸待複量':'V1 R05 · 2026.09.17 · 設計示意，施工尺寸待複量';
 R.applyFinishes();
});
