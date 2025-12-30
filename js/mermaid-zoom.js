(function () {
  function initOne(svg) {
    if (!window.svgPanZoom) return;
    if (!svg || svg.getAttribute('data-panzoom') === '1') return;
    svg.setAttribute('data-panzoom', '1');

    try {
      var panZoom = window.svgPanZoom(svg, {
        zoomEnabled: true,
        controlIconsEnabled: true,
        fit: false,
        center: false,
        minZoom: 0.2,
        maxZoom: 20,
        zoomScaleSensitivity: 0.3,
        mouseWheelZoomEnabled: true,
        dblClickZoomEnabled: true,
        preventMouseEventsDefault: true
      });

      // Mermaid 的 SVG 往往 viewBox 很大 + 还有留白；用 fit() 会同时约束高度，导致初始“窗口很小”
      // 这里改成“按宽度铺满”的初始缩放（fit-to-width），再居中。
      var fitToWidth = function () {
        try {
          panZoom.resize();
          var viewport = svg.querySelector('.svg-pan-zoom_viewport');
          var bbox = viewport ? viewport.getBBox() : svg.getBBox();
          var w = svg.clientWidth || svg.getBoundingClientRect().width;
          if (!bbox || !bbox.width || !w) {
            panZoom.fit();
            panZoom.center();
            return;
          }

          // 留一点点边距，避免刚好贴边
          var zoom = (w / bbox.width) * 0.98;
          if (zoom < 0.2) zoom = 0.2;
          if (zoom > 20) zoom = 20;

          panZoom.zoom(zoom);
          panZoom.center();
          svg.dataset.panzoomInitialZoom = String(zoom);
        } catch (e) {
          // noop
        }
      };

      // 初始两次：一拍立即 + 一拍等布局稳定
      setTimeout(fitToWidth, 0);
      setTimeout(fitToWidth, 250);

      // resize 时：如果用户没手动缩放（还在初始 zoom 附近），就重新 fit-to-width；否则不打扰
      window.addEventListener('resize', function () {
        try {
          panZoom.resize();
          var initial = parseFloat(svg.dataset.panzoomInitialZoom || '');
          if (!initial) return;
          var cur = panZoom.getZoom();
          if (Math.abs(cur - initial) < 0.02) {
            fitToWidth();
          }
        } catch (e) {
          // noop
        }
      });
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


