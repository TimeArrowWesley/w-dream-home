'use strict';
// PM01: reviewed integration of the owner's supplied plan-measure.js.
// The orthographic model plan and SVG share centimetres. Original PDF images
// are only visually registered; they must not inherit this calibration.
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  const length = points => points.slice(1).reduce((sum, p, i) => sum + distance(points[i], p), 0);
  const axis = (from, to, locked) => !locked || !from ? to :
    Math.abs(to[0] - from[0]) >= Math.abs(to[1] - from[1]) ? [to[0], from[1]] : [from[0], to[1]];
  const rounded = value => Math.round(value).toLocaleString('zh-TW');
  const copy = points => points.map(p => p.slice());

  function boot() {
    const svg = document.getElementById('floorplan'), tour = window.HOME_TOUR;
    if (!svg || !tour || svg.dataset.measureReady) return;
    svg.dataset.measureReady = 'pm01';
    let on = false, points = [], completed = [], rawHover = null, hover = null;
    let shift = false, alt = false, endpointSnap = false;
    const mk = (tag, attrs = {}, text = '') => {
      const el = document.createElementNS(NS, tag);
      for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
      el.textContent = text; return el;
    };
    const layer = mk('g', {id: 'planMeasure', 'pointer-events': 'none'});
    const done = mk('g'), live = mk('g'); layer.append(done, live); svg.append(layer);
    const toolbar = document.createElement('section'); toolbar.id = 'pmToolbar';
    toolbar.setAttribute('aria-label', '平面圖測距');
    toolbar.innerHTML = '<div class="pmActions"><button type="button" id="pmToggle" aria-pressed="false">測量距離</button>' +
      '<button type="button" id="pmFinish" disabled>完成此線</button><button type="button" id="pmUndo" disabled>退一點</button>' +
      '<button type="button" id="pmClear" disabled>清除</button>' +
      '<label class="pmLock"><input type="checkbox" id="pmLock">鎖水平／垂直</label></div>' +
      '<p id="pmReadout" role="status" aria-live="polite"></p>' +
      '<details class="pmHelp"><summary>操作與尺寸說明</summary><p>右鍵定起點，左鍵連續加點；按「完成此線」或雙擊保留。Shift 鎖軸，Alt 暫停端點吸附，Backspace 退一點，Esc 取消本線／退出。手機先按「測量距離」。</p><p>單位 cm；僅量目前模型，手動選點有誤差。只吸附已畫的端點，不吸附舊家具資料。原始圖尚未校準，不能在此量測。線段僅保留於本頁，重新整理即清除。</p></details>';
    svg.parentElement.before(toolbar);
    const $ = id => toolbar.querySelector('#' + id);
    const isModel = () => tour.getSource() === 'model';
    const style = document.createElement('style'); style.textContent = `
#pmToolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 12px;margin:8px 0;padding:8px 10px;border:1px solid #485b53;border-radius:8px;background:#1e2b26;color:#e4eee8;font:13px/1.5 system-ui,sans-serif}
#pmToolbar .pmActions{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#pmToolbar button{font:inherit;padding:7px 10px;min-height:34px;border:1px solid #677e70;background:#26382e;color:#edf6f0;border-radius:6px;cursor:pointer}
#pmToolbar button[aria-pressed=true]{background:#c5d8c9;color:#17281f}
#pmToolbar button:disabled{opacity:.45;cursor:default}
#pmToolbar .pmLock{display:flex;align-items:center;gap:6px;margin:0 4px}
#pmToolbar input{accent-color:#c5d8c9;width:16px;height:16px}
#pmReadout{margin:4px 0;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
#pmToolbar .pmHelp{font-size:12px;color:#bbc9c0}
#pmToolbar .pmHelp[open]{grid-column:1/-1}
#pmToolbar .pmHelp summary{cursor:pointer}
#pmToolbar .pmHelp p{margin:5px 0}
#floorplan.pmOn{cursor:crosshair;touch-action:manipulation}
#floorplan.pmOn #hotspots,#floorplan.pmOn #cameraPin{visibility:hidden}
body.uiApp #uiMapDialog:has(#pmToolbar) #planstage{height:min(54dvh,620px)}
@media(max-width:600px){#pmToolbar button{min-height:42px}#pmToolbar{padding:8px;grid-template-columns:minmax(0,1fr)}body.uiApp #uiMapDialog:has(#pmToolbar) #planstage{height:auto;min-height:0;aspect-ratio:1480/1090}}
`;
    document.head.append(style);

    function localPoint(event) {
      const matrix = svg.getScreenCTM();
      if (!matrix) return null;
      try {
        const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
        const q = point.matrixTransform(matrix.inverse());
        return Number.isFinite(q.x) && Number.isFinite(q.y) && q.x >= -250 && q.x <= 1230 && q.y >= -70 && q.y <= 1020 ? [q.x, q.y] : null;
      } catch (_) { return null; }
    }
    function resolve(point) {
      endpointSnap = false;
      if (!point) return null;
      const from = points[points.length - 1], locked = shift || $('pmLock').checked;
      const result = axis(from, point, locked), matrix = svg.getScreenCTM();
      if (!alt && matrix) {
        let best = 6, chosen = null;
        // Local finite segments/points, not infinite x/y lines from stale HOME_DATA.
        for (const target of [...points, ...completed.flat()]) {
          if (locked && from && Math.abs(axis(from, target, true)[0] - target[0]) + Math.abs(axis(from, target, true)[1] - target[1]) > .001) continue;
          const dx = target[0] - result[0], dy = target[1] - result[1];
          const pixels = Math.hypot(matrix.a * dx + matrix.c * dy, matrix.b * dx + matrix.d * dy);
          if (pixels < best && Math.hypot(dx, dy) <= 5) { chosen = target; best = pixels; }
        }
        if (chosen) { endpointSnap = true; return chosen.slice(); }
      }
      return result;
    }
    function label(target, point, text) {
      target.append(mk('text', {x: point[0], y: point[1], 'text-anchor': 'middle', fill:'#fff', stroke:'#12201a', 'stroke-width':5,
        'paint-order':'stroke fill', 'stroke-linejoin':'round', 'font-family':'system-ui,sans-serif', 'font-size':20, 'font-weight':600}, text));
    }
    function draw(target, chain) {
      if (!chain.length) return;
      target.append(mk('polyline', {points:chain.map(p=>p.join(',')).join(' '), fill:'none', stroke:'#e06432', 'stroke-width':2.5, 'vector-effect':'non-scaling-stroke'}));
      chain.forEach(p=>target.append(mk('circle', {cx:p[0], cy:p[1], r:5, fill:'#e06432', stroke:'#fff', 'stroke-width':1.5})));
      chain.slice(1).forEach((p,i)=>label(target, [(p[0]+chain[i][0])/2,(p[1]+chain[i][1])/2-12], rounded(distance(chain[i],p))+' cm'));
      if (chain.length > 2) label(target, [chain.at(-1)[0],chain.at(-1)[1]+28], '總長 '+rounded(length(chain))+' cm');
    }
    function readout(chain) {
      let message;
      if (!isModel()) message = '原始圖尚未校準，請切回「裝潢平面」測距。';
      else if (chain.length > 1) message = '本段 '+rounded(distance(chain.at(-2),chain.at(-1)))+' cm · 總長 '+rounded(length(chain))+' cm'+(endpointSnap?' · 端點吸附':'')+'（模型參考）';
      else if (on) message = points.length ? '已定起點，點下一點。模型參考尺寸，非現場實測。' : '點選起點。模型參考尺寸，非現場實測。';
      else message = '模型參考尺寸，非現場實測。右鍵或按鈕開始。';
      if ($('pmReadout').textContent !== message) $('pmReadout').textContent = message;
    }
    function render(preview = true) {
      hover = on && points.length && preview ? resolve(rawHover) : null;
      live.replaceChildren(); draw(live, hover ? [...points,hover] : points);
      $('pmToggle').disabled = !isModel(); $('pmToggle').textContent = on ? '退出測距' : '測量距離';
      $('pmToggle').setAttribute('aria-pressed', String(on)); $('pmFinish').disabled = !on || points.length < 2;
      $('pmUndo').disabled = !on || !points.length; $('pmClear').disabled = !points.length && !completed.length;
      $('pmLock').disabled = !isModel();
      readout(points.length ? (hover ? [...points,hover] : points) : completed.at(-1) || []);
    }
    function setOn(value) {
      on = Boolean(value) && isModel();
      if (!on) { points = []; rawHover = hover = null; shift = alt = false; }
      svg.classList.toggle('pmOn',on); render();
    }
    function finish() {
      if (points.length > 1) { completed.push(copy(points)); draw(done,points); }
      points = []; rawHover = null; render(false);
    }
    function clear() { completed = []; points = []; rawHover = null; done.replaceChildren(); render(false); }
    function add(point) {
      if (!point || points.length && distance(points.at(-1),point)<.01) return;
      points.push(point); rawHover = null; render(false);
    }
    const stop = e => { e.preventDefault(); e.stopImmediatePropagation(); };
    $('pmToggle').onclick = () => setOn(!on);
    $('pmFinish').onclick = finish;
    $('pmUndo').onclick = () => { points.pop(); rawHover = null; render(false); };
    $('pmClear').onclick = clear;
    $('pmLock').onchange = () => render();
    svg.addEventListener('contextmenu', e => {
      if (!isModel()) return;
      const p = localPoint(e); if (!p) return;
      stop(e); shift = e.shiftKey; alt = e.altKey;
      if (!on) setOn(true);
      if (points.length > 1) finish();
      else { add(resolve(p)); if (points.length > 1) finish(); }
    });
    svg.addEventListener('click', e => {
      if (!on) return; stop(e);
      if (e.detail > 1) return; // dblclick's second click must not add a zero-length segment.
      shift = e.shiftKey; alt = e.altKey; add(resolve(localPoint(e)));
    }, true);
    svg.addEventListener('dblclick', e => { if(on) { stop(e); finish(); } }, true);
    svg.addEventListener('pointermove', e => { if(on && points.length && e.pointerType !== 'touch') {shift=e.shiftKey; alt=e.altKey; rawHover=localPoint(e); render();} });
    svg.addEventListener('pointerleave', () => {rawHover=null; if(on) render(false);});
    svg.addEventListener('keydown', e => { if(on && ['Enter',' '].includes(e.key)) stop(e); }, true);
    window.addEventListener('keydown', e => {
      if (!on || e.target?.closest?.('input,textarea,select,[contenteditable=true]')) return;
      if(e.key==='Shift' || e.key==='Alt') {shift=e.shiftKey; alt=e.altKey; render();}
      if(e.key==='Escape') {stop(e); if(points.length) {points=[];rawHover=null;render(false);} else setOn(false);}
      if(e.key==='Backspace') {stop(e);points.pop();rawHover=null;render(false);}
    }, true);
    window.addEventListener('keyup', e => {if(e.key==='Shift'||e.key==='Alt') {shift=e.shiftKey;alt=e.altKey;if(on)render();}});
    window.addEventListener('blur', () => {shift=alt=false;rawHover=null;if(on)render(false);});
    function sourceChanged() {
      layer.style.display = isModel() ? '' : 'none';
      if(!isModel()) setOn(false); else render(false);
    }
    window.addEventListener('plansourcechange',sourceChanged);
    document.getElementById('uiMapDialog')?.addEventListener('close',()=>setOn(false));
    document.getElementById('uiRoomsTab')?.addEventListener('click',()=>setOn(false));
    window.HOME_PLAN_MEASURE = {
      on:()=>on,setOn,clear,finish,points:()=>copy(points),completed:()=>completed.map(copy),
      prepareExport(clone) {
        const out=clone.querySelector('#planMeasure'); if(!out)return;
        out.replaceChildren(); clone.classList.remove('pmOn');
        if(!isModel()) {out.remove();return;}
        for(const chain of completed)draw(out,chain);
        if(points.length>1)draw(out,points);
        if(completed.length||points.length>1)label(out,[490,-38],'模型參考尺寸 · 單位 cm · 非現場實測');
      }
    };
    sourceChanged();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
