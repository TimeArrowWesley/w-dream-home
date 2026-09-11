'use strict';
(()=>{
 const rootURL=new URL('.',document.currentScript.src);
 function init(){
  const E=window.HOME_EQUIPMENT,V=window.HOME_VIEWER,bar=document.getElementById('layoutSwitch');if(!E||!V||!bar)return;
  const version=window.HOME_LAYOUT.proposal||window.HOME_LAYOUT.version;
  const changes=document.createElement('a');changes.id='versionChanges';changes.className='equipmentAction';changes.href=new URL('版本調整.html?version='+version,rootURL).href;changes.target='_blank';changes.rel='noopener';changes.textContent=version.toUpperCase()+' 調整內容 ↗';bar.appendChild(changes);
  const controls=document.createElement('div');controls.id='equipmentControls';controls.innerHTML='<strong>設備與收納</strong><label>查看設備 <select id="equipmentSelect"><option value="">選擇設備，查看實際尺寸</option></select></label><button id="inspectEquipment" aria-pressed="false">檢視櫃內／維修預留</button><button id="coffeeLift" aria-pressed="false">茶几升到用餐高度 65 cm</button><small>設備外徑按核對規格；黄色線框為設計預留。未定機型與安裝條件請看本版調整內容。</small>';
  const host=document.querySelector('aside')||bar;host.appendChild(controls);
  const doorButtons=[];
  for(const host of [bar,document.getElementById('walkBottomBar')].filter(Boolean)){
   const b=document.createElement('button');b.type='button';b.className='equipmentAction';b.textContent='開啟廚房玻璃門';b.setAttribute('aria-pressed','false');b.onclick=()=>{window.HOME_INTERACTION?.toggleDoor('kitchen');syncKitchenDoor();};host.appendChild(b);doorButtons.push(b);
  }
  doorButtons[0].id='kitchenDoorToggle';
  function syncKitchenDoor(){const e=window.HOME_INTERACTION?.getState().entries.find(e=>e.key==='kitchen');if(!e)return;for(const b of doorButtons){b.textContent=e.target>.5?'關閉廚房玻璃門':'開啟廚房玻璃門';b.setAttribute('aria-pressed',String(e.target>.5));b.title=Math.abs(e.angle-e.target)>.001?'電動門移動中，可再次按下反向':'中島與廚房之間的單片玻璃滑門';}}
  window.addEventListener('doorstatechange',syncKitchenDoor);syncKitchenDoor();
  const mirrorButton=document.createElement('button');mirrorButton.id='closetMirrorToggle';mirrorButton.type='button';mirrorButton.textContent='移開更衣鏡';mirrorButton.setAttribute('aria-pressed','false');controls.insertBefore(mirrorButton,document.getElementById('inspectEquipment'));
  mirrorButton.onclick=()=>{window.HOME_INTERACTION?.toggleDoor('closet-mirror');syncMirror();};
  function syncMirror(){const e=window.HOME_INTERACTION?.getState().entries.find(e=>e.key==='closet-mirror');if(!e)return;mirrorButton.textContent=e.target>.5?'更衣鏡移回左側':'移開更衣鏡';mirrorButton.setAttribute('aria-pressed',String(e.target>.5));}
  window.addEventListener('doorstatechange',syncMirror);syncMirror();
  const select=document.getElementById('equipmentSelect');E.items.forEach((g,i)=>{const option=document.createElement('option');option.value=i;option.textContent=g.name;select.appendChild(option);});
  const spec=document.createElement('p');spec.id='selectedEquipmentSpec';spec.hidden=true;controls.insertBefore(spec,document.getElementById('inspectEquipment'));
  function showSwitch(){
   if(!E.switchStation)return;window.HOME_TOUR?.setMode('model');V.selectRoom('living');V.focusObject(E.switchStation);
   select.value=String(E.items.findIndex(g=>g.userData.equipment.key==='switch2'));spec.hidden=false;spec.textContent='Switch 2 主機與二代底座都在 PS5 上方的層板前緣。現在是設備特寫，可拖曳查看；點左側房間可回到空間導覽。';
  }
  const switchButton=document.createElement('button');switchButton.id='showSwitch2';switchButton.type='button';switchButton.className='equipmentAction';switchButton.textContent='查看 Switch 2';switchButton.title='直接查看 PS5 上方的 Switch 2 主機與二代底座';switchButton.onclick=showSwitch;bar.appendChild(switchButton);
  select.onchange=()=>{if(select.value==='')return;const g=E.items[Number(select.value)],key=g.userData.equipment.key;if(key==='switch2'||key==='switch2dock'){showSwitch();return;}window.HOME_TOUR?.setMode('model');const room={wine:'island',ih:'island',clar:'island',robot:'island',fridge:'kitchen',dishwasher:'kitchen',oven:'kitchen',dishdryer:'kitchen',pc:'study',washer:'back',nx:'bath1',ls:'bath2',projector:'bed'}[key]||'living';V.selectRoom(room);V.focusObject?.(g);spec.hidden=false;spec.textContent=g.userData.desc;};
  let inspecting=false,lifted=false;
  const inspectionNote=document.createElement('small');inspectionNote.id='inspectionNote';inspectionNote.hidden=true;inspectionNote.textContent='目前是櫃內檢視：櫃板透明，所以兩面都能看見同一批設備。按「恢復櫃體外觀」可回到正常外觀。';inspectionNote.setAttribute('role','status');controls.insertBefore(inspectionNote,document.getElementById('coffeeLift'));
  document.getElementById('inspectEquipment').onclick=()=>{inspecting=!inspecting;E.setInspection(inspecting);const b=document.getElementById('inspectEquipment');b.setAttribute('aria-pressed',String(inspecting));b.textContent=inspecting?'恢復櫃體外觀':'檢視櫃內／維修預留';inspectionNote.hidden=!inspecting;};
  document.getElementById('coffeeLift').onclick=()=>{lifted=!lifted;const g=window.HOME_COFFEE_LIFT;if(g)g.position.y=lifted?20:0;window.HOME_REALISM?.invalidate();const b=document.getElementById('coffeeLift');b.setAttribute('aria-pressed',String(lifted));b.textContent=lifted?'茶几降回日常高度 45 cm':'茶几升到用餐高度 65 cm';};
  const style=document.createElement('style');style.textContent='.equipmentAction{display:inline-flex;align-items:center;color:#e7ede9;text-decoration:none;border:1px solid #729285;border-radius:5px;padding:8px 11px;font-size:12px;background:#284239;white-space:nowrap}#equipmentControls{display:grid;gap:9px;padding:16px 10px;border-top:1px solid #52625b;margin-top:16px;font-size:12px}#equipmentControls label{display:grid;gap:5px}#equipmentControls select,#equipmentControls button{width:100%;min-width:0;border:1px solid #61716b;background:#24302c;color:#edf3ee;padding:9px 6px;border-radius:5px;font-size:11px}#equipmentControls small{color:#bac9c3;line-height:1.65}#equipmentControls [aria-pressed="true"]{background:#416256}';document.head.appendChild(style);
  // Existing rendered stills are historical. Never label them as this equipment revision.
  const link=document.getElementById('latestTourLink');if(link){link.textContent='更新前 A／B 參考圖';link.title='設備已更新，請以目前3D為準';}
  document.querySelectorAll('a[href*="正反視角總覽"]').forEach(a=>{a.textContent='更新前 A／B 參考圖';a.title='本次設備更新前的靜態圖；現況請看3D模型';});
 }
 // layout-version.js builds its bar on window's DOMContentLoaded, after document listeners.
 if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',init);else init();
})();
