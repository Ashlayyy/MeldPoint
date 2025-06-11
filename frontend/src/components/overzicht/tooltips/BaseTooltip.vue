<script lang="ts">
import { computed, defineComponent } from 'vue'
import type { TooltipPosition } from '@/types/map'

export default defineComponent({
  name: 'BaseTooltip',
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      required: true
    },
    position: {
      type: Object as () => TooltipPosition,
      required: true
    },
    windowHeight: {
      type: Number,
      required: true
    },
    headerColor: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const tooltipTransform = computed(() => {
      return props.position.y > (props.windowHeight * 0.7) ? 
        'translate(-50%, -120%)' : 
        'translate(-50%, 20%)'
    })

    return {
      tooltipTransform
    }
  }
})
</script>

<template>
  <div 
    class="point-tooltip"
    :style="{ 
      left: `${position.x}px`, 
      top: `${position.y}px`,
      transform: tooltipTransform
    }"
  >
    <div class="tooltip-header" :style="{ background: headerColor }">
      <slot name="icon"></slot>
      <div>
        <div class="font-weight-medium">{{ title }}</div>
        <div class="text-caption text-white text-opacity-75">{{ subtitle }}</div>
      </div>
    </div>
    <div class="tooltip-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.point-tooltip {
  position: fixed;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  min-width: 224px;
  max-width: 280px;
  pointer-events: none;
  z-index: 999999;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  font-size: 0.9em;
  transition: opacity 0.2s ease;
}

.tooltip-header {
  padding: 8px 12px;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  color: white;
  font-size: 13px;
  display: flex;
  align-items: center;
}

.tooltip-content {
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}
</style> 
