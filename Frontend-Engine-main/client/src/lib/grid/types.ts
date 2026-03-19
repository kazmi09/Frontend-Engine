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
  requiredPermissions?: string[] // Permissions needed to view/edit this column
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

// Extend TanStack Table's ColumnMeta type
declare module '@tanstack/vue-table' {
  interface ColumnMeta<TData, TValue> extends ColumnMetaProperties {}
}
