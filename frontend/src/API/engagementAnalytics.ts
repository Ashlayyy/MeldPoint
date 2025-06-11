import axios from '@/utils/axios';
import {
  TimelineEntry,
  DepartmentViewEntry,
  EventTypeEntry,
  TopUserEntry,
  ActivityTimeEntry,
  ActivityDayEntry,
  TrendEntry
} from '@/types/verbeter/engagement';

const buildUrl = (type: string, meldingId: string, preventiefId?: string, correctiefId?: string): string => {
  const pId = preventiefId || 'null';
  const cId = correctiefId || 'null';
  return `/engagement/${meldingId}/${pId}/${cId}/${type}`;
};

export const GetTimelineData = async (
  meldingId: string,
  preventiefId?: string,
  correctiefId?: string
): Promise<{ data: TimelineEntry[] }> => {
  if (!meldingId) throw new Error('meldingId is required for GetTimelineData');
  const url = buildUrl('timeline', meldingId, preventiefId, correctiefId);
  console.log(`Calling API: GET ${url}`);
  const response = await axios.get(url);
  return response.data;
};

export const GetDepartmentViewsData = async (
  meldingId: string,
  preventiefId?: string,
  correctiefId?: string
): Promise<{ data: DepartmentViewEntry[] }> => {
  if (!meldingId) throw new Error('meldingId is required for GetDepartmentViewsData');
  const url = buildUrl('department-views', meldingId, preventiefId, correctiefId);
  console.log(`Calling API: GET ${url}`);
  const response = await axios.get(url);
  return response.data;
};

export const GetEventTypesData = async (
  meldingId: string,
  preventiefId?: string,
  correctiefId?: string
): Promise<{ data: EventTypeEntry[] }> => {
  if (!meldingId) throw new Error('meldingId is required for GetEventTypesData');
  const url = buildUrl('event-types', meldingId, preventiefId, correctiefId);
  console.log(`Calling API: GET ${url}`);
  const response = await axios.get(url);
  return response.data;
};

export const GetTopUsersData = async (
  meldingId: string,
  preventiefId?: string,
  correctiefId?: string
): Promise<{ data: TopUserEntry[] }> => {
  if (!meldingId) throw new Error('meldingId is required for GetTopUsersData');
  const url = buildUrl('top-users', meldingId, preventiefId, correctiefId);
  console.log(`Calling API: GET ${url}`);
  const response = await axios.get(url);
  return response.data;
};

export const GetActivityTimeData = async (
  meldingId: string,
  preventiefId?: string,
  correctiefId?: string
): Promise<{ data: ActivityTimeEntry[] }> => {
  if (!meldingId) throw new Error('meldingId is required for GetActivityTimeData');
  const url = buildUrl('activity-time', meldingId, preventiefId, correctiefId);
  console.log(`Calling API: GET ${url}`);
  const response = await axios.get(url);
  return response.data;
};

export const GetActivityDayData = async (
  meldingId: string,
  preventiefId?: string,
  correctiefId?: string
): Promise<{ data: ActivityDayEntry[] }> => {
  if (!meldingId) throw new Error('meldingId is required for GetActivityDayData');
  const url = buildUrl('activity-day', meldingId, preventiefId, correctiefId);
  console.log(`Calling API: GET ${url}`);
  const response = await axios.get(url);
  return response.data;
};

export const GetTrendData = async (meldingId: string, preventiefId?: string, correctiefId?: string): Promise<{ data: TrendEntry[] }> => {
  if (!meldingId) throw new Error('meldingId is required for GetTrendData');
  const url = buildUrl('trend', meldingId, preventiefId, correctiefId);
  console.log(`Calling API: GET ${url}`);
  const response = await axios.get(url);
  return response.data;
};
