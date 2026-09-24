'use strict';
// Do not render intermediate palettes while the ordered scene modules are loading.
window.HOME_BOOT_PENDING = true;
(() => {
  const message = document.createElement('div');
  message.id = 'viewerLoading';
  message.setAttribute('role', 'status');
  message.textContent = '正在載入空間…';
  message.style.cssText = 'position:fixed;inset:0;z-index:10000;display:grid;place-items:center;background:#151c1b;color:#d4e0d9;font:16px system-ui;pointer-events:none';
  document.body.append(message);
  let failed = false;
  window.addEventListener('error', event => {
    if (event.message?.startsWith('ResizeObserver loop')) return;
    if (window.HOME_BOOT_PENDING && (event.message || event.target?.tagName === 'SCRIPT')) {
      failed = true;
      message.textContent = '載入未完成，請重新整理頁面。';
    }
  }, true);
  document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([window.HOME_REALISM?.whenReady, window.HOME_EXTERIOR?.ready, window.HOME_FLOORING?.ready]);
    window.HOME_BOOT_PENDING = false;
    if (!failed && window.HOME_VIEWER && window.HOME_REALISM) {
      window.HOME_REALISM.invalidate();
      message.remove();
    } else {
      message.textContent = '載入未完成，請重新整理頁面。';
    }
  }, { once: true });
})();
