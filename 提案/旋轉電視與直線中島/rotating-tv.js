'use strict';
(() => {
  const T = window.THREE, V = window.HOME_VIEWER, TV = window.HOME_ROTATING_TV;
  if (!T || !V || !TV?.pivot) return;

  const canvas = document.getElementById('view');
  const DEG = Math.PI / 180, WALK_RADIUS = 18, SPEED = 42 * DEG;
  const MAX_STEP = DEG, COLLISION_PADDING = 2;
  let current = Math.max(0, Math.min(Math.PI, TV.pivot.rotation.y));
  let target = current, blocked = false, last = 0, lastPaint = 0;
  let preview = null, extraMessage = '', messageUntil = 0;
  const localCorners = new WeakMap();

  function meshesOf(objects) {
    const result = new Set();
    for (const object of objects.filter(Boolean)) {
      object.traverse(child => {
        if (!child.isMesh || !child.geometry) return;
        // The walk engine must never retain a stale axis-aligned copy.
        child.userData.dynamicDoor = true;
        result.add(child);
      });
    }
    return [...result];
  }
  const rotatingMeshes = meshesOf(TV.rotatingMeshes?.length ? TV.rotatingMeshes : [TV.pivot]);
  const upperMeshes = meshesOf([TV.upperStool]);
  const lowerMeshes = meshesOf([TV.lowerStool]);

  function visible(object) {
    for (let parent = object; parent; parent = parent.parent) if (!parent.visible) return false;
    return true;
  }

  function cornersOf(mesh) {
    let cached = localCorners.get(mesh.geometry);
    if (cached) return cached;
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    if (!box || box.isEmpty()) return [];
    cached = [];
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) cached.push(new T.Vector3(x, y, z));
      }
    }
    localCorners.set(mesh.geometry, cached);
    return cached;
  }

  const cross = (o, a, b) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  function hull(points) {
    points.sort((a, b) => a.x - b.x || a.z - b.z);
    const unique = points.filter((point, i) => !i || Math.abs(point.x - points[i - 1].x) > .0001 || Math.abs(point.z - points[i - 1].z) > .0001);
    if (unique.length <= 2) return unique;
    const lower = [], upper = [];
    for (const point of unique) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
      lower.push(point);
    }
    for (let i = unique.length - 1; i >= 0; i--) {
      const point = unique[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
      upper.push(point);
    }
    lower.pop(); upper.pop();
    return lower.concat(upper);
  }

  function segmentDistanceSquared(p, a, b) {
    const dx = b.x - a.x, dz = b.z - a.z, length = dx * dx + dz * dz;
    const t = length ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / length)) : 0;
    return (p.x - a.x - t * dx) ** 2 + (p.z - a.z - t * dz) ** 2;
  }

  // Project the transformed local bounding box, rather than its world AABB.
  // This follows the panel's current angle, including parent scale/rotation.
  function intersects(mesh, x, z, radius) {
    if (!visible(mesh)) return false;
    mesh.updateWorldMatrix(true, false);
    const corners = cornersOf(mesh).map(point => point.clone().applyMatrix4(mesh.matrixWorld));
    if (!corners.length) return false;
    let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const p of corners) {
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
    }
    if (maxY < 12 || minY > 180 || x + radius < minX || x - radius > maxX || z + radius < minZ || z - radius > maxZ) return false;
    const polygon = hull(corners), point = { x, z };
    if (polygon.length === 1) return segmentDistanceSquared(point, polygon[0], polygon[0]) <= radius * radius;
    let inside = polygon.length >= 3;
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length];
      if (segmentDistanceSquared(point, a, b) <= radius * radius) return true;
      if (cross(a, b, point) < -.00001) inside = false;
    }
    return inside;
  }

  function blockedBy(meshes, x, z, radius) {
    return meshes.some(mesh => intersects(mesh, x, z, radius));
  }
  function dynamicBlocksPoint(x, z, radius = WALK_RADIUS) {
    return blockedBy(rotatingMeshes, x, z, radius) || blockedBy(upperMeshes, x, z, radius) || blockedBy(lowerMeshes, x, z, radius);
  }

  // Preserve the original opening-door policy and append only this proposal's objects.
  const interaction = window.HOME_INTERACTION;
  if (interaction) {
    const previous = interaction.blocksPoint.bind(interaction);
    interaction.blocksPoint = (x, z, radius) => previous(x, z, radius) || dynamicBlocksPoint(x, z, radius);
  }

  function walker() {
    return window.HOME_WALK?.getState().active && window.HOME_TOUR?.getMode() === 'walk' ? V.camera.position : null;
  }
  function notify(text, duration = 3600) {
    extraMessage = text;
    messageUntil = performance.now() + duration;
    paint();
  }
  function emitStateEvent(type) {
    window.dispatchEvent(new CustomEvent(type, { detail: getState() }));
  }

  function setTarget(destination) {
    let next;
    if (destination === 'living' || destination === 0) next = 0;
    else if (destination === 'island' || destination === 180) next = Math.PI;
    else return false;
    target = next;
    blocked = false;
    extraMessage = '';
    if (Math.abs(target - current) < .00001) {
      current = target;
      TV.pivot.rotation.y = current;
      TV.pivot.updateMatrixWorld(true);
      emitStateEvent('tvrotationend');
    }
    paint();
    return getState();
  }

  function toggleStool(show = !TV.upperStool || !visible(TV.upperStool)) {
    if (!TV.upperStool) return false;
    TV.upperStool.traverse(object => { object.visible = !!show; });
    const person = walker();
    if (show && person && blockedBy(upperMeshes, person.x, person.z, WALK_RADIUS)) {
      TV.upperStool.traverse(object => { object.visible = false; });
      notify('你目前站在座椅的位置，請先走開再加入活動椅。');
      return false;
    }
    notify(TV.config.openIsland ? (show?'已加入東側活動椅；南端通道仍保持淨空。':'已收起東側活動椅。') : (show ? '已加入冰箱前比較用活動椅；可比較開門與通行空間。' : '已收起冰箱前活動椅；南端保留局部留膝，座椅預設收起。'));
    emitStateEvent('tvrotationend');
    return getState();
  }

  // Seated previews are camera studies in model mode. Walk mode owns its 165 cm eye height.
  function viewSeat(seat) {
    if (!['living', 'island'].includes(seat)) return false;
    window.HOME_TOUR?.setMode('model');
    V.selectRoom(seat === 'living' ? 'living' : 'island');
    window.HOME_TOUR?.setMode('model');
    const cut = document.getElementById('cut'), ceiling = document.getElementById('ceiling');
    if (cut?.checked) { cut.checked = false; cut.dispatchEvent(new Event('change')); }
    if (ceiling && !ceiling.checked) { ceiling.checked = true; ceiling.dispatchEvent(new Event('change')); }
    const point = TV.config.seatPoints?.[seat] || (seat === 'living' ? [947, 590, 116] : [396, 614, 125]);
    V.camera.position.copy(V.pos(...point));
    V.camera.fov = 55;
    V.camera.updateProjectionMatrix();
    V.camera.lookAt(V.pos(TV.config.axisX, TV.config.axisY, TV.config.screenCenterHeight || 125));
    V.syncWalkCamera();
    preview = seat;
    setTarget(seat);
    notify(TV.config.openIsland ? (seat==='living'?'沙發主座視點105cm；聲道以此座位配置。':'中島西側視點125cm，非固定座椅；活動椅在東側留膝區。') : (seat === 'living' ? '沙發坐姿預覽：視點約 116 cm；真人步行仍為 165 cm。' : '中島坐姿預覽：視點約 125 cm；真人步行仍為 165 cm。'), 6000);
    return getState();
  }

  const panel = document.createElement('section');
  panel.id = 'rotatingTVPanel';
  panel.setAttribute('aria-label', '旋轉電視與座位');
  panel.innerHTML = `
    <button id="rotatingTVToggle" type="button" aria-expanded="false" aria-controls="rotatingTVBody">電視方向 <span id="rotatingTVSummary">客廳 · 0°</span><span aria-hidden="true">⌄</span></button>
    <div id="rotatingTVBody" hidden>
      <div class="tvDirectionRow"><button type="button" data-tv-facing="living">轉向客廳</button><button type="button" data-tv-facing="island">轉向中島</button></div>
      <div class="tvProgress"><progress id="rotatingTVProgress" max="180" value="0" aria-label="電視旋轉角度"></progress><output id="rotatingTVAngle">0°</output></div>
      <div id="rotatingTVStatus" role="status" aria-live="polite"></div>
      <div class="tvSeatRow"><button type="button" data-tv-seat="living">沙發坐姿預覽</button><button type="button" data-tv-seat="island">中島坐姿預覽</button></div>
      <label class="tvStoolCheck"><input id="rotatingTVSecondStool" type="checkbox">${TV.config.openIsland?'中島東側活動椅':'冰箱前比較用活動椅'}</label>
      <p>底櫃固定。轉動時請從旁繞行。</p>
    </div>`;
  canvas.parentElement.appendChild(panel);
  const style = document.createElement('style');
  style.textContent = `
    #rotatingTVPanel{position:absolute;right:14px;top:14px;z-index:9;width:276px;max-width:calc(100% - 28px);color:#ecf3eb;font:12px/1.55 "Microsoft JhengHei",sans-serif;border:1px solid #bdd0c24a;border-radius:10px;background:#14201feb;box-shadow:0 5px 22px #0003;overflow:hidden}
    #rotatingTVPanel button{font-size:12px;background:#253733;color:#ecf3eb;border:1px solid #c6d7cd38;padding:9px 8px;border-radius:6px;line-height:1.4}
    #rotatingTVPanel button:hover{background:#3b5147}#rotatingTVPanel button:focus-visible,#rotatingTVPanel input:focus-visible{outline:2px solid #d5e9b9;outline-offset:2px}
    #rotatingTVPanel button[aria-pressed="true"]{background:#c7d8c6;color:#102a20;border-color:#d5e9b9}
    #rotatingTVPanel #rotatingTVToggle{width:100%;display:flex;gap:10px;align-items:center;border:0;border-radius:0;background:transparent;padding:10px 12px;text-align:left}
    #rotatingTVSummary{margin-left:auto;font-size:11px;color:#d5dfbd}#rotatingTVBody{padding:0 12px 10px;max-height:min(390px,calc(100dvh - 180px));overflow:auto}
    #rotatingTVBody[hidden]{display:none!important}.tvDirectionRow,.tvSeatRow{display:flex;gap:6px}.tvDirectionRow button,.tvSeatRow button{flex:1}.tvSeatRow{margin-top:9px}#rotatingTVPanel .tvSeatRow button{font-size:11px;padding:8px 4px}
    .tvProgress{display:flex;gap:9px;align-items:center;margin:10px 0 5px}.tvProgress progress{width:100%;height:5px;accent-color:#b2cb9d}.tvProgress output{min-width:36px;text-align:right;font-variant-numeric:tabular-nums}
    #rotatingTVStatus{font-size:11px;line-height:1.65;min-height:35px;color:#d2ddcf}#rotatingTVPanel[data-blocked="true"] #rotatingTVStatus{color:#ffdf9c}.tvStoolCheck{display:flex;align-items:center;gap:7px;margin-top:11px;cursor:pointer}.tvStoolCheck input{accent-color:#b2cb9d}#rotatingTVPanel p{font-size:10px;line-height:1.6;color:#b1c1b6;margin:6px 0 0}
    body.walkImmersive #rotatingTVPanel{left:24px;right:auto;top:88px}
    #scenePanel[data-mode="photo"] #rotatingTVPanel,#scenePanel[data-mode="panorama"] #rotatingTVPanel{display:none}
    @media(max-width:760px){#rotatingTVPanel{top:10px;right:10px;width:258px;max-width:calc(100% - 20px)}body.walkImmersive #rotatingTVPanel{left:14px;top:77px;width:260px}#rotatingTVBody{max-height:calc(100dvh - 240px)}}`;
  document.head.appendChild(style);

  const byId = id => document.getElementById(id);
  const collapse = byId('rotatingTVToggle');
  collapse.onclick = () => {
    const body = byId('rotatingTVBody');
    body.hidden = !body.hidden;
    collapse.setAttribute('aria-expanded', String(!body.hidden));
  };
  panel.querySelectorAll('[data-tv-facing]').forEach(button => { button.onclick = () => setTarget(button.dataset.tvFacing); });
  panel.querySelectorAll('[data-tv-seat]').forEach(button => { button.onclick = () => viewSeat(button.dataset.tvSeat); });
  byId('rotatingTVSecondStool').onchange = event => {
    toggleStool(event.target.checked);
    event.target.checked = !!TV.upperStool && visible(TV.upperStool);
  };
  window.addEventListener('roomchange', () => { preview = null; });
  // Native buttons keep Enter/Space, without forwarding camera movement through the panel.
  for (const name of ['pointerdown', 'pointermove', 'pointerup', 'wheel']) panel.addEventListener(name, event => event.stopPropagation());

  function getState() {
    return {
      angle: current / DEG,
      target: target / DEG,
      moving: Math.abs(target - current) > .00001,
      blocked,
      upperStoolVisible: !!TV.upperStool && visible(TV.upperStool),
      facing: Math.abs(current) < .00001 ? 'living' : Math.abs(current - Math.PI) < .00001 ? 'island' : 'turning',
      axis: { x: TV.config.axisX, y: TV.config.axisY },
      seatedPreview: window.HOME_TOUR?.getMode() === 'model' ? preview : null,
      walkEyeHeight: 165,
      rotatingColliderCount: rotatingMeshes.length
    };
  }

  let lastPaintKey='';
  function paint() {
    if (!panel.isConnected) return;
    const state = getState(), degrees = Math.round(state.angle);
    const key=[state.angle,state.target,blocked,state.upperStoolVisible,extraMessage,performance.now()<messageUntil].join('|');
    if(key===lastPaintKey)return;lastPaintKey=key;
    byId('rotatingTVAngle').textContent = degrees + '°';
    byId('rotatingTVProgress').value = state.angle;
    byId('rotatingTVSummary').textContent = (blocked ? '暫停' : state.moving ? '轉動中' : state.facing === 'living' ? '客廳' : '中島') + ' · ' + degrees + '°';
    panel.dataset.blocked = String(blocked);
    byId('rotatingTVSecondStool').checked = state.upperStoolVisible;
    panel.querySelectorAll('[data-tv-facing]').forEach(button => {
      button.setAttribute('aria-pressed', String((button.dataset.tvFacing === 'living' ? 0 : 180) === state.target));
    });
    const message = blocked ? '前方有人，旋轉已暫停。請繞開電視邊緣，讓出空間後會繼續。' : performance.now() < messageUntil && extraMessage ? extraMessage : state.moving ? '正在轉向' + (target ? '中島' : '客廳') + '；可按另一方向返回。' : '已定位，電視朝向' + (target ? '中島' : '客廳') + '。';
    const status = byId('rotatingTVStatus');
    if (status.textContent !== message) status.textContent = message;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min(.05, Math.max(0, (now - last) / 1000)) : 0;
    last = now;
    if(document.hidden)return;
    const before=current;
    if (Math.abs(target - current) > .00001) {
      const distance = Math.min(Math.abs(target - current), SPEED * dt);
      const steps = Math.max(1, Math.ceil(distance / MAX_STEP));
      const increment = Math.sign(target - current) * distance / steps;
      const person = walker();
      blocked = false;
      for (let i = 0; i < steps; i++) {
        const next = current + increment;
        TV.pivot.rotation.y = next;
        TV.pivot.updateMatrixWorld(true);
        if (person && blockedBy(rotatingMeshes, person.x, person.z, WALK_RADIUS + COLLISION_PADDING)) {
          TV.pivot.rotation.y = current;
          TV.pivot.updateMatrixWorld(true);
          blocked = true;
          break;
        }
        current = next;
      }
      if (Math.abs(target - current) < .00001) {
        current = target;
        TV.pivot.rotation.y = target;
        TV.pivot.updateMatrixWorld(true);
        blocked = false;
        emitStateEvent('tvrotationend');
      }
    }
    if(current!==before)window.HOME_REALISM?.invalidate(true,true);
    if (now - lastPaint > 80) { paint(); lastPaint = now; }
  }

  if (TV.upperStool) TV.upperStool.traverse(object => { object.visible = false; });
  window.HOME_ROTATING_TV_CONTROLS = { getState, setTarget, toggleStool, viewSeat, blocksPoint: dynamicBlocksPoint };
  paint();
  requestAnimationFrame(frame);
})();
