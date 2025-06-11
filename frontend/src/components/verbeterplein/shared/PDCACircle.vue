<template>
  <svg :width="size" :height="size" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" stroke-width="10" />
    <!-- First segment (0° to 72°) -->
    <path d="M50 5 A45 45 0 0 1 86.7 27.3" 
          fill="none" 
          :stroke="step >= 1 ? '#800080' : '#e0e0e0'" 
          stroke-width="10"
          stroke-linecap="round" />
    
    <!-- Second segment (72° to 144°) -->
    <path d="M86.7 27.3 A45 45 0 0 1 86.7 72.7" 
          fill="none" 
          :stroke="step >= 2 ? '#4CAF50' : '#e0e0e0'" 
          stroke-width="10"
          stroke-linecap="round" />
    
    <!-- Third segment (144° to 216°) -->
    <path d="M86.7 72.7 A45 45 0 0 1 13.3 72.7" 
          fill="none" 
          :stroke="step >= 3 ? '#2196F3' : '#e0e0e0'" 
          stroke-width="10"
          stroke-linecap="round" />
    
    <!-- Fourth segment (216° to 288°) -->
    <path d="M13.3 72.7 A45 45 0 0 1 13.3 27.3" 
          fill="none" 
          :stroke="step >= 4 ? '#FFC107' : '#e0e0e0'" 
          stroke-width="10"
          stroke-linecap="round" />
    
    <!-- Fifth segment (288° to 360°) -->
    <path d="M13.3 27.3 A45 45 0 0 1 50 5" 
          fill="none" 
          :stroke="step >= 5 ? '#FF5722' : '#e0e0e0'" 
          stroke-width="10"
          stroke-linecap="round" />
    
    <text x="50" y="60" font-size="40" text-anchor="middle" fill="#333">
      {{ ['O', 'P', 'D', 'C', 'A'][step - 1] || '' }}
    </text>
  </svg>
</template>

<script setup lang="ts">
defineProps({
  step: {
    type: Number,
    default: 0
  },
  size: {
    type: Number,
    default: 40
  }
});
</script>
