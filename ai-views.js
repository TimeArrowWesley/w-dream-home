'use strict';

// AI stills follow the selected room and the current design version.
(() => {
  const assetBase = new URL('.', document.currentScript?.src || document.baseURI);

  function init() {
    const V = window.HOME_VIEWER;
    const tour = window.HOME_TOUR;
    const panel = document.getElementById('scenePanel');
    const main = panel?.querySelector('main');
    if (!V || !tour || !main || window.HOME_AI_VIEWS) return;

    const $ = id => document.getElementById(id);
    const proposal = window.HOME_LAYOUT?.proposal || window.HOME_LAYOUT?.version || 'v1';
    const source = window.HOME_AI_PHOTOS?.[proposal];
    const seen = new Set();
    const photos = (Array.isArray(source) ? source : []).filter(item => {
      if (!item || !item.id || !item.src || !item.room || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    const roomName = id => V.rooms.find(room => room.id === id)?.n || id;
    const originalSetMode = tour.setMode.bind(tour);
    const originalGetMode = tour.getMode.bind(tour);
    let opened = false;
    let selected = null;
    let requestedRoom = V.getCurrent();
    let zoom = 1;
    let offsetX = 0;
    let offsetY = 0;
    let drag = null;
    let imageLoaded = false;

    const style = document.createElement('style');
    style.id = 'aiViewsStyle';
    style.textContent = `
      #scenePanel #photoStage,#scenePanel #photoBadge,#scenePanel #photoControls,
      #scenePanel #filmstrip{display:none!important}
      #scenePanel{grid-template-rows:65px minmax(250px,1fr) auto}
      #scenePanel .viewTabs [data-viewmode="photo"]{display:inline-block!important}
      #scenePanel .viewTabs [data-viewmode="photo"][hidden]{display:none!important}
      #scenePanel[data-ai-photo="open"] #caption,
      #scenePanel[data-ai-photo="open"] #hint,
      #scenePanel[data-ai-photo="open"] #cameraControls,
      #scenePanel[data-ai-photo="open"] #detail,
      #scenePanel[data-ai-photo="open"] #rotatingTVPanel{display:none!important}
      body:has(#scenePanel[data-ai-photo="open"]) #homeControlsToggle,
      body:has(#scenePanel[data-ai-photo="open"]) #homeControls{display:none!important}
      #aiPhotoStage{position:absolute;inset:0;z-index:9;background:#11191b;
        display:grid;grid-template-rows:auto minmax(0,1fr) auto auto;min-width:0;color:#edf3ee}
      #aiPhotoStage[hidden]{display:none!important}
      #aiPhotoHeading::before{content:"更新前 AI 圖 · 設備現況請看 3D";display:block;color:#e4c286;font-size:12px;margin-right:12px}#aiPhotoHeading{padding:12px 15px;border-bottom:1px solid #3b4947;display:flex;
        align-items:flex-start;justify-content:space-between;gap:12px;background:#192323}
      #aiPhotoHeading strong{display:block;font-size:14px;font-weight:500;line-height:1.5}
      #aiPhotoHeading small{display:block;font-size:10px;color:#adbbb5;line-height:1.7;margin-top:3px}
      #aiPhotoStage button,#aiPhotoStage a{border:1px solid #4b6057;border-radius:5px;
        background:#25332e;color:#e8f0eb;padding:7px 10px;text-decoration:none;font-size:11px}
      #aiPhotoStage button:hover,#aiPhotoStage a:hover{background:#344b3e}
      #aiPhotoStage button:focus-visible,#aiPhotoStage a:focus-visible{outline:2px solid #c5ddce;outline-offset:2px}
      #aiPhotoHeading button{flex-shrink:0;white-space:nowrap}
      #aiPhotoRoom{max-width:100%;margin-top:7px;background:#25332e;color:#edf3ee;border:1px solid #61776c;border-radius:5px;padding:6px;font:inherit;font-size:12px}
      #aiPhotoStage [hidden]{display:none!important}
      #aiPhotoStage[data-overview="true"]{grid-template-rows:auto 0px auto minmax(0,1fr)}
      #aiPhotoStage[data-overview="true"] #aiPhotoGallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));align-content:start;overflow:auto}
      #aiPhotoStage[data-overview="true"] #aiPhotoGallery button{width:100%;height:130px}
      #aiPhotoViewport{position:relative;overflow:hidden;min-height:0;touch-action:none;outline:none}
      #aiPhotoImage{width:100%;height:100%;object-fit:contain;display:block;user-select:none;
        transform-origin:center;cursor:zoom-in}
      #aiPhotoStage[data-zoomed="true"] #aiPhotoImage{cursor:grab}
      #aiPhotoStatus{position:absolute;left:8%;right:8%;top:43%;text-align:center;
        font-size:12px;line-height:1.8;background:#1f2c29ec;border-radius:7px;padding:14px}
      #aiPhotoNotice{font-size:10px;line-height:1.6;color:#cfccb6;margin:0;padding:5px 15px 0}
      #aiPhotoTools{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;flex-wrap:wrap}
      #aiPhotoTools output{font-size:10px;color:#bdcec3;min-width:38px;text-align:center}
      #aiPhotoGallery{display:flex;gap:8px;overflow-x:auto;padding:8px 12px 10px;scrollbar-width:thin;
        border-top:1px solid #354640;min-width:0}
      #aiPhotoGallery button{position:relative;padding:0;flex:0 0 120px;height:80px;
        overflow:hidden;text-align:left;background:#1b2923}
      #aiPhotoGallery button[aria-pressed="true"]{border:2px solid #bad8c4}
      #aiPhotoGallery img{width:100%;height:100%;object-fit:cover;display:block;opacity:.84}
      #aiPhotoGallery span{position:absolute;bottom:0;left:0;right:0;background:#111c18dc;
        padding:5px;font-size:10px;line-height:1.35}
      #aiPhotoEmpty{font-size:12px;line-height:1.7;padding:24px;margin:0;text-align:center;align-self:center}
      @media(max-width:1150px){#scenePanel{grid-template-rows:85px minmax(250px,1fr) auto}}
      @media(max-width:760px){#scenePanel{grid-template-rows:60px minmax(300px,1fr) auto}
        #aiPhotoHeading::before{content:"更新前 AI 圖 · 設備現況請看 3D";display:block;color:#e4c286;font-size:12px;margin-right:12px}#aiPhotoHeading{padding:9px 10px}#aiPhotoHeading strong{font-size:12px}
        #aiPhotoGallery button{flex-basis:95px;height:65px}#aiPhotoGallery{padding:6px 8px}
        #aiPhotoTools{padding:6px 8px}#aiPhotoNotice{padding:4px 10px 0}}
    `;
    document.head.appendChild(style);

    const stage = document.createElement('section');
    stage.id = 'aiPhotoStage';
    stage.hidden = true;
    stage.setAttribute('aria-label', 'AI 寫實設計視角');
    stage.innerHTML = `
      <div id="aiPhotoHeading"><div><strong id="aiPhotoTitle"></strong>
        <small>AI 設計效果圖 · 格局以 3D 模型為準</small>
        <select id="aiPhotoRoom" aria-label="選擇 AI 視角區域"></select></div>
        <button id="aiPhotoClose" type="button">返回 3D</button></div>
      <div id="aiPhotoViewport" tabindex="0" aria-label="設計效果圖；加減鍵縮放，方向鍵移動">
        <img id="aiPhotoImage" draggable="false" alt="">
        <div id="aiPhotoStatus" role="status" aria-live="polite" hidden></div>
        <p id="aiPhotoEmpty" hidden>此版本的 AI 設計效果圖尚未加入。</p>
      </div>
      <div><p id="aiPhotoNotice" hidden></p><div id="aiPhotoTools">
        <button type="button" data-ai-zoom="in" aria-label="放大效果圖">＋</button>
        <output id="aiPhotoZoom">100%</output>
        <button type="button" data-ai-zoom="out" aria-label="縮小效果圖">−</button>
        <button type="button" data-ai-zoom="reset">回位</button>
        <a id="aiPhotoDownload" download>下載 AI 效果圖</a>
      </div></div>
      <nav id="aiPhotoGallery" aria-label="此版本已完成的 AI 設計圖"></nav>
    `;
    main.appendChild(stage);

    const image = $('aiPhotoImage');
    const viewport = $('aiPhotoViewport');
    const status = $('aiPhotoStatus');
    const gallery = $('aiPhotoGallery');
    const download = $('aiPhotoDownload');
    const photoURL = item => new URL(item.src, assetBase).href;
    const roomSelect = $('aiPhotoRoom');
    V.rooms.forEach(room => {
      const option = document.createElement('option');
      option.value = room.id;
      const count = photos.filter(photo => photo.room === room.id).length;
      option.textContent = room.id === 'all' ? '全屋 AI 圖集' : `${room.n}（${count} 張）`;
      roomSelect.appendChild(option);
    });
    roomSelect.onchange = () => V.selectRoom(roomSelect.value);

    function transform() {
      const xLimit = Math.max(0, viewport.clientWidth * (zoom - 1) / 2);
      const yLimit = Math.max(0, viewport.clientHeight * (zoom - 1) / 2);
      offsetX = Math.max(-xLimit, Math.min(xLimit, offsetX));
      offsetY = Math.max(-yLimit, Math.min(yLimit, offsetY));
      image.style.transform = `translate(${offsetX}px,${offsetY}px) scale(${zoom})`;
      stage.dataset.zoomed = String(zoom > 1);
      $('aiPhotoZoom').textContent = `${Math.round(zoom * 100)}%`;
    }

    function reset() {
      zoom = 1;
      offsetX = offsetY = 0;
      drag = null;
      transform();
    }

    function updateButtons() {
      document.querySelectorAll('[data-viewmode]').forEach(button => {
        const active = button.dataset.viewmode === (opened ? 'photo' : originalGetMode());
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      $('layoutAIPhotos')?.classList.toggle('active', opened);
    }

    function render(item) {
      selected = item || null;
      reset();
      imageLoaded = false;
      const empty = !selected;
      const overview = requestedRoom === 'all';
      stage.dataset.overview = String(overview);
      roomSelect.value = requestedRoom;
      image.hidden = empty;
      $('aiPhotoEmpty').hidden = !empty || overview;
      $('aiPhotoEmpty').textContent = `${roomName(requestedRoom)}尚未加入 AI 圖片，可返回 3D 查看此區域。`;
      $('aiPhotoTools').hidden = empty;
      gallery.hidden = !photos.length;
      gallery.querySelectorAll('button').forEach(button => {
        const photo = photos.find(p => p.id === button.dataset.aiPhoto);
        button.hidden = !overview && photo.room !== requestedRoom;
        button.setAttribute('aria-pressed', String(selected?.id === photo.id));
      });
      status.hidden = true;
      if (empty) {
        image.removeAttribute('src');
        download.removeAttribute('href');
        $('aiPhotoTitle').textContent = `${proposal.toUpperCase()} · ${overview ? '全屋 AI 圖集' : roomName(requestedRoom)}`;
        $('aiPhotoNotice').hidden = true;
        return;
      }
      const label = selected.label || roomName(selected.room);
      $('aiPhotoTitle').textContent = `${proposal.toUpperCase()} · ${label}`;
      $('aiPhotoNotice').hidden = true;
      image.alt = `${proposal.toUpperCase()} ${label}，AI 設計效果圖`;
      image.src = photoURL(selected);
      status.textContent = '載入 AI 設計效果圖…';
      status.hidden = false;
      download.href = photoURL(selected);
      const extension = new URL(download.href).pathname.split('.').pop() || 'png';
      download.download = `W夢想之家_${proposal}_${selected.id}_AI效果圖.${extension}`;
      gallery.querySelectorAll('button').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.aiPhoto === selected.id));
      });
    }

    image.onload = () => {
      if (!selected || image.src !== photoURL(selected)) return;
      imageLoaded = true;
      status.hidden = true;
    };
    image.onerror = () => {
      if (!selected) return;
      imageLoaded = false;
      image.hidden = true;
      status.textContent = '這張 AI 效果圖無法讀取，請確認 ai-interiors 圖片資料夾與專案放在一起。';
      status.hidden = false;
    };

    photos.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.aiPhoto = item.id;
      button.setAttribute('aria-pressed', 'false');
      const thumb = document.createElement('img');
      thumb.src = photoURL(item);
      thumb.alt = '';
      thumb.loading = 'lazy';
      const label = document.createElement('span');
      label.textContent = item.label || roomName(item.room);
      button.append(thumb, label);
      button.onclick = () => select(item.id);
      gallery.appendChild(button);
    });

    function open(id) {
      // Exit pointer lock and walking before opening the image, using every
      // existing mode wrapper. Keep the old photo renderer inactive.
      originalSetMode('model');
      requestedRoom = V.getCurrent();
      opened = true;
      panel.dataset.mode = 'photo';
      panel.dataset.aiPhoto = 'open';
      stage.hidden = false;
      if ($('cameraControls')) $('cameraControls').hidden = true;
      if ($('photoBadge')) $('photoBadge').hidden = true;
      if ($('photoControls')) $('photoControls').hidden = true;
      const explicit = photos.find(photo => photo.id === id);
      if (explicit && requestedRoom !== explicit.room) {
        V.selectRoom(explicit.room);
        requestedRoom = explicit.room;
      }
      const item = explicit || photos.find(photo => photo.room === requestedRoom);
      render(item);
      updateButtons();
      return Boolean(item);
    }

    function close(nextMode = 'model') {
      opened = false;
      stage.hidden = true;
      delete panel.dataset.aiPhoto;
      drag = null;
      originalSetMode(nextMode);
      updateButtons();
    }

    function select(id) {
      const item = photos.find(photo => photo.id === id);
      if (!item) return false;
      if (!opened) return open(id);
      if (V.getCurrent() !== item.room) V.selectRoom(item.room);
      requestedRoom = item.room;
      render(item);
      return true;
    }

    tour.setMode = mode => mode === 'photo' ? open() : close(mode);
    tour.getMode = () => opened ? 'photo' : originalGetMode();
    document.querySelectorAll('[data-viewmode]').forEach(button => {
      button.onclick = () => tour.setMode(button.dataset.viewmode);
      if (button.dataset.viewmode === 'photo') {
        button.textContent = 'AI 更新前參考';
        button.title = '觀看 設備更新前的 AI 效果圖；目前設備以3D模型為準';
        button.hidden = photos.length === 0;
      }
    });

    const bar = $('layoutSwitch');
    if (bar && photos.length) {
      const button = document.createElement('button');
      button.id = 'layoutAIPhotos';
      button.type = 'button';
      button.textContent = 'AI 更新前參考';
      button.onclick = () => open();
      const legacyGallery = Array.from(bar.querySelectorAll('a'))
        .find(link => link.getAttribute('href')?.includes('最新版導覽'));
      if (legacyGallery) legacyGallery.replaceWith(button);
      else bar.appendChild(button);
    }

    $('aiPhotoClose').onclick = () => close();
    const exportButton = $('export');
    if (exportButton) {
      const previousExport = exportButton.onclick;
      exportButton.onclick = event => {
        if (opened) {
          if (selected && imageLoaded) download.click();
        } else previousExport?.call(exportButton, event);
      };
    }

    stage.querySelectorAll('[data-ai-zoom]').forEach(button => {
      button.onclick = () => {
        if (button.dataset.aiZoom === 'reset') return reset();
        zoom = Math.max(1, Math.min(3, zoom + (button.dataset.aiZoom === 'in' ? .25 : -.25)));
        transform();
      };
    });
    viewport.addEventListener('wheel', event => {
      event.preventDefault();
      zoom = Math.max(1, Math.min(3, zoom + (event.deltaY < 0 ? .15 : -.15)));
      transform();
    }, { passive: false });
    viewport.onpointerdown = event => {
      if (event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY };
      viewport.setPointerCapture(event.pointerId);
      viewport.focus();
    };
    viewport.onpointermove = event => {
      if (!drag || zoom === 1) return;
      offsetX += event.clientX - drag.x;
      offsetY += event.clientY - drag.y;
      drag = { x: event.clientX, y: event.clientY };
      transform();
    };
    viewport.onpointerup = viewport.onpointercancel = () => { drag = null; };
    viewport.onkeydown = event => {
      if (event.key === 'Escape') { close(); return; }
      if (event.key === '+' || event.key === '=') zoom = Math.min(3, zoom + .25);
      else if (event.key === '-') zoom = Math.max(1, zoom - .25);
      else if (event.key === 'Home') reset();
      else if (event.key === 'ArrowLeft') offsetX += 30;
      else if (event.key === 'ArrowRight') offsetX -= 30;
      else if (event.key === 'ArrowUp') offsetY += 30;
      else if (event.key === 'ArrowDown') offsetY -= 30;
      else return;
      event.preventDefault();
      transform();
    };

    window.addEventListener('roomchange', () => {
      if (!opened) return;
      requestedRoom = V.getCurrent();
      render(photos.find(photo => photo.room === requestedRoom));
    });

    // A plan hotspot has a closed-over legacy setMode handler. While browsing
    // AI images, keep the image gallery open and change its actual room label.
    function selectPlanRoom(event) {
      if (!opened) return;
      if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
      const target = event.target.closest?.('.planroom[data-room]');
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      V.selectRoom(target.dataset.room);
    }
    $('planstage')?.addEventListener('click', selectPlanRoom, true);
    $('planstage')?.addEventListener('keydown', selectPlanRoom, true);

    // Legacy controls such as 全戶 use a private setMode function. Observe that
    // transition so the new layer never obscures an explicitly selected model.
    new MutationObserver(() => {
      if (opened && panel.dataset.mode !== 'photo') {
        opened = false;
        stage.hidden = true;
        delete panel.dataset.aiPhoto;
        updateButtons();
      }
    }).observe(panel, { attributes: true, attributeFilter: ['data-mode'] });

    window.HOME_AI_VIEWS = {
      open,
      close,
      select,
      getState: () => ({
        open: opened,
        proposal,
        requestedRoom,
        imageRoom: selected?.room || null,
        selectedId: selected?.id || null,
        src: selected ? photoURL(selected) : null,
        imageLoaded,
        zoom,
        available: photos.map(({ id, room, label, src }) => ({ id, room, label, src }))
      })
    };
  }

  function start() {
    init();
    const room = new URLSearchParams(location.hash.slice(1)).get('ai');
    if (room && window.HOME_VIEWER.rooms.some(item => item.id === room)) {
      window.HOME_VIEWER.selectRoom(room);
      window.HOME_AI_VIEWS?.open();
    }
  }
  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
