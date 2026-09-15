/* Static local/online gallery: no 3D renderer is loaded on this page. */
(()=>{'use strict';
const data=window.HOME_ALBUM,base=new URL('.',document.currentScript.src),$=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);let version=data.versions.some(v=>v.id===params.get('version'))?params.get('version'):'v1',room=data.rooms.some(r=>r.id===params.get('room'))?params.get('room'):'all',mode='ai',detailMode='ai',selected=null,visible=[];
const url=p=>new URL(p,base).href,roomLabel=(id,v=version)=>v==='v0'&&id==='collection'?'貓房':v==='v0'&&id==='study'?'書房・電子琴':id==='collection'&&['v3','v4'].includes(v)?'開放收藏收納':data.rooms.find(r=>r.id===id)?.name||id;
const button=(text,action)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;return b;};
const viewLabel=e=>e.directionLabel?e.directionLabel+' · '+e.angle:'方向 '+e.angle;
function photo(e,type,full=false){const im=document.createElement('img');im.src=url(type==='ai'&&!full?e.thumb:e[type]);im.alt=e.version.toUpperCase()+' '+roomLabel(e.room,e.version)+'・'+viewLabel(e)+'・'+(type==='ai'?'AI 效果':'原始 3D');im.loading='lazy';im.decoding='async';im.width=1536;im.height=1024;im.onerror=()=>{const p=document.createElement('p');p.className='error';p.textContent='圖片未能載入，請確認圖集與圖片資料夾一起保存。';im.replaceWith(p);};return im;}
function syncURL(key){const p=new URLSearchParams({version,room});if(key)p.set('view',key);try{history.replaceState(null,'','?'+p);}catch(_){}}
function draw(){
 visible=data.entries.filter(e=>e.version===version&&(room==='all'||e.room===room));$('gallery').replaceChildren();
 $('versions').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.version===version)));
 $('room').value=room;for(const id of ['collection','study'])$('room').querySelector('option[value="'+id+'"]').textContent=roomLabel(id);
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 $('count').textContent=visible.length+' 個視角 · '+(mode==='ai'?'AI 效果':'模型取景');
 for(const r of data.rooms){const entries=visible.filter(e=>e.room===r.id);if(!entries.length)continue;
  const section=document.createElement('section');section.className='space';const head=document.createElement('div');head.className='space-head';
  const title=document.createElement('h2');title.textContent=roomLabel(r.id);const sub=document.createElement('span');sub.textContent=r.id==='entry'?'同一站位 · ← 左 / ↖ 左前 / ↑ 正前 / ↗ 右前 / → 右':'三個方向 / A · B · C';head.append(title,sub);
  const grid=document.createElement('div');grid.className='photos';
  for(const e of entries){const b=button('',()=>open(e));b.className='photo';b.append(photo(e,mode));const cap=document.createElement('div');cap.className='caption';const label=document.createElement('span');label.textContent=viewLabel(e);const small=document.createElement('small');small.textContent='放大・對照 ↗';cap.append(label,small);b.append(cap);grid.append(b);}
  section.append(head,grid);$('gallery').append(section);
 }syncURL();
}
function detail(){if(!selected)return;$('detailTitle').textContent=roomLabel(selected.room,selected.version)+'・'+viewLabel(selected);$('detailVersion').textContent=selected.version.toUpperCase()+' / '+data.versions.find(v=>v.id===selected.version).name;
 const pane=$('detailImages');pane.replaceChildren();pane.classList.toggle('compare',detailMode==='compare');
 for(const type of detailMode==='compare'?['model','ai']:[detailMode]){const f=document.createElement('figure'),cap=document.createElement('figcaption');cap.textContent=type==='ai'?'AI 成品效果':'原始 3D 取景';const im=photo(selected,type,true);im.loading='eager';f.append(im,cap);pane.append(f);}
 document.querySelectorAll('[data-detail-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.detailMode===detailMode)));
 const type=detailMode==='model'?'model':'ai';$('download').href=url(selected[type]);$('download').download='W夢想之家_'+selected.key+'_'+type+'.webp';$('detailPosition').textContent=(visible.findIndex(e=>e.key===selected.key)+1)+' / '+visible.length;syncURL(selected.key);
}
function open(e){selected=e;detailMode=mode;detail();if(!$('detail').open)$('detail').showModal();document.body.classList.add('modal-open');}
function close(){$('detail').close();document.body.classList.remove('modal-open');syncURL();}
function step(n){const i=visible.findIndex(e=>e.key===selected?.key);selected=visible[(i+n+visible.length)%visible.length];detail();}
for(const v of data.versions){const b=button('',()=>{version=v.id;draw();});b.dataset.version=v.id;const tag=document.createElement('b'),label=document.createElement('span');tag.textContent=v.id.toUpperCase();label.textContent=v.name;b.append(tag,label);$('versions').append(b);}
for(const r of [{id:'all',name:'全屋空間'},...data.rooms]){const o=document.createElement('option');o.value=r.id;o.textContent=r.name;$('room').append(o);}
 $('room').onchange=()=>{room=$('room').value;draw();};document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;draw();});document.querySelectorAll('[data-detail-mode]').forEach(b=>b.onclick=()=>{detailMode=b.dataset.detailMode;detail();});
 $('close').onclick=close;$('detail').addEventListener('cancel',e=>{e.preventDefault();close();});$('previous').onclick=()=>step(-1);$('next').onclick=()=>step(1);document.addEventListener('keydown',e=>{if(!$('detail').open)return;if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.key==='ArrowRight'){e.preventDefault();step(1);}});
 $('provenance').textContent=data.entries.length+' 個模型視角 × AI 效果對照；'+data.uniqueImages+' 張不同畫面。各版完全相同的取景共用圖檔。';draw();const initial=data.entries.find(e=>e.key===params.get('view'));if(initial&&visible.some(e=>e.key===initial.key))open(initial);
})();
