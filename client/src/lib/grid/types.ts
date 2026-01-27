import { type ColumnDef } from "@tanstack/vue-table";
import type { Component } from "vue";

export type ColumnType = "string" | "number" | "date" | "boolean" | "select";

export interface ColumnConfig {
  id: string;
  label: string;
  type: ColumnType;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  pinned?: "left" | "right" | false;
  editable?: boolean;
  hidden?: boolean;
  requiredPermissions?: string[]; // "admin", "editor", etc.
  options?: string[]; // For select type
  validator?: (value: any) => string | null; // Validation function
}

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

export interface DataResult {
  primaryKey: string;
  columns: ColumnConfig[];
  rows: DataRow[];
  pagination?: {
    pageIndex: number;
    pageSize: number;
    totalRows: number;
  };
  expandable?: ExpandableConfig; // New property
}

// Expandable row configuration
export interface ExpandableConfig<TData = any> {
  // Renderer configuration (slot name or component)
  renderer?: string | Component;
  
  // Lazy loading function
  lazyLoad?: (row: TData, rowId: string) => Promise<any>;
  
  // Initially expanded row IDs
  defaultExpanded?: string[];
  
  // Only allow one row expanded at a time
  singleExpand?: boolean;
  
  // Required permissions to expand rows
  requiredPermissions?: string[];
  
  // Custom row expansion check (e.g., only expand rows with children)
  canExpand?: (row: TData) => boolean;
}

// Detail panel data state
export interface DetailPanelState {
  [rowId: string]: {
    data: any;
    loading: boolean;
    error: string | null;
  };
}