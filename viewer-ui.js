'use strict';

// Shared application shell. Move existing controls so their model handlers stay intact.
(() => {
  const root = new URL('.', document.currentScript.src);
  const $ = id => document.getElementById(id);
  const all = (s, host = document) => Array.from(host.querySelectorAll(s));
  const make = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  };
  const btn = (text, id, action) => {
    const n = make('button', '', text); n.type = 'button'; n.id = id;
    if (action) n.onclick = action;
    return n;
  };

  function init() {
    const V = window.HOME_VIEWER, tour = window.HOME_TOUR;
    if (!V || !tour || !$('layoutSwitch') || window.HOME_UI) return;
    const version = window.HOME_CURRENT_VERSION();
    const body = document.body, shell = document.querySelector('.shell');
    const sidebar = shell.querySelector('aside'), workspace = document.querySelector('.workspace');
    const scene = $('scenePanel'), header = document.querySelector('body > header');
    const plan = $('planPanel'), rooms = $('rooms'), bar = $('layoutSwitch');
    const planTab = $('planToggle'), equipment = $('equipmentControls');
    const kitchen = $('kitchenDoorToggle'), mirror = $('closetMirrorToggle'), coffee = $('coffeeLift'), switch2 = $('showSwitch2'), tv = $('rotatingTVPanel'), stools = $('aStoolToggle');
    let navView = 'rooms', inspectorView = null, allControls = false, returnFocus = null;

    body.classList.add('uiApp');
    sidebar.id = 'uiSidebar'; sidebar.setAttribute('aria-label', '版本與空間');
    // Append after feature styles. All selectors are scoped to this shell.
    const theme = make('link'); theme.rel = 'stylesheet'; theme.href = new URL('viewer-ui.css?v=20260922-ui07', root).href;
    document.head.append(theme);

    // Primary navigation: one entry per task, with export as a secondary action.
    const brand = header.firstElementChild;
    brand.className = 'uiBrand'; brand.querySelector('.sub').textContent = 'A1–14F / 全屋設計';
    const primary = make('nav', 'uiPrimary'); primary.setAttribute('aria-label', '專案功能');
    const designTab = btn('空間設計', 'uiDesignTab', () => closeInspector());
    designTab.setAttribute('aria-current', 'page');
    const furniture = $('homeFurnitureCatalog');
    if (furniture) { furniture.textContent = '家具設備'; furniture.className = ''; }
    const resourcesButton = btn('設計資料', 'uiResourcesButton', () => openDialog(resources, resourcesButton));
    primary.append(designTab); if (furniture) primary.append(furniture); primary.append(resourcesButton);
    const actions = make('div', 'uiHeaderActions');
    const exportMenu = make('details', 'uiMenu uiExportMenu');
    exportMenu.append(make('summary', '', '匯出圖面'));
    const exportItems = make('div', 'uiMenuBody');
    $('export').textContent = '目前視角 PNG'; $('planExport').textContent = '平面圖 SVG';
    exportItems.append($('export'), $('planExport')); exportMenu.append(exportItems);
    $('full').textContent = '全螢幕'; actions.append(exportMenu, $('full'));
    header.replaceChildren(brand, primary, actions);

    // Public version names; construction and entry configurations remain descriptive details.
    const registry=window.HOME_VERSION_REGISTRY.versions;
    const versions=Object.fromEntries(registry.map(v=>[v.id,[v.name,v.detail]]));
    document.title='W夢想之家｜'+version.toUpperCase()+' '+versions[version][0];
    const versionMenu = make('details', 'uiMenu uiVersionMenu'); versionMenu.id = 'uiVersionMenu';
    const versionSummary = make('summary');
    versionSummary.append(make('small', '', '設計版本'), make('strong', '', version.toUpperCase() + ' · ' + versions[version][0]), make('span', '', versions[version][1]));
    versionMenu.append(versionSummary);
    const versionButtons = all('[data-layout], [data-proposal]', bar);
    const extras = Array.from(bar.children).filter(n => !versionButtons.includes(n));
    bar.replaceChildren();
    const historyVersions=make('details','uiVersionHistory');
    historyVersions.append(make('summary','','歷史版本（已停用）'));
    for (const key of Object.keys(versions)) {
      const b = make('button');b.dataset.proposal=key;
      b.replaceChildren(make('strong', '', key.toUpperCase()), make('span', '', versions[key].join(' / ')));
      b.title = versions[key].join(' / '); b.setAttribute('aria-pressed', String(key === version));
      b.onclick = () => {
        versionMenu.open = false;
        if (key === version) return;
        const url = new URL(registry.find(v=>v.id===key).path, root);
        url.searchParams.set('layout', key);
        url.searchParams.set('uiRoom', V.getCurrent());
        url.searchParams.set('uiMode', tour.getMode());
        location.assign(url.href);
      };
      if(registry.find(v=>v.id===key).history)historyVersions.append(b);else bar.append(b);
    }
    bar.append(historyVersions);
    bar.className = 'uiMenuBody'; versionMenu.append(bar);

    // Separate space selection from display settings. The floorplan shares the same slot.
    const settingsSections = all(':scope > .section', sidebar);
    const sideTabs = make('div', 'uiSideTabs'); sideTabs.setAttribute('role', 'tablist'); sideTabs.setAttribute('aria-label', '導覽方式');
    const roomTab = btn('空間列表', 'uiRoomsTab', () => setNav('rooms'));
    planTab.textContent = '平面圖'; planTab.onclick = () => setNav('plan');
    for (const [b, target] of [[roomTab, 'uiRoomList'], [planTab, 'planPanel']]) {
      b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', target);
    }
    sideTabs.append(roomTab, planTab);
    const roomList = make('section', 'uiRoomList'); roomList.id = 'uiRoomList'; roomList.setAttribute('role', 'tabpanel'); roomList.setAttribute('aria-labelledby', 'uiRoomsTab');
    const roomGroups = [
      ['全屋', ['all']], ['公共空間', ['entry','living','island','kitchen',...(HOME_LAYOUT.openIsland?['collection']:[])]],
      ['私人空間', ['bed','closet','study',...(HOME_LAYOUT.openIsland?[]:['collection'])]], ['衛浴與機能', ['bath1','bath2','storage','back']]
    ];
    const roomButtons = all('button[data-id]', rooms); rooms.replaceChildren();
    for (const [label, ids] of roomGroups) {
      const group = make('div', 'uiRoomGroup'); group.append(make('h2', '', label));
      ids.forEach(id => {
        const b = roomButtons.find(n => n.dataset.id === id); if (!b) return;
        b.title = V.rooms.find(r => r.id === id)?.n || id;
        if(window.HOME_HYBRID && id==='island') b.textContent='圓弧中島・頂天玻璃櫃';
        b.onclick = () => { V.selectRoom(id); closeMobileNav(); };
        group.append(b);
      });
      rooms.append(group);
    }
    roomList.append(rooms);
    const roomNotes = make('details', 'uiRoomNotes'); roomNotes.append(make('summary', '', '本區設計說明'), $('caption')); roomList.append(roomNotes);
    plan.setAttribute('role', 'tabpanel'); plan.setAttribute('aria-labelledby', 'planToggle');
    plan.querySelector('h3').textContent = '平面導覽';
    plan.querySelector('.panelHeading small').textContent = 'FLOOR PLAN';
    const planFooter = plan.querySelector('.planFooter');
    const expandPlan = btn('放大圖面', 'uiExpandPlan', () => { mapDialog.append(plan); openDialog(mapDialog, expandPlan); });
    planFooter.replaceChildren(expandPlan);
    plan.querySelector('.materialNotes')?.remove();
    const sideContent = make('div', 'uiSideContent'); sideContent.append(roomList, plan);
    const sideFoot = make('div', 'uiSideFoot', registry.find(v=>v.id===version).history ? version.toUpperCase()+' · 已停用／歷史參考' : window.HOME_HYBRID ? 'V3 · VN01圓弧中島／AU01影音／BI01材質 · 工程待核' : window.HOME_TV_WALL ? 'V1 · TW01主牆／AU01影音／BI01材質 · 工程待核' : window.HOME_LIVING_AUDIO ? version.toUpperCase()+' · AU01影音／BI01材質 · 工程待核' : window.HOME_BLACK_INDUSTRIAL ? version.toUpperCase()+' · BI01霧黑工業 · '+(version==='v4'?'已停用／歷史':'工程待核') : version==='v4' ? 'V4 已停用・僅供歷史參考' : window.HOME_V4_INDUSTRIAL ? 'V4 · R02格局／GI01材質 · 工程待核' : window.HOME_V4_PUBLIC ? 'V4 · R02 · 2026.09.23 · 採用配置，尺寸與工程待核' : window.HOME_AUDIT_REPAIRS ? version.toUpperCase()+' · QA03 · 2026.09.22 · 模型複核，施工尺寸待確認' : window.HOME_MODEL_REPAIRS ? version.toUpperCase()+' · MR01 · 2026.09.21 · 設計試案，尺寸待複量' : 'V0～V5 共用家具清單 · 可隨時切換版本');
    sidebar.replaceChildren(versionMenu, sideTabs, sideContent, sideFoot);
    workspace.classList.remove('planhidden');

    const mapDialog = makeDialog('uiMapDialog', '裝潢與原始圖面', '點選圖上的房間，即可切換至對應空間。');
    mapDialog.addEventListener('close', () => { sideContent.append(plan); setNav(navView); });
    $('planstage').addEventListener('click', e => { if (e.target.closest?.('.planroom')) { if (mapDialog.open) mapDialog.close(); closeMobileNav(); } });
    $('planstage').addEventListener('keydown', e => { if (['Enter',' '].includes(e.key) && e.target.closest?.('.planroom')) { if (mapDialog.open) mapDialog.close(); closeMobileNav(); } });

    // A resource library replaces scattered links in the version toolbar.
    const resources = makeDialog('uiResources', '設計資料', '比較方案、查看調整依據，或回顧參考圖。');
    const resourceGrid = make('div', 'uiResourceGrid');
    for (const [title, note, file] of [
      ['版本重編與新增V3 VN01', '目前六版對照、圓弧中島與頂天玻璃櫃', '版本重編與V3.html'],
      ['無上櫃電視牆 TW01', 'V1採目前V2灰石主牆；歷史TW01對照', '電視牆統一.html'],
      ['V1／V2 影音統一 AU01', '回靠窗側、保留中島旁留空；共同影音定位與32個AI更新', '影音統一.html'],
      ['全版本霧黑工業 BI01', '霧黑天花、中灰牆與灰棕木；全屋五視角AI重製', '霧黑工業全屋.html'],
      ['原V4（現V2）灰石工業 GI01', '歷史：石墨櫃面、槍灰金屬與分區燈光', '調整紀錄/20260923V4灰石工業校正/index.html'],
      ['原V4（現V2）公共區 R02', '歷史：客廳比例與背架後環繞；目前位置見AU01', '調整紀錄/20260923V4公共區更新/index.html'],
      ['灰石全屋設計 GR06', '灰石、灰棕木、分區燈光與全屋五視角提案', '灰石全屋設計.html'],
      ['四版動線修正 MR01', '收藏室入口、行李取出、原V3（現V5）窄道與主浴避撞的前後對照', '調整紀錄/20260921四版動線修正/index.html'],
      ['V0・原始格局', '原圖還原、全屋平面與功能說明', '提案/原始格局/方案說明.html'],
      ['拆收藏室・兩個替代格局', '現V2 大中島已製作 3D／B 保留 2D，完整尺寸與設計比較', '提案/拆收藏室替代方案/index.html'],
      ['V5・旋轉電視+大中島', '開放大中島的尺寸、影音配置與設計對照', '提案/開放大中島/方案說明.html'],
      ['版本比較', 'V0 原始格局與 V1～V5 的配置及共用功能', '方案比較.html'],
      ['本版調整內容', version.toUpperCase() + ' 的設備尺寸及設計決定', '版本調整.html?version=' + version],
      ['材質與配色', '22 個工業風案例、四版材質前後對照與酒吧照明', '材質調整.html'],
      ['全屋核對與主臥細節', '最新收放操作、燈光與前後比較', '調整紀錄/20260911全屋核對與主臥細節/index.html'],
      ['設計修正對照', '平面與設備調整的前後紀錄', '設計修正對照.html'],
      ['全屋設計檢視', '各空間的接縫、收邊與設計檢視', '全屋設計檢視.html'],
      ['全版本模型與 AI 複核', 'QA03 歷史：190 個角度、窗洞補牆與修改前後比較', '全版本複核.html'],
      ['歷史模型檢查紀錄', '較早版本的模型尺寸、結構與設備核對', '全屋模型檢查.html']
    ]) {
      const a = make('a', 'uiResource'); a.href = new URL(file, root).href; a.target = '_blank'; a.rel = 'noopener';
      a.append(make('strong', '', title + ' ↗'), make('span', '', note)); resourceGrid.append(a);
    }
    resources.append(resourceGrid);
    const history = make('details', 'uiHistory'); history.append(make('summary', '', 'AI 成品圖集'));
    history.append(make('p', '', '每版12個空間，各空間5方向，可對照模型取景與AI材質效果。尺寸以模型及核定圖說為準。'));
    for (const [label, file] of [['全屋 AI 圖集 ↗', 'AI寫實視角.html']]) {
      const a = make('a', '', label); a.href = new URL(file, root).href; a.target = '_blank'; a.rel = 'noopener'; history.append(a);
    }
    resources.append(history);

    // A single inspector keeps controls off the scene and groups them by purpose.
    const inspector = make('section', 'uiInspector'); inspector.id = 'uiInspector'; inspector.hidden = true;
    inspector.setAttribute('aria-label', '空間設定'); inspector.tabIndex = -1;
    const inspectorHeader = make('div', 'uiInspectorHeader');
    inspectorHeader.append(make('strong', '', '空間設定'), btn('關閉', 'uiInspectorClose', () => closeInspector(true)));
    const inspectorTabs = make('div', 'uiInspectorTabs'); inspectorTabs.setAttribute('role', 'tablist'); inspectorTabs.setAttribute('aria-label', '設定分類');
    const controlTab = btn('設備互動', 'uiControlsTab', () => openInspector('controls'));
    const displayTab = btn('顯示設定', 'uiDisplayTab', () => openInspector('display'));
    const controlsBody = make('div', 'uiInspectorBody'); controlsBody.id = 'uiControlsBody';
    const displayBody = make('div', 'uiInspectorBody'); displayBody.id = 'uiDisplayBody';
    for (const [b,p] of [[controlTab,controlsBody], [displayTab,displayBody]]) {
      b.setAttribute('role','tab'); b.setAttribute('aria-controls',p.id);
      p.setAttribute('role','tabpanel'); p.setAttribute('aria-labelledby',b.id);
    }
    inspectorTabs.append(controlTab, displayTab); inspector.append(inspectorHeader, inspectorTabs, controlsBody, displayBody); workspace.append(inspector);
    const context = make('div', 'uiControlContext'); context.id = 'uiControlContext'; controlsBody.append(context);
    const scope = make('label', 'uiScope'); const scopeInput = make('input'); scopeInput.type = 'checkbox'; scopeInput.id = 'uiAllControls';
    scopeInput.onchange = () => { allControls = scopeInput.checked; syncRoom(); window.dispatchEvent(new CustomEvent('homecontrolscope')); };
    scope.append(scopeInput, document.createTextNode('顯示全屋設備操作')); controlsBody.append(scope);
    const contextActions = make('div', 'uiContextActions'); controlsBody.append(contextActions);
    [kitchen, mirror, coffee, switch2, tv, stools].filter(Boolean).forEach(n => contextActions.append(n));
    if (tv) { $('rotatingTVBody').hidden = false; $('rotatingTVToggle').setAttribute('aria-expanded','true'); }
    if ($('bedroomControls')) controlsBody.append($('bedroomControls'));
    const repairDoors=[];
    if(window.HOME_MODEL_REPAIRS && window.HOME_INTERACTION){
      const section=make('details','uiControlSection');section.open=true;
      section.append(make('summary','','門片與取物檢查'));
      for(const e of HOME_INTERACTION.getState().entries){
        const room=/主浴/.test(e.name)?'bath1':/收藏室|精品包|左側上提包櫃|右側包櫃/.test(e.name)?'collection':/更衣室.*側移/.test(e.name)?'closet':/後陽台.*側移/.test(e.name)?'back':/儲藏室拉門/.test(e.name)?'storage':null;
        if(!room)continue;
        const b=btn('', 'uiRepairDoor'+e.id,()=>HOME_INTERACTION.toggleDoor(e.id));
        b.style.cssText='display:block;width:100%;margin:6px 0;text-align:left';
        section.append(b);repairDoors.push({id:e.id,room,b,section});
      }
      function syncDoorButtons(){for(const e of HOME_INTERACTION.getState().entries){const q=repairDoors.find(q=>q.id===e.id);if(q){const open=Math.abs(e.target)>.1;q.b.textContent=(open?'關閉':'開啟')+' · '+e.name;q.b.setAttribute('aria-pressed',String(open));}}}
      syncDoorButtons();window.addEventListener('doorstatechange',syncDoorButtons);controlsBody.append(section);
    }
    const lightSection = make('details', 'uiControlSection'); lightSection.append(make('summary', '', '燈光與窗簾'));
    const lighting = $('homeControls'); if (lighting) { lighting.hidden = false; lightSection.append(lighting); }
    controlsBody.append(lightSection);
    if (equipment) { const details = make('details', 'uiControlSection'); details.append(make('summary', '', '所有設備與櫃內檢視'), equipment); controlsBody.append(details); }
    const catalogContext = btn('開啟本區家具清單', 'uiRoomFurniture', () => {
      closeInspector(); window.HOME_CATALOG?.open({room:V.getCurrent()});
    }); controlsBody.append(catalogContext);
    settingsSections.forEach(section => displayBody.append(section));
    if ($('realismQuality')) displayBody.append($('realismQuality'));
    if ($('realismStatus')) displayBody.append($('realismStatus'));
    const help = make('details', 'uiControlSection'); help.append(make('summary', '', '操作說明'));
    help.append(make('p', '', '3D 檢視：拖曳轉向，滾輪縮放。步行：WASD 移動，拖曳轉頭，E 開關門，Shift 慢走。'));
    if ($('walkLock')) help.append($('walkLock'));
    displayBody.append(help);
    $('homeControlsToggle')?.remove();
    // Keep legacy duplicate nodes out of the application navigation.
    const legacy = make('div'); legacy.hidden = true; legacy.id = 'uiLegacyControls';
    extras.forEach(n => { if (n.parentElement === null || n.parentElement === bar) legacy.append(n); });
    all('#walkBottomBar .equipmentAction').forEach(n => legacy.append(n)); body.append(legacy);

    // Room and viewing mode are always visible, including while walking.
    const toolbar = scene.querySelector('.sceneToolbar'), roomHeading = toolbar.firstElementChild;
    roomHeading.className = 'uiSceneTitle';
    const mobileNav = btn('空間', 'uiMobileNav', () => {
      const open = body.classList.toggle('uiNavOpen'); mobileNav.setAttribute('aria-expanded', String(open));
      navScrim.hidden = !open;
    }); mobileNav.setAttribute('aria-controls','uiSidebar'); mobileNav.setAttribute('aria-expanded','false');
    roomHeading.prepend(mobileNav);
    const viewTabs = toolbar.querySelector('.viewTabs'); viewTabs.setAttribute('aria-label', '觀看方式');
    const modeNames = {model:'3D 檢視', walk:'室內步行', photo:'AI 成品'};
    ['model','walk','photo'].forEach(mode => {
      const b = viewTabs.querySelector('[data-viewmode="'+mode+'"]'); if (!b) return;
      b.textContent = modeNames[mode]; b.title = mode === 'photo' ? '目前模型生成的材質效果圖' : modeNames[mode]; viewTabs.append(b);
    });
    const sceneActions = make('div', 'uiSceneActions');
    const controlsButton = btn('設備控制', 'uiOpenControls', () => inspectorView === 'controls' ? closeInspector(true) : openInspector('controls', controlsButton));
    const displayButton = btn('顯示設定', 'uiOpenDisplay', () => inspectorView === 'display' ? closeInspector(true) : openInspector('display', displayButton));
    [controlsButton, displayButton].forEach(b => { b.setAttribute('aria-controls','uiInspector'); b.setAttribute('aria-expanded','false'); });
    sceneActions.append(controlsButton, displayButton); toolbar.append(sceneActions);
    const sceneFooter = make('div', 'uiSceneFooter');
    const modeBadge = make('span', 'uiModeBadge'); modeBadge.id = 'uiModeBadge';
    sceneFooter.append(modeBadge, $('hint')); scene.append(sceneFooter);
    if ($('walkReset')) { $('walkReset').textContent = '回到起點'; sceneFooter.append($('walkReset')); }
    scene.querySelector('main').setAttribute('aria-label','設計預覽');
    $('view').tabIndex = 0;
    const aiNote = $('aiPhotoHeading')?.querySelector('small'); if (aiNote) aiNote.textContent = '目前模型生成的材質效果；格局與尺寸以 3D 為準。';
    const navScrim = btn('關閉空間導覽', 'uiNavScrim', closeMobileNav); navScrim.hidden = true; navScrim.tabIndex = -1; body.append(navScrim);

    function closeMobileNav() { body.classList.remove('uiNavOpen'); mobileNav?.setAttribute('aria-expanded','false'); if (navScrim) navScrim.hidden = true; }
    function setNav(view) {
      navView = view; roomList.hidden = view !== 'rooms'; plan.hidden = view !== 'plan';
      for (const [b,key] of [[roomTab,'rooms'],[planTab,'plan']]) {
        const active = key === view; b.setAttribute('aria-selected',String(active)); b.tabIndex = active ? 0 : -1;
      }
      sidebar.dataset.view = view;
    }
    function openInspector(view, trigger) {
      if (tour.getMode() === 'photo') tour.setMode('model');
      if (trigger) returnFocus = trigger;
      inspectorView = view; inspector.hidden = false; workspace.classList.add('uiInspectorOpen');
      controlsBody.hidden = view !== 'controls'; displayBody.hidden = view !== 'display';
      for (const [b,key] of [[controlTab,'controls'],[displayTab,'display']]) { const active = view === key; b.setAttribute('aria-selected',String(active)); b.tabIndex = active ? 0 : -1; }
      controlsButton.setAttribute('aria-expanded', String(view === 'controls'));
      displayButton.setAttribute('aria-expanded', String(view === 'display'));
      syncRoom(); if (trigger) $('uiInspectorClose').focus();
    }
    function closeInspector(focus = false) {
      inspectorView = null; inspector.hidden = true; workspace.classList.remove('uiInspectorOpen');
      controlsButton.setAttribute('aria-expanded','false'); displayButton.setAttribute('aria-expanded','false');
      if (focus && returnFocus?.isConnected) returnFocus.focus();
    }
    function syncRoom() {
      const room = V.getCurrent(), isAll = room === 'all' || allControls;
      for(const q of repairDoors)q.b.hidden=!isAll&&q.room!==room;
      if(repairDoors.length)repairDoors[0].section.hidden=!repairDoors.some(q=>!q.b.hidden);
      context.textContent = (V.rooms.find(r => r.id === room)?.n || '') + ' · 設備互動';
      for (const [n, ids] of [[kitchen,['living','island','kitchen']],[mirror,['closet']],[coffee,['living']],[switch2,['living','island']],[tv,['living','island']],[stools,['island']]]) if (n) n.hidden = !isAll && !ids.includes(room);
      for (const b of roomButtons) b.setAttribute('aria-current',b.dataset.id === room ? 'location' : 'false');
      if (['living','study'].includes(room) && $('rgbRoom') && $('rgbRoom').value !== room) { $('rgbRoom').value = room; $('rgbRoom').dispatchEvent(new Event('change')); }
      const curtain = {living:'living1',study:'studyN',bed:'bed',kitchen:'kitchen'}[room];
      if (curtain && $('curtainSelect') && !String($('curtainSelect').value).startsWith(room === 'living' ? 'living' : room === 'study' ? 'study' : curtain)) { $('curtainSelect').value = curtain; $('curtainSelect').dispatchEvent(new Event('change')); }
      catalogContext.textContent = room === 'all' ? '開啟全屋家具清單' : '開啟本區家具清單';
    }
    function syncMode() {
      const mode = tour.getMode(); body.dataset.uiMode = mode;
      modeBadge.textContent = mode === 'photo' ? 'AI 成品圖集' : version.toUpperCase() + ' · ' + (mode === 'walk' ? '步行模式' : '即時 3D');
      $('hint').hidden = mode === 'photo';
      if ($('walkReset')) $('walkReset').hidden = mode !== 'walk';
      if (mode === 'walk') $('hint').textContent = 'WASD 移動 · 拖曳轉頭 · E 開關門';
      if (mode === 'photo' && inspectorView) closeInspector();
    }
    function makeDialog(id, title, description) {
      const dialog = make('dialog', 'uiDialog'); dialog.id = id; dialog.setAttribute('aria-labelledby',id+'Title');
      const heading = make('div','uiDialogHeader'), titleBlock = make('div');
      const h = make('h2','',title); h.id = id+'Title'; titleBlock.append(h,make('p','',description));
      heading.append(titleBlock,btn('關閉',id+'Close',()=>dialog.close())); dialog.append(heading); body.append(dialog);
      dialog.addEventListener('click', e => { if(e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close(); } });
      return dialog;
    }
    function openDialog(dialog, trigger) {
      if (document.pointerLockElement) document.exitPointerLock?.();
      if (tour.getMode() === 'walk') tour.setMode('model');
      closeInspector(); if (!dialog.open) dialog.showModal();
      dialog.addEventListener('close', () => trigger?.focus(), {once:true});
    }
    // Native menus and tablists support keyboard navigation and predictable dismissal.
    for (const tabs of [sideTabs,inspectorTabs]) tabs.addEventListener('keydown',e=>{
      const bs=all('[role="tab"]',tabs), i=bs.indexOf(document.activeElement); if(i<0)return;
      const next=e.key==='ArrowRight'?(i+1)%bs.length:e.key==='ArrowLeft'?(i+bs.length-1)%bs.length:e.key==='Home'?0:e.key==='End'?bs.length-1:null;
      if(next!==null){e.preventDefault();bs[next].click();bs[next].focus();}
    });
    document.addEventListener('click', e => { for (const menu of [versionMenu,exportMenu]) if(menu.open&&!menu.contains(e.target))menu.open=false; });
    document.addEventListener('keydown', e => {
      if(e.key!=='Escape')return;
      for(const menu of [versionMenu,exportMenu])if(menu.open){menu.open=false;menu.querySelector('summary').focus();}
      if(!document.querySelector('dialog[open]')){closeInspector(true);closeMobileNav();}
    });
    for (const b of all('button',exportItems)) b.addEventListener('click',()=>{exportMenu.open=false;});
    window.addEventListener('roomchange',()=>{syncRoom();syncMode();if(mapDialog.open)mapDialog.close();closeMobileNav();});
    new MutationObserver(syncMode).observe(scene,{attributes:true,attributeFilter:['data-mode','data-ai-photo']});
    const observer = new MutationObserver(()=> { if(body.classList.contains('uiNavOpen')&&innerWidth>760)closeMobileNav(); });
    observer.observe(body,{attributes:true,attributeFilter:['class']});
    window.addEventListener('resize',()=>{if(innerWidth>760)closeMobileNav();});
    // Restore only meaningful navigation, never an accidental device close-up.
    const params = new URLSearchParams(location.search), requested = params.get('uiRoom');
    if (requested && V.rooms.some(r=>r.id===requested)) {
      V.selectRoom(requested); tour.setMode(['model','walk','photo'].includes(params.get('uiMode'))?params.get('uiMode'):'model');
    } else if (!params.has('catalogItem')&&!params.has('catalogRoom')&&!location.hash.includes('ai=')) {
      tour.setMode('model'); V.selectRoom('all');
    }
    setNav('rooms'); syncRoom(); syncMode();
    window.HOME_UI = {setNav,openInspector,closeInspector,getState:()=>({version,navView,inspectorView,room:V.getCurrent(),mode:tour.getMode()})};
  }
  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
