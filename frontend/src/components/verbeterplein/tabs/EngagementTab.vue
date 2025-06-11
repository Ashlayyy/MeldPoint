<template>
  <div class="engagement-container pa-4">
    <div v-if="engagementStore.loading" class="text-center pt-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="mt-2 text-disabled">{{ $t('verbeterplein.showItem.engagement.loading') }}</p>
    </div>

    <div v-else-if="engagementStore.error" class="text-center text-error pt-6">
      <v-icon size="large" color="error">mdi-alert-circle-outline</v-icon>
      <p class="mt-2">{{ engagementStore.error }}</p>
    </div>

    <div v-else-if="!engagementStore.hasData" class="text-center text-disabled pt-6">
      <v-icon size="64">mdi-chart-bar-off</v-icon>
      <p class="mt-2">{{ $t('verbeterplein.showItem.engagement.no_data') }}</p>
    </div>

    <div v-else>
      <!--
      
            <v-row>
        <v-col cols="12" md="4">
          <v-card elevation="2" class="pa-3 text-center fill-height d-flex flex-column justify-center">
            <div class="text-h4 font-weight-bold">{{ engagementStore.stats?.viewCount ?? 0 }}</div>
            <div class="text-subtitle-1 text-disabled">{{ $t('verbeterplein.showItem.engagement.total_views') }}</div>
            <v-icon size="large" color="primary" class="mt-2">mdi-eye-outline</v-icon>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card elevation="2" class="pa-3 text-center fill-height d-flex flex-column justify-center">
            <div class="text-h4 font-weight-bold">{{ engagementStore.stats?.uniqueViewerCount ?? 0 }}</div>
            <div class="text-subtitle-1 text-disabled">{{ $t('verbeterplein.showItem.engagement.unique_viewers') }}</div>
            <v-icon size="large" color="secondary" class="mt-2">mdi-account-group-outline</v-icon>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card elevation="2" class="pa-3 text-center fill-height d-flex flex-column justify-center">
            <div class="text-h4 font-weight-bold">{{ engagementStore.stats?.totalEvents ?? 0 }}</div>
            <div class="text-subtitle-1 text-disabled">{{ $t('verbeterplein.showItem.engagement.total_events') }}</div>
            <v-icon size="large" color="info" class="mt-2">mdi-history</v-icon>
          </v-card>
        </v-col>
      </v-row>

      <v-divider v-if="engagementStore.stats" class="my-6"></v-divider>-->

      <v-card v-if="engagementStore.timeline" elevation="1" class="pa-2 mb-6">
        <h3 class="mb-1 text-h6 font-weight-medium text-center">
          {{ $t('verbeterplein.showItem.engagement.charts.activity_timeline_title') }}
        </h3>
        <client-only>
          <VueApexCharts type="bar" height="350" :options="timelineBarChartOptions" :series="engagementStore.timeline?.series ?? []" />
          <template #fallback>
            <div class="text-center pa-4 text-disabled">{{ $t('general.fallback.loading') }}</div>
          </template>
        </client-only>
      </v-card>

      <v-row class="mt-4">
        <v-col cols="12" md="6" v-if="engagementStore.departmentViews">
          <v-card elevation="1" class="pa-2 fill-height">
            <client-only>
              <VueApexCharts
                type="donut"
                height="300"
                :options="departmentChartOptions"
                :series="engagementStore.departmentViews?.series ?? []"
              />
              <template #fallback>
                <div class="text-center pa-4 text-disabled">{{ $t('general.fallback.loading') }}</div>
              </template>
            </client-only>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" v-if="engagementStore.eventTypes">
          <v-card elevation="1" class="pa-2 fill-height">
            <client-only>
              <VueApexCharts type="pie" height="300" :options="eventTypeChartOptions" :series="engagementStore.eventTypes?.series ?? []" />
              <template #fallback>
                <div class="text-center pa-4 text-disabled">{{ $t('general.fallback.loading') }}</div>
              </template>
            </client-only>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6" v-if="engagementStore.topUsers">
          <v-card elevation="1" class="pa-2 fill-height">
            <client-only>
              <VueApexCharts type="bar" height="300" :options="topUsersChartOptions" :series="engagementStore.topUsers?.series ?? []" />
              <template #fallback>
                <div class="text-center pa-4 text-disabled">{{ $t('general.fallback.loading') }}</div>
              </template>
            </client-only>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" v-if="engagementStore.trend">
          <v-card elevation="1" class="pa-2 fill-height">
            <client-only>
              <VueApexCharts type="area" height="300" :options="engagementTrendOptions" :series="engagementStore.trend?.series ?? []" />
              <template #fallback>
                <div class="text-center pa-4 text-disabled">{{ $t('general.fallback.loading') }}</div>
              </template>
            </client-only>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" md="6" v-if="engagementStore.activityTime">
          <v-card elevation="1" class="pa-2 fill-height">
            <client-only>
              <VueApexCharts
                type="bar"
                height="300"
                :options="activityByHourOptions"
                :series="engagementStore.activityTime?.series ?? []"
              />
              <template #fallback>
                <div class="text-center pa-4 text-disabled">{{ $t('general.fallback.loading') }}</div>
              </template>
            </client-only>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" v-if="engagementStore.activityDay">
          <v-card elevation="1" class="pa-2 fill-height">
            <client-only>
              <VueApexCharts type="bar" height="300" :options="activityByDayOptions" :series="engagementStore.activityDay?.series ?? []" />
              <template #fallback>
                <div class="text-center pa-4 text-disabled">{{ $t('general.fallback.loading') }}</div>
              </template>
            </client-only>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import { useEngagementStore } from '@/stores/verbeterplein/engagement_store';
import { useI18n } from 'vue-i18n';

import { VProgressCircular, VRow, VCol, VCard, VIcon, VDivider, VBtn } from 'vuetify/components';
import VueApexCharts from 'vue3-apexcharts';

const props = defineProps({
  item: {
    type: Object as () => Record<string, any>,
    required: true
  }
});

const engagementStore = useEngagementStore();
const { t } = useI18n();

const timelineBarChartOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: {
    type: 'bar',
    height: 350,
    stacked: true,
    toolbar: { show: true },
    zoom: { enabled: false }
  },
  plotOptions: {
    bar: { horizontal: false, columnWidth: '60%' }
  },
  xaxis: {
    categories: engagementStore.timeline?.categories || [],
    title: { text: t('verbeterplein.showItem.history.timestamp') }
  },
  yaxis: {
    title: { text: t('verbeterplein.showItem.engagement.total_events') },
    min: 0,
    forceNiceScale: true
  },
  legend: { position: 'bottom', offsetY: 10 },
  colors: ['#2196F3', '#00BCD4', '#FFC107', '#4CAF50', '#9E9E9E'],
  tooltip: {
    shared: false,
    intersect: true,
    y: {
      formatter: function (val, { seriesIndex, w }) {
        const seriesName = w.globals.seriesNames[seriesIndex];
        return `${val} ${seriesName || ''}`;
      }
    }
  },
  dataLabels: { enabled: false },
  grid: { borderColor: '#f1f1f1' },
  noData: { text: t('verbeterplein.showItem.engagement.no_data') }
}));

const departmentChartOptions = computed<ApexCharts.ApexOptions>(() => {
  const hasData = engagementStore.departmentViews?.series?.some((count: number) => count > 0);
  return {
    chart: { type: 'donut', height: 300 },
    labels: engagementStore.departmentViews?.labels || [],
    title: { text: t('verbeterplein.showItem.engagement.charts.views_by_department_title'), align: 'center' },
    legend: { position: 'bottom' },
    tooltip: {
      y: { formatter: (val: number) => `${val} ${val === 1 ? t('general.view') : t('general.views')}` }
    },
    noData: { text: t('verbeterplein.showItem.engagement.no_data') },
    dataLabels: { enabled: !!hasData }
  };
});

const eventTypeChartOptions = computed<ApexCharts.ApexOptions>(() => {
  const hasData = engagementStore.eventTypes?.series?.some((count: number) => count > 0);
  return {
    chart: { type: 'pie', height: 300 },
    labels: engagementStore.eventTypes?.labels || [],
    title: { text: t('verbeterplein.showItem.engagement.charts.event_type_distribution_title'), align: 'center' },
    legend: { position: 'bottom' },
    tooltip: {
      y: { formatter: (val: number) => `${val} ${val === 1 ? t('general.event') : t('general.events')}` }
    },
    noData: { text: t('verbeterplein.showItem.engagement.no_data') },
    dataLabels: { enabled: !!hasData }
  };
});

const topUsersChartOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: {
    type: 'bar',
    height: 300
  },
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: '70%',
      distributed: true
    }
  },
  xaxis: {
    categories: engagementStore.topUsers?.categories || [],
    title: { text: t('verbeterplein.showItem.engagement.total_events') }
  },
  yaxis: {
    labels: {
      maxWidth: 150
    }
  },
  legend: {
    show: false
  },
  title: {
    text: t('verbeterplein.showItem.engagement.charts.top_users_title'),
    align: 'center'
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} ${val === 1 ? t('general.event') : t('general.events')}`
    }
  },
  dataLabels: { enabled: false },
  noData: { text: t('verbeterplein.showItem.engagement.no_data') }
}));

const engagementTrendOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: {
    type: 'area',
    height: 300,
    zoom: { enabled: true, type: 'x' },
    toolbar: { show: true }
  },
  xaxis: {
    type: 'datetime',
    categories: engagementStore.trend?.categories || [],
    title: { text: t('verbeterplein.showItem.history.timestamp') }
  },
  yaxis: {
    title: { text: t('verbeterplein.showItem.engagement.total_events') },
    min: 0
  },
  stroke: {
    curve: 'smooth'
  },
  dataLabels: {
    enabled: false
  },
  markers: {
    size: 4,
    hover: { sizeOffset: 2 }
  },
  tooltip: {
    x: { format: 'dd MMM yyyy' },
    y: { formatter: (val: number) => `${val} ${val === 1 ? t('general.event') : t('general.events')}` }
  },
  title: {
    text: t('verbeterplein.showItem.engagement.charts.engagement_trend_title'),
    align: 'center'
  },
  annotations: engagementStore.trend?.annotations || {},
  noData: { text: t('verbeterplein.showItem.engagement.no_data') }
}));

const activityByHourOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: {
    type: 'bar',
    height: 300
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '70%',
      distributed: true
    }
  },
  xaxis: {
    categories: engagementStore.activityTime?.categories || []
    //title: { text: t('general.time_hour') }
  },
  yaxis: {
    title: { text: t('verbeterplein.showItem.engagement.total_events') },
    min: 0
  },
  legend: {
    show: false
  },
  title: {
    text: t('verbeterplein.showItem.engagement.charts.activity_by_hour_title'),
    align: 'center'
  },
  tooltip: {
    x: {
      formatter: (val) => `${t('general.time_hour')} ${val}`
    },
    y: {
      formatter: (val: number) => `${val} ${val === 1 ? t('general.event') : t('general.events')}`
    }
  },
  dataLabels: { enabled: false },
  noData: { text: t('verbeterplein.showItem.engagement.no_data') }
}));

const activityByDayOptions = computed<ApexCharts.ApexOptions>(() => ({
  chart: {
    type: 'bar',
    height: 300
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '70%',
      distributed: true
    }
  },
  xaxis: {
    categories: engagementStore.activityDay?.categories || [],
    title: { text: t('general.day_of_week') }
  },
  yaxis: {
    title: { text: t('verbeterplein.showItem.engagement.total_events') },
    min: 0
  },
  legend: {
    show: false
  },
  title: {
    text: t('verbeterplein.showItem.engagement.charts.activity_by_day_title'),
    align: 'center'
  },
  tooltip: {
    x: {
      formatter: (val) => `${t('general.day')} ${val}`
    },
    y: {
      formatter: (val: number) => `${val} ${val === 1 ? t('general.event') : t('general.events')}`
    }
  },
  dataLabels: { enabled: false },
  noData: { text: t('verbeterplein.showItem.engagement.no_data') }
}));
</script>

<style scoped lang="scss">
.engagement-container {
  min-height: 200px;
}
.fill-height {
  height: 100%;
}
.border {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.text-disabled {
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
}
</style>
