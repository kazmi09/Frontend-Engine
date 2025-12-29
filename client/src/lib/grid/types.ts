import { type ColumnDef } from "@tanstack/react-table";

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
}
