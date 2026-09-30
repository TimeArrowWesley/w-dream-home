'use strict';
window.addEventListener('DOMContentLoaded',()=>{
 const R=window.HOME_R05,V=window.HOME_VIEWER;if(!R||!V)return;
 const header=document.querySelector('body > header'),interaction=window.HOME_INTERACTION;
 if(!header||!interaction)return;
 const quick=document.createElement('div');quick.className='uiQuickControls';quick.setAttribute('role','group');quick.setAttribute('aria-label','中島與書房快捷控制');
 function toggle(label,id,accessibleName,onChange){
  const host=document.createElement('label');host.className='uiQuickSwitch';
  const caption=document.createElement('span');caption.className='uiQuickCaption';caption.append(document.createTextNode(label));
  const state=document.createElement('small');state.setAttribute('aria-hidden','true');caption.append(state);
  const input=document.createElement('input');input.type='checkbox';input.id=id;input.setAttribute('role','switch');input.setAttribute('aria-label',accessibleName);
  const track=document.createElement('span');track.className='uiSwitchTrack';track.setAttribute('aria-hidden','true');
  host.append(caption,input,track);quick.append(host);input.onchange=()=>{onChange(input.checked);sync();};
  return {input,state};
 }
 const stools=toggle('中島圓凳','uiDiningSwitch','中島圓凳拉出檢查',out=>R.setDiningPulled(out));
 const slide=toggle('書房滑門','uiStudyDoorSwitch','書房滑門開啟',open=>interaction.setDoor('study-slide-r05',open));
 function sync(){
  stools.input.checked=!!R.pulled;stools.state.textContent=R.pulled?'已拉出':'已收妥';
  const door=interaction.getState().entries.find(e=>e.key==='study-slide-r05');
  slide.input.disabled=!door;slide.input.checked=!!door&&Math.abs(door.target)>.1;
  slide.state.textContent=!door?'未提供':slide.input.checked?'開啟':'關閉';
 }
 header.insertBefore(quick,header.querySelector('.uiHeaderActions'));
 document.body.classList.add('uiHasQuickControls');
 window.addEventListener('doorstatechange',sync);
 interaction.setDoor('study-slide-r05',true);sync();
 const room=document.querySelector('#rooms [data-id="island"]');if(room)room.textContent='中島・外弧兩席';
 const desc=document.getElementById('layoutDescription');if(desc)desc.textContent='V1 R05｜高玻璃櫃保留・外弧兩席・書房通道修正';
 const foot=document.querySelector('.uiSideFoot');if(foot)foot.textContent=window.HOME_AUDIT_REPAIRS?'V1 R05＋MR01＋QA03 · 2026.09.22 · 施工尺寸待確認':window.HOME_MODEL_REPAIRS?'V1 R05＋MR01 · 2026.09.21 · 設計試案，尺寸待複量':'V1 R05 · 2026.09.17 · 設計示意，施工尺寸待複量';
 R.applyFinishes();
});
