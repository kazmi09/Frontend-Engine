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