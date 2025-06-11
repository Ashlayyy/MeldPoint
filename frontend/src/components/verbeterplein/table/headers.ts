import { ITextFilterParams } from 'ag-grid-community';
import { formatDate } from '@/utils/helpers/dateHelpers';

import i18n from '@/main';
import { hasPermission } from '@/utils/permission';
const t = i18n.global.t;

const hasArchivePermissions = hasPermission([{ action: 'manage', resourceType: 'all' }]);

const filterParams: ITextFilterParams = {
  buttons: ['clear', 'cancel'],
  debounceMs: 200
};

export const OPS_headers = [
  {
    headerName: t('verbeterplein.table.headers.id'),
    field: 'VolgNummer',
    filter: true,
    filterParams
  },
  { headerName: t('verbeterplein.table.headers.project'), field: 'Project.NumberID', filter: true, filterParams },
  { headerName: t('verbeterplein.table.headers.deelorder'), field: 'Deelorder', filter: true, filterParams },
  { headerName: t('verbeterplein.table.headers.project_name'), field: 'Project.ProjectNaam', filter: true, filterParams },
  {
    headerName: t('verbeterplein.table.headers.fail_costs'),
    field: 'Correctief.Faalkosten',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => {
      return params.value ? `€ ${params.value}` : t('verbeterplein.table.na');
    }
  },
  {
    headerName: t('verbeterplein.table.headers.akoordOPS'),
    field: 'Correctief.AkoordOPS',
    filter: true,
    filterParams,
    cellRenderer: 'CheckmarkRenderer',
    valueFormatter: (params: any) => {
      return params.value ? t('verbeterplein.table.headers.yes') : t('verbeterplein.table.headers.no');
    }
  },
  {
    headerName: t('verbeterplein.table.headers.pdca_started'),
    field: 'PDCA',
    filter: true,
    filterParams,
    cellRenderer: 'CheckmarkRenderer',
    valueFormatter: (params: any) => {
      return params.data.PDCA ? t('verbeterplein.table.headers.yes') : t('verbeterplein.table.headers.no');
    }
  },
  {
    headerName: t('verbeterplein.table.headers.created_at'),
    field: 'CreatedAt',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => {
      return formatDate(params.value);
    }
  },
  ...(hasArchivePermissions
    ? [{ headerName: t('verbeterplein.table.headers.action'), field: 'action', cellRenderer: 'ActionRenderer' }]
    : [])
];

export const CORRECTIEF_headers = [
  {
    headerName: t('verbeterplein.table.headers.id'),
    field: 'VolgNummer',
    filter: true,
    filterParams
  },
  { headerName: t('verbeterplein.table.headers.project'), field: 'Project.NumberID', filter: true, filterParams },
  { headerName: t('verbeterplein.table.headers.deelorder'), field: 'Deelorder', filter: true, filterParams },
  { headerName: t('verbeterplein.table.headers.project_name'), field: 'Project.ProjectNaam', filter: true, filterParams },
  {
    headerName: t('verbeterplein.table.headers.action_holder_correctief'),
    field: 'Correctief.User.Name',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => params.value || t('verbeterplein.table.na')
  },
  {
    headerName: t('verbeterplein.table.headers.fail_costs'),
    field: 'Correctief.Faalkosten',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => (params.value || params.value === 0 ? `€ ${params.value}` : t('verbeterplein.table.na'))
  },
  {
    headerName: t('verbeterplein.table.headers.deadline_correctief'),
    field: 'Correctief.Deadline',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => (params.value ? formatDate(params.value) : t('verbeterplein.table.na'))
  },
  {
    headerName: t('verbeterplein.table.headers.status_correctief'),
    field: 'Correctief.Status',
    filter: true,
    cellRenderer: 'StatusRenderer',
    filterParams,
    valueFormatter: (params: any) => {
      if (!params.value) return t('verbeterplein.table.na');
      return params.value.Status;
    }
  },
  ...(hasArchivePermissions
    ? [{ headerName: t('verbeterplein.table.headers.action'), field: 'action', cellRenderer: 'ActionRenderer' }]
    : [])
];

export const PDCA_headers = [
  {
    headerName: t('verbeterplein.table.headers.id'),
    field: 'Preventief.VolgNummer',
    filter: true,
    filterParams
  },
  {
    headerName: t('verbeterplein.table.headers.title_pdca'),
    field: 'Preventief.Title',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => {
      const title = params.value;
      if (!title) return t('verbeterplein.table.na');
      return title.length > 40 ? title.substring(0, 40) + '...' : title;
    }
  },
  {
    headerName: t('verbeterplein.table.headers.clones'),
    field: 'Preventief',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => {
      if (!params.value) return t('verbeterplein.table.na');
      return params.value.Melding.length;
    }
  },
  {
    headerName: t('verbeterplein.table.headers.action_holder_pdca'),
    field: 'Preventief.User.Name',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => params.value || t('verbeterplein.table.na')
  },
  {
    headerName: t('verbeterplein.table.headers.processdeel'),
    field: 'Preventief.User.Department.name',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => params.value || t('verbeterplein.table.na')
  },
  {
    headerName: t('verbeterplein.table.headers.status_pdca'),
    field: 'Preventief.Status',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => {
      if (!params.value) return t('verbeterplein.table.na');
      return params.value.Status;
    },
    cellRenderer: 'PDCACircleRenderer'
  },
  {
    headerName: t('verbeterplein.table.headers.deadline_preventief'),
    field: 'Preventief.Deadline',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => (params.value ? formatDate(params.value) : t('verbeterplein.table.na'))
  },
  {
    headerName: t('verbeterplein.table.headers.status_preventief'),
    field: 'Preventief.Status',
    filter: true,
    filterParams,
    cellRenderer: 'StatusRenderer',
    valueFormatter: (params: any) => params.value || t('verbeterplein.table.na')
  },
  ...(hasArchivePermissions
    ? [{ headerName: t('verbeterplein.table.headers.action'), field: 'action', cellRenderer: 'ActionRenderer' }]
    : [])
];

export const ARCHIVE_headers = [
  {
    headerName: t('verbeterplein.table.headers.id'),
    field: 'VolgNummer',
    filter: true,
    filterParams
  },
  { headerName: t('verbeterplein.table.headers.project'), field: 'Project.NumberID', filter: true, filterParams },
  { headerName: t('verbeterplein.table.headers.deelorder'), field: 'Deelorder', filter: true, filterParams },
  {
    headerName: t('verbeterplein.table.headers.akoordOPS'),
    field: 'Correctief.AkoordOPS',
    filter: true,
    filterParams,
    cellRenderer: 'CheckmarkRenderer',
    valueFormatter: (params: any) => (params.value ? t('verbeterplein.table.headers.yes') : t('verbeterplein.table.headers.no'))
  },
  {
    headerName: t('verbeterplein.table.headers.pdca_started'),
    field: 'Preventief.id',
    filter: true,
    filterParams,
    cellRenderer: 'CheckmarkRenderer',
    valueFormatter: (params: any) => (params.value ? t('verbeterplein.table.headers.yes') : t('verbeterplein.table.headers.no'))
  },
  {
    headerName: t('verbeterplein.table.headers.status_correctief'),
    field: 'Correctief.Status',
    filter: true,
    filterParams,
    cellRenderer: 'StatusRenderer',
    valueFormatter: (params: any) => params.value || t('verbeterplein.table.na')
  },
  {
    headerName: t('verbeterplein.table.headers.status_preventief'),
    field: 'Preventief.Status',
    filter: true,
    filterParams,
    cellRenderer: 'StatusRenderer',
    valueFormatter: (params: any) => params.value || t('verbeterplein.table.na')
  },
  ...(hasArchivePermissions
    ? [{ headerName: t('verbeterplein.table.headers.action'), field: 'action', cellRenderer: 'ActionRendererArchive' }]
    : [])
];

export const ALL_headers = [
  {
    headerName: t('verbeterplein.table.headers.id'),
    field: 'VolgNummer',
    filter: true,
    filterParams
  },
  { headerName: t('verbeterplein.table.headers.project'), field: 'Project.NumberID', filter: true, filterParams },
  { headerName: t('verbeterplein.table.headers.deelorder'), field: 'Deelorder', filter: true, filterParams },
  {
    headerName: t('verbeterplein.table.headers.created_at'),
    field: 'CreatedAt',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => formatDate(params.value)
  },
  {
    headerName: t('verbeterplein.table.headers.deadline_correctief'),
    field: 'Correctief.Deadline',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => (params.value ? formatDate(params.value) : t('verbeterplein.table.na'))
  },
  {
    headerName: t('verbeterplein.table.headers.status_correctief'),
    field: 'Correctief.Status',
    filter: true,
    filterParams,
    cellRenderer: 'StatusRenderer',
    valueFormatter: (params: any) => params.value || t('verbeterplein.table.na')
  },
  {
    headerName: t('verbeterplein.table.headers.status_preventief'),
    field: 'Preventief.Status',
    filter: true,
    filterParams,
    cellRenderer: 'StatusRenderer',
    valueFormatter: (params: any) => params.value || t('verbeterplein.table.na')
  },
  {
    headerName: t('verbeterplein.table.headers.deadline_preventief'),
    field: 'Preventief.Deadline',
    filter: true,
    filterParams,
    valueFormatter: (params: any) => (params.value ? formatDate(params.value) : t('verbeterplein.table.na'))
  },
  ...(hasArchivePermissions
    ? [{ headerName: t('verbeterplein.table.headers.action'), field: 'action', cellRenderer: 'ActionRenderer' }]
    : [])
];
