(function () {
  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function ensureButtonForWrap(wrap) {
    if (!wrap || wrap.getAttribute('data-mermaid-zoom-btn') === '1') return;
    var svg = $('svg', wrap);
    if (!svg) return;

    wrap.setAttribute('data-mermaid-zoom-btn', '1');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mermaid-zoom-btn';
    btn.textContent = '放大';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModalFromWrap(wrap);
    });
    wrap.appendChild(btn);
  }

  function cloneSvg(svg) {
    // 深拷贝一份，避免和页面里的 panzoom 状态互相影响
    var cloned = svg.cloneNode(true);
    // 清理我们的标记
    cloned.removeAttribute('data-panzoom');
    if (cloned.dataset) {
      delete cloned.dataset.panzoom;
      delete cloned.dataset.panzoomInitialZoom;
      delete cloned.dataset.panzoomInitialHeight;
    }
    return cloned;
  }

  function initPanZoomInModal(svg) {
    if (!window.svgPanZoom) return null;
    try {
      var panZoom = window.svgPanZoom(svg, {
        zoomEnabled: true,
        controlIconsEnabled: true,
        fit: true,
        center: true,
        minZoom: 0.1,
        maxZoom: 50,
        zoomScaleSensitivity: 0.25,
        mouseWheelZoomEnabled: true,
        dblClickZoomEnabled: true,
        preventMouseEventsDefault: true
      });
      // 进弹窗后再强制一次，保证完整显示
      setTimeout(function () {
        try {
          panZoom.resize();
          panZoom.fit();
          panZoom.center();
        } catch (e) {}
      }, 0);
      return panZoom;
    } catch (e) {
      return null;
    }
  }

  function openModalFromWrap(wrap) {
    var srcSvg = $('svg', wrap);
    if (!srcSvg) return;

    // 已打开则不重复
    if ($('.mermaid-modal')) return;

    var modal = document.createElement('div');
    modal.className = 'mermaid-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    var panel = document.createElement('div');
    panel.className = 'mermaid-modal__panel';

    var toolbar = document.createElement('div');
    toolbar.className = 'mermaid-modal__toolbar';

    var title = document.createElement('div');
    title.className = 'mermaid-modal__title';
    title.textContent = 'Mermaid 图（支持拖拽/滚轮缩放）';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'mermaid-modal__close';
    closeBtn.textContent = '关闭 (Esc)';

    toolbar.appendChild(title);
    toolbar.appendChild(closeBtn);

    var body = document.createElement('div');
    body.className = 'mermaid-modal__body';

    var canvas = document.createElement('div');
    canvas.className = 'mermaid-modal__canvas';

    var cloned = cloneSvg(srcSvg);
    canvas.appendChild(cloned);
    body.appendChild(canvas);

    panel.appendChild(toolbar);
    panel.appendChild(body);
    modal.appendChild(panel);

    var prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.appendChild(modal);

    var panZoom = initPanZoomInModal(cloned);

    function cleanup() {
      try {
        document.documentElement.style.overflow = prevOverflow;
      } catch (e) {}
      try {
        if (panZoom && typeof panZoom.destroy === 'function') panZoom.destroy();
      } catch (e) {}
      try {
        modal.remove();
      } catch (e) {}
      window.removeEventListener('keydown', onKeyDown, true);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') cleanup();
    }

    closeBtn.addEventListener('click', cleanup);
    modal.addEventListener('click', function (e) {
      // 点击遮罩关闭；点击面板内不关闭
      if (e.target === modal) cleanup();
    });
    window.addEventListener('keydown', onKeyDown, true);
  }

  function enhanceAll() {
    var wraps = $all('#article-container .mermaid-wrap');
    if (!wraps.length) return;
    wraps.forEach(ensureButtonForWrap);
  }

  function init() {
    // Mermaid 异步插入 svg，这里做一次延迟 + 观察
    setTimeout(enhanceAll, 0);
    setTimeout(enhanceAll, 300);

    var container = document.getElementById('article-container') || document.body;
    if (!container || container.getAttribute('data-mermaid-modal-observed') === '1') return;
    container.setAttribute('data-mermaid-modal-observed', '1');

    var obs = new MutationObserver(function () {
      enhanceAll();
    });
    obs.observe(container, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // pjax：页面切换后重新挂按钮
  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', init, 'mermaidModalInit');
  } else {
    document.addEventListener('pjax:complete', init);
  }
})();


