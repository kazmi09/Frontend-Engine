<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Debug Info -->
    <div v-if="false" class="p-2 bg-gray-100 text-xs">
      <div>Data rows: {{ props.data?.rows?.length || 0 }}</div>
      <div>Columns: {{ props.data?.columns?.length || 0 }}</div>
      <div>Table rows: {{ table.getRowModel().rows.length }}</div>
      <div>First row data: {{ JSON.stringify(props.data?.rows?.[0]) }}</div>
    </div>

    <!-- Table Container -->
    <div 
      ref="tableContainerRef" 
      class="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white"
    >
      <!-- Custom Table using TanStack Table -->
      <div v-if="!props.data || !props.data.columns || props.data.columns.length === 0" class="p-8 text-center text-gray-500">
        <div v-if="isLoading">Loading...</div>
        <div v-else>No data available</div>
      </div>
      
      <table v-else class="w-full border-collapse" :key="tableKey">
        <!-- Header -->
        <thead class="bg-gray-50 sticky top-0 z-10">
          <tr v-for="headerGroup in (table?.getHeaderGroups?.() || [])" :key="headerGroup.id">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="{ width: `${header.getSize()}px` }"
              class="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
            >
              <div class="flex items-center gap-2">
                <!-- Selection Header -->
                <template v-if="header.id === 'select'">
                  <q-checkbox
                    :model-value="table?.getIsAllRowsSelected?.()"
                    :indeterminate="table?.getIsSomeRowsSelected?.()"
                    @update:model-value="(value) => table?.toggleAllRowsSelected?.(value)"
                  />
                </template>
                
                <!-- Regular Column Header -->
                <template v-else>
                  <span>{{ header.column.columnDef.header }}</span>
                  
                  <!-- Sort Indicator -->
                  <div v-if="header.column.getCanSort()" class="flex flex-col ml-1">
                    <q-btn
                      flat
                      dense
                      size="xs"
                      icon="keyboard_arrow_up"
                      :class="getSortButtonClass(header.column.id, false)"
                      @click="handleSort(header.column.id, false)"
                    />
                    <q-btn
                      flat
                      dense
                      size="xs"
                      icon="keyboard_arrow_down"
                      :class="getSortButtonClass(header.column.id, true)"
                      @click="handleSort(header.column.id, true)"
                    />
                  </div>
                </template>
              </div>
              
              <!-- Resize Handle -->
              <div
                v-if="header.column.getCanResize() && header.id !== 'select'"
                class="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-blue-500"
                @mousedown="startResize(header.column.id, $event)"
              />
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="bg-white divide-y divide-gray-200">
          <template v-for="row in (table?.getRowModel?.()?.rows || [])" :key="row.id">
            <!-- Main Row -->
            <tr 
              :class="getRowClass(row)"
              class="hover:bg-gray-50"
            >
              <td
                v-for="cell in (row?.getVisibleCells?.() || [])"
                :key="cell.id"
                :style="{ width: `${cell.column.getSize()}px` }"
                class="border-b border-gray-200 px-4 py-3 whitespace-nowrap text-sm"
              >
                <!-- Expander Cell -->
                <ExpanderCell
                  v-if="cell.column.id === 'expander'"
                  :row-id="row.original.id"
                  :can-expand="canExpandRow(row)"
                  @toggle="handleToggleExpansion"
                />
                
                <!-- Selection Cell -->
                <template v-else-if="cell.column.id === 'select'">
                  <q-checkbox
                    :model-value="row?.getIsSelected?.()"
                    @update:model-value="(value) => row?.toggleSelected?.(value)"
                  />
                </template>
                
                <!-- Regular Cell -->
                <EditableCell
                  v-else
                  :value="cell.getValue()"
                  :row-id="row.original.id"
                  :column="getColumnConfig(cell.column.id)"
                  :width="cell.column.getSize()"
                />
              </td>
            </tr>
            
            <!-- Detail Panel Row -->
            <template v-if="row.getIsExpanded?.()">
              <DetailPanel
                :row="row.original"
                :row-id="row.original.id"
                :column-count="row.getVisibleCells().length"
                :expandable-config="props.data.expandable!"
                @retry="handleRetryDetailLoad"
              >
                <template #default="slotProps">
                  <slot name="detail-panel" v-bind="slotProps" />
                </template>
              </DetailPanel>
            </template>
          </template>
        </tbody>
      </table>

      <!-- Loading Overlay -->
      <div v-if="isLoading" class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
        <q-spinner-dots size="50px" color="primary" />
      </div>
    </div>

    <!-- Pagination -->
    <div class="bg-white dark:bg-neutral-900 border-t px-6 py-3 flex items-center justify-between flex-none">
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">
          Showing {{ startRow }} to {{ endRow }} of {{ totalRows }} entries
        </span>
        
        <q-select
          v-model="pageSize"
          :options="pageSizeOptions"
          outlined
          dense
          emit-value
          map-options
          style="min-width: 100px"
          @update:model-value="gridStore.setPageSize"
        >
          <template v-slot:prepend>
            <span class="text-sm">Show:</span>
          </template>
        </q-select>
      </div>

      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="7"
        direction-links
        boundary-links
        @update:model-value="(value) => gridStore.setPageIndex(value - 1)"
      />
    </div>

    <!-- Bulk Actions Bar -->
    <BulkActionsBar
      :columns="props.data?.columns || []"
      @bulk-edit="handleBulkEdit"
      @bulk-archive="handleBulkArchive"
      @bulk-delete="handleBulkDelete"
      @export="handleExport"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  type ColumnDef,
} from '@tanstack/vue-table'
import { useGridStore } from '@/lib/grid/store'
import { useAuthStore } from '@/lib/auth/store'
import { DataResult, ColumnConfig } from '@/lib/grid/types'
import EditableCell from './cells/EditableCell.vue'
import ExpanderCell from './cells/ExpanderCell.vue'
import DetailPanel from './cells/DetailPanel.vue'
import BulkActionsBar from './BulkActionsBar.vue'

const props = defineProps<{
  data: DataResult
  isLoading?: boolean
}>()

const emit = defineEmits<{
  bulkEdit: [data: { selectedIds: string[], updates: Record<string, any> }]
  bulkArchive: [selectedIds: string[]]
  bulkDelete: [selectedIds: string[]]
  export: [selectedIds: string[]]
}>()

const tableContainerRef = ref<HTMLDivElement>()
const gridStore = useGridStore()
const authStore = useAuthStore()

// Use storeToRefs to make store properties reactive
const { 
  columnVisibility,
  columnOrder,
  columnPinning,
  columnSizing,
  sorting,
  pageIndex,
  pageSize,
  rowSelection,
  expandedRows,
} = storeToRefs(gridStore)

const { user } = storeToRefs(authStore)

// Check if user has permission to expand rows
const hasExpandPermission = computed(() => {
  console.log('=== EXPAND PERMISSION CHECK ===')
  console.log('expandable config:', props.data?.expandable)
  console.log('required permissions:', props.data?.expandable?.requiredPermissions)
  console.log('user role:', user.value.role)
  
  if (!props.data?.expandable?.requiredPermissions) {
    console.log('No permissions required, returning true')
    return true
  }
  const userRole = user.value.role
  const hasPermission = props.data.expandable.requiredPermissions.includes(userRole)
  console.log('Has permission?', hasPermission)
  console.log('=== END PERMISSION CHECK ===')
  return hasPermission
})

// Columns definition
const columns = computed<ColumnDef<any>[]>(() => {
  console.log('=== COMPUTING COLUMNS ===')
  console.log('Computing columns, data:', props.data)
  console.log('Has expandable?', !!props.data?.expandable)
  console.log('Has permission?', hasExpandPermission.value)
  
  if (!props.data?.columns || !Array.isArray(props.data.columns)) {
    console.log('No columns data available, returning empty array')
    return []
  }
  
  const cols: ColumnDef<any>[] = []
  
  // Add expander column if expandable config exists and user has permissions
  if (props.data.expandable && hasExpandPermission.value) {
    console.log('✅ Adding expander column!')
    cols.push({
      id: "expander",
      header: "",
      cell: ({ row }) => row.original,
      enableSorting: false,
      enableHiding: false,
      size: 50,
      minSize: 50,
      maxSize: 50,
    })
  } else {
    console.log('❌ NOT adding expander column')
    console.log('  - has expandable?', !!props.data.expandable)
    console.log('  - has permission?', hasExpandPermission.value)
  }
  
  const selectColumn: ColumnDef<any> = {
    id: "select",
    header: "Select",
    cell: ({ row }) => row.getIsSelected(),
    enableSorting: false,
    enableHiding: false,
    size: 50,
    minSize: 50,
    maxSize: 50,
  }

  const dataColumns: ColumnDef<any>[] = props.data.columns.map((col) => ({
    id: col.id,
    accessorKey: col.id,
    header: col.label,
    size: col.width || 150,
    minSize: col.minWidth || 100,
    maxSize: col.maxWidth || 500,
    enableSorting: true,
    enableHiding: true, // Make sure this is true
    meta: {
      columnConfig: col // Store the original column config
    }
  }))

  cols.push(selectColumn, ...dataColumns)
  console.log('Computed columns:', cols)
  return cols
})

// Table instance with reactive state
const table = useVueTable({
  data: computed(() => {
    const rows = props.data?.rows || []
    console.log('Table data:', rows.length, 'rows')
    if (rows.length > 0) {
      console.log('First row sample:', rows[0])
      console.log('First row ID:', rows[0].id)
    }
    return rows
  }),
  get columns() { 
    return columns.value 
  },
  state: {
    get columnVisibility() { 
      console.log('Getting columnVisibility:', columnVisibility.value)
      return columnVisibility.value 
    },
    get columnOrder() { 
      return columnOrder.value 
    },
    get columnPinning() { 
      return columnPinning.value 
    },
    get columnSizing() { 
      return columnSizing.value 
    },
    get sorting() { 
      console.log('Getting sorting state:', sorting.value)
      return sorting.value 
    },
    get rowSelection() { 
      return rowSelection.value 
    },
    get expanded() {
      console.log('[TABLE STATE] Getting expanded state:', expandedRows.value)
      return expandedRows.value
    },
    get pagination() {
      return {
        pageIndex: pageIndex.value,
        pageSize: pageSize.value,
      }
    },
  },
  onColumnVisibilityChange: (updater) => {
    console.log('onColumnVisibilityChange called with:', updater)
    gridStore.setColumnVisibility(updater)
  },
  onColumnOrderChange: gridStore.setColumnOrder,
  onColumnPinningChange: gridStore.setColumnPinning,
  onColumnSizingChange: gridStore.setColumnSizing,
  onSortingChange: (updater) => {
    console.log('onSortingChange called with:', updater)
    gridStore.setSorting(updater)
  },
  onRowSelectionChange: gridStore.setRowSelection,
  onExpandedChange: (updater) => {
    console.log('[TABLE] onExpandedChange called with:', updater)
    console.log('[TABLE] Current expandedRows:', expandedRows.value)
    
    let newState: Record<string, boolean>
    
    if (typeof updater === 'function') {
      const currentState = expandedRows.value
      const result = updater(currentState)
      
      // Handle both boolean (expand all) and object (specific rows) results
      if (typeof result === 'boolean') {
        newState = result ? Object.fromEntries(props.data?.rows?.map(row => [row.id, true]) || []) : {}
      } else {
        newState = result as Record<string, boolean>
      }
      console.log('[TABLE] New expanded state from updater:', newState)
    } else {
      // Handle both boolean and object direct updates
      if (typeof updater === 'boolean') {
        newState = updater ? Object.fromEntries(props.data?.rows?.map(row => [row.id, true]) || []) : {}
      } else {
        newState = updater as Record<string, boolean>
      }
      console.log('[TABLE] Direct state update:', updater)
    }
    
    // Get all row IDs that were previously expanded
    const previouslyExpanded = Object.keys(expandedRows.value)
    
    // Process all rows in the new state
    Object.keys(newState).forEach(rowId => {
      if (newState[rowId]) {
        gridStore.expandRow(rowId)
      } else {
        gridStore.collapseRow(rowId)
      }
    })
    
    // Collapse any rows that were expanded but are not in the new state
    previouslyExpanded.forEach(rowId => {
      if (!(rowId in newState)) {
        console.log('[TABLE] Collapsing row not in new state:', rowId)
        gridStore.collapseRow(rowId)
      }
    })
  },
  onPaginationChange: (updater) => {
    if (typeof updater === 'function') {
      const current = { pageIndex: pageIndex.value, pageSize: pageSize.value }
      const newState = updater(current)
      gridStore.setPageIndex(newState.pageIndex)
      gridStore.setPageSize(newState.pageSize)
    }
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getRowId: (row) => row.id, // Tell TanStack Table how to identify rows
  manualPagination: true,
  manualSorting: false, // Let TanStack Table handle sorting
  enableRowSelection: true,
  enableExpanding: true,
  enableColumnResizing: true,
  columnResizeMode: "onChange",
})

// Force table re-render when state changes
const tableKey = computed(() => {
  return `${JSON.stringify(columnVisibility.value)}-${JSON.stringify(sorting.value)}`
})

// Table columns for Quasar - REMOVED, using native table now

// Pagination
const currentPage = computed({
  get: () => pageIndex.value + 1,
  set: (value) => gridStore.setPageIndex(value - 1)
})

const totalRows = computed(() => props.data?.pagination?.totalRows || 0)
const totalPages = computed(() => Math.ceil(totalRows.value / pageSize.value))
const startRow = computed(() => pageIndex.value * pageSize.value + 1)
const endRow = computed(() => Math.min((pageIndex.value + 1) * pageSize.value, totalRows.value))

const pageSizeOptions = [
  { label: '10', value: 10 },
  { label: '20', value: 20 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
]

// Helper functions
const getColumnConfig = (columnId: string): ColumnConfig => {
  return props.data?.columns.find(col => col.id === columnId) || {
    id: columnId,
    label: columnId,
    type: 'string'
  }
}

const getRowClass = (row: any) => {
  const classes = []
  if (row.getIsSelected()) {
    classes.push('bg-blue-50 dark:bg-blue-900/20')
  }
  if (row.getIsExpanded?.()) {
    classes.push('bg-gray-50')
  }
  return classes.join(' ')
}

// Check if a row can be expanded
const canExpandRow = (row: any) => {
  if (!props.data?.expandable) return false
  if (props.data.expandable.canExpand) {
    return props.data.expandable.canExpand(row.original)
  }
  return true
}

// Handle row expansion toggle
const handleToggleExpansion = (rowId: string) => {
  console.log('=== TOGGLE EXPANSION DEBUG ===')
  console.log('Toggle expansion for row:', rowId)
  console.log('Current expandedRows state:', JSON.stringify(expandedRows.value))
  console.log('Is row currently expanded?', expandedRows.value[rowId])
  
  // Find the row in TanStack Table
  const tableRows = table.getRowModel().rows
  const targetRow = tableRows.find(r => r.original.id === rowId)
  
  if (targetRow) {
    console.log('Found row in TanStack Table, current expanded state:', targetRow.getIsExpanded?.())
    
    // Handle singleExpand mode
    if (props.data?.expandable?.singleExpand && !targetRow.getIsExpanded?.()) {
      console.log('SingleExpand mode: collapsing all rows')
      gridStore.collapseAllRows()
    }
    
    // Use TanStack Table's toggle method
    targetRow.toggleExpanded()
    console.log('After toggleExpanded(), row state:', targetRow.getIsExpanded?.())
  } else {
    console.log('Could not find row in TanStack Table, falling back to store')
    // Fallback to store method
    if (props.data?.expandable?.singleExpand && !expandedRows.value[rowId]) {
      gridStore.collapseAllRows()
    }
    gridStore.toggleRowExpansion(rowId)
  }
  
  console.log('After toggle, expandedRows state:', JSON.stringify(expandedRows.value))
  console.log('=== END DEBUG ===')
}

// Handle retry for lazy loading
const handleRetryDetailLoad = async (rowId: string) => {
  if (!props.data?.expandable?.lazyLoad) return
  
  gridStore.setDetailPanelLoading(rowId, true)
  try {
    const row = props.data.rows.find(r => r.id === rowId)
    if (row) {
      const data = await props.data.expandable.lazyLoad(row, rowId)
      gridStore.setDetailPanelData(rowId, data)
    }
  } catch (err) {
    gridStore.setDetailPanelError(
      rowId,
      err instanceof Error ? err.message : 'Failed to load detail data'
    )
  }
}

// Sorting
const getSortButtonClass = (columnId: string, desc: boolean) => {
  const sortState = sorting.value.find(s => s.id === columnId)
  const isActive = sortState && sortState.desc === desc
  return isActive ? 'text-blue-600' : 'text-gray-400'
}

const handleSort = (columnId: string, desc: boolean) => {
  console.log('Sort clicked:', { columnId, desc })
  
  const column = table.getColumn(columnId)
  if (column) {
    console.log('Column found, toggling sort')
    column.toggleSorting(desc)
  } else {
    console.log('Column not found:', columnId)
  }
}

// Column resizing
const startResize = (columnId: string, event: MouseEvent) => {
  event.preventDefault()
  
  const startX = event.clientX
  const column = table.getColumn(columnId)
  const startWidth = column?.getSize() || 150
  
  const handleMouseMove = (e: MouseEvent) => {
    const diff = e.clientX - startX
    const newWidth = Math.max(100, startWidth + diff)
    gridStore.setColumnSizing({ ...columnSizing.value, [columnId]: newWidth })
  }
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// Initialize default expanded rows
onMounted(() => {
  if (props.data?.expandable?.defaultExpanded) {
    gridStore.expandAllRows(props.data.expandable.defaultExpanded)
  }
})

// Cleanup expanded rows when data changes
watch(() => props.data?.rows, (newRows) => {
  if (newRows) {
    const validRowIds = newRows.map(r => r.id)
    gridStore.cleanupExpandedRows(validRowIds)
  }
}, { deep: true })

// Cleanup expanded rows when page changes
watch(pageIndex, () => {
  if (props.data?.rows) {
    const validRowIds = props.data.rows.map(r => r.id)
    gridStore.cleanupExpandedRows(validRowIds)
  }
})

// Bulk action handlers
const handleBulkEdit = (data: { selectedIds: string[], updates: Record<string, any> }) => {
  emit('bulkEdit', data)
}

const handleBulkArchive = (selectedIds: string[]) => {
  emit('bulkArchive', selectedIds)
}

const handleBulkDelete = (selectedIds: string[]) => {
  emit('bulkDelete', selectedIds)
}

const handleExport = (selectedIds: string[]) => {
  emit('export', selectedIds)
}
</script>

<style lang="sass" scoped>
.grid-table
  table
    border-collapse: collapse
    
  th, td
    border-right: 1px solid rgba(0, 0, 0, 0.12)
    
  th:last-child, td:last-child
    border-right: none
    
  tbody tr:hover
    background-color: rgba(0, 0, 0, 0.02)
</style>