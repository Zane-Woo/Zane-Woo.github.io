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

      // 目标：默认“完整显示 + 尽量大”
      // - 缩放：按容器宽度 fit-to-width（不被高度强行缩小）
      // - 高度：同步把 svg 高度拉到足以容纳内容（否则看起来像 300x150 的小窗）
      var fitToWidthAndResizeCanvas = function () {
        try {
          // 先确保 svg 有真实布局宽度
          var container = svg.parentElement || svg;
          var w = (container && container.getBoundingClientRect && container.getBoundingClientRect().width) || svg.clientWidth || svg.getBoundingClientRect().width;
          if (!w) return;

          // 优先用 svg-pan-zoom 的 viewBox（更稳定），兜底用 getBBox()
          var sizes = (panZoom.getSizes && panZoom.getSizes()) || null;
          var vb = sizes && sizes.viewBox ? sizes.viewBox : null;
          var contentW = vb && vb.width ? vb.width : 0;
          var contentH = vb && vb.height ? vb.height : 0;

          if (!contentW || !contentH) {
            var viewport = svg.querySelector('.svg-pan-zoom_viewport');
            var bbox = viewport ? viewport.getBBox() : svg.getBBox();
            contentW = bbox && bbox.width ? bbox.width : 0;
            contentH = bbox && bbox.height ? bbox.height : 0;
          }
          if (!contentW || !contentH) return;

          // 留边距，避免贴边
          var zoom = (w / contentW) * 0.98;
          if (zoom < 0.2) zoom = 0.2;
          if (zoom > 20) zoom = 20;

          // 关键：把 svg 高度按内容比例撑开，否则默认高度太小就像“窗口很窄/很小”
          // 高度 = 内容高 * zoom，再加一点点 padding
          var desiredH = contentH * zoom * 1.02;
          if (desiredH && isFinite(desiredH) && desiredH > 0) {
            svg.style.height = desiredH + 'px';
          }

          panZoom.resize();
          panZoom.zoom(zoom);
          panZoom.center();

          svg.dataset.panzoomInitialZoom = String(zoom);
          svg.dataset.panzoomInitialHeight = String(desiredH || '');
        } catch (e) {
          // noop
        }
      };

      // 初始两次：一拍立即 + 一拍等布局稳定
      setTimeout(fitToWidthAndResizeCanvas, 0);
      setTimeout(fitToWidthAndResizeCanvas, 250);

      // resize 时：如果用户没手动缩放（还在初始 zoom 附近），就重新 fit-to-width；否则不打扰
      window.addEventListener('resize', function () {
        try {
          var initial = parseFloat(svg.dataset.panzoomInitialZoom || '');
          if (!initial) return;
          var cur = panZoom.getZoom();
          if (Math.abs(cur - initial) < 0.02) {
            fitToWidthAndResizeCanvas();
          }
        } catch (e) {
          // noop
        }
      });

      // 右侧 RESET 按钮：把它也变成“回到适配视图”
      // svg-pan-zoom 会插入控制按钮，这里简单监听一下 reset click
      svg.addEventListener('click', function (e) {
        try {
          var t = e && e.target;
          if (!t) return;
          if (t.id === 'svg-pan-zoom-reset' || (t.closest && t.closest('#svg-pan-zoom-reset'))) {
            setTimeout(fitToWidthAndResizeCanvas, 0);
          }
        } catch (err) {
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


