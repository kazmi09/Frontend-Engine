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
}