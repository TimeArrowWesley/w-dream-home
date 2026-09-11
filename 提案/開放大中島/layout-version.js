'use strict';
(()=>{
const version='v3',proposal=version,proposalName='V3 旋轉電視+大中島';
window.HOME_LAYOUT={comfort:true,openIsland:true,version,proposal,isV2:true,entryCabinetHeight:90,entryDoorY:955};
window.addEventListener('DOMContentLoaded',()=>{
 const entryIndex=HOME_VIEWER.rooms.findIndex(r=>r.id==='entry');if(entryIndex>1)HOME_VIEWER.rooms.splice(1,0,HOME_VIEWER.rooms.splice(entryIndex,1)[0]);const roomNav=document.getElementById('rooms'),entryButton=roomNav.querySelector('[data-id="entry"]');if(entryButton)roomNav.insertBefore(entryButton,roomNav.children[1]);
 const bar=document.createElement('div');bar.id='layoutSwitch';bar.setAttribute('aria-label','設計版本');
 bar.innerHTML='<span>配置</span><button data-layout="v1">V1 圓弧中島酒吧+玄關矮櫃</button><button data-proposal="v2">V2 旋轉電視+小中島</button><button data-proposal="v3">V3 旋轉電視+大中島</button><button data-proposal="v4">V4 大中島</button><span id="layoutDescription"></span>';
 document.querySelector('header').after(bar);
 const style=document.createElement('style');style.textContent='#layoutSwitch{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 16px;background:#18232b;border-bottom:1px solid #425561;font-size:12px}#layoutSwitch button{font-size:12px;padding:6px 10px}#layoutSwitch button.active{background:#bde2dc;color:#14232a}#layoutDescription{color:#b7c7cf}.shell{height:calc(100vh - 124px)}@media(max-width:760px){#layoutDescription{width:100%;font-size:11px}}';document.head.appendChild(style);
 document.querySelectorAll('[data-layout],[data-proposal]').forEach(b=>{const key=b.dataset.layout||b.dataset.proposal,active=key===version;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));b.onclick=()=>{if(active)return;const url=new URL((key==='v4'?'提案/南牆電視與開放中島/':key==='v3'?'提案/開放大中島/':key==='v2'?'提案/旋轉電視與直線中島/':'')+'index.html',document.baseURI);url.searchParams.set('layout',key);location.assign(url.href);};});
 document.title='W夢想之家｜'+proposalName;document.getElementById('layoutDescription').textContent=proposalName;
 const walkStyle=document.createElement('style');walkStyle.textContent='body.walkImmersive .shell,body.walkImmersive .workspace,body.walkImmersive #scenePanel{height:calc(100dvh - var(--layout-bar-height,44px))!important}';document.head.appendChild(walkStyle);
 const fit=()=>{document.documentElement.style.setProperty('--layout-bar-height',bar.offsetHeight+'px');document.querySelector('.shell').style.height=Math.max(250,innerHeight-document.querySelector('header').offsetHeight-bar.offsetHeight)+'px';};new ResizeObserver(fit).observe(bar);window.addEventListener('resize',fit);fit();
 HOME_TOUR.setMode('model');HOME_VIEWER.selectRoom('all');document.querySelector('.workspace').classList.remove('planhidden');document.getElementById('planToggle').textContent='收起平面圖';
});
})();
