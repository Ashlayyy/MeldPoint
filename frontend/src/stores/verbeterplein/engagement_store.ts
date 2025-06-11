import { defineStore } from 'pinia';
import {
  TimelineEntry,
  DepartmentViewEntry,
  EventTypeEntry,
  TopUserEntry,
  ActivityTimeEntry,
  ActivityDayEntry,
  TrendEntry
} from '@/types/verbeter/engagement';
import { useNotificationStore } from './notification_store';
import i18n from '@/main';
const t = i18n.global.t;
import { mapEventTypeToKey } from '@/utils/helpers/eventMapping';
import { hasPermission } from '@/utils/permission';

import {
  GetTimelineData,
  GetDepartmentViewsData,
  GetEventTypesData,
  GetTopUsersData,
  GetActivityTimeData,
  GetActivityDayData,
  GetTrendData
} from '@/API/engagementAnalytics'; // <-- Confirm or correct this path

interface ChartData {
  series: any[];
  categories?: string[];
  labels?: string[];
  annotations?: any;
}
export const useEngagementStore = defineStore('engagement', {
  state: () => ({
    timeline: null as ChartData | null,
    departmentViews: null as ChartData | null,
    eventTypes: null as ChartData | null,
    topUsers: null as ChartData | null,
    activityTime: null as ChartData | null,
    activityDay: null as ChartData | null,
    trend: null as ChartData | null,
    currentMeldingId: null as string | null,

    loading: false,
    error: null as string | null,
    lastNotificationMessage: null as string | null
  }),

  getters: {
    hasData(state): boolean {
      return (
        !!state.timeline ||
        !!state.departmentViews ||
        !!state.eventTypes ||
        !!state.topUsers ||
        !!state.activityTime ||
        !!state.activityDay ||
        !!state.trend
      );
    }
  },

  actions: {
    async fetchAnalyticsData(meldingId: string, preventiefId?: string, correctiefId?: string) {
      if (this.loading) return;

      // Permission check: block if user lacks MANAGE:ALL
      if (!hasPermission([{ action: 'MANAGE', resourceType: 'ALL' }])) {
        return;
      }

      this.currentMeldingId = meldingId;

      console.log('Fetching all analytics data for:', meldingId, preventiefId, correctiefId);
      this.loading = true;
      this.error = null;
      this.resetData();

      const pId = preventiefId || undefined;
      const cId = correctiefId || undefined;

      try {
        const results = await Promise.allSettled([
          GetTimelineData(meldingId, pId, cId),
          GetDepartmentViewsData(meldingId, pId, cId),
          GetEventTypesData(meldingId, pId, cId),
          GetTopUsersData(meldingId, pId, cId),
          GetActivityTimeData(meldingId, pId, cId),
          GetActivityDayData(meldingId, pId, cId),
          GetTrendData(meldingId, pId, cId)
        ]);

        let firstError: string | null = null;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            console.log('Result:', result);
            const responseData = result.value.data;

            try {
              switch (index) {
                case 0: {
                  const timelineData = responseData as TimelineEntry[];

                  const groupedData: Record<string, Record<string, number>> = {};
                  const uniqueDates = new Set<string>();
                  const uniqueActions = new Set<string>();

                  timelineData.forEach((entry) => {
                    uniqueDates.add(entry.date);
                    uniqueActions.add(entry.type);
                    if (!groupedData[entry.date]) {
                      groupedData[entry.date] = {};
                    }
                    groupedData[entry.date][entry.type] = (groupedData[entry.date][entry.type] || 0) + entry.count;
                  });

                  const sortedDates = Array.from(uniqueDates).sort();
                  const sortedRawActions = Array.from(uniqueActions).sort();

                  const series = sortedRawActions.map((rawAction) => {
                    const translationKey = `verbeterplein.showItem.engagement.eventTypes.${mapEventTypeToKey(rawAction)}`;
                    return {
                      name: t(translationKey),
                      data: sortedDates.map((date) => groupedData[date]?.[rawAction] || 0)
                    };
                  });

                  this.timeline = {
                    series: series,
                    categories: sortedDates
                  };
                  break;
                }
                case 1:
                  const deptData = responseData as DepartmentViewEntry[];
                  this.departmentViews = {
                    series: deptData.map((entry) => entry.count),
                    labels: deptData.map((entry) => entry.department)
                  };
                  break;
                case 2:
                  const eventTypeData = responseData as EventTypeEntry[];
                  const labels = eventTypeData.map((entry) => {
                    const translationKey = `verbeterplein.showItem.engagement.eventTypes.${mapEventTypeToKey(entry.type)}`;
                    return t(translationKey);
                  });
                  this.eventTypes = {
                    series: eventTypeData.map((entry) => entry.count),
                    labels: labels
                  };
                  break;
                case 3:
                  const topUserData = responseData as TopUserEntry[];
                  this.topUsers = {
                    series: [{ name: t('general.events'), data: topUserData.map((entry) => entry.count) }],
                    categories: topUserData.map((entry) => entry.name)
                  };
                  break;
                case 4:
                  const activityTimeData = responseData as ActivityTimeEntry[];
                  const timeMap = new Map<number, number>();
                  activityTimeData.forEach((entry) => timeMap.set(entry.hour, entry.count));
                  const timeSeriesData: number[] = [];
                  const timeCategories: string[] = [];
                  for (let hour = 0; hour < 24; hour++) {
                    timeSeriesData.push(timeMap.get(hour) || 0);
                    timeCategories.push(`${hour.toString().padStart(2, '0')}:00`);
                  }
                  this.activityTime = {
                    series: [{ name: t('analytics.activity_time_series_name'), data: timeSeriesData }],
                    categories: timeCategories
                  };
                  break;
                case 5:
                  const activityDayData = responseData as ActivityDayEntry[];

                  const dayNames = [
                    t('days.sun'),
                    t('days.mon'),
                    t('days.tue'),
                    t('days.wed'),
                    t('days.thu'),
                    t('days.fri'),
                    t('days.sat')
                  ];
                  const dayMap = new Map<number, number>();
                  activityDayData.forEach((entry) => dayMap.set(entry.dayOfWeek, entry.count));

                  const daySeriesData: number[] = [];
                  const dayCategories: string[] = [];
                  const dayOrder = [2, 3, 4, 5, 6, 7, 1];
                  for (const dayNum of dayOrder) {
                    daySeriesData.push(dayMap.get(dayNum) || 0);
                    dayCategories.push(dayNames[dayNum - 1]);
                  }

                  this.activityDay = {
                    series: [{ name: t('analytics.activity_day_series_name'), data: daySeriesData }],
                    categories: dayCategories
                  };
                  break;
                case 6:
                  const trendData = responseData as TrendEntry[];
                  this.trend = {
                    series: [{ name: t('analytics.trend_series_name'), data: trendData.map((entry) => entry.count) }],
                    categories: trendData.map((entry) => entry.date)
                  };
                  break;
              }
            } catch (transformError: any) {
              console.error(`Error transforming data for endpoint ${index}:`, transformError);
              if (!firstError) {
                const errorMessage = typeof transformError?.message === 'string' ? transformError.message : JSON.stringify(transformError);
                firstError = t('errors.data_transform_error', { index: index, error: errorMessage });
              }
            }
          } else {
            console.error(`Error fetching analytics data (Endpoint ${index}):`, result.reason);
            if (!firstError) {
              const errorReason = result.reason as any;
              const message = errorReason?.response?.data?.message || errorReason?.message;
              firstError = typeof message === 'string' ? message : JSON.stringify(result.reason);
            }
          }
        });

        if (firstError) {
          this.error = firstError;

          const notification = useNotificationStore();
          const notificationMessage = typeof this.error === 'string' ? this.error : JSON.stringify(this.error);

          if (this.lastNotificationMessage !== notificationMessage) {
            notification.error({ message: notificationMessage });
            this.lastNotificationMessage = notificationMessage;
          }
        }
      } catch (error: any) {
        console.error('Critical error fetching analytics data:', error);
        const errorMessage = error.message || error.toString();
        this.error = t('errors.fetch_error', { error: errorMessage });
        const notification = useNotificationStore();
        if (this.lastNotificationMessage !== this.error) {
          notification.error({ message: this.error });
          this.lastNotificationMessage = this.error;
        }
      } finally {
        this.loading = false;
      }
    },
    resetData() {
      this.timeline = null;
      this.departmentViews = null;
      this.eventTypes = null;
      this.topUsers = null;
      this.activityTime = null;
      this.activityDay = null;
      this.trend = null;
    },

    resetState() {
      this.resetData();
      this.loading = false;
      this.error = null;
      this.lastNotificationMessage = null;
      this.currentMeldingId = null;
    }
  }
});
