/* 文章热力图贪吃蛇动画 - 优化版
 * 参考: https://inkcodes.com/2024/12/04/给hexo博客添加贪吃蛇热力图/
 * 实现: 在博客文章热力图上叠加贪吃蛇动画
 */

(() => {
  'use strict';

  const CONFIG = {
    SNAKE_LENGTH: 20,        // 蛇的长度
    MOVE_INTERVAL: 100,      // 移动间隔（毫秒），越小越快
    INIT_DELAY: 500,         // 初始化延迟
    COLOR_HEAD: '#ff6b2b',   // 蛇头颜色（橙红色）
    COLOR_BODY: '#4A9EFF',   // 蛇身颜色（蓝色）
  };

  let snakeTimer = null;
  let snakeInstance = null;

  class HeatmapSnake {
    constructor(container) {
      this.container = container;
      this.cells = [];
      this.path = [];
      this.position = 0;
      this.paused = false;
      this.init();
    }

    init() {
      // 获取所有有效的热力图格子（排除占位格子）
      this.cells = Array.from(
        this.container.querySelectorAll('.post-heatmap__day:not(.is-outside)')
      );

      if (this.cells.length < CONFIG.SNAKE_LENGTH) {
        console.warn('热力图格子数量不足，无法显示贪吃蛇');
        return;
      }

      // 构建蛇形路径（之字形）
      this.buildSnakePath();

      // 绑定鼠标悬停事件
      this.bindEvents();

      // 开始动画
      this.start();
    }

    buildSnakePath() {
      // 热力图是按周（列）排列的，每周7天（行）
      const DAYS_PER_WEEK = 7;
      const weeks = Math.ceil(this.cells.length / DAYS_PER_WEEK);

      this.path = [];

      // 按列遍历，奇数列从上到下，偶数列从下到上（之字形）
      for (let week = 0; week < weeks; week++) {
        const startIdx = week * DAYS_PER_WEEK;
        const endIdx = Math.min(startIdx + DAYS_PER_WEEK, this.cells.length);

        if (week % 2 === 0) {
          // 偶数列：从上到下
          for (let i = startIdx; i < endIdx; i++) {
            this.path.push(this.cells[i]);
          }
        } else {
          // 奇数列：从下到上
          for (let i = endIdx - 1; i >= startIdx; i--) {
            this.path.push(this.cells[i]);
          }
        }
      }
    }

    draw() {
      if (this.paused) return;

      // 清除所有蛇的样式
      this.path.forEach(cell => {
        cell.classList.remove('snake-head', 'snake-body');
        cell.style.removeProperty('--snake-opacity');
      });

      // 绘制蛇身（渐变透明度）
      for (let i = 0; i < CONFIG.SNAKE_LENGTH; i++) {
        const idx = (this.position - i + this.path.length) % this.path.length;
        const cell = this.path[idx];

        if (i === 0) {
          // 蛇头
          cell.classList.add('snake-head');
        } else {
          // 蛇身，透明度递减
          const opacity = 1 - (i / CONFIG.SNAKE_LENGTH) * 0.7;
          cell.classList.add('snake-body');
          cell.style.setProperty('--snake-opacity', opacity.toFixed(2));
        }
      }
    }

    move() {
      this.position = (this.position + 1) % this.path.length;
      this.draw();
    }

    start() {
      if (snakeTimer) return;

      this.draw();
      snakeTimer = setInterval(() => this.move(), CONFIG.MOVE_INTERVAL);
    }

    pause() {
      this.paused = true;
      // 清除所有蛇的样式
      this.path.forEach(cell => {
        cell.classList.remove('snake-head', 'snake-body');
        cell.style.removeProperty('--snake-opacity');
      });
    }

    resume() {
      this.paused = false;
      this.draw();
    }

    destroy() {
      if (snakeTimer) {
        clearInterval(snakeTimer);
        snakeTimer = null;
      }
      // 清除所有蛇的样式
      this.path.forEach(cell => {
        cell.classList.remove('snake-head', 'snake-body');
        cell.style.removeProperty('--snake-opacity');
      });
    }

    bindEvents() {
      this.container.addEventListener('mouseenter', () => this.pause());
      this.container.addEventListener('mouseleave', () => this.resume());
    }
  }

  function initSnake() {
    // 清理旧实例
    if (snakeInstance) {
      snakeInstance.destroy();
      snakeInstance = null;
    }

    // 查找热力图容器
    const heatmapGrid = document.querySelector('.post-heatmap__grid');
    if (!heatmapGrid) return;

    // 延迟初始化，确保 DOM 完全加载
    setTimeout(() => {
      snakeInstance = new HeatmapSnake(heatmapGrid);
    }, CONFIG.INIT_DELAY);
  }

  // 页面加载时初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSnake);
  } else {
    initSnake();
  }

  // PJAX 兼容
  if (typeof btf !== 'undefined' && btf.addGlobalFn) {
    btf.addGlobalFn('pjaxComplete', initSnake, 'post_heatmap_snake');
  }
})();

