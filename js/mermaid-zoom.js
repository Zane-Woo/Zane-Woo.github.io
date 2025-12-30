(function () {
  function doInitOnce() {
    if (!window.svgPanZoom) return;

    // Butterfly 渲染 Mermaid 时，svg 通常不是 mermaid-wrap 的直接子元素
    var svgs = document.querySelectorAll('.mermaid-wrap svg');
    if (!svgs || !svgs.length) return;

    svgs.forEach(function (svg) {
      if (!svg || svg.getAttribute('data-panzoom') === '1') return;
      svg.setAttribute('data-panzoom', '1');

      try {
        // 避免 svg 被布局挤压/不可点击
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';

        window.svgPanZoom(svg, {
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
      } catch (e) {
        // noop
      }
    });
  }

  function init() {
    // Mermaid 是异步渲染：这里做短暂重试，直到 svg 出现
    var maxTry = 20;
    var tryCount = 0;

    var tick = function () {
      tryCount += 1;
      doInitOnce();

      var hasSvg = document.querySelectorAll('.mermaid-wrap svg').length > 0;
      if (!hasSvg && tryCount < maxTry) {
        setTimeout(tick, 150);
      }
    };

    setTimeout(tick, 50);
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


