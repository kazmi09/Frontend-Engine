// Shared types (duplicated from shared/types.ts for client-side use)
export interface ColumnConfig {
  id: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'select'
  width?: number
  minWidth?: number
  maxWidth?: number
  pinned?: 'left' | 'right'
  editable?: boolean
  options?: string[] // For select type
  /**
   * Legacy, coarse-grained permission flag.
   * If set, the column is only visible/editable for these roles.
   * Prefer the more explicit `permissions` object below.
   */
  requiredPermissions?: string[] // Permissions needed to view/edit this column
  /**
   * Fine-grained, data-agnostic column permissions.
   * Completely config-driven – the grid engine never hardcodes any roles.
   */
  permissions?: {
    /**
     * Roles that are allowed to SEE this column.
     * If omitted, the column is visible to all roles.
     */
    view?: string[]
    /**
     * Roles that are allowed to EDIT this column.
     * If omitted, editability falls back to the base `editable` flag.
     */
    edit?: string[]
  }
}

export interface GroupingConfig {
  enabled: boolean
  groupBy?: string[] // Fields to group by (in order of priority)
  defaultGroupBy?: string[] // Default grouping fields
  allowMultipleGroups?: boolean // Allow grouping by multiple fields
  collapsible?: boolean // Allow collapsing/expanding groups
  defaultCollapsed?: boolean // Start with groups collapsed
  showGroupCount?: boolean // Show count of items in group
  showGroupSummary?: boolean // Show summary row for each group
  summaryFields?: {
    field: string
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'
    label?: string
  }[]
  customGroupHeader?: (groupValue: any, field: string, count: number) => string
  /**
   * Optional group-level styling configuration, mirrored from shared/grid-config for client-side usage.
   */
  groupStyles?: {
    /**
     * Zero-based depth of the group row (0 = top-level group).
     */
    level?: number
    /**
     * Extra CSS class to apply to the group header row.
     */
    rowClass?: string
    /**
     * Extra CSS class to apply to the group count badge.
     */
    badgeClass?: string
  }[]
  /**
   * Optional label templates for group headers.
   * Tokens: {columnLabel}, {value}, {count}, {displayName}, {displayNamePlural}
   */
  labelTemplates?: {
    /**
     * Column ID this template applies to. If omitted, used as a default template.
     */
    field?: string
    template: string
  }[]
}

export interface ExpandableConfig {
  renderer?: any // Vue component for rendering expanded content
  requiredPermissions?: string[]
  canExpand?: (row: any) => boolean
  singleExpand?: boolean
  defaultExpanded?: boolean
  lazyLoad?: boolean
  lazyLoadFn?: (row: any, rowId: string) => Promise<any>
}

export interface DataResult {
  primaryKey: string
  columns: ColumnConfig[]
  rows: any[]
  pagination?: {
    pageIndex: number
    pageSize: number
    totalRows: number
  }
  expandable?: ExpandableConfig
  grouping?: GroupingConfig
  gridId?: string
}

import type { Component } from "vue";

export type ColumnType = "string" | "number" | "date" | "boolean" | "select";

export interface GridState {
  columnVisibility: Record<string, boolean>;
  columnOrder: string[];
  columnPinning: {
    left?: string[];
    right?: string[];
  };
  columnSizing: Record<string, number>;
  sorting: { id: string; desc: boolean }[];
  grouping: string[]; // Fields currently being grouped by
  groupExpanded: Record<string, boolean>; // Track which groups are expanded
}

export interface FilterState {
  [columnId: string]: {
    value: any;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  };
}

export interface DataRow {
  id: string;
  [key: string]: any;
}

// Detail panel data state
export interface DetailPanelState {
  [rowId: string]: {
    data: any;
    loading: boolean;
    error: string | null;
  };
}

// Column meta properties for TanStack Table
export interface ColumnMetaProperties {
  columnConfig?: any;
  pinned?: 'left' | 'right';
  reorderable?: boolean;
  resizable?: boolean;
}

// Group row type
export interface GroupRow {
  isGroupHeader: true;
  groupField: string;
  groupValue: any;
  groupLabel: string;
  count: number;
  rows: any[];
  isExpanded: boolean;
  level: number; // For nested grouping
  summary?: Record<string, any>;
}

// Extend TanStack Table's ColumnMeta type
declare module '@tanstack/vue-table' {
  interface ColumnMeta<TData, TValue> extends ColumnMetaProperties {}
}
