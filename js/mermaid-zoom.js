/**
 * Mermaid 图表缩放和拖拽增强模块
 * 为所有 Mermaid SVG 图表添加交互功能
 * - Ctrl + 滚轮缩放
 * - 鼠标拖拽平移
 * - 双击重置
 * - 触摸屏支持
 */

(function() {
  'use strict';

  // 配置项
  const CONFIG = {
    minScale: 0.3,        // 最小缩放比例
    maxScale: 5,          // 最大缩放比例
    zoomSpeed: 0.1,       // 缩放速度
    enableTouch: true,    // 启用触摸支持
    requireCtrl: false,   // 是否需要按住 Ctrl 才能缩放（false = 直接滚轮缩放）
    cursorDrag: 'grab',   // 拖拽时的光标样式
    cursorDragging: 'grabbing'
  };

  class MermaidZoom {
    constructor(container) {
      this.container = container;
      this.svg = container.querySelector('svg');
      if (!this.svg) return;

      // 变换状态
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;

      // 拖拽状态
      this.isDragging = false;
      this.startX = 0;
      this.startY = 0;

      // 触摸状态
      this.lastTouchDistance = 0;

      this.init();
    }

    init() {
      // 设置容器样式
      this.container.style.overflow = 'hidden';
      this.container.style.position = 'relative';
      this.container.style.cursor = CONFIG.cursorDrag;
      this.container.style.userSelect = 'none';
      this.container.style.touchAction = 'none';

      // 设置 SVG 样式
      this.svg.style.transition = 'transform 0.1s ease-out';
      this.svg.style.transformOrigin = '0 0';

      // 绑定事件
      this.bindEvents();

      // 添加工具提示
      this.addToolbar();
    }

    bindEvents() {
      // 鼠标滚轮缩放
      this.container.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

      // 鼠标拖拽
      this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.container.addEventListener('mouseleave', this.handleMouseUp.bind(this));

      // 双击重置
      this.container.addEventListener('dblclick', this.reset.bind(this));

      // 触摸支持
      if (CONFIG.enableTouch) {
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
      }
    }

    // 滚轮缩放
    handleWheel(e) {
      // 根据配置决定是否需要 Ctrl 键
      if (CONFIG.requireCtrl && !e.ctrlKey) return;
      
      e.preventDefault();

      const rect = this.container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 计算缩放前的 SVG 坐标
      const svgX = (mouseX - this.translateX) / this.scale;
      const svgY = (mouseY - this.translateY) / this.scale;

      // 计算新的缩放比例
      const delta = e.deltaY > 0 ? -CONFIG.zoomSpeed : CONFIG.zoomSpeed;
      const newScale = Math.min(Math.max(this.scale * (1 + delta), CONFIG.minScale), CONFIG.maxScale);

      // 计算新的平移量（保持鼠标位置不变）
      this.translateX = mouseX - svgX * newScale;
      this.translateY = mouseY - svgY * newScale;
      this.scale = newScale;

      this.updateTransform();
    }

    // 鼠标按下
    handleMouseDown(e) {
      if (e.button !== 0) return; // 只响应左键
      
      this.isDragging = true;
      this.startX = e.clientX - this.translateX;
      this.startY = e.clientY - this.translateY;
      this.container.style.cursor = CONFIG.cursorDragging;
      this.svg.style.transition = 'none'; // 拖拽时禁用动画
      
      e.preventDefault();
    }

    // 鼠标移动
    handleMouseMove(e) {
      if (!this.isDragging) return;

      this.translateX = e.clientX - this.startX;
      this.translateY = e.clientY - this.startY;
      this.updateTransform();
    }

    // 鼠标释放
    handleMouseUp() {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      this.container.style.cursor = CONFIG.cursorDrag;
      this.svg.style.transition = 'transform 0.1s ease-out';
    }

    // 触摸开始
    handleTouchStart(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        this.lastTouchDistance = this.getTouchDistance(e.touches);
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.isDragging = true;
        this.startX = touch.clientX - this.translateX;
        this.startY = touch.clientY - this.translateY;
      }
    }

    // 触摸移动
    handleTouchMove(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = this.getTouchDistance(e.touches);
        const delta = (currentDistance - this.lastTouchDistance) * 0.01;
        
        const newScale = Math.min(Math.max(this.scale * (1 + delta), CONFIG.minScale), CONFIG.maxScale);
        this.scale = newScale;
        this.lastTouchDistance = currentDistance;
        
        this.updateTransform();
      } else if (e.touches.length === 1 && this.isDragging) {
        const touch = e.touches[0];
        this.translateX = touch.clientX - this.startX;
        this.translateY = touch.clientY - this.startY;
        this.updateTransform();
      }
    }

    // 触摸结束
    handleTouchEnd(e) {
      if (e.touches.length < 2) {
        this.lastTouchDistance = 0;
      }
      if (e.touches.length === 0) {
        this.isDragging = false;
      }
    }

    // 计算两点触摸距离
    getTouchDistance(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    // 更新变换
    updateTransform() {
      this.svg.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
      
      // 更新工具栏显示
      if (this.scaleDisplay) {
        this.scaleDisplay.textContent = `${Math.round(this.scale * 100)}%`;
      }
    }

    // 重置
    reset() {
      this.scale = 1;
      this.translateX = 0;
      this.translateY = 0;
      this.svg.style.transition = 'transform 0.3s ease-out';
      this.updateTransform();
      
      setTimeout(() => {
        this.svg.style.transition = 'transform 0.1s ease-out';
      }, 300);
    }

    // 添加工具栏
    addToolbar() {
      const toolbar = document.createElement('div');
      toolbar.className = 'mermaid-zoom-toolbar';
      toolbar.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        gap: 8px;
        align-items: center;
        background: rgba(255, 255, 255, 0.9);
        padding: 6px 12px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        font-size: 12px;
        z-index: 10;
        user-select: none;
      `;

      // 缩放显示
      this.scaleDisplay = document.createElement('span');
      this.scaleDisplay.textContent = '100%';
      this.scaleDisplay.style.cssText = `
        min-width: 45px;
        text-align: center;
        font-weight: bold;
        color: #333;
      `;

      // 放大按钮
      const zoomInBtn = this.createButton('+', () => {
        this.scale = Math.min(this.scale * 1.2, CONFIG.maxScale);
        this.updateTransform();
      });

      // 缩小按钮
      const zoomOutBtn = this.createButton('−', () => {
        this.scale = Math.max(this.scale * 0.8, CONFIG.minScale);
        this.updateTransform();
      });

      // 重置按钮
      const resetBtn = this.createButton('⟲', () => this.reset());

      toolbar.appendChild(zoomOutBtn);
      toolbar.appendChild(this.scaleDisplay);
      toolbar.appendChild(zoomInBtn);
      toolbar.appendChild(resetBtn);

      this.container.appendChild(toolbar);
    }

    // 创建按钮
    createButton(text, onClick) {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.cssText = `
        width: 28px;
        height: 28px;
        border: none;
        background: #fff;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        color: #333;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      btn.onmouseover = () => {
        btn.style.background = '#f0f0f0';
        btn.style.transform = 'scale(1.1)';
      };
      btn.onmouseout = () => {
        btn.style.background = '#fff';
        btn.style.transform = 'scale(1)';
      };
      btn.onclick = onClick;
      
      return btn;
    }
  }

  // 初始化所有 Mermaid 图表
  function initMermaidZoom() {
    const mermaidContainers = document.querySelectorAll('.mermaid-wrap');
    
    mermaidContainers.forEach(container => {
      // 避免重复初始化
      if (container.dataset.zoomInitialized) return;
      
      // 等待 SVG 渲染完成
      const checkSVG = () => {
        const svg = container.querySelector('svg');
        if (svg) {
          new MermaidZoom(container);
          container.dataset.zoomInitialized = 'true';
        } else {
          setTimeout(checkSVG, 100);
        }
      };
      checkSVG();
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMermaidZoom);
  } else {
    initMermaidZoom();
  }

  // 支持 PJAX 动态加载
  if (window.btf && window.btf.addGlobalFn) {
    window.btf.addGlobalFn('pjaxComplete', initMermaidZoom, 'mermaid-zoom');
  }

  // 导出到全局（供手动调用）
  window.initMermaidZoom = initMermaidZoom;

})();








