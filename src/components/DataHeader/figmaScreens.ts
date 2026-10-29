/*
 * Story data: the app-specific Figma "Screen" variants of User Headers (707:5584) and Data Rows (707:5559),
 * plus Tenant Headers* / Tenant Rows*, expressed as generic columns and cells.
 * Text is copied from Figma. Columns Figma hides with opacity 0 (placeholder Header / Row Items) are left out;
 * a `fill` column takes their space instead.
 */
import type { DataColumn, DataLeading } from './columns';

export type FigmaScreen = {
  name: string;
  columns: DataColumn[];
  leading: DataLeading;
  leadingWidth?: number;
  corners?: 'all' | 'bottom' | 'none';
  /** One sample row; the status column holds a StatusPill label. */
  row: Record<string, string>;
  /** Column keys rendered as a StatusPill / an icon instead of text. */
  statusKey?: string;
  iconKey?: string;
  selected?: boolean;
  initials?: string;
};

export const SCREENS: FigmaScreen[] = [
  {
    name: 'Users',
    leading: 'checkbox-avatar',
    columns: [
      { key: 'id', label: 'User ID' },
      { key: 'name', label: 'Name', width: 'fill' },
      { key: 'company', label: 'Company', width: 'fill' },
      { key: 'department', label: 'Department', width: 'fill' },
      { key: 'primaryRole', label: 'Primary Role', width: 'fill' },
      { key: 'additionalRole', label: 'Additional Role', width: 'fill' },
      { key: 'type', label: 'Type', align: 'center' },
      { key: 'status', label: 'Status', align: 'center' },
    ],
    row: {
      id: '12345',
      name: 'User Name',
      company: 'Company Name',
      department: 'Project Management',
      primaryRole: 'Order Processor',
      additionalRole: 'Technician',
      type: 'Internal',
      status: 'Active',
    },
    statusKey: 'status',
  },
  {
    name: 'Departments',
    leading: 'checkbox-avatar',
    columns: [
      { key: 'id', label: 'Department ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description', width: 'fill', sortable: false },
      { key: 'totalUsers', label: 'Total Users', align: 'center' },
      { key: 'status', label: 'Status', align: 'center' },
    ],
    row: { id: '12345', name: 'Name', description: 'Description', totalUsers: '2', status: 'Active' },
    statusKey: 'status',
  },
  {
    name: 'Locations',
    leading: 'checkbox-avatar',
    columns: [
      { key: 'id', label: 'Location ID' },
      { key: 'name', label: 'Name', width: 'fill' },
      { key: 'totalUsers', label: 'Total Users' },
      { key: 'status', label: 'Status', align: 'center' },
    ],
    row: { id: '12345', name: 'Location Name', totalUsers: 'Label', status: 'Active' },
    statusKey: 'status',
  },
  {
    name: 'Roles',
    leading: 'checkbox',
    columns: [
      { key: 'id', label: 'Role ID' },
      { key: 'description', label: 'Description', width: 'fill' },
      { key: 'users', label: 'Users', align: 'center' },
      { key: 'permissions', label: 'Permissions', align: 'center' },
      { key: 'type', label: 'Type', align: 'center' },
      { key: 'status', label: 'Status', align: 'center' },
    ],
    row: {
      id: 'Super Admin',
      description: 'Full access to system settings and tenant management',
      users: '4',
      permissions: '+156',
      type: 'Internal',
      status: 'Active',
    },
    statusKey: 'status',
  },
  {
    name: 'Supervisors',
    leading: 'checkbox-avatar',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'company', label: 'Company', width: 'fill' },
      { key: 'type', label: 'Type' },
      { key: 'supervisor', label: 'Supervisor', align: 'center' },
      { key: 'lastModified', label: 'Last Modified', align: 'end' },
    ],
    // Figma's row puts an ID and a user name under the "Name" and "Company" headers; copied as-is.
    row: { name: '12345', company: 'User Name', type: 'Internal', supervisor: '', lastModified: 'Mar 24, 2026 10:30AM' },
    iconKey: 'supervisor',
  },
  {
    name: 'Tags',
    leading: 'checkbox-avatar',
    leadingWidth: 160,
    columns: [
      { key: 'id', label: 'Tag ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description', width: 'fill', sortable: false },
      { key: 'totalUsers', label: 'Total Users', align: 'center' },
      { key: 'status', label: 'Status', align: 'center' },
    ],
    row: { id: '12345', name: 'Tag Name', description: 'Description', totalUsers: '4', status: 'Active' },
    statusKey: 'status',
  },
  {
    name: 'Notes',
    leading: 'checkbox',
    leadingWidth: 135,
    corners: 'none',
    selected: false,
    columns: [
      { key: 'createdBy', label: 'Created By', width: 193 },
      { key: 'category', label: 'Category', width: 201 },
      { key: 'created', label: 'Created', width: 235 },
      { key: 'note', label: 'Note', width: 'fill' },
    ],
    row: {
      createdBy: 'User Name',
      category: 'Assembly',
      created: 'Mar 24, 2026 10:30AM',
      note: 'Lorem  ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Cursus turpis massa  tincidunt dui ut ornare. Non diam phasellus vestibulum lorem sed.  Aliquam eleifend mi in nulla posuere.',
    },
  },
];

/** Tenant Headers* (1098:813) and Tenant Rows* (1098:940). */
export const TENANT_SCREEN: FigmaScreen = {
  name: 'Tenants',
  leading: 'checkbox-avatar',
  corners: 'bottom',
  initials: 'JR',
  columns: [
    { key: 'id', label: 'Tenant ID' },
    { key: 'name', label: 'Name', width: 'fill' },
    { key: 'planType', label: 'Plan Type', align: 'center' },
    { key: 'status', label: 'Status', align: 'center' },
  ],
  row: { id: '123-456-789', name: 'Acme', planType: 'Starter', status: 'Active' },
  statusKey: 'status',
};
