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
          <tr 
            v-for="row in (table?.getRowModel?.()?.rows || [])" 
            :key="row.id"
            :class="getRowClass(row)"
            class="hover:bg-gray-50"
          >
            <td
              v-for="cell in (row?.getVisibleCells?.() || [])"
              :key="cell.id"
              :style="{ width: `${cell.column.getSize()}px` }"
              class="border-b border-gray-200 px-4 py-3 whitespace-nowrap text-sm"
            >
              <!-- Selection Cell -->
              <template v-if="cell.column.id === 'select'">
                <q-checkbox
                  :model-value="row?.getIsSelected?.()"
                  @update:model-value="(value) => row?.toggleSelected?.(value)"
                />
              </template>
              
              <!-- Regular Cell -->
              <template v-else>
                <EditableCell
                  :value="cell.getValue()"
                  :row-id="row.original.id"
                  :column="getColumnConfig(cell.column.id)"
                  :width="cell.column.getSize()"
                />
              </template>
            </td>
          </tr>
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, toRefs, watch } from 'vue'
import { storeToRefs } from 'pinia'
import {
  useVueTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
} from '@tanstack/vue-table'
import { useGridStore } from '@/lib/grid/store'
import { DataResult, ColumnConfig } from '@/lib/grid/types'
import EditableCell from './cells/EditableCell.vue'

const props = defineProps<{
  data: DataResult
  isLoading?: boolean
}>()

const tableContainerRef = ref<HTMLDivElement>()
const gridStore = useGridStore()

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
} = storeToRefs(gridStore)

// Columns definition
const columns = computed<ColumnDef<any>[]>(() => {
  console.log('Computing columns, data:', props.data)
  if (!props.data?.columns || !Array.isArray(props.data.columns)) {
    console.log('No columns data available, returning empty array')
    return []
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

  const result = [selectColumn, ...dataColumns]
  console.log('Computed columns:', result)
  return result
})

// Table instance with reactive state
const table = useVueTable({
  data: computed(() => {
    const rows = props.data?.rows || []
    console.log('Table data:', rows.length, 'rows')
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
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  manualPagination: true,
  manualSorting: false, // Let TanStack Table handle sorting
  enableRowSelection: true,
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
  return row.getIsSelected() ? 'bg-blue-50 dark:bg-blue-900/20' : ''
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