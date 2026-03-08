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
  icon?: string // Icon for navigation/display
  displayName?: string // Singular form (e.g., "User", "Product")
  displayNamePlural?: string // Plural form (e.g., "Users", "Products")
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
  grouping?: {
    enabled: boolean
    allowMultipleGroups?: boolean
    collapsible?: boolean
    defaultCollapsed?: boolean
    showGroupCount?: boolean
    showGroupSummary?: boolean
    summaryFields?: {
      field: string
      aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'
      label?: string
    }[]
    /**
     * Optional group-level styling and label customization.
     * This is intentionally declarative (no functions) to keep configs serializable and dataset-agnostic.
     */
    groupStyles?: {
      /**
       * Zero-based grouping depth this style applies to (0 = top-level group).
       * If omitted, applies to all levels unless a more specific entry overrides it.
       */
      level?: number
      /**
       * Extra CSS class to apply to the group header row (e.g. Tailwind utility class).
       */
      rowClass?: string
      /**
       * Extra CSS class to apply to the count badge in the group header.
       */
      badgeClass?: string
    }[]
    /**
     * Optional label templates for group headers.
     * Tokens: {columnLabel}, {value}, {count}, {displayName}, {displayNamePlural}
     */
    labelTemplates?: {
      /**
       * Column ID this template applies to. If omitted, used as a default template for all grouped columns.
       */
      field?: string
      /**
       * Template string, e.g. "{columnLabel}: {value} ({count} {displayNamePlural})"
       */
      template: string
    }[]
  }
}

// Grid configurations registry
export const GRID_CONFIGS: Record<string, GridConfig> = {
  // DummyJSON Users API - Full CRUD support
  users: {
    id: 'users',
    name: 'Users',
    description: 'User management grid with DummyJSON API',
    icon: 'group',
    displayName: 'user',
    displayNamePlural: 'users',
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
      {
        id: "firstName",
        label: "First Name",
        type: "string",
        width: 150,
        editable: true,
        permissions: {
          view: ["admin", "moderator", "viewer"],
          edit: ["admin", "moderator"],
        },
      },
      {
        id: "lastName",
        label: "Last Name",
        type: "string",
        width: 150,
        editable: true,
        permissions: {
          view: ["admin", "moderator", "viewer"],
          edit: ["admin", "moderator"],
        },
      },
      {
        id: "email",
        label: "Email",
        type: "string",
        width: 250,
        editable: true,
        permissions: {
          view: ["admin", "moderator"],
          edit: ["admin"],
        },
      },
      {
        id: "phone",
        label: "Phone",
        type: "string",
        width: 180,
        editable: true,
        permissions: {
          view: ["admin", "moderator"],
          edit: ["admin", "moderator"],
        },
      },
      {
        id: "username",
        label: "Username",
        type: "string",
        width: 120,
        editable: true,
        permissions: {
          view: ["admin", "moderator", "viewer"],
          edit: ["admin", "moderator"],
        },
      },
      {
        id: "age",
        label: "Age",
        type: "number",
        width: 80,
        editable: true,
        permissions: {
          view: ["admin", "moderator", "viewer"],
          edit: ["admin"],
        },
      },
      {
        id: "gender",
        label: "Gender",
        type: "select",
        options: ["male", "female"],
        width: 100,
        editable: true,
        permissions: {
          view: ["admin", "moderator", "viewer"],
          edit: ["admin"],
        },
      },
      {
        id: "birthDate",
        label: "Birth Date",
        type: "date",
        width: 120,
        editable: true,
        permissions: {
          view: ["admin", "moderator"],
          edit: ["admin"],
        },
      },
      {
        id: "bloodGroup",
        label: "Blood Group",
        type: "string",
        width: 120,
        editable: true,
        permissions: {
          view: ["admin", "moderator"],
          edit: ["admin"],
        },
      },
      {
        id: "height",
        label: "Height",
        type: "number",
        width: 100,
        editable: true,
        permissions: {
          view: ["admin", "moderator"],
          edit: ["admin"],
        },
      },
      {
        id: "weight",
        label: "Weight",
        type: "number",
        width: 100,
        editable: true,
        permissions: {
          view: ["admin", "moderator"],
          edit: ["admin"],
        },
      },
      {
        id: "eyeColor",
        label: "Eye Color",
        type: "string",
        width: 120,
        editable: true,
        permissions: {
          view: ["admin", "moderator", "viewer"],
          edit: ["admin"],
        },
      },
      {
        id: "university",
        label: "University",
        type: "string",
        width: 200,
        editable: true,
        permissions: {
          view: ["admin", "moderator", "viewer"],
          edit: ["admin", "moderator"],
        },
      },
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
      filterableColumns: ['gender', 'bloodGroup', 'eyeColor']
    },
    grouping: {
      enabled: true,
      allowMultipleGroups: true,
      collapsible: true,
      defaultCollapsed: false,
      showGroupCount: true,
      showGroupSummary: true,
      summaryFields: [
        { field: 'age', aggregation: 'avg', label: 'Avg Age' },
        { field: 'height', aggregation: 'avg', label: 'Avg Height' },
        { field: 'weight', aggregation: 'avg', label: 'Avg Weight' }
      ],
      // Example group-level customization for users grid
      groupStyles: [
        // Top-level groups: slightly stronger background
        { level: 0, rowClass: 'group-level-0-custom', badgeClass: 'group-badge-level-0' },
        // Second-level groups: lighter background
        { level: 1, rowClass: 'group-level-1-custom' }
      ],
      // Default label template for all grouped columns
      labelTemplates: [
        {
          template: '{columnLabel}: {value} ({count} {displayNamePlural})'
        }
      ]
    }
  },

  // DummyJSON Products API - Example of another dataset
  products: {
    id: 'products',
    name: 'Products',
    description: 'Product catalog from DummyJSON API',
    icon: 'inventory_2',
    displayName: 'product',
    displayNamePlural: 'products',
    dataSource: {
      type: 'api',
      api: {
        baseUrl: 'https://dummyjson.com',
        endpoints: {
          list: '/products',
          get: '/products/{id}',
          create: '/products/add',
          update: '/products/{id}',
          delete: '/products/{id}'
        }
      }
    },
    columns: [
      { id: "id", label: "ID", type: "number", width: 80, editable: false },
      { id: "title", label: "Product Name", type: "string", width: 250, editable: true },
      { id: "brand", label: "Brand", type: "string", width: 150, editable: true },
      { id: "category", label: "Category", type: "string", width: 150, editable: true },
      { id: "price", label: "Price", type: "number", width: 100, editable: true },
      { id: "stock", label: "Stock", type: "number", width: 100, editable: true },
      { id: "rating", label: "Rating", type: "number", width: 100, editable: false }
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
        archive: false,
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
      pageSizeOptions: [10, 20, 30, 50]
    },
    search: {
      enabled: true,
      searchableColumns: ['title', 'brand', 'category']
    },
    filters: {
      enabled: true,
      filterableColumns: ['category', 'brand']
    },
    grouping: {
      enabled: true,
      allowMultipleGroups: true,
      collapsible: true,
      defaultCollapsed: false,
      showGroupCount: true,
      showGroupSummary: true,
      summaryFields: [
        { field: 'price', aggregation: 'avg', label: 'Avg Price' },
        { field: 'stock', aggregation: 'sum', label: 'Total Stock' },
        { field: 'rating', aggregation: 'avg', label: 'Avg Rating' }
      ],
      // Example group-level customization for products grid
      groupStyles: [
        { level: 0, rowClass: 'group-level-0-custom', badgeClass: 'group-badge-level-0' }
      ],
      labelTemplates: [
        {
          template: '{columnLabel}: {value} ({count} {displayNamePlural})'
        }
      ]
    }
  }
}

export function getGridConfig(gridId: string): GridConfig | null {
  return GRID_CONFIGS[gridId] || null
}

export function getAllGridConfigs(): GridConfig[] {
  return Object.values(GRID_CONFIGS)
}