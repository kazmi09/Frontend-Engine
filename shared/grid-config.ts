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

export interface GridDataSource {
  type: 'mysql' | 'api' | 'static'
  connection?: {
    table: string
    primaryKey: string
    database?: string
  }
  api?: {
    baseUrl: string
    endpoints: {
      list: string
      get?: string
      create?: string
      update?: string
      delete?: string
      bulkEdit?: string
      bulkDelete?: string
      bulkArchive?: string
      export?: string
    }
    headers?: Record<string, string>
  }
  static?: {
    data: any[]
  }
}

export interface GridExpandableConfig {
  enabled: boolean
  component?: string // Component name to render
  requiredPermissions?: string[]
  canExpand?: string // Function as string that can be evaluated
  singleExpand?: boolean
  defaultExpanded?: boolean
  lazyLoad?: boolean
}

export interface GridBulkActionsConfig {
  enabled: boolean
  actions: {
    edit?: boolean
    delete?: boolean
    archive?: boolean
    export?: boolean
    custom?: Array<{
      id: string
      label: string
      icon: string
      endpoint: string
      method: 'POST' | 'PATCH' | 'DELETE'
      confirmationRequired?: boolean
    }>
  }
}

export interface GridConfig {
  id: string
  name: string
  description?: string
  dataSource: GridDataSource
  columns: ColumnConfig[]
  expandable?: GridExpandableConfig
  bulkActions?: GridBulkActionsConfig
  permissions?: {
    read?: string[]
    create?: string[]
    update?: string[]
    delete?: string[]
  }
  pagination?: {
    enabled: boolean
    defaultPageSize: number
    pageSizeOptions: number[]
  }
  search?: {
    enabled: boolean
    searchableColumns: string[]
  }
  filters?: {
    enabled: boolean
    filterableColumns: string[]
  }
}

// Grid configurations registry
export const GRID_CONFIGS: Record<string, GridConfig> = {
  employees: {
    id: 'employees',
    name: 'Employees',
    description: 'Employee management grid',
    dataSource: {
      type: 'mysql',
      connection: {
        table: 'employees_temp',
        primaryKey: 'employee_id',
      }
    },
    columns: [
      { 
        id: "employee_id", 
        label: "Employee ID", 
        type: "number", 
        width: 120, 
        pinned: "left", 
        editable: false 
      },
      { 
        id: "first_name", 
        label: "First Name", 
        type: "string", 
        width: 200, 
        editable: true 
      },
      { 
        id: "last_name", 
        label: "Last Name", 
        type: "string", 
        width: 150, 
        editable: true 
      },
      { 
        id: "email", 
        label: "Email", 
        type: "string", 
        width: 300, 
        editable: true 
      },
      { 
        id: "department", 
        label: "Department", 
        type: "string", 
        width: 140, 
        editable: true 
      },
      { 
        id: "job_title", 
        label: "Job Title", 
        type: "string", 
        width: 150, 
        editable: true 
      },
      { 
        id: "salary", 
        label: "Salary", 
        type: "string", 
        width: 250, 
        editable: true 
      },
      { 
        id: "hire_date", 
        label: "Hire Date", 
        type: "date", 
        width: 150, 
        editable: true 
      },
    ],
    expandable: {
      enabled: true,
      component: 'GenericDetailPanel',
      requiredPermissions: ['admin', 'editor', 'viewer'],
      canExpand: '() => true',
      singleExpand: false,
      defaultExpanded: false,
      lazyLoad: false
    },
    bulkActions: {
      enabled: true,
      actions: {
        edit: true,
        delete: true,
        archive: true,
        export: true
      }
    },
    permissions: {
      read: ['admin', 'editor', 'viewer'],
      create: ['admin', 'editor'],
      update: ['admin', 'editor'],
      delete: ['admin']
    },
    pagination: {
      enabled: true,
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100]
    },
    search: {
      enabled: true,
      searchableColumns: ['employee_id', 'first_name', 'last_name', 'email', 'department', 'job_title']
    },
    filters: {
      enabled: true,
      filterableColumns: ['department', 'job_title']
    }
  },

  // DummyJSON Users API - Full CRUD support
  users: {
    id: 'users',
    name: 'Users',
    description: 'User management grid with DummyJSON API',
    dataSource: {
      type: 'api',
      api: {
        baseUrl: 'https://dummyjson.com',
        endpoints: {
          list: '/users',
          get: '/users/{id}',
          create: '/users/add',
          update: '/users/{id}',
          delete: '/users/{id}',
          bulkEdit: '/users/bulk/edit',
          bulkDelete: '/users/bulk/delete',
          export: '/users/export'
        }
      }
    },
    columns: [
      { id: "id", label: "ID", type: "number", width: 80, pinned: "left", editable: false },
      { id: "firstName", label: "First Name", type: "string", width: 150, editable: true },
      { id: "lastName", label: "Last Name", type: "string", width: 150, editable: true },
      { id: "email", label: "Email", type: "string", width: 250, editable: true },
      { id: "phone", label: "Phone", type: "string", width: 180, editable: true },
      { id: "username", label: "Username", type: "string", width: 120, editable: true },
      { id: "age", label: "Age", type: "number", width: 80, editable: true },
      { id: "gender", label: "Gender", type: "select", options: ["male", "female"], width: 100, editable: true },
      { id: "birthDate", label: "Birth Date", type: "date", width: 120, editable: true },
      { id: "bloodGroup", label: "Blood Group", type: "string", width: 120, editable: true },
      { id: "height", label: "Height", type: "number", width: 100, editable: true },
      { id: "weight", label: "Weight", type: "number", width: 100, editable: true },
      { id: "eyeColor", label: "Eye Color", type: "string", width: 120, editable: true },
      { id: "university", label: "University", type: "string", width: 200, editable: true },
      { id: "role", label: "Role", type: "select", options: ["admin", "moderator", "user"], width: 120, editable: true }
    ],
    expandable: {
      enabled: true,
      component: 'GenericDetailPanel',
      requiredPermissions: ['admin', 'editor', 'viewer'],
      canExpand: '() => true',
      singleExpand: true,
      defaultExpanded: false,
      lazyLoad: false
    },
    bulkActions: {
      enabled: true,
      actions: {
        edit: true,
        delete: true,
        archive: false, // DummyJSON doesn't support archiving
        export: true
      }
    },
    permissions: {
      read: ['admin', 'editor', 'viewer'],
      create: ['admin', 'editor'],
      update: ['admin', 'editor'],
      delete: ['admin']
    },
    pagination: {
      enabled: true,
      defaultPageSize: 30,
      pageSizeOptions: [10, 20, 30, 50]
    },
    search: {
      enabled: true,
      searchableColumns: ['firstName', 'lastName', 'email', 'username', 'phone']
    },
    filters: {
      enabled: true,
      filterableColumns: ['gender', 'role', 'bloodGroup', 'eyeColor']
    }
  }
}

export function getGridConfig(gridId: string): GridConfig | null {
  return GRID_CONFIGS[gridId] || null
}

export function getAllGridConfigs(): GridConfig[] {
  return Object.values(GRID_CONFIGS)
}