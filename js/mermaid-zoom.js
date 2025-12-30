(function () {
  function initOne(svg) {
    if (!window.svgPanZoom) return;
    if (!svg || svg.getAttribute('data-panzoom') === '1') return;
    svg.setAttribute('data-panzoom', '1');

    try {
      var panZoom = window.svgPanZoom(svg, {
        zoomEnabled: true,
        controlIconsEnabled: true,
        fit: true,
        center: true,
        minZoom: 0.2,
        maxZoom: 20,
        zoomScaleSensitivity: 0.3,
        mouseWheelZoomEnabled: true,
        dblClickZoomEnabled: true,
        preventMouseEventsDefault: true
      });

      // Mermaid 渲染 + 布局稳定后再强制 fit/center，避免只显示一角
      var refit = function () {
        try {
          panZoom.resize();
          panZoom.fit();
          panZoom.center();
        } catch (e) {
          // noop
        }
      };
      setTimeout(refit, 0);
      setTimeout(refit, 250);
      window.addEventListener('resize', refit);
    } catch (e) {
      // noop
    }
  }

  function init() {
    if (!window.svgPanZoom) return;

    // Butterfly 渲染 Mermaid 时，svg 可能异步插入；这里主动扫描一次
    var svgs = document.querySelectorAll('.mermaid-wrap svg');
    if (svgs && svgs.length) {
      svgs.forEach(initOne);
    }

    // 再用 MutationObserver 兜底，保证“后插入”的 svg 也能初始化
    var container = document.getElementById('article-container') || document.body;
    if (!container || container.getAttribute('data-mermaid-observed') === '1') return;
    container.setAttribute('data-mermaid-observed', '1');

    var obs = new MutationObserver(function () {
      var list = document.querySelectorAll('.mermaid-wrap svg');
      if (!list || !list.length) return;
      list.forEach(initOne);
    });

    obs.observe(container, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Butterfly 开了 pjax：页面切换后需要重新绑定
  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', init, 'mermaidPanZoomInit');
  } else {
    // 兜底（不同 pjax 实现的事件名可能不同）
    document.addEventListener('pjax:complete', init);
  }
})();


