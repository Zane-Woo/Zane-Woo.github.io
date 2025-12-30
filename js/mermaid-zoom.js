(function () {
  function doInit() {
    if (!window.svgPanZoom) return;

    var svgs = document.querySelectorAll('.mermaid-wrap > svg');
    if (!svgs || !svgs.length) return;

    svgs.forEach(function (svg) {
      if (!svg || svg.getAttribute('data-panzoom') === '1') return;
      svg.setAttribute('data-panzoom', '1');

      try {
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
    // Mermaid 可能会在 DOMReady 后异步渲染 SVG，这里延迟一拍更稳
    setTimeout(doInit, 50);
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


