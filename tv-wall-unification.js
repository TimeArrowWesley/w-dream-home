'use strict';
// TW01: owner adopts V4's cabinet-free TV feature wall in V1.
(()=>{
 const V=window.HOME_VIEWER,T=window.THREE;
 if(!V||window.HOME_LAYOUT?.proposal!=='v1'||window.HOME_TV_WALL)return;
 const upper=V.fittings.children.find(o=>o.name==='電視上櫃');
 const stone=V.fittings.children.find(o=>['黑玻電視背牆','R05 低反射電視背牆','GR06 灰石電視背牆'].includes(o.userData.name));
 if(!upper||!stone)throw Error('TW01: expected V1 TV upper cabinet and backing');
 const removedOuter={...upper.userData.cabinet};
 upper.traverse(o=>V.unregisterObject?.(o));upper.parent.remove(upper);
 // Match the V4 surface: x760..1075, y951..953, floor z0..245.
 stone.geometry.dispose();stone.geometry=new T.BoxGeometry(315,245,2);
 stone.position.copy(V.pos(917.5,952,122.5));stone.scale.set(1,1,1);
 delete stone.userData.gr06UV;
 stone.userData.source='D040 業主採用V4無上櫃版型；既有模型值，非施工核定';
 stone.userData.tvWallRevision='20260924-tw01';
 const part=V.wallParts.find(p=>p.m===stone);
 if(part)Object.assign(part,{z:0,h:245});else V.wallParts.push({m:stone,z:0,h:245});
 // Follow the current cutaway state before the shared finish pipeline, as V4 does.
 if(document.getElementById('cut').checked){stone.scale.y=85/245;stone.position.y=42.5;}
 const room=V.rooms.find(r=>r.id==='living');
 room.note+=' TW01：移除電視上櫃，灰石主牆比照V4延伸至樑下；側邊電箱檢修與下方影音櫃保持。';
 window.HOME_TV_WALL={revision:'20260924-tw01',referenceVersion:'v4',removedOuter,backing:stone,feature:{x:760,y:951,z:0,w:315,d:2,h:245},limits:'315×35×75cm為移除上櫃外廓，不代表有效收納；石材厚度、固定、樑下高度及電箱檢修待現場深化'};
 V.scene.updateMatrixWorld(true);
})();
