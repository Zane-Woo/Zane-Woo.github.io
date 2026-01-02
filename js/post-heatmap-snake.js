/* Post heatmap snake animation (Butterfly sidebar widget)
 * - Adds a "snake" that moves across heatmap cells
 * - Pauses on hover to avoid annoyance
 * - Safe to re-init (PJAX)
 */

(() => {
  const KEY = '__post_heatmap_snake_inited__'

  function initSnake() {
    const heatmap = document.querySelector('.post-heatmap')
    if (!heatmap) return

    // prevent multiple timers on PJAX
    if (heatmap[KEY]) return
    heatmap[KEY] = true

    const cells = Array.from(heatmap.querySelectorAll('.post-heatmap__day'))
      .filter(el => !el.classList.contains('is-outside'))
    if (cells.length < 20) return

    // Build a serpentine path by columns (matches our CSS: column flow)
    const grid = heatmap.querySelector('.post-heatmap__grid')
    const rowCount = 7
    const colCount = Math.floor(cells.length / rowCount)

    const byIndex = (r, c) => (c * rowCount + r)
    const path = []
    for (let c = 0; c < colCount; c++) {
      if (c % 2 === 0) {
        for (let r = 0; r < rowCount; r++) path.push(cells[byIndex(r, c)])
      } else {
        for (let r = rowCount - 1; r >= 0; r--) path.push(cells[byIndex(r, c)])
      }
    }

    const snakeLen = Math.max(8, Math.min(18, Math.floor(path.length / 18)))
    let head = Math.floor(path.length * 0.6)
    let paused = false

    function clearClasses() {
      for (const el of path) {
        el.classList.remove('snake-seg', 'snake-head')
      }
    }

    function draw() {
      clearClasses()
      for (let i = 0; i < snakeLen; i++) {
        const idx = (head - i + path.length) % path.length
        const el = path[idx]
        if (!el) continue
        el.classList.add('snake-seg')
        if (i === 0) el.classList.add('snake-head')
      }
    }

    function tick() {
      if (!paused) {
        head = (head + 1) % path.length
        draw()
      }
    }

    // Hover pause
    heatmap.addEventListener('mouseenter', () => {
      paused = true
      heatmap.classList.add('is-snake-paused')
      clearClasses()
    })
    heatmap.addEventListener('mouseleave', () => {
      paused = false
      heatmap.classList.remove('is-snake-paused')
      draw()
    })

    // Start
    draw()
    const timer = window.setInterval(tick, 220)

    // Cleanup on navigation (best-effort)
    const cleanup = () => {
      try {
        window.clearInterval(timer)
        clearClasses()
        heatmap[KEY] = false
      } catch (_) {}
    }
    window.addEventListener('beforeunload', cleanup, { once: true })
  }

  // Run now + PJAX hooks if available
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSnake)
  } else {
    initSnake()
  }

  // Butterfly PJAX global hook (if present)
  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', initSnake, 'post_heatmap_snake')
  }
})()


