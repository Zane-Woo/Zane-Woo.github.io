/* 文章热力图贪吃蛇动画 - 穿越版
 * 实现: 蛇从上往下走，到底部后从下一列顶部出现（上下联通）
 */

(() => {
  'use strict';

  const CONFIG = {
    SNAKE_LENGTH: 7,         // 蛇的长度（刚好一列）
    MOVE_INTERVAL: 120,      // 移动间隔（毫秒）
    INIT_DELAY: 500,         // 初始化延迟
  };

  let snakeTimer = null;
  let snakeInstance = null;

  class HeatmapSnake {
    constructor(container) {
      this.container = container;
      this.grid = [];     // 二维网格 [col][row]
      this.cols = 0;
      this.rows = 7;      // 一周7天
      this.position = { col: 0, row: 0 };
      this.paused = false;
      this.init();
    }

    init() {
      // 获取所有有效的热力图格子（排除占位格子）
      const allCells = Array.from(
        this.container.querySelectorAll('.post-heatmap__day')
      );

      if (allCells.length < CONFIG.SNAKE_LENGTH) {
        console.warn('热力图格子数量不足，无法显示贪吃蛇');
        return;
      }

      // 构建二维网格（按列优先，因为 CSS grid 是 column-flow）
      this.buildGrid(allCells);

      // 绑定鼠标悬停事件
      this.bindEvents();

      // 开始动画
      this.start();
    }

    buildGrid(allCells) {
      // 热力图是列优先排列的
      // 每列7个格子（一周7天）
      this.cols = Math.ceil(allCells.length / this.rows);
      this.grid = [];

      for (let col = 0; col < this.cols; col++) {
        this.grid[col] = [];
        for (let row = 0; row < this.rows; row++) {
          const idx = col * this.rows + row;
          if (idx < allCells.length) {
            const cell = allCells[idx];
            // 标记是否是有效格子
            const isValid = !cell.classList.contains('is-outside');
            this.grid[col][row] = { el: cell, valid: isValid };
          }
        }
      }
    }

    // 获取蛇身的所有位置（向上回溯）
    getSnakePositions() {
      const positions = [];
      let { col, row } = this.position;

      for (let i = 0; i < CONFIG.SNAKE_LENGTH; i++) {
        positions.push({ col, row });
        
        // 向上移动一格（反向追溯蛇身）
        row--;
        if (row < 0) {
          row = this.rows - 1;
          col--;
          if (col < 0) {
            col = this.cols - 1;
          }
        }
      }

      return positions;
    }

    clearAllStyles() {
      // 清除所有格子的蛇样式
      for (let col = 0; col < this.cols; col++) {
        for (let row = 0; row < this.rows; row++) {
          if (this.grid[col] && this.grid[col][row]) {
            const cell = this.grid[col][row].el;
            cell.classList.remove('snake-head', 'snake-body');
            cell.style.removeProperty('--snake-opacity');
          }
        }
      }
    }

    draw() {
      if (this.paused) return;

      // 清除所有蛇的样式
      this.clearAllStyles();

      // 获取蛇的所有位置
      const positions = this.getSnakePositions();

      // 绘制蛇身（渐变透明度）
      positions.forEach((pos, i) => {
        const cellData = this.grid[pos.col]?.[pos.row];
        if (!cellData || !cellData.valid) return;

        const cell = cellData.el;

        if (i === 0) {
          // 蛇头
          cell.classList.add('snake-head');
        } else {
          // 蛇身，透明度递减
          const opacity = 1 - (i / CONFIG.SNAKE_LENGTH) * 0.7;
          cell.classList.add('snake-body');
          cell.style.setProperty('--snake-opacity', opacity.toFixed(2));
        }
      });
    }

    move() {
      // 向下移动一格
      this.position.row++;
      
      // 到达底部，穿越到下一列的顶部
      if (this.position.row >= this.rows) {
        this.position.row = 0;
        this.position.col++;
        
        // 到达最右边，回到最左边
        if (this.position.col >= this.cols) {
          this.position.col = 0;
        }
      }

      this.draw();
    }

    start() {
      if (snakeTimer) return;

      // 从中间位置开始
      this.position = { col: Math.floor(this.cols / 2), row: 0 };
      
      this.draw();
      snakeTimer = setInterval(() => this.move(), CONFIG.MOVE_INTERVAL);
    }

    pause() {
      this.paused = true;
      this.clearAllStyles();
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
      this.clearAllStyles();
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

