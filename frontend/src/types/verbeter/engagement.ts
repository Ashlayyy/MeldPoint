export interface EngagementStatsResponse {
  viewCount: number;
  uniqueViewerCount: number;
  totalEvents: number;
}

export interface TimelineEntry {
  date: string;
  type: string;
  count: number;
}

export interface DepartmentViewEntry {
  department: string;
  count: number;
}

export interface EventTypeEntry {
  type: string;
  count: number;
}

export interface TopUserEntry {
  userId: string;
  name: string;
  email: string;
  count: number;
}

export interface ActivityTimeEntry {
  hour: number;
  count: number;
}

export interface ActivityDayEntry {
  dayOfWeek: number;
  count: number;
}

export interface TrendEntry {
  date: string;
  count: number;
}
