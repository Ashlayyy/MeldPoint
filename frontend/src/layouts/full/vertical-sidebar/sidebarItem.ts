import {
  BrandFramerIcon,
  HelpIcon,
  AssetIcon,
  ChartBarIcon,
  UserIcon,
  DatabaseCogIcon,
  UserCogIcon,
  LockBoltIcon,
  BuildingFactoryIcon,
  CalendarStatsIcon,
  ToolsIcon,
  ChartPieIcon,
  FileTextIcon,
  MapIcon,
  CurrencyEuroIcon,
  CubeIcon,
  BrandGithubIcon,
  BellIcon,
  BuildingIcon,
  ClockIcon,
  KeyIcon,
  FolderIcon
} from 'vue-tabler-icons';

export interface menu {
  header?: string;
  enabledHeader?: boolean;

  permissionNeeded?: { action: string; resourceType: string }[];
  title?: string;
  icon?: object;
  to?: string;
  divider?: boolean;
  chip?: string;
  chipColor?: string;
  chipVariant?: string;
  chipIcon?: string;
  children?: menu[];
  disabled?: boolean;
  type?: string;
  subCaption?: string;
}

const sidebarItem: menu[] = [
  {
    header: 'Verbeterplein',
    enabledHeader: true,
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }]
  },
  {
    title: 'Verbeterplein',
    icon: ChartBarIcon,
    to: '/verbeterplein/overzicht',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }]
  },
  {
    header: 'Projecten',
    enabledHeader: true,
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }]
  },
  {
    title: 'Project administratie',
    icon: FolderIcon,
    to: '/projects/administration',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }]
  },
  // {
  //   title: 'Geo-overzicht',
  //   icon: MapIcon,
  //   to: '/geo-overzicht',
  //   disabled: true,
  //   chip: 'in Q1 2025',
  //   permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  // },
  // {
  //   title: 'Administratief',
  //   icon: CurrencyEuroIcon,
  //   to: '/administratief',
  //   permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }],
  //   disabled: true
  // },
  // { divider: true, permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }] },

  // {
  //   header: 'Productie',
  //   enabledHeader: true,
  //   permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }]
  // },
  // {
  //   title: 'Machinepark',
  //   icon: BuildingFactoryIcon,
  //   to: '/productie/machinepark',
  //   permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }],
  //   disabled: true,

  // },
  // {
  //   title: 'Productieplanning',
  //   icon: CalendarStatsIcon,
  //   to: '/productie/planning',
  //   disabled: true,
  //   permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }]
  // },

  // {
  //   header: 'Backoffice',
  //   enabledHeader: true,
  //   permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }]
  // },
  // {
  //   title: 'Overzicht',
  //   icon: ChartPieIcon,
  //   to: '/backoffice/overzicht',
  //   permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }],
  //   disabled: true
  // },
  // {
  //   title: 'Deepdive',
  //   icon: FileTextIcon,
  //   to: '/backoffice/deepdive',
  //   permissionNeeded: [{ action: 'MANAGE', resourceType: 'MELDING' }],
  //   disabled: true,
  //   chip: 'in Q1 2025'
  // },

  { divider: true, permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }] },
  { header: 'Backups', enabledHeader: true, permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }] },
  {
    title: 'Migrate',
    icon: BrandFramerIcon,
    to: '/verbeterplein/migrate',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },
  {
    title: 'Backup',
    icon: DatabaseCogIcon,
    to: '/verbeterplein/backup',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },
  { divider: true, permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }] },
  { header: 'Beheer', enabledHeader: true, permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }] },
  {
    title: 'GitHub Issues',
    icon: BrandGithubIcon,
    to: '/beheer/github/issues',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },
  {
    title: 'Departments',
    icon: BuildingIcon,
    to: '/beheer/departments',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },
  {
    title: 'Notification Tester',
    icon: BellIcon,
    to: '/admin/notifications/test',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },
  {
    title: 'Scheduler Tester',
    icon: ClockIcon,
    to: '/admin/scheduler/test',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },

  { header: 'Rechten', enabledHeader: true, permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }] },
  {
    title: 'API Keys',
    icon: KeyIcon,
    to: '/beheer/api-keys',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },
  {
    title: 'Gebruikers',
    icon: UserIcon,
    to: '/beheer/gebruikers',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },
  {
    title: 'Roles',
    icon: UserCogIcon,
    to: '/beheer/roles',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },
  {
    title: 'Permissions',
    icon: LockBoltIcon,
    to: '/beheer/permissions',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },
  { divider: true, permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }] },
  { header: 'Emails', enabledHeader: true, permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }] },
  {
    title: 'Emails',
    icon: AssetIcon,
    to: '/emails/overview',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }]
  },
  {
    title: 'Templates',
    icon: AssetIcon,
    to: '/emails/templates',
    permissionNeeded: [{ action: 'MANAGE', resourceType: 'ALL' }],
    disabled: true
  },
  { divider: true },
  {
    title: 'Documentation',
    icon: HelpIcon,
    to: '/',
    disabled: true
  },
  {
    title: 'Changelog',
    icon: HelpIcon,
    to: '/changelog',
    disabled: false
  }
];

export default sidebarItem;
