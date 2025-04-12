import { ref, onMounted, onUnmounted } from 'vue'

// 响应式断点
const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
}

// 创建响应式状态
export function useResponsive() {
  const windowWidth = ref(window.innerWidth)
  const isMobile = ref(windowWidth.value < breakpoints.md)
  const isTablet = ref(windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg)
  const isDesktop = ref(windowWidth.value >= breakpoints.lg)

  const handleResize = () => {
    windowWidth.value = window.innerWidth
    isMobile.value = windowWidth.value < breakpoints.md
    isTablet.value = windowWidth.value >= breakpoints.md && windowWidth.value < breakpoints.lg
    isDesktop.value = windowWidth.value >= breakpoints.lg
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints
  }
}

// 响应式类名生成器
export function getResponsiveClass(baseClass, prefix = '') {
  return {
    [`${baseClass}--mobile`]: prefix ? `${prefix}-mobile` : 'mobile',
    [`${baseClass}--tablet`]: prefix ? `${prefix}-tablet` : 'tablet',
    [`${baseClass}--desktop`]: prefix ? `${prefix}-desktop` : 'desktop'
  }
}

export function getBreakpoint() {
  const width = window.innerWidth
  if (width >= breakpoints.xxl) return 'xxl'
  if (width >= breakpoints.xl) return 'xl'
  if (width >= breakpoints.lg) return 'lg'
  if (width >= breakpoints.md) return 'md'
  if (width >= breakpoints.sm) return 'sm'
  return 'xs'
}

export function isBreakpointUp(breakpoint) {
  return window.innerWidth >= breakpoints[breakpoint]
}

export function isBreakpointDown(breakpoint) {
  return window.innerWidth < breakpoints[breakpoint]
} 