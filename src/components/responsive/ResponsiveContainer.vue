<template>
  <div class="responsive-container" :class="containerClass">
    <slot></slot>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useResponsive } from '@/utils/responsive'

export default {
  name: 'ResponsiveContainer',
  props: {
    fluid: {
      type: Boolean,
      default: false
    },
    padding: {
      type: String,
      default: 'normal' // normal, small, large, none
    }
  },
  setup(props) {
    const { isMobile, isTablet } = useResponsive()

    const containerClass = computed(() => {
      return {
        'container-fluid': props.fluid,
        [`padding-${props.padding}`]: true,
        'mobile': isMobile.value,
        'tablet': isTablet.value
      }
    })

    return {
      containerClass
    }
  }
}
</script>

<style lang="scss" scoped>
.responsive-container {
  width: 100%;
  margin-right: auto;
  margin-left: auto;
  transition: all 0.3s ease;

  &.padding-normal {
    padding: 1rem;
    @media (min-width: 768px) {
      padding: 1.5rem;
    }
    @media (min-width: 992px) {
      padding: 2rem;
    }
  }

  &.padding-small {
    padding: 0.5rem;
    @media (min-width: 768px) {
      padding: 0.75rem;
    }
    @media (min-width: 992px) {
      padding: 1rem;
    }
  }

  &.padding-large {
    padding: 1.5rem;
    @media (min-width: 768px) {
      padding: 2rem;
    }
    @media (min-width: 992px) {
      padding: 2.5rem;
    }
  }

  &.padding-none {
    padding: 0;
  }

  &.mobile {
    max-width: 100%;
  }

  &.tablet {
    max-width: 720px;
  }

  &:not(.mobile):not(.tablet) {
    max-width: 1140px;
  }
}
</style> 