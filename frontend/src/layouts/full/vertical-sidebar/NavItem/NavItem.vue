<script setup lang="ts">
import Icon from '../IconSet.vue';

const props = defineProps<{ item: Record<string, any>; level: number }>();
</script>

<template>
  <!---Single Item-->
  <v-tooltip 
    location="right" 
    :open-delay="200" 
    content-class="custom-tooltip-wrapper"
    :offset="8"
  >
    <template v-slot:activator="{ props: tooltipProps }">
      <v-list-item
      v-if="item.disabled"
        v-bind="item.disabled ? tooltipProps : {}"
        rounded
        class="mb-1"
        color="secondary"
        :disabled="item.disabled"
      >
        <!---If icon-->
        <template v-slot:prepend>
          <Icon :item="props.item.icon" :level="props.level" />
        </template>
        <v-list-item-title>{{ $t(item.title) }}</v-list-item-title>
        <!---If Caption-->
        <v-list-item-subtitle v-if="item.subCaption" class="text-caption mt-n1 hide-menu">
          {{ item.subCaption }}
        </v-list-item-subtitle>
        <!---If any chip or label-->
        <template v-slot:append v-if="item.chip && !item.disabled">
          <v-chip
            :color="item.chipColor"
            class="sidebarchip hide-menu"
            :size="item.chipIcon ? 'small' : 'default'"
            :variant="item.chipVariant"
            :prepend-icon="item.chipIcon"
          >
            {{ item.chip }}
          </v-chip>
        </template>
      </v-list-item>
      <v-list-item
      v-else
        v-bind="item.disabled ? tooltipProps : {}"
        :to="item.type === 'external' ? '' : item.to"
        :href="item.type === 'external' ? item.to : ''"
        rounded
        class="mb-1"
        color="secondary"
        :disabled="item.disabled"
        :target="item.type === 'external' ? '_blank' : ''"
      >
        <!---If icon-->
        <template v-slot:prepend>
          <Icon :item="props.item.icon" :level="props.level" />
        </template>
        <v-list-item-title>{{ $t(item.title) }}</v-list-item-title>
        <!---If Caption-->
        <v-list-item-subtitle v-if="item.subCaption" class="text-caption mt-n1 hide-menu">
          {{ item.subCaption }}
        </v-list-item-subtitle>
        <!---If any chip or label-->
        <template v-slot:append v-if="item.chip && !item.disabled">
          <v-chip
            :color="item.chipColor"
            class="sidebarchip hide-menu"
            :size="item.chipIcon ? 'small' : 'default'"
            :variant="item.chipVariant"
            :prepend-icon="item.chipIcon"
          >
            {{ item.chip }}
          </v-chip>
        </template>
      </v-list-item>
    </template>
    
    <!-- Custom Tooltip Content -->
    <template v-slot:default v-if="item.disabled">
      <div class="custom-tooltip">
        <span class="tooltip-text">
          Coming <span class="text-secondary">Soon</span>
          <div class="tooltip-subtext">{{ item.chip }}</div>
        </span>
      </div>
    </template>
  </v-tooltip>
</template>

<style scoped lang="scss">
// Override Vuetify's default tooltip styling
:deep(.custom-tooltip-wrapper) {
  background-color: transparent !important;
  opacity: 1 !important;
  padding: 0 !important;
  margin-top: -4px !important;
  margin-left: -12px !important;
}

.custom-tooltip {
  background: white;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-family: 'FreeSetDemiBold', sans-serif;
  border: 1px solid rgba(var(--v-theme-primary), 0.08);
}

.tooltip-text {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  font-size: 14px;
  
  .text-secondary {
    color: rgb(var(--v-theme-secondary));
  }
}

.tooltip-subtext {
  font-size: 11px;
  color: rgb(var(--v-theme-primary));
  opacity: 0.8;
  margin-top: 2px;
  text-align: center;
}
</style>
