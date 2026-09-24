'use strict';
(()=>{
 const H=window.HOME_HYBRID,V=window.HOME_VIEWER,S=window.HOME_OPEN_ISLAND_SPEC;if(!H)return;
 // Undo the old rectangular-island seat envelopes; keep the AU01 living group.
 const centers=H.stools.map(g=>{const n=g.userData.seatNormal;return {x:524.8+174*n[0],y:518.1+174*n[1],n};});
 H.centers=centers;
 H.stools.forEach((g,i)=>{g.userData.footprint={x:centers[i].x-20,y:centers[i].y-20,w:40,d:40,h:65};});
 window.HOME_V4_PUBLIC.seats=H.stools;
 window.HOME_V4_PUBLIC.seatedProxies=centers.map(p=>({x:p.x-28,y:p.y-28,w:56,d:56,z:0,h:135}));
 S.island={...H.island.userData.footprint};S.sink={x:625,y:561,r:11,type:'V1圓形飲水小槽，非備餐大單槽'};
 S.kneeRecess={depth:25,side:'outer-arc',status:'V1既有模型試配，檯面补強及商品待核'};
 S.nominalClearances={...S.nominalClearances,islandToSofa:132.2,islandSouthToColumn:221.8,fridgeToIsland:89.8,northPassage:null};
 Object.assign(V.rooms.find(r=>r.id==='island'),{n:'圓弧中島・頂天玻璃櫃',p:[735,700,160],t:[545,560,120],label:[540,585],note:'VN01：沿用V1的260×160.2×H95圓弧中島、260×30到頂雙面玻璃櫃及外弧兩張Ø40圓凳。中島為飲水小槽，非原長中島55×45備餐槽。25cm留膝、尺寸及維修空間為模型值。'});
 V.rooms.find(r=>r.id==='entry').note='VN01：保留原V4開放收藏區、玄關矮櫃與電箱檢修；中島改圓弧＋頂天雙面玻璃櫃，入戶南側留空增加。';
 V.rooms.find(r=>r.id==='living').note='VN01：固定灰石電視牆、AU01沙發與音響位置沿用原V4。玻璃櫃增加廚房至客廳的垂直分界，兩面透視；通行另依使用包絡核對。';
 // The shared control reads the seat footprints and retains collision checks.
 V.scene.updateMatrixWorld(true);
})();
