'use strict';
(()=>{
const R=window.HOME_R05,V=window.HOME_VIEWER,T=window.THREE;if(!R||!V)return;
const matte=(hex,rough=.85,metal=0)=>new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness:rough,metalness:metal});
const quiet=matte('#41494b'),warm=matte('#56534f'),metal=matte('#849096',.43,.65);
const notes={living:'R05：保留整合背架沙發與固定電視，背牆改低反射深石墨。中島原有到頂雙面玻璃櫃保留，外弧兩席用餐。後方落地環繞撤除，改為背架小型完整音箱。書房新增外側滑門提案；音箱與滑門五金待核定。',island:'R05：依業主示意，兩張圓凳沿外側圓弧排列；保留到頂玻璃櫃、取消內側餐翼。座面Ø40、座高65、檯高95、檯下內縮25cm均為模型提案，需核定座椅商品、檯面補強與設備維修空間。',collection:'R05：展示面同深50cm、背面 y803 平整；10格大型展示。房內試排4組70×40×73cm大外箱包絡，套疊群組及實際紙箱數量尚未核定；門框無多餘餘量。',study:'R05：兩張180×80cm獨立桌與地面主機保留。九抽改六抽＋低位常用櫃，高位改封閉歸檔；加入桌下理線槽。兩人語音習慣、椅背後仰與升降理線需實品確認。',entry:'R05：保留90cm玄關矮櫃，封閉小鞋格；收藏展示牆上、下部為封閉備品。現場開門與穿鞋姿態仍需複量。',closet:'R05：保留既有滑鏡、抽屜與吊掛，補上高位換季布盒；軟體互鎖不代表實體五金已解決。',kitchen:'R05：已下單廚具配置沿用，維持水槽／洗碗機／爐具與冰箱位置。須以簽認訂單圖核對戶別、尺寸和中島接口。',bath1:'R05：設備與濕區維持 V1，新增鏡側補光；鏡面反射、燈具防護與配線由現場專業人員核定。',bath2:'R05：沿用設備區位，鏡側補光與霧面深灰材質形成層次。燈具防護、濕區施工及管線待核定。',back:'R05：保留洗衣與外機維修區，補家務水槽工作光；不把通道當作紙箱備藏。'};
V.rooms.forEach(r=>{if(notes[r.id])r.note=notes[r.id];if(r.id==='island'){r.p=[735,700,160];r.t=[545,560,95];}if(r.id==='collection'){r.p=[425,850,152];r.t=[289,909,117];}});
const islandRoom=V.rooms.find(r=>r.id==='island');islandRoom.n='中島・外弧兩席';islandRoom.reviewFov=76;
const collectionRoom=V.rooms.find(r=>r.id==='collection');collectionRoom.reviewFov=90;
function apply(){
 V.fittings.traverse(o=>{if(!o.isMesh)return;
  if(o.userData.reviewFinish)o.material=R.finishes[o.userData.reviewFinish];
  const n=o.userData.name||o.name||'';
  if(n==='黑玻電視背牆'){o.material=quiet;o.userData.name='R05 低反射電視背牆';o.userData.desc='原背牆尺度保留，改霧面深石墨飾面；降低電視與窗光雙重反射。';}
  if(n==='R05 低反射電視背牆')o.material=quiet;
  if(n.includes('床頭軟包'))o.material=warm;
  if(n.includes('霧黑龍頭'))o.material=metal;
 });
 // Calmer default scene: RGB remains available as a user-controlled mode.
 V.scene.updateMatrixWorld(true);window.HOME_REALISM?.invalidate?.();
}
apply();window.HOME_REALISM?.ready?.then(apply);R.applyFinishes=apply;
})();
