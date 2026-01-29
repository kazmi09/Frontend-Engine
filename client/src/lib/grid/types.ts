// Re-export shared types for consistency
export { ColumnConfig, ExpandableConfig, DataResult } from '../../../shared/types'
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