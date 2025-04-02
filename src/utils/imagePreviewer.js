/**
 * 图片预览功能
 * @param {string} blobUrl - 图片的Blob URL
 * @param {object} options - 配置选项
 * @param {number} [options.maxScale=10] - 最大缩放比例
 * @param {number} [options.minScale=0.1] - 最小缩放比例
 * @param {string} [options.bgColor='rgba(0,0,0,0.7)'] - 背景颜色
 * @returns {{close: function}} 返回包含关闭方法的对象
 */
export function showImagePreview(blobUrl, options = {}) {
  // 合并默认配置和用户配置
  const config = {
    maxScale: 10,
    minScale: 0.1,
    bgColor: 'rgba(0,0,0,0.7)',
    ...options
  };

  // 保存原始状态
  const originalOverflow = document.body.style.overflow;
  const originalPaddingRight = document.body.style.paddingRight;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  // 创建预览容器
  const previewContainer = document.createElement('div');
  previewContainer.id = 'image-preview-container';
  
  // 设置预览容器样式
  Object.assign(previewContainer.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: config.bgColor,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '9999',
    overflow: 'hidden'
  });

  // 创建图片元素
  const img = document.createElement('img');
  img.src = blobUrl;
  img.draggable = false; // 禁止默认拖拽行为
  
  // 设置图片样式
  Object.assign(img.style, {
    maxWidth: '90%',
    maxHeight: '90%',
    transition: 'transform 0.1s ease',
    transformOrigin: 'center center',
    cursor: 'grab',
    userSelect: 'none',
    pointerEvents: 'auto' // 确保图片可以接收事件
  });

  // 初始状态
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let touchStartDistance = 0;

  // 应用当前变换
  const applyTransform = () => {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  };

  // 滚轮缩放
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    scale *= delta > 0 ? 1.1 : 0.9;
    scale = Math.max(config.minScale, Math.min(scale, config.maxScale));
    applyTransform();
  };

  // 点击关闭
  const handleContainerClick = (e) => {
    if (e.target === previewContainer && !isDragging) {
      closePreview();
    }
  };

  // 双击重置
  const handleDoubleClick = () => {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  };

  // 鼠标拖拽 - 开始
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // 只响应左键
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    img.style.cursor = 'grabbing';
  };

  // 鼠标拖拽 - 移动
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyTransform();
  };

  // 修改后的鼠标拖拽结束逻辑
  const handleMouseUp = (e) => {
    // 防止鼠标抬起事件冒泡触发点击事件
    e.stopPropagation();
    
    isDragging = false;
    img.style.cursor = 'grab';
    
    // 添加一个小延迟，确保点击事件能正确判断isDragging状态
    setTimeout(() => {
      isDragging = false;
    }, 100);
  };

  // 触摸屏支持 - 开始
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  };

  // 触摸屏支持 - 移动
  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging) {
      translateX = e.touches[0].clientX - startX;
      translateY = e.touches[0].clientY - startY;
      applyTransform();
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const touchDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      scale *= touchDistance / touchStartDistance;
      scale = Math.max(config.minScale, Math.min(scale, config.maxScale));
      applyTransform();
      touchStartDistance = touchDistance;
    }
  };

  // 关闭预览
  const closePreview = () => {
    // 移除事件监听器
    previewContainer.removeEventListener('wheel', handleWheel);
    previewContainer.removeEventListener('click', handleContainerClick);
    img.removeEventListener('dblclick', handleDoubleClick);
    img.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    previewContainer.removeEventListener('touchstart', handleTouchStart);
    previewContainer.removeEventListener('touchmove', handleTouchMove);

    // 移除DOM元素
    if (previewContainer.parentNode) {
      document.body.removeChild(previewContainer);
    }

    // 恢复原始样式
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;

    // 释放Blob URL
    URL.revokeObjectURL(blobUrl);
  };

  // 添加事件监听器
  previewContainer.addEventListener('wheel', handleWheel, { passive: false });
  previewContainer.addEventListener('click', handleContainerClick);
  img.addEventListener('dblclick', handleDoubleClick);
  img.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  previewContainer.addEventListener('touchstart', handleTouchStart);
  previewContainer.addEventListener('touchmove', handleTouchMove, { passive: false });

  // 添加到DOM前处理页面滚动
  document.body.style.overflow = 'hidden';
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

  // 添加到DOM
  previewContainer.appendChild(img);
  document.body.appendChild(previewContainer);

  // 暴露关闭方法
  return {
    close: closePreview
  };
}