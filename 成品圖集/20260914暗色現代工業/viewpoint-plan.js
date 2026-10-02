/* VP01: project X/Y in centimetres, from the source camera, never AI pixels. */
(() => {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  const ns = 'http://www.w3.org/2000/svg', bounds = [-250, -70, 1480, 1090];
  const svgEl = (tag, attrs = {}) => {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    return node;
  };
  function pose(camera) {
    if (!camera || ![camera.position, camera.target].every(a => Array.isArray(a) && a.length === 3 && a.every(Number.isFinite))) return null;
    const [x, y, height] = camera.position, [tx, ty, tz] = camera.target;
    const distance = Math.hypot(tx - x, ty - y), aspect = camera.aspect;
    if (distance < .001 || !Number.isFinite(camera.fov) || camera.fov <= 0 || camera.fov >= 175 || !Number.isFinite(aspect) || aspect <= 0) return null;
    const pitch = Math.atan2(tz - height, distance);
    // Project the left/right rays at image mid-height onto the plan. Camera
    // pitch matters: tan(verticalFov/2)*aspect/cos(pitch), not vertical FOV.
    const half = Math.atan(Math.tan(camera.fov * Math.PI / 360) * aspect / Math.cos(pitch));
    return {x, y, height, heading: Math.atan2(ty - y, tx - x), half, pitch};
  }
  function draw(layer, camera) {
    layer.replaceChildren();
    const p = pose(camera);
    if (!p) return null;
    layer.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${p.heading * 180 / Math.PI})`);
    const length = 190, endX = length * Math.cos(p.half), endY = length * Math.sin(p.half);
    layer.append(svgEl('path', {d:`M0 0 L${endX} ${-endY} A${length} ${length} 0 0 1 ${endX} ${endY} Z`, fill:'#ffd16b', 'fill-opacity':'.24', stroke:'#a96304', 'stroke-width':'3', 'stroke-dasharray':'8 5'}));
    layer.append(svgEl('path', {d:'M24 0 H142 M126 -13 L143 0 L126 13', fill:'none', stroke:'#8b4600', 'stroke-width':'8', 'stroke-linecap':'round', 'stroke-linejoin':'round'}));
    // Upright mannequin icon; the foot anchor, rather than its head, is at XY.
    const person = svgEl('g', {transform:`rotate(${-p.heading * 180 / Math.PI})`});
    person.append(svgEl('ellipse', {cx:'0', cy:'0', rx:'19', ry:'9', fill:'#fff4d1', stroke:'#342718', 'stroke-width':'3'}));
    person.append(svgEl('path', {d:'M-7 -27 L-9 -3 M7 -27 L9 -3 M-11 -45 L-23 -24 M11 -45 L23 -24', fill:'none', stroke:'#342718', 'stroke-width':'12', 'stroke-linecap':'round'}));
    person.append(svgEl('path', {d:'M-7 -27 L-9 -3 M7 -27 L9 -3 M-11 -45 L-23 -24 M11 -45 L23 -24', fill:'none', stroke:'#ffc24d', 'stroke-width':'7', 'stroke-linecap':'round'}));
    person.append(svgEl('rect', {x:'-12', y:'-49', width:'24', height:'27', rx:'6', fill:'#ffc24d', stroke:'#342718', 'stroke-width':'3'}));
    person.append(svgEl('circle', {cx:'0', cy:'-64', r:'11', fill:'#ffe6ac', stroke:'#342718', 'stroke-width':'3'}));
    layer.append(person);
    return p;
  }
  function create(host) {
    if (!host) return null;
    host.classList.add('viewpointPlan');
    host.innerHTML = '<div class="vpHead"><strong>這張圖從哪裡看？</strong><button type="button" class="vpZoom" aria-pressed="false">放大站位</button></div><svg class="vpMap" role="img" aria-label="照片取景位置平面圖"></svg><div class="vpCaption"><p class="vpLabel" aria-live="polite"></p><p class="vpLegend">人形＝取景位置　箭頭＝面向<br>扇形＝取景方向示意</p><small>模型取景示意；不判斷遮擋與可站立淨空。</small><p class="vpError" hidden>平面圖未能載入，請重新整理。</p></div>';
    const svg = host.querySelector('svg'), bg = svgEl('image', {x:bounds[0], y:bounds[1], width:bounds[2], height:bounds[3]});
    const layer = svgEl('g', {'class':'vpMarker', 'pointer-events':'none'});
    svg.setAttribute('viewBox', bounds.join(' '));
    svg.append(bg, layer);
    const zoom = host.querySelector('.vpZoom'), label = host.querySelector('.vpLabel');
    let current = null, zoomed = false, imageVersion = '';
    const frame = () => {
      const p = pose(current?.camera);
      const rect = zoomed && p ? [Math.max(bounds[0], Math.min(bounds[0] + bounds[2] - 580, p.x - 290)), Math.max(bounds[1], Math.min(bounds[1] + bounds[3] - 470, p.y - 235)), 580, 470] : bounds;
      svg.setAttribute('viewBox', rect.join(' '));
      zoom.setAttribute('aria-pressed', String(zoomed));
      zoom.textContent = zoomed ? '看全屋' : '放大站位';
    };
    zoom.onclick = () => {zoomed = !zoomed; frame();};
    bg.addEventListener('error', () => {host.querySelector('.vpError').hidden = false; layer.style.display = 'none';});
    bg.addEventListener('load', () => {host.querySelector('.vpError').hidden = true; layer.style.display = '';});
    function update(item, version, title) {
      current = item;
      const p = pose(item?.camera);
      host.hidden = !item;
      zoom.disabled = !p;
      if (!item) {layer.replaceChildren(); return;}
      const validVersion = /^v[0-5]$/.test(version);
      if (validVersion && imageVersion !== version) {
        imageVersion = version;
        bg.setAttribute('href', new URL(`plans/${version}-vp01.webp`, base).href);
      }
      draw(layer, validVersion ? item.camera : null);
      const text = p && validVersion ? `${title} · 視點高 ${Math.round(p.height)} cm` : '這張圖尚無可用的取景座標';
      label.textContent = text;
      svg.setAttribute('aria-label', `${text}；人形是取景位置，箭頭是面向。`);
      host.dataset.viewId = item.id || item.key || '';
      frame();
    }
    return {update, svg};
  }
  window.HOME_VIEWPOINT_PLAN = {pose, draw, create, bounds};
})();
