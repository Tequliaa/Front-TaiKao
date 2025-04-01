// utils/imagePreviewer.js

/**
 * 图片预览功能
 * @param {string} blobUrl - 图片的Blob URL
 * @param {object} options - 配置选项
 * @param {number} [options.maxScale=10] - 最大缩放比例
 * @param {number} [options.minScale=0.1] - 最小缩放比例
 * @param {string} [options.bgColor='rgba(0,0,0,0.7)'] - 背景颜色
 */
export function showImagePreview(blobUrl, options = {}) {
  // 合并默认配置和用户配置
  const config = {
    maxScale: 10,
    minScale: 0.1,
    bgColor: 'rgba(0,0,0,0.7)',
    ...options
  };

  // 创建预览容器
  const previewContainer = document.createElement('div');
  previewContainer.style.position = 'fixed';
  previewContainer.style.top = '0';
  previewContainer.style.left = '0';
  previewContainer.style.width = '100%';
  previewContainer.style.height = '100%';
  previewContainer.style.backgroundColor = config.bgColor;
  previewContainer.style.display = 'flex';
  previewContainer.style.justifyContent = 'center';
  previewContainer.style.alignItems = 'center';
  previewContainer.style.zIndex = '9999';
  
  // 创建图片元素
  const img = document.createElement('img');
  img.src = blobUrl;
  img.style.maxWidth = '90%';
  img.style.maxHeight = '90%';
  img.style.transition = 'transform 0.1s ease';
  img.style.transformOrigin = 'center center';
  img.style.cursor = 'grab';
  
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
  previewContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    scale *= delta > 0 ? 1.1 : 0.9;
    scale = Math.max(config.minScale, Math.min(scale, config.maxScale));
    applyTransform();
  }, { passive: false });

  // 点击关闭
  previewContainer.addEventListener('click', (e) => {
    if (e.target === previewContainer) {
      closePreview();
    }
  });

  // 双击重置
  img.addEventListener('dblclick', () => {
    scale = 1;
    translateX = 0;
    translateY = 0;
    applyTransform();
  });

  // 鼠标拖拽
  img.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
    img.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;
    applyTransform();
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    img.style.cursor = 'grab';
  });

  // 触摸屏支持
  previewContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      touchStartDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  });

  previewContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
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
  }, { passive: false });

  // 关闭预览
  const closePreview = () => {
    document.body.removeChild(previewContainer);
    URL.revokeObjectURL(blobUrl);
    document.body.style.overflow = originalOverflow;
  };

  // 添加到DOM
  previewContainer.appendChild(img);
  document.body.appendChild(previewContainer);
  
  // 阻止背景滚动
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  // 暴露关闭方法
  return {
    close: closePreview
  };
}