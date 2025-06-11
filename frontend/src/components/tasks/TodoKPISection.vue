<template>
  <v-card elevation="0" class="mb-4">
    <v-card variant="outlined">
      <v-row>
        <v-col cols="12" sm="6" lg="3" v-for="(kpi, i) in props.kpiItems" :key="i">
          <v-card-text 
            :class="{ 'cursor-pointer kpi-card': kpi.clickable }"
            @click="kpi.clickable ? handleKpiClick(kpi) : null"
            :style="kpi.clickable ? 'transition: all 0.2s ease-in-out;' : ''"
          >
            <span class="text-medium-emphasis text-subtitle-2 font-weight-medium">{{ kpi.title }}</span>
            <h3 class="text-h3 my-2">{{ kpi.value }}</h3>
            <v-progress-linear 
              :model-value="kpi.title !== 'Totaal' ? calculatePercentage(kpi.value) : 100" 
              :color="kpi.color"
            ></v-progress-linear>
          </v-card-text>
        </v-col>
      </v-row>
    </v-card>
  </v-card>
</template>

<script setup lang="ts">
interface KpiItem {
  title: string;
  value: number;
  color: string;
  action: Function | null;
  clickable: boolean;
}

const props = defineProps({
  kpiItems: {
    type: Array as () => KpiItem[],
    required: true
  }
});

const emit = defineEmits(['kpi-click']);

function handleKpiClick(kpi: KpiItem) {
  emit('kpi-click', kpi);
}

function calculatePercentage(value: number): number {
  // Find the total from the "Totaal" KPI item
  const totalItem = props.kpiItems.find(item => item.title === 'Totaal');
  const total = totalItem?.value || 0;
  
  if (!total || total === 0) return 0;
  return (value / total) * 100;
}
</script>

<style scoped>
.kpi-card:hover {
  background-color: rgba(0, 0, 0, 0.03);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.cursor-pointer {
  cursor: pointer;
}
</style> 