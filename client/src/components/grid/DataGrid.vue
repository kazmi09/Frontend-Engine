<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Scroll Position Indicator - Always Visible for Testing -->
    <div 
      v-if="visibleRowRange.first && visibleRowRange.last"
      class="fixed top-20 right-8 z-50 bg-primary text-white px-4 py-2 rounded-lg shadow-lg"
    >
      <div class="text-xs font-medium">
        Viewing Rows: {{ visibleRowRange.first }} - {{ visibleRowRange.last }}
      </div>
      <div class="text-xs opacity-80 mt-1">
        {{ visibleRowRange.count }} of {{ totalRows }} total
      </div>
    </div>

    <!-- Debug Info -->
    <div v-if="false" class="p-2 bg-gray-100 text-xs">
      <div>Data rows: {{ props.data?.rows?.length || 0 }}</div>
      <div>Columns: {{ props.data?.columns?.length || 0 }}</div>
      <div>Table rows: {{ table.getRowModel().rows.length }}</div>
      <div>Virtual items: {{ rowVirtualizer && typeof rowVirtualizer.getVirtualItems === 'function' ? rowVirtualizer.getVirtualItems().length : 'N/A' }}</div>
      <div>Total size: {{ rowVirtualizer && typeof rowVirtualizer.getTotalSize === 'function' ? rowVirtualizer.getTotalSize() : 'N/A' }}px</div>
      <div>First row data: {{ JSON.stringify(props.data?.rows?.[0]) }}</div>
    </div>

    <!-- Table Container -->
    <div 
      ref="tableContainerRef" 
      class="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white relative"
      style="overflow-y: auto; overflow-x: auto;"
    >
      <!-- Enhanced Skeleton Loading with Quasar Components -->
      <div v-if="isLoading && (!props.data?.rows || props.data.rows.length === 0)" class="w-full">
        <q-markup-table flat bordered class="skeleton-table">
          <thead>
            <tr>
              <!-- Checkbox column skeleton -->
              <th class="text-left" style="width: 50px">
                <q-skeleton type="QCheckbox" animation="wave" />
              </th>
              <!-- Expander column skeleton if expandable -->
              <th v-if="props.data?.expandable" class="text-left" style="width: 50px">
                <q-skeleton type="rect" width="24px" height="24px" animation="wave" />
              </th>
              <!-- Dynamic column skeletons based on actual columns -->
              <th 
                v-for="(col, i) in (props.data?.columns || defaultSkeletonColumns)" 
                :key="i" 
                class="text-left"
              >
                <q-skeleton type="text" animation="wave" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in skeletonRowCount" :key="i">
              <!-- Checkbox cell skeleton -->
              <td>
                <q-skeleton type="QCheckbox" animation="wave" />
              </td>
              <!-- Expander cell skeleton if expandable -->
              <td v-if="props.data?.expandable">
                <q-skeleton type="rect" width="24px" height="24px" animation="wave" />
              </td>
              <!-- Data cell skeletons with varying types for realism -->
              <td 
                v-for="(col, j) in (props.data?.columns || defaultSkeletonColumns)" 
                :key="j"
              >
                <q-skeleton 
                  :type="getSkeletonType(col, j)" 
                  :width="getSkeletonWidth(col, j)"
                  animation="wave"
                />
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>
      
      <!-- No Data Message -->
      <div v-else-if="!props.data?.rows || props.data.rows.length === 0" class="p-8 text-center text-gray-500">
        <div v-if="isLoading">Loading...</div>
        <div v-else>No data available</div>
      </div>
      
      <!-- Data Table -->
      <table v-else class="w-full border-collapse" :key="tableKey">
        <!-- Header -->
        <thead class="bg-gray-50 sticky top-0 z-10">
          <tr v-for="headerGroup in (table?.getHeaderGroups?.() || [])" :key="headerGroup.id">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="{ width: `${header.getSize()}px` }"
              :class="[
                'border-b border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative',
                {
                  'cursor-move': header.id !== 'select' && header.id !== 'expander',
                  'opacity-50': isDragging && draggedColumnId === header.id,
                  'bg-blue-50': isDragging && draggedColumnId !== header.id
                }
              ]"
              :draggable="header.id !== 'select' && header.id !== 'expander'"
              @dragstart="header.id !== 'select' && header.id !== 'expander' ? handleDragStart(header.id, $event) : null"
              @dragover="header.id !== 'select' && header.id !== 'expander' ? handleDragOver(header.id, $event) : null"
              @drop="header.id !== 'select' && header.id !== 'expander' ? handleDrop(header.id, $event) : null"
              @dragend="handleDragEnd"
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
              
              <!-- Drop Indicator -->
              <div
                v-if="isDragging && dropIndicatorPosition !== null"
                class="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-20 pointer-events-none"
                :style="{ left: `${dropIndicatorPosition}px` }"
              />
              
              <!-- Resize Handle -->
              <div
                v-if="header.column.getCanResize() && header.id !== 'select' && header.id !== 'expander'"
                class="resize-handle absolute right-0 top-0 h-full w-2 cursor-col-resize group"
                @mousedown="startResize(header.column.id, $event)"
                @dblclick="handleColumnDoubleClick(header.column.id)"
              >
                <div class="h-full w-px bg-gray-300 group-hover:bg-blue-500 group-hover:w-0.5 transition-all ml-auto"></div>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Body with Virtual Scrolling -->
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- Top spacer -->
          <tr v-if="rowVirtualizer.getVirtualItems().length > 0">
            <td :colspan="columns.length" :style="{ height: `${rowVirtualizer.getVirtualItems()[0]?.start || 0}px`, padding: 0, border: 'none' }"></td>
          </tr>
          
          <template v-for="virtualRow in rowVirtualizer.getVirtualItems()" :key="virtualRow.index">
            <template v-if="table?.getRowModel?.()?.rows[virtualRow.index]">
              <template v-for="row in [table.getRowModel().rows[virtualRow.index]]" :key="row.id">
                <!-- Main Row -->
                <tr 
                  :class="getRowClass(row)"
                  class="hover:bg-gray-50"
                >
                  <td
                    v-for="cell in (row?.getVisibleCells?.() || [])"
                    :key="cell.id"
                    :style="{ width: `${cell.column.getSize()}px`, minWidth: `${cell.column.getSize()}px`, maxWidth: `${cell.column.getSize()}px` }"
                    class="border-b border-gray-200 px-4 py-3 text-sm overflow-hidden"
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
                      :grid-id="gridId"
                    />
                  </td>
                </tr>
                
                <!-- Detail Panel Row -->
                <tr v-if="row.getIsExpanded?.()" :key="`${row.id}-detail`">
                  <td :colspan="row.getVisibleCells().length" class="p-0">
                    <DetailPanel
                      :row="row.original"
                      :row-id="row.original.id"
                      :column-count="row.getVisibleCells().length"
                      :expandable-config="props.data.expandable!"
                      :columns="props.data.columns"
                      :grid-id="getGridIdFromData()"
                      @retry="handleRetryDetailLoad"
                    >
                      <template #default="slotProps">
                        <slot name="detail-panel" v-bind="slotProps" />
                      </template>
                    </DetailPanel>
                  </td>
                </tr>
              </template>
            </template>
          </template>
          
          <!-- Bottom spacer -->
          <tr v-if="rowVirtualizer.getVirtualItems().length > 0">
            <td :colspan="columns.length" :style="{ height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1]?.end || 0)}px`, padding: 0, border: 'none' }"></td>
          </tr>
        </tbody>
      </table>

      <!-- Loading More Skeleton (Infinite Scroll) -->
      <div v-if="isFetchingNext" class="w-full">
        <q-markup-table flat bordered class="skeleton-table">
          <tbody>
            <tr v-for="i in 5" :key="`loading-${i}`">
              <!-- Checkbox cell skeleton -->
              <td style="width: 50px">
                <q-skeleton type="QCheckbox" animation="wave" />
              </td>
              <!-- Expander cell skeleton if expandable -->
              <td v-if="props.data?.expandable" style="width: 50px">
                <q-skeleton type="rect" width="24px" height="24px" animation="wave" />
              </td>
              <!-- Data cell skeletons matching actual columns -->
              <td 
                v-for="(col, j) in (props.data?.columns || defaultSkeletonColumns)" 
                :key="j"
                :style="{ width: `${col.width || 150}px`, minWidth: `${col.minWidth || 100}px`, maxWidth: `${col.maxWidth || 500}px` }"
              >
                <q-skeleton 
                  :type="getSkeletonType(col, j)" 
                  :width="getSkeletonWidth(col, j)"
                  animation="wave"
                />
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>

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
        v-model="currentVirtualPage"
        :max="totalPages"
        :max-pages="7"
        direction-links
        boundary-links
        @update:model-value="handlePageChange"
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
import { useVirtualizer } from '@tanstack/vue-virtual'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type ColumnDef,
} from '@tanstack/vue-table'
import { useGridStore } from '@/lib/grid/store'
import { useGridStateStore } from '@/stores/gridState'
import { gridStateStorage } from '@/lib/grid/GridStateStorage'
import { useAuthStore } from '@/lib/auth/store'
import { useColumnReordering } from '@/composables/useColumnReordering'
import { useColumnResizing } from '@/composables/useColumnResizing'
import { DataResult, ColumnConfig } from '@/lib/grid/types'
import EditableCell from './cells/EditableCell.vue'
import ExpanderCell from './cells/ExpanderCell.vue'
import DetailPanel from './cells/DetailPanel.vue'
import BulkActionsBar from './BulkActionsBar.vue'

const props = defineProps<{
  data: DataResult
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNext?: boolean
}>()

const emit = defineEmits<{
  loadMore: []
  bulkEdit: [data: { selectedIds: string[], updates: Record<string, any> }]
  bulkArchive: [selectedIds: string[]]
  bulkDelete: [selectedIds: string[]]
  export: [selectedIds: string[]]
}>()

const tableContainerRef = ref<HTMLDivElement>()
const gridStore = useGridStore()
const gridStateStore = useGridStateStore()
const authStore = useAuthStore()

// Scroll indicator state
const showScrollIndicator = ref(false)
const scrollTimeout = ref<number | null>(null)
const visibleRowRange = ref({
  first: '',
  last: '',
  count: 0
})

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
  if (!props.data?.expandable?.requiredPermissions) {
    return true
  }
  const userRole = user.value.role
  const hasPermission = props.data.expandable.requiredPermissions.includes(userRole)
  return hasPermission
})

// Columns definition
const columns = computed<ColumnDef<any>[]>(() => {
  if (!props.data?.columns || !Array.isArray(props.data.columns)) {
    return []
  }
  
  const cols: ColumnDef<any>[] = []
  
  // Add expander column if expandable config exists and user has permissions
  if (props.data.expandable && hasExpandPermission.value) {
    cols.push({
      id: "expander",
      header: "",
      cell: ({ row }) => row.original,
      enableSorting: false,
      enableHiding: false,
      size: 50,
      minSize: 50,
      maxSize: 50,
      meta: {
        pinned: 'left',
        reorderable: false,
        resizable: false
      }
    })
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
    meta: {
      pinned: 'left',
      reorderable: false,
      resizable: false
    }
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
      columnConfig: col, // Store the original column config
      reorderable: true,
      resizable: true
    }
  }))

  cols.push(selectColumn, ...dataColumns)
  return cols
})

// Table instance with reactive state
const table = useVueTable({
  data: computed(() => {
    const rows = props.data?.rows || []
    return rows
  }),
  get columns() { 
    return columns.value 
  },
  state: {
    get columnVisibility() {
      return columnVisibility.value 
    },
    get columnOrder() {
      // Always prepend special columns (expander, select) before data columns
      const dataColumnOrder = columnOrder.value
      const specialColumns = []
      
      // Add expander first if it exists
      if (props.data?.expandable && hasExpandPermission.value) {
        specialColumns.push('expander')
      }
      
      // Add select column
      specialColumns.push('select')
      
      // Combine: special columns first, then data columns
      const fullOrder = [...specialColumns, ...dataColumnOrder]
      return fullOrder
    },
    get columnPinning() { 
      return columnPinning.value 
    },
    get columnSizing() { 
      return columnSizing.value 
    },
    get sorting() { 
      return sorting.value 
    },
    get rowSelection() { 
      return rowSelection.value 
    },
    get expanded() {
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
    const newVisibility = typeof updater === 'function' ? updater(columnVisibility.value) : updater
    console.log('[DataGrid] Column visibility changed:', newVisibility)
    
    // Update main grid store
    gridStore.setColumnVisibility(newVisibility)
    
    // Update gridState store for persistence
    Object.keys(newVisibility).forEach(columnId => {
      console.log(`[DataGrid] Saving visibility for ${columnId}:`, newVisibility[columnId])
      gridStateStore.updateColumnVisibility(gridId.value, columnId, newVisibility[columnId])
    })
  },
  onColumnOrderChange: (updater) => {
    // Filter out special columns (select, expander) from the order
    const newOrder = typeof updater === 'function' ? updater(columnOrder.value) : updater
    const filteredOrder = newOrder.filter((id: string) => id !== 'select' && id !== 'expander')
    console.log('onColumnOrderChange - filtered order:', filteredOrder)
    gridStore.setColumnOrder(filteredOrder)
  },
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
  getExpandedRowModel: getExpandedRowModel(),
  getRowId: (row, index) => {
    // Use the primary key from the data result, fallback to 'id'
    const primaryKey = props.data?.primaryKey || 'id'
    
    // CRITICAL: Use ONLY the primary key field, NEVER use row.id as fallback
    const rowId = row[primaryKey]?.toString()
    
    if (!rowId) {
      console.error('[DataGrid] ERROR: Could not get row ID from primary key:', primaryKey)
      console.error('[DataGrid] Row data:', row)
      return String(Math.random())
    }
    
    return rowId
  },
  manualPagination: true,
  manualSorting: false, // Let TanStack Table handle sorting
  enableRowSelection: true,
  enableExpanding: true,
  enableColumnResizing: true,
  columnResizeMode: "onChange",
})

// Virtual scrolling setup
const rowVirtualizer = useVirtualizer({
  get count() {
    return table.getRowModel().rows.length
  },
  getScrollElement: () => tableContainerRef.value || null,
  estimateSize: () => 53, // Estimated row height in pixels
  overscan: 10, // Increased overscan to prevent shaking during fast scroll
  measureElement: typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
    ? (element) => element?.getBoundingClientRect().height
    : undefined,
  scrollMargin: 0,
  // Enable smooth scrolling
  enabled: true,
})

// Update visible row range
const updateVisibleRowRange = () => {
  // Check if rowVirtualizer is initialized
  if (!rowVirtualizer || typeof rowVirtualizer.getVirtualItems !== 'function') {
    return
  }
  
  const virtualItems = rowVirtualizer.getVirtualItems()
  
  if (virtualItems.length > 0) {
    const firstIndex = virtualItems[0].index
    const lastIndex = virtualItems[virtualItems.length - 1].index
    const rows = table.getRowModel().rows
    
    if (rows[firstIndex] && rows[lastIndex]) {
      const primaryKey = props.data?.primaryKey || 'id'
      const newRange = {
        first: String(rows[firstIndex].original[primaryKey] || rows[firstIndex].original.id || ''),
        last: String(rows[lastIndex].original[primaryKey] || rows[lastIndex].original.id || ''),
        count: lastIndex - firstIndex + 1
      }
      
      // Only update if changed to trigger reactivity
      if (newRange.first !== visibleRowRange.value.first || newRange.last !== visibleRowRange.value.last) {
        visibleRowRange.value = newRange
      }
    }
  }
}

// Show scroll indicator on scroll
onMounted(() => {
  const container = tableContainerRef.value
  if (container) {
    // Update immediately on mount
    setTimeout(() => {
      updateVisibleRowRange()
    }, 100)
    
    // Add interval-based updates for infinite scroll mode
    const updateInterval = setInterval(() => {
      if (props.hasNextPage || props.isFetchingNext) {
        updateVisibleRowRange()
      }
    }, 500) // Update every 500ms in infinite scroll mode
    
    // Throttle scroll updates for smooth performance
    let scrollRAF: number | null = null
    let lastScrollCheck = 0
    
    // Update on scroll and check if we need to load more
    const handleScroll = () => {
      // Use requestAnimationFrame for smooth updates
      if (scrollRAF) {
        cancelAnimationFrame(scrollRAF)
      }
      
      scrollRAF = requestAnimationFrame(() => {
        updateVisibleRowRange()
        showScrollIndicator.value = true
        
        // Throttle load more check to every 100ms
        const now = Date.now()
        if (now - lastScrollCheck > 100) {
          lastScrollCheck = now
          
          // Check if we should load more data (infinite scroll)
          if (props.hasNextPage && !props.isFetchingNext) {
            const scrollTop = container.scrollTop
            const scrollHeight = container.scrollHeight
            const clientHeight = container.clientHeight
            const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
            
            // Load more when 80% scrolled
            if (scrollPercentage >= 0.8) {
              console.log('[DataGrid] Loading more data...')
              emit('loadMore')
            }
          }
        }
        
        // Hide indicator after 2 seconds of no scrolling
        if (scrollTimeout.value) {
          clearTimeout(scrollTimeout.value)
        }
        scrollTimeout.value = window.setTimeout(() => {
          showScrollIndicator.value = false
        }, 2000)
        
        scrollRAF = null
      })
    }
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Cleanup on unmount
    return () => {
      container.removeEventListener('scroll', handleScroll)
      clearInterval(updateInterval)
      if (scrollRAF) {
        cancelAnimationFrame(scrollRAF)
      }
    }
  }
})

// Also update visible range when virtual items change
watch(() => {
  if (rowVirtualizer && typeof rowVirtualizer.getVirtualItems === 'function') {
    return rowVirtualizer.getVirtualItems()
  }
  return []
}, () => {
  updateVisibleRowRange()
}, { deep: true })

// Update visible row range when data changes
watch(() => props.data?.rows, () => {
  setTimeout(() => {
    updateVisibleRowRange()
  }, 100)
}, { immediate: true })

// Force table re-render when state changes
const tableKey = computed(() => {
  return `${JSON.stringify(columnVisibility.value)}-${JSON.stringify(sorting.value)}`
})

// Initialize grid state and composables
const gridId = computed(() => {
  const id = props.data?.gridId || 'default'
  console.log('[DataGrid] gridId computed - props.data?.gridId:', props.data?.gridId, 'returning:', id)
  return id
})

// Column reordering composable - initialize after table is created
let columnReorderingComposable: ReturnType<typeof useColumnReordering> | null = null
let columnResizingComposable: ReturnType<typeof useColumnResizing> | null = null

// Reactive refs for composable state
const isDragging = ref(false)
const draggedColumnId = ref<string | null>(null)
const dropIndicatorPosition = ref<number | null>(null)
const isResizing = ref(false)
const resizingColumnId = ref<string | null>(null)

// Initialize composables after mount
const initializeComposables = () => {
  if (!table || columnReorderingComposable) return
  
  columnReorderingComposable = useColumnReordering({
    gridId: gridId.value,
    tableInstance: table,
    onOrderChange: (newOrder) => {
      console.log('[DataGrid] Column order changed:', newOrder)
    }
  })
  
  columnResizingComposable = useColumnResizing({
    gridId: gridId.value,
    tableInstance: table,
    minWidth: 50,
    maxWidth: 1000,
    onWidthChange: (columnId, width) => {
      console.log('[DataGrid] Column width changed:', columnId, width)
    }
  })
  
  // Sync reactive refs
  isDragging.value = columnReorderingComposable.isDragging.value
  draggedColumnId.value = columnReorderingComposable.draggedColumnId.value
  dropIndicatorPosition.value = columnReorderingComposable.dropIndicatorPosition.value
  isResizing.value = columnResizingComposable.isResizing.value
  resizingColumnId.value = columnResizingComposable.resizingColumnId.value
}

// Handlers that delegate to composables
const handleDragStart = (columnId: string, event: DragEvent) => {
  columnReorderingComposable?.handleDragStart(columnId, event)
}

const handleDragOver = (columnId: string, event: DragEvent) => {
  columnReorderingComposable?.handleDragOver(columnId, event)
}

const handleDragEnd = (event: DragEvent) => {
  columnReorderingComposable?.handleDragEnd(event)
}

const handleDrop = (targetColumnId: string, event: DragEvent) => {
  columnReorderingComposable?.handleDrop(targetColumnId, event)
}

const composableResizeStart = (columnId: string, event: MouseEvent) => {
  columnResizingComposable?.handleResizeStart(columnId, event)
}

const composableDoubleClick = (columnId: string) => {
  columnResizingComposable?.handleDoubleClick(columnId)
}

// Table columns for Quasar - REMOVED, using native table now

// Pagination
const currentPage = computed({
  get: () => pageIndex.value + 1,
  set: (value) => gridStore.setPageIndex(value - 1)
})

const totalRows = computed(() => props.data?.pagination?.totalRows || 0)
const totalPages = computed(() => Math.ceil(totalRows.value / pageSize.value))

// For infinite scroll mode: show actual loaded rows
const loadedRows = computed(() => props.data?.rows?.length || 0)

// For infinite scroll mode: calculate virtual page based on visible rows
const currentVirtualPage = computed({
  get: () => {
    if (props.hasNextPage || props.isFetchingNext) {
      // Calculate based on first visible row
      const firstVisibleId = visibleRowRange.value.first
      if (!firstVisibleId || !props.data?.rows) {
        return 1
      }
      
      const firstVisibleIndex = props.data.rows.findIndex(row => {
        const primaryKey = props.data?.primaryKey || 'id'
        return String(row[primaryKey]) === firstVisibleId
      })
      
      if (firstVisibleIndex >= 0) {
        const currentPageSize = pageSize.value
        const calculatedPage = Math.max(1, Math.ceil((firstVisibleIndex + 1) / currentPageSize))
        return calculatedPage
      }
      return 1
    } else {
      return currentPage.value
    }
  },
  set: (value) => {
    // Only allow setting in regular mode
    if (!props.hasNextPage && !props.isFetchingNext) {
      gridStore.setPageIndex(value - 1)
    }
  }
})

// Calculate start/end rows based on mode
const startRow = computed(() => {
  if (props.hasNextPage || props.isFetchingNext) {
    // Infinite scroll mode: calculate based on first visible row
    const firstVisibleId = visibleRowRange.value.first
    if (!firstVisibleId) return 1
    
    // Find the index of the first visible row in the loaded data
    const firstVisibleIndex = props.data?.rows?.findIndex(row => {
      const primaryKey = props.data?.primaryKey || 'id'
      return String(row[primaryKey]) === firstVisibleId
    })
    
    return firstVisibleIndex !== undefined && firstVisibleIndex >= 0 ? firstVisibleIndex + 1 : 1
  } else {
    // Regular pagination mode
    return pageIndex.value * pageSize.value + 1
  }
})

const endRow = computed(() => {
  if (props.hasNextPage || props.isFetchingNext) {
    // Infinite scroll mode: calculate based on last visible row
    const lastVisibleId = visibleRowRange.value.last
    if (!lastVisibleId) return loadedRows.value
    
    // Find the index of the last visible row in the loaded data
    const lastVisibleIndex = props.data?.rows?.findIndex(row => {
      const primaryKey = props.data?.primaryKey || 'id'
      return String(row[primaryKey]) === lastVisibleId
    })
    
    return lastVisibleIndex !== undefined && lastVisibleIndex >= 0 ? lastVisibleIndex + 1 : loadedRows.value
  } else {
    // Regular pagination mode
    return Math.min((pageIndex.value + 1) * pageSize.value, totalRows.value)
  }
})

// Handle page change - works in both regular and infinite scroll modes
const handlePageChange = (value: number) => {
  if (props.hasNextPage || props.isFetchingNext) {
    // Infinite scroll mode: scroll to the target page position
    const targetRowIndex = (value - 1) * pageSize.value
    const container = tableContainerRef.value
    
    if (container && rowVirtualizer) {
      // Calculate the scroll position for the target row
      const scrollToPosition = targetRowIndex * 53 // 53px per row
      container.scrollTop = scrollToPosition
    }
  } else {
    // Regular pagination mode: change page index
    gridStore.setPageIndex(value - 1)
  }
}

const pageSizeOptions = computed(() => {
  const totalRows = props.data?.pagination?.totalRows || 0
  
  const options = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: '500', value: 500 },
    { label: '1000', value: 1000 },
    { label: '5000', value: 5000 },
    { label: `All (${totalRows.toLocaleString()})`, value: totalRows }
  ]
  
  return options
})

// Skeleton loading configuration
const defaultSkeletonColumns = Array(7).fill({ id: 'skeleton', label: 'Loading...', type: 'string' })
const skeletonRowCount = computed(() => {
  // Show more skeleton rows for larger viewports
  if (typeof window !== 'undefined') {
    const viewportHeight = window.innerHeight
    return Math.min(Math.floor(viewportHeight / 60), 20) // ~60px per row, max 20 rows
  }
  return 15
})

// Helper function to determine skeleton type based on column type
const getSkeletonType = (col: any, index: number) => {
  if (!col || !col.type) {
    // Vary skeleton types for visual interest when no column info
    const types = ['text', 'text', 'text', 'rect', 'text']
    return types[index % types.length]
  }
  
  switch (col.type) {
    case 'number':
      return 'text'
    case 'boolean':
      return 'QCheckbox'
    case 'date':
      return 'text'
    default:
      return 'text'
  }
}

// Helper function to determine skeleton width based on column type
const getSkeletonWidth = (col: any, index: number) => {
  if (!col || !col.type) {
    // Vary widths for visual interest
    const widths = ['80%', '60%', '70%', '50%', '90%']
    return widths[index % widths.length]
  }
  
  switch (col.type) {
    case 'number':
      return '60%'
    case 'boolean':
      return '24px'
    case 'date':
      return '70%'
    case 'select':
      return '75%'
    default:
      return '80%'
  }
}

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

// Column resizing - use composable
const startResize = (columnId: string, event: MouseEvent) => {
  composableResizeStart(columnId, event)
}

// Double-click for auto-fit
const handleColumnDoubleClick = (columnId: string) => {
  composableDoubleClick(columnId)
}

// Initialize default expanded rows and grid state
onMounted(() => {
  console.log('[DataGrid] onMounted - Initializing grid state for:', gridId.value)
  
  // Initialize grid state with default config
  // IMPORTANT: Only include data columns in the order, exclude special columns (select, expander)
  const defaultColumnOrder = props.data?.columns?.map(col => col.id) || []
  const defaultColumnWidths: Record<string, number> = {}
  const defaultColumnVisibility: Record<string, boolean> = {}
  
  // Add data columns
  props.data?.columns?.forEach(col => {
    defaultColumnWidths[col.id] = col.width || 150
    defaultColumnVisibility[col.id] = true
  })
  
  // Add special columns with fixed widths (but don't include in order)
  defaultColumnWidths['select'] = 50
  defaultColumnWidths['expander'] = 50
  defaultColumnVisibility['select'] = true
  defaultColumnVisibility['expander'] = true
  
  // Initialize gridStateStore (this will load from localStorage if exists)
  gridStateStore.initializeGrid(gridId.value, {
    columnOrder: defaultColumnOrder, // Only data columns
    columnWidths: defaultColumnWidths,
    columnVisibility: defaultColumnVisibility
  })
  
  // Get the loaded config (which may have been loaded from localStorage)
  const loadedConfig = gridStateStore.getGridConfig(gridId.value).value
  console.log('[DataGrid] Loaded config from gridStateStore:', loadedConfig)
  
  // Apply loaded column visibility to BOTH gridStore and TanStack Table
  if (loadedConfig && loadedConfig.columnVisibility) {
    console.log('[DataGrid] Applying loaded column visibility:', loadedConfig.columnVisibility)
    
    // CRITICAL: Update the main gridStore first (this is what the table state getter reads)
    gridStore.setColumnVisibility(loadedConfig.columnVisibility)
    
    // Then update TanStack Table
    table.setColumnVisibility(loadedConfig.columnVisibility)
  }
  
  // Apply loaded column order to TanStack Table
  const loadedOrder = gridStateStore.getColumnOrder(gridId.value).value
  if (loadedOrder && loadedOrder.length > 0) {
    console.log('[DataGrid] Applying loaded column order:', loadedOrder)
    // Prepend special columns
    const specialColumns = []
    if (props.data?.expandable && hasExpandPermission.value) {
      specialColumns.push('expander')
    }
    specialColumns.push('select')
    const fullOrder = [...specialColumns, ...loadedOrder]
    table.setColumnOrder(fullOrder)
  }
  
  // Apply loaded column widths to gridStore and TanStack Table
  if (loadedConfig && loadedConfig.columnWidths) {
    console.log('[DataGrid] Applying loaded column widths:', loadedConfig.columnWidths)
    
    // Update the main gridStore columnSizing
    gridStore.setColumnSizing(loadedConfig.columnWidths)
    
    // Also update TanStack Table directly
    table.setColumnSizing(loadedConfig.columnWidths)
  }
  
  // Initialize composables after grid state is ready
  initializeComposables()
  
  // Initialize expanded rows if configured
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

// Helper function to get grid ID from data
const getGridIdFromData = () => {
  // Use the gridId from the data result, fallback to 'default'
  const gridId = props.data?.gridId || 'default'
  console.log('[DataGrid] Using gridId:', gridId, 'from props.data?.gridId:', props.data?.gridId)
  return gridId
}
</script>

<style lang="sass" scoped>
// Skeleton table styles
.skeleton-table
  :deep(thead)
    background-color: #f5f5f5
    
  :deep(th)
    padding: 12px 16px
    font-weight: 500
    
  :deep(td)
    padding: 12px 16px
    
  :deep(tbody tr)
    transition: background-color 0.2s
    
    &:hover
      background-color: #fafafa

.grid-table
  table
    border-collapse: collapse
    
  th, td
    border-right: 1px solid rgba(0, 0, 0, 0.12)
    
  th:last-child, td:last-child
    border-right: none
    
  tbody tr:hover
    background-color: rgba(0, 0, 0, 0.02)

// Drag and drop styles
th[draggable="true"]
  user-select: none
  
  &:active
    cursor: grabbing

// Resize handle styles
.resize-handle
  z-index: 10
  user-select: none
  
  &:hover
    .w-px
      background-color: #1976d2
      width: 2px
  
  &:active
    .w-px
      background-color: #1565c0
      width: 3px

// Table container optimizations
.flex-1
  // Use CSS containment for better performance
  contain: layout style paint

// Table performance optimizations
table
  // Prevent layout shifts during scroll
  table-layout: fixed
  
  tbody tr
    // Fixed row height prevents shaking
    height: 53px
    // Prevent content from causing layout shifts
    contain: layout style paint
    // Hardware acceleration
    will-change: transform
  
  tbody td
    // Prevent cell expansion
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap
    // Fixed height to prevent jumping
    height: 53px
    max-height: 53px
    box-sizing: border-box

// Smooth scrolling container
.overflow-auto
  // Enable smooth scrolling
  scroll-behavior: smooth
  // Prevent overscroll bounce
  overscroll-behavior: contain
  // Hardware acceleration
  transform: translateZ(0)
  -webkit-overflow-scrolling: touch

// Scroll indicator fade transition
.fade-enter-active, .fade-leave-active
  transition: opacity 0.3s ease

.fade-enter-from, .fade-leave-to
  opacity: 0

</style>