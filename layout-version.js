'use strict';
(()=>{
const query=new URLSearchParams(location.search),version=query.get('layout')==='v2'?'v2':'v1';
window.HOME_LAYOUT={comfort:true,version,isV2:version==='v2',entryCabinetHeight:version==='v2'?90:null,entryDoorY:955,proposal:version};
window.addEventListener('DOMContentLoaded',()=>{
 const entryIndex=HOME_VIEWER.rooms.findIndex(r=>r.id==='entry');if(entryIndex>1)HOME_VIEWER.rooms.splice(1,0,HOME_VIEWER.rooms.splice(entryIndex,1)[0]);const roomNav=document.getElementById('rooms'),entryButton=roomNav.querySelector('[data-id="entry"]');if(entryButton)roomNav.insertBefore(entryButton,roomNav.children[1]);
 const bar=document.createElement('div');bar.id='layoutSwitch';bar.setAttribute('aria-label','設計版本');
 bar.innerHTML='<span>配置</span><button data-layout="v1">V1 圓弧中島酒吧+玄關高矮櫃</button><button data-layout="v2">V2 圓弧中島酒吧+玄關矮櫃</button><button id="layoutV3" data-proposal="v3" aria-pressed="false">V3 旋轉電視+玄關高矮櫃</button><button id="layoutV4" data-proposal="v4" aria-pressed="false">V4 旋轉電視+玄關矮櫃</button><span id="layoutDescription"></span>';
 document.querySelector('header').after(bar);
 const style=document.createElement('style');style.textContent='#layoutSwitch{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 16px;background:#18232b;border-bottom:1px solid #425561;font-size:12px}#layoutSwitch button{font-size:12px;padding:6px 10px}#layoutSwitch button.active{background:#bde2dc;color:#14232a}#layoutDescription{color:#b7c7cf}.shell{height:calc(100vh - 124px)}@media(max-width:760px){#layoutDescription{width:100%;font-size:11px}}';document.head.appendChild(style);
 document.querySelectorAll('[data-layout]').forEach(b=>{b.classList.toggle('active',b.dataset.layout===version);b.setAttribute('aria-pressed',String(b.dataset.layout===version));b.onclick=()=>{if(b.dataset.layout===version)return;const url=new URL(location.href);url.searchParams.set('layout',b.dataset.layout);url.searchParams.delete('comfort');url.searchParams.delete('room');location.assign(url.href);};});
 document.querySelectorAll('[data-proposal]').forEach(b=>{b.onclick=()=>{const url=new URL('提案/旋轉電視與直線中島/index.html',document.baseURI);url.searchParams.set('layout',b.dataset.proposal==='v4'?'v2':'v1');location.assign(url.href);};});
 document.title='W夢想之家｜'+(version==='v2'?'V2 圓弧中島酒吧+玄關矮櫃':'V1 圓弧中島酒吧+玄關高矮櫃');
 document.getElementById('layoutDescription').textContent=version==='v2'?'原版中島＋玻璃櫃；玄關全矮櫃90cm':'原版中島＋玻璃櫃；玄關高矮櫃';
 const gallery=document.createElement('a');gallery.href='最新版導覽/正反視角總覽.html';gallery.target='_blank';gallery.textContent='更新前 A／B 參考圖';gallery.style.color='#bde2dc';bar.appendChild(gallery);
 document.getElementById('photoBadge').textContent='更新前模型圖 · 目前設備請看3D';document.querySelectorAll('[data-viewmode="photo"]').forEach(b=>b.title='更新前靜態參考，設備現況以3D為準');
 const walkStyle=document.createElement('style');walkStyle.textContent='body.walkImmersive .shell,body.walkImmersive .workspace,body.walkImmersive #scenePanel{height:calc(100dvh - var(--layout-bar-height,44px))!important}';document.head.appendChild(walkStyle);
 const fit=()=>{document.documentElement.style.setProperty('--layout-bar-height',bar.offsetHeight+'px');document.querySelector('.shell').style.height=Math.max(250,innerHeight-document.querySelector('header').offsetHeight-bar.offsetHeight)+'px';};new ResizeObserver(fit).observe(bar);window.addEventListener('resize',fit);fit();
 HOME_TOUR.setMode('model');HOME_VIEWER.selectRoom('all');document.querySelector('.workspace').classList.remove('planhidden');document.getElementById('planToggle').textContent='收起平面圖';
});
})();

