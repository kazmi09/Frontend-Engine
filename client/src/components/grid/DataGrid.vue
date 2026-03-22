<template>
  <div class="tw:flex tw:flex-col tw:h-full tw:overflow-hidden">
    <!-- Debug Info -->
    <div v-if="false" class="tw:p-2 tw:bg-gray-100 tw:text-xs">
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
      class="tw:flex-1 tw:overflow-auto tw:border tw:border-gray-200 dark:tw:border-gray-700 tw:rounded-lg tw:bg-white tw:relative tw:mx-2 tw:mb-2"
    >
      <!-- Enhanced Skeleton Loading with Quasar Components -->
      <div v-if="isLoading && (!props.data?.rows || props.data.rows.length === 0)" class="tw:w-full">
        <q-markup-table flat bordered class="skeleton-table">
          <thead>
            <tr>
              <!-- Checkbox column skeleton -->
              <th class="tw:text-left" style="width: 50px">
                <q-skeleton type="QCheckbox" animation="wave" />
              </th>
              <!-- Expander column skeleton if expandable -->
              <th v-if="props.data?.expandable" class="tw:text-left" style="width: 50px">
                <q-skeleton type="rect" width="24px" height="24px" animation="wave" />
              </th>
              <!-- Dynamic column skeletons based on actual columns -->
              <th 
                v-for="(col, i) in (props.data?.columns || defaultSkeletonColumns)" 
                :key="i" 
                class="tw:text-left"
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
      <div v-else-if="!props.data?.rows || props.data.rows.length === 0" class="tw:p-8 tw:text-center tw:text-gray-500">
        <div v-if="isLoading">Loading...</div>
        <div v-else>No data available</div>
      </div>
      
      <!-- Data Table wrapped in q-markup-table for consistent styling -->
      <q-markup-table v-else flat bordered dense class="grid-table-wrapper" :style="{ width: `${tableWidth}px`, minWidth: `${tableWidth}px` }">
        <table class="tw:border-collapse full-width" :style="{ width: '100%' }" :key="tableKey">
        <!-- Header -->
        <thead class="tw:sticky tw:top-0 tw:z-10 bg-grey-2">
          <tr v-for="headerGroup in (table?.getHeaderGroups?.() || [])" :key="headerGroup.id">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="{ width: `${header.getSize()}px` }"
              :class="[
                'tw:border-b tw:border-gray-200 tw:px-2 tw:py-1.5 tw:text-left tw:text-xs tw:font-medium tw:text-gray-500 tw:uppercase tw:tracking-wider tw:relative',
                {
                  'tw:cursor-move': header.id !== 'select' && header.id !== 'expander',
                  'tw:opacity-50': isDragging && draggedColumnId === header.id,
                  'tw:bg-blue-50': isDragging && draggedColumnId !== header.id
                }
              ]"
              :draggable="header.id !== 'select' && header.id !== 'expander'"
              @dragstart="header.id !== 'select' && header.id !== 'expander' ? handleDragStart(header.id, $event) : null"
              @dragover="header.id !== 'select' && header.id !== 'expander' ? handleDragOver(header.id, $event) : null"
              @drop="header.id !== 'select' && header.id !== 'expander' ? handleDrop(header.id, $event) : null"
              @dragend="handleDragEnd"
            >
              <div class="tw:flex tw:items-center tw:gap-2">
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
                  <div v-if="header.column.getCanSort()" class="tw:flex tw:items-center tw:gap-0.5 tw:ml-1">
                    <div class="tw:flex tw:flex-col">
                      <q-btn
                        flat
                        dense
                        size="xs"
                        icon="keyboard_arrow_up"
                        :class="getSortButtonClass(header.column.id, false)"
                        @click="handleSort(header.column.id, false, $event as MouseEvent)"
                      />
                      <q-btn
                        flat
                        dense
                        size="xs"
                        icon="keyboard_arrow_down"
                        :class="getSortButtonClass(header.column.id, true)"
                        @click="handleSort(header.column.id, true, $event as MouseEvent)"
                      />
                    </div>
                    <!-- Multi-sort priority badge -->
                    <span
                      v-if="sorting.length > 1 && getSortPriority(header.column.id) > 0"
                      class="sort-priority-badge"
                    >
                      {{ getSortPriority(header.column.id) }}
                    </span>
                  </div>
                </template>
              </div>
              
              <!-- Drop Indicator -->
              <div
                v-if="isDragging && dropIndicatorPosition !== null"
                class="tw:absolute tw:top-0 tw:bottom-0 tw:w-0.5 tw:bg-blue-500 tw:z-20 tw:pointer-events-none"
                :style="{ left: `${dropIndicatorPosition}px` }"
              />
              
              <!-- Resize Handle -->
              <div
                v-if="header.column.getCanResize() && header.id !== 'select' && header.id !== 'expander'"
                class="resize-handle tw:absolute tw:right-0 tw:top-0 tw:h-full tw:w-2 tw:cursor-col-resize tw:group"
                @mousedown="startResize(header.column.id, $event)"
                @dblclick="handleColumnDoubleClick(header.column.id)"
              >
                <div class="tw:h-full tw:w-px tw:bg-gray-300 group-hover:tw:bg-blue-500 group-hover:tw:w-0.5 tw:transition-all tw:ml-auto"></div>
              </div>
            </th>
          </tr>

          <!-- Inline Column Filter Row -->
          <tr class="filter-header-row">
            <th
              v-for="header in (table?.getHeaderGroups?.()[0]?.headers || [])"
              :key="`filter-${header.id}`"
              :style="{ width: `${header.getSize()}px` }"
              class="tw:border-b tw:border-gray-200 tw:px-1 tw:py-1 tw:bg-gray-50"
            >
              <!-- No filter for special columns -->
              <template v-if="header.id === 'select' || header.id === 'expander'">
                &nbsp;
              </template>

              <!-- Select column: multi-select dropdown -->
              <template v-else-if="getColumnConfig(header.column.id)?.type === 'select'">
                <q-select
                  :model-value="getColumnFilterValue(header.column.id)"
                  :options="getColumnConfig(header.column.id)?.options || []"
                  outlined
                  dense
                  multiple
                  use-chips
                  emit-value
                  clearable
                  placeholder="All"
                  class="inline-filter-select"
                  @update:model-value="(val) => handleSelectFilter(header.column.id, val)"
                />
              </template>

              <!-- Number column: number input -->
              <template v-else-if="getColumnConfig(header.column.id)?.type === 'number'">
                <q-input
                  :model-value="String(getColumnFilterValue(header.column.id) ?? '')"
                  outlined
                  dense
                  type="number"
                  placeholder="Filter..."
                  clearable
                  class="inline-filter-input"
                  @update:model-value="(val) => handleInlineFilter(header.column.id, val)"
                  @clear="gridStore.removeColumnFilter(header.column.id)"
                />
              </template>

              <!-- String / Date / Boolean column: text input -->
              <template v-else>
                <q-input
                  :model-value="String(getColumnFilterValue(header.column.id) ?? '')"
                  outlined
                  dense
                  placeholder="Filter..."
                  clearable
                  class="inline-filter-input"
                  @update:model-value="(val) => handleInlineFilter(header.column.id, val != null ? String(val) : '')"
                  @clear="gridStore.removeColumnFilter(header.column.id)"
                />
              </template>
            </th>
          </tr>
        </thead>

        <!-- Body with Virtual Scrolling -->
        <tbody class="tw:bg-white tw:divide-y tw:divide-gray-200">
          <!-- Top spacer -->
          <tr v-if="rowVirtualizer.getVirtualItems().length > 0">
            <td :colspan="columns.length" :style="{ height: `${rowVirtualizer.getVirtualItems()[0]?.start || 0}px`, padding: 0, border: 'none' }"></td>
          </tr>
          
          <template v-for="virtualRow in rowVirtualizer.getVirtualItems()" :key="virtualRow.index">
            <template v-if="table?.getRowModel?.()?.rows[virtualRow.index]">
              <template v-for="row in [table.getRowModel().rows[virtualRow.index]]" :key="row.id">
                <!-- Debug: Log row info -->
                <template v-if="false">
                  {{ console.log('Row:', { 
                    id: row.id, 
                    depth: row.depth, 
                    getIsGrouped: row.getIsGrouped,
                    subRows: row.subRows?.length,
                    original: row.original 
                  }) }}
                </template>
                
                <!-- Group Header Row (TanStack Table native grouping) -->
                <tr 
                  v-if="grouping.length > 0 && row.getIsGrouped()"
                  :key="`group-${row.id}`"
                  class="group-header-row"
                  :class="getGroupHeaderClasses(row)"
                  :style="getGroupHeaderStyle(row)"
                  @click="row.toggleExpanded()"
                >
                  <td 
                    :colspan="columns.length" 
                    class="group-header-cell"
                    :style="{ paddingLeft: `${(row.depth * 1.5) + 1}rem` }"
                  >
                    <div class="tw:flex tw:items-center tw:gap-3">
                      <!-- Expand/Collapse Icon -->
                      <q-icon 
                        :name="row.getIsExpanded() ? 'expand_more' : 'chevron_right'"
                        size="md"
                        class="group-expand-icon"
                      />
                      
                      <!-- Group Value Display -->
                      <div class="tw:flex tw:items-center tw:gap-2 tw:flex-1">
                        <span class="group-label">
                          <template v-for="cell in row.getVisibleCells()" :key="cell.id">
                            <template v-if="cell.getIsGrouped()">
                              {{ getGroupLabel(cell, row) }}
                              <!-- Custom Label Badge if exists -->
                              <q-chip
                                v-if="getGroupCustomLabel(cell, row)"
                                dense
                                size="sm"
                                color="primary"
                                text-color="white"
                                class="tw:ml-2"
                                @click.stop
                              >
                                {{ getGroupCustomLabel(cell, row) }}
                              </q-chip>
                            </template>
                          </template>
                        </span>
                        
                        <!-- Count Badge with proper formatting -->
                        <q-badge 
                          :label="formatGroupCount(getLeafRowCount(row))"
                          color="primary"
                          class="group-count-badge"
                          :class="getGroupBadgeClass(row)"
                        />
                      </div>
                      
                      <!-- Customization Menu -->
                      <div class="group-customization-menu-wrapper" @click.stop>
                        <template v-for="cell in row.getVisibleCells()" :key="cell.id">
                          <GroupCustomizationMenu
                            v-if="cell.getIsGrouped()"
                            :dataset="gridId"
                            :group-column="cell.column.id"
                            :group-column-label="cell.column.columnDef.header ?? cell.column.id"
                            :group-value="String(cell.getValue() ?? '')"
                            :current-customization="getGroupCustomization(cell.column.id, cell.getValue())"
                            @save="(customization) => handleSaveCustomization(cell.column.id, cell.getValue(), customization)"
                            @reset="() => handleResetCustomization(cell.column.id, cell.getValue())"
                          />
                        </template>
                      </div>
                      
                      <!-- Aggregated Values -->
                      <div 
                        v-if="row.getIsExpanded() && hasAggregations(row)"
                        class="tw:flex tw:items-center tw:gap-4 tw:ml-4"
                      >
                        <div 
                          v-for="cell in row.getVisibleCells().filter(c => c.getIsAggregated() && !c.getIsGrouped())" 
                          :key="cell.id"
                          class="aggregation-item"
                        >
                          <span class="aggregation-label">{{ cell.column.columnDef.header }}:</span>
                          <span class="aggregation-value">{{ formatAggregationValue(cell.renderValue(), cell.column.columnDef.meta?.columnConfig?.type) }}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Metadata / Notes Display -->
                    <template v-for="cell in row.getVisibleCells()" :key="`metadata-${cell.id}`">
                      <div
                        v-if="cell.getIsGrouped() && getGroupCustomization(cell.column.id, cell.getValue())?.metadata"
                        class="tw:mt-2 tw:text-xs tw:text-gray-600 dark:tw:text-gray-400 tw:italic"
                        :style="{ paddingLeft: '2.5rem' }"
                        @click.stop
                      >
                        {{ getGroupCustomization(cell.column.id, cell.getValue())?.metadata }}
                      </div>
                    </template>
                  </td>
                </tr>
                
                <!-- Main Data Row - Only render if it's a leaf row (not a group) -->
                <tr 
                  v-else-if="!row.getIsGrouped()"
                  :class="getRowClass(row)"
                  class="hover:tw:bg-gray-50 data-row"
                >
                  <td
                    v-for="(cell, cellIndex) in (row?.getVisibleCells?.() || [])"
                    :key="cell.id"
                    :style="{ 
                      width: `${cell.column.getSize()}px`, 
                      minWidth: `${cell.column.getSize()}px`, 
                      maxWidth: `${cell.column.getSize()}px`,
                      paddingLeft: getCellPaddingLeft(cell, cellIndex, row)
                    }"
                    class="tw:border-b tw:border-gray-200 tw:px-2 tw:py-1 tw:text-sm tw:overflow-hidden"
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
                    
                    <!-- Regular Cell - Get value from original row data -->
                    <EditableCell
                      v-else
                      :value="row.original[cell.column.id]"
                      :row-id="row.original.id"
                      :column="getColumnConfig(cell.column.id)"
                      :width="cell.column.getSize()"
                      :grid-id="gridId"
                      :active-role="props.activeRole"
                    />
                  </td>
                </tr>
                
                <!-- Detail Panel Row -->
                <tr v-if="!(grouping.length > 0 && row.getIsGrouped?.()) && row.getIsExpanded?.()" :key="`${row.id}-detail`">
                  <td :colspan="row.getVisibleCells().length" class="tw:p-0">
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
    </q-markup-table>

      <!-- Loading More Skeleton (Infinite Scroll) -->
      <div v-if="isFetchingNext" :style="{ width: `${tableWidth}px`, minWidth: `${tableWidth}px` }">
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
      <div v-if="isLoading" class="tw:absolute tw:inset-0 tw:bg-white tw:bg-opacity-75 tw:flex tw:items-center tw:justify-center">
        <q-spinner-dots size="50px" color="primary" />
      </div>
    </div>

    <!-- Status Bar -->
    <div class="tw:flex-none q-py-xs q-px-sm tw:border-t tw:flex tw:items-center tw:justify-between text-caption text-grey-7 tw:bg-white dark:tw:bg-dark">
      <span>{{ totalRows.toLocaleString() }} total rows{{ props.isFetchingNext ? ' · Loading more...' : (props.hasNextPage ? ' · Scroll to load more' : '') }}</span>
      <span v-if="selectedCount > 0" class="text-primary text-weight-medium">{{ selectedCount }} selected</span>
    </div>

    <!-- Bulk Actions Bar -->
    <BulkActionsBar
      :columns="props.data?.columns || []"
      :bulk-actions-config="props.bulkActionsConfig"
      :display-name="props.displayName || 'item'"
      :display-name-plural="props.displayNamePlural || 'items'"
      @bulk-edit="handleBulkEdit"
      @bulk-archive="handleBulkArchive"
      @bulk-delete="handleBulkDelete"
      @export="handleExport"
      @custom-action="handleCustomAction"
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
  getFilteredRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  type ColumnDef,
  type ColumnFiltersState,
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
import GroupCustomizationMenu from './GroupCustomizationMenu.vue'

const props = defineProps<{
  data: DataResult
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNext?: boolean
  /**
   * Optional grouping configuration and metadata passed from the page-level grid config.
   * Used for group-level customization such as background colors and labels.
   */
  groupingConfig?: import('@/lib/grid/types').GroupingConfig
  /**
   * Singular and plural display names for the current grid's entity,
   * used for building human-friendly group labels (e.g. "5 users").
   */
  displayName?: string
  displayNamePlural?: string
  /**
   * Effective role used for permission evaluation in this grid instance.
   * When provided, this overrides the authenticated user role for column-level
   * view/edit behaviour, which is useful for testing and demos.
   */
  activeRole?: string | null
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
  grouping,
  groupExpanded,
  columnFilters,
  tanstackColumnFilters
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
      enableGrouping: false,
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
    enableGrouping: false,
    size: 50,
    minSize: 50,
    maxSize: 50,
    meta: {
      pinned: 'left',
      reorderable: false,
      resizable: false
    }
  }

  const dataColumns: ColumnDef<any>[] = props.data.columns.map((col) => {
    // Determine aggregation function based on column type
    let aggregationFn: 'mean' | 'count' | 'sum' | 'min' | 'max' | 'extent' | 'median' | 'unique' | 'uniqueCount' | undefined
    if (col.type === 'number') {
      aggregationFn = 'mean' // Use mean for numeric columns
    } else if (col.type === 'boolean') {
      aggregationFn = 'count' // Count for boolean columns
    } else {
      aggregationFn = undefined // No aggregation for string/date/select by default
    }
    
    return {
      id: col.id,
      accessorKey: col.id,
      header: col.label,
      size: col.width || 150,
      minSize: col.minWidth || 100,
      maxSize: col.maxWidth || 500,
      enableSorting: true,
      enableHiding: true,
      enableGrouping: true, // Enable grouping for data columns
      enableColumnFilter: true,
      // Custom filter function that handles both single and multi-value (array) filters
      filterFn: (row: any, columnId: string, filterValue: any) => {
        const cellValue = row.getValue(columnId)
        if (filterValue === null || filterValue === undefined || filterValue === '') return true
        // Multi-value filter (used by select columns)
        if (Array.isArray(filterValue)) {
          if (filterValue.length === 0) return true
          return filterValue.some((v: any) => String(cellValue).toLowerCase() === String(v).toLowerCase())
        }
        // Number equality
        if (col.type === 'number') {
          return Number(cellValue) === Number(filterValue)
        }
        // String contains (default)
        return String(cellValue ?? '').toLowerCase().includes(String(filterValue).toLowerCase())
      },
      // Aggregation function for grouped rows
      aggregationFn: aggregationFn,
      // Custom aggregation renderer
      aggregatedCell: ({ getValue }: any) => {
        const value = getValue()
        if (value === null || value === undefined) return '-'
        if (typeof value === 'number') {
          return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)
        }
        return String(value)
      },
      meta: {
        columnConfig: col,
        reorderable: true,
        resizable: true
      }
    }
  })

  cols.push(selectColumn, ...dataColumns)
  return cols
})

// Table instance with reactive state
const table = useVueTable({
  data: computed(() => props.data?.rows || []),
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
    get columnFilters() {
      return tanstackColumnFilters.value as ColumnFiltersState
    },
    get grouping() {
      return grouping.value
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
  onGroupingChange: (updater) => {
    const newGrouping = typeof updater === 'function' ? updater(grouping.value) : updater
    console.log('[DataGrid] Grouping changed:', newGrouping)
    gridStore.setGrouping(newGrouping)
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
  getFilteredRowModel: getFilteredRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  getGroupedRowModel: getGroupedRowModel(),
  enableColumnFilters: true,
  onColumnFiltersChange: (updater: any) => {
    const newFilters = typeof updater === 'function' ? updater(tanstackColumnFilters.value) : updater
    // Sync back to store
    const filterRecord: Record<string, any> = {}
    newFilters.forEach((f: { id: string; value: any }) => {
      filterRecord[f.id] = f.value
    })
    // Clear old filters and set new ones
    gridStore.clearAllColumnFilters()
    Object.entries(filterRecord).forEach(([id, value]) => {
      gridStore.setColumnFilter(id, value)
    })
  },
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
  manualGrouping: false, // Let TanStack Table handle grouping
  enableRowSelection: true,
  enableExpanding: true,
  enableGrouping: true,
  enableColumnResizing: true,
  columnResizeMode: "onChange",
  groupedColumnMode: false, // Don't hide grouped columns
})

// Virtual scrolling setup
const rowVirtualizer = useVirtualizer({
  get count() {
    return table.getRowModel().rows.length
  },
  getScrollElement: () => tableContainerRef.value || null,
  estimateSize: () => 53, // Estimated row height in pixels
  overscan: 25, // Significantly increased overscan to prevent shaking during fast scroll
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
            const distanceToBottom = scrollHeight - scrollTop - clientHeight
            
            // Load more when within 1000 pixels of the bottom instead of percentage
            if (distanceToBottom < 1000) {
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

// Total pixel width of all visible columns — drives explicit table width so
// the container scrolls horizontally instead of squashing columns.
const tableWidth = computed(() => {
  return table.getVisibleLeafColumns().reduce((sum, col) => sum + col.getSize(), 0)
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

// Selected rows count for bulk actions bar spacing
const selectedCount = computed(() => {
  return Object.keys(rowSelection.value).filter(id => rowSelection.value[id]).length
})

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
  // CRITICAL FIX: Exclude group rows from the search. TanStack Table assigns the original data
  // of the first child leaf to the synthetic group row header. Otherwise, clicking the first child
  // would find the group header row and collapse it instead of opening the child's detail panel!
  const targetRow = tableRows.find(r => r.original?.id === rowId && !r.getIsGrouped?.())
  
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
  return isActive ? 'text-blue-600 tw:font-bold' : 'text-gray-400'
}

// Get the sort priority index (1-based) for multi-column sort display
const getSortPriority = (columnId: string): number => {
  const index = sorting.value.findIndex(s => s.id === columnId)
  return index >= 0 ? index + 1 : -1
}

const handleSort = (columnId: string, desc: boolean, event?: MouseEvent) => {
  console.log('Sort clicked:', { columnId, desc, shiftKey: event?.shiftKey })
  
  const column = table.getColumn(columnId)
  if (!column) {
    console.log('Column not found:', columnId)
    return
  }

  if (event?.shiftKey) {
    // Multi-column sort: add/toggle this column in the existing sort array
    const existingIndex = sorting.value.findIndex(s => s.id === columnId)
    const newSorting = [...sorting.value]
    
    if (existingIndex >= 0) {
      // Column already in sort — check if same direction
      if (newSorting[existingIndex].desc === desc) {
        // Same direction clicked again: remove from multi-sort
        newSorting.splice(existingIndex, 1)
      } else {
        // Different direction: update direction
        newSorting[existingIndex] = { id: columnId, desc }
      }
    } else {
      // New column: append to sort array
      newSorting.push({ id: columnId, desc })
    }
    
    gridStore.setSorting(newSorting)
  } else {
    // Single-column sort: replace all sorting with just this column
    const currentSort = sorting.value.find(s => s.id === columnId)
    if (currentSort && currentSort.desc === desc) {
      // Already sorted in this direction: clear sort
      gridStore.setSorting([])
    } else {
      gridStore.setSorting([{ id: columnId, desc }])
    }
  }
}

// Debounce timer refs for inline filter inputs
const filterDebounceTimers = ref<Record<string, ReturnType<typeof setTimeout>>>({})

const handleInlineFilter = (columnId: string, value: any, debounceMs = 300) => {
  // Clear previous debounce
  if (filterDebounceTimers.value[columnId]) {
    clearTimeout(filterDebounceTimers.value[columnId])
  }
  
  filterDebounceTimers.value[columnId] = setTimeout(() => {
    if (value === '' || value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
      gridStore.removeColumnFilter(columnId)
    } else {
      gridStore.setColumnFilter(columnId, value)
    }
  }, debounceMs)
}

// Immediate filter for select dropdowns (no debounce needed)
const handleSelectFilter = (columnId: string, value: any) => {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
    gridStore.removeColumnFilter(columnId)
  } else {
    gridStore.setColumnFilter(columnId, value)
  }
}

// Get current filter value for a given column (for v-model binding)
const getColumnFilterValue = (columnId: string) => {
  return columnFilters.value[columnId] ?? (getColumnConfig(columnId).type === 'select' ? [] : '')
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
    // Add group IDs (which typically contain ':') so they aren't accidentally wiped out
    const validAndGroupIds = [...validRowIds, ...Object.keys(expandedRows.value).filter(id => id.includes(':'))]
    gridStore.cleanupExpandedRows(validAndGroupIds)
  }
}, { deep: true })

// Cleanup expanded rows when page changes
watch(pageIndex, () => {
  if (props.data?.rows) {
    const validRowIds = props.data.rows.map(r => r.id)
    const validAndGroupIds = [...validRowIds, ...Object.keys(expandedRows.value).filter(id => id.includes(':'))]
    gridStore.cleanupExpandedRows(validAndGroupIds)
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

// Helper function to format group value
const formatGroupValue = (value: any): string => {
  if (value === null || value === undefined) return '(Empty)'
  if (value === '') return '(Blank)'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

// Helper function to format group count
const formatGroupCount = (count: number): string => {
  // Try to get display name from props, fallback to generic terms
  const displayName = props.displayName || 'item'
  const displayNamePlural = props.displayNamePlural || 'items'
  return `${count} ${count === 1 ? displayName : displayNamePlural}`
}

// Get group customization from store
const getGroupCustomization = (groupColumn: string, groupValue: any) => {
  const dataset = gridId.value
  const valueStr = String(groupValue ?? '')
  return gridStore.getGroupCustomization(dataset, groupColumn, valueStr)
}

// Compute extra CSS classes for a group header row based on depth and optional groupingConfig styles
const getGroupHeaderClasses = (row: any): Record<string, boolean> | string[] => {
  const classes: Record<string, boolean> = {
    'group-level-0': row.depth === 0,
    'group-level-1': row.depth === 1,
    'group-level-2': row.depth >= 2,
  }

  const styles = props.groupingConfig?.groupStyles
  if (styles && styles.length > 0) {
    // Find the most specific style for this depth (exact match first, then entries without level)
    const exact = styles.find(s => s.level === row.depth && !!s.rowClass)
    const fallback = styles.find(s => s.level === undefined && !!s.rowClass)
    const style = exact || fallback
    if (style?.rowClass) {
      classes[style.rowClass] = true
    }
  }

  return classes
}

// Get inline style for group header (for custom background color)
const getGroupHeaderStyle = (row: any): Record<string, string> | undefined => {
  // Find the grouped cell to get customization
  const groupedCell = row.getVisibleCells().find((cell: any) => cell.getIsGrouped())
  if (!groupedCell) return undefined
  
  const customization = getGroupCustomization(groupedCell.column.id, groupedCell.getValue())
  if (customization?.color) {
    return {
      backgroundColor: customization.color,
    }
  }
  return undefined
}

// Compute extra CSS classes for a group count badge based on depth and optional groupingConfig styles
const getGroupBadgeClass = (row: any): string | undefined => {
  const styles = props.groupingConfig?.groupStyles
  if (!styles || styles.length === 0) return undefined

  const exact = styles.find(s => s.level === row.depth && !!s.badgeClass)
  const fallback = styles.find(s => s.level === undefined && !!s.badgeClass)
  return (exact || fallback)?.badgeClass
}

// Build a group label using optional labelTemplates from groupingConfig
// Get custom label for a group (if user has customized it)
const getGroupCustomLabel = (cell: any, row: any): string | null => {
  const customization = getGroupCustomization(cell.column.id, cell.getValue())
  return customization?.label || null
}

const getGroupLabel = (cell: any, row: any): string => {
  const columnLabel = cell.column.columnDef.header ?? cell.column.id
  const rawValue = cell.getValue()
  const value = formatGroupValue(rawValue)
  const count = getLeafRowCount(row)
  const displayName = props.displayName || 'item'
  const displayNamePlural = props.displayNamePlural || 'items'

  const templates = props.groupingConfig?.labelTemplates
  if (templates && templates.length > 0) {
    const columnId = cell.column.id
    const exact = templates.find(t => t.field === columnId)
    const fallback = templates.find(t => t.field === undefined)
    const template = exact?.template || fallback?.template

    if (template) {
      return template
        .replace('{columnLabel}', String(columnLabel))
        .replace('{value}', String(value))
        .replace('{count}', String(count))
        .replace('{displayName}', displayName)
        .replace('{displayNamePlural}', displayNamePlural)
    }
  }

  // Default label format
  return `${columnLabel}: ${value}`
}

// Helper function to format aggregation value
const formatAggregationValue = (value: any, columnType?: string): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'number') {
    if (columnType === 'number') {
      // Format numbers with appropriate decimal places
      return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)
    }
    return value.toLocaleString()
  }
  return String(value)
}

// Helper function to check if row has aggregations
const hasAggregations = (row: any): boolean => {
  const cells = row.getVisibleCells()
  return cells.some((cell: any) => cell.getIsAggregated() && !cell.getIsGrouped())
}

// Helper function to calculate cell padding left for indentation
const getCellPaddingLeft = (cell: any, cellIndex: number, row: any): string | undefined => {
  // If it's a placeholder cell, use minimal padding
  if (cell.getIsPlaceholder()) {
    return '0.5rem'
  }
  
  // If grouping is active and this is the first data column (after expander/select), apply indentation
  if (grouping.value.length > 0 && row.depth > 0) {
    const visibleCells = row.getVisibleCells()
    const firstDataCellIndex = visibleCells.findIndex((c: any) => 
      c.column.id !== 'expander' && c.column.id !== 'select' && !c.getIsPlaceholder()
    )
    
    if (cellIndex === firstDataCellIndex) {
      return `${(row.depth * 1.5) + 1}rem`
    }
  }
  
  return undefined
}

// Helper function to count leaf rows (actual data rows) in a group
const getLeafRowCount = (row: any): number => {
  // If the row has subRows, recursively count leaf rows
  if (row.subRows && row.subRows.length > 0) {
    return row.subRows.reduce((count: number, subRow: any) => {
      if (subRow.getIsGrouped && subRow.getIsGrouped()) {
        // If it's a nested group, count its leaf rows
        return count + getLeafRowCount(subRow)
      } else {
        // If it's a data row, count it
        return count + 1
      }
    }, 0)
  }
  // If no subRows, it's a leaf row itself
  return 1
}

// Handle save customization
const handleSaveCustomization = (
  groupColumn: string,
  groupValue: any,
  customization: { color?: string; label?: string; metadata?: string }
) => {
  const dataset = gridId.value
  const valueStr = String(groupValue ?? '')
  gridStore.setGroupCustomization(dataset, groupColumn, valueStr, customization)
}

// Handle reset customization
const handleResetCustomization = (groupColumn: string, groupValue: any) => {
  const dataset = gridId.value
  const valueStr = String(groupValue ?? '')
  gridStore.resetGroupCustomization(dataset, groupColumn, valueStr)
}
</script>

<style lang="sass" scoped>
// Skeleton table styles
.skeleton-table
  :deep(thead)
    background-color: #f5f5f5
    
  :deep(th)
    padding: 8px 16px
    font-weight: 500
    
  :deep(td)
    padding: 8px 16px
    
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

// Table layout & performance
table
  // Let intrinsic column widths determine total table width so the grid
  // can overflow horizontally and be scrolled when there are many columns.
  table-layout: auto
  width: max-content
  min-width: 100%
  
  tbody tr
    // Compact row height to match 32px inputs + padding
    height: 40px
    // Prevent content from causing layout shifts
    contain: layout style paint
    // Hardware acceleration
    will-change: transform
  
  tbody td
    // Prevent cell expansion
    overflow: hidden
    text-overflow: ellipsis
    white-space: nowrap
    // Compact height to match 32px inputs + padding
    height: 40px
    max-height: 40px
    box-sizing: border-box

// Group header row styles
.group-header-row
  background-color: #f3f4f6
  border-bottom: 2px solid #e5e7eb
  cursor: pointer
  transition: background-color 0.2s ease
  font-weight: 600
  
  &:hover
    background-color: #e5e7eb
    
    .group-customization-menu-wrapper
      .group-menu-btn
        opacity: 1
  
  &.group-level-0
    background-color: #f3f4f6
    font-weight: 700
    
  &.group-level-1
    background-color: #f9fafb
    font-weight: 600
    
  &.group-level-2
    background-color: #fafbfc
    font-weight: 500

.group-customization-menu-wrapper
  display: flex
  align-items: center

.group-header-cell
  padding: 0.5rem 1rem
  border-bottom: 2px solid #e5e7eb

.group-expand-icon
  color: #6b7280
  flex-shrink: 0
  transition: transform 0.2s ease

.group-label
  font-size: 0.875rem
  font-weight: inherit
  color: #111827

.group-column-name
  color: #6b7280
  font-weight: 500
  margin-right: 0.25rem

.group-value
  color: #111827
  font-weight: inherit

.group-count-badge
  font-size: 0.75rem
  font-weight: 600
  padding: 0.125rem 0.5rem

.aggregation-item
  font-size: 0.75rem
  color: #6b7280

.aggregation-label
  font-weight: 500
  margin-right: 0.25rem

.aggregation-value
  font-weight: 600
  color: #111827

// Data row indentation for nested groups
.data-row
  // Indentation is handled inline via style binding

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

// Sort priority badge for multi-column sort
.sort-priority-badge
  display: inline-flex
  align-items: center
  justify-content: center
  width: 16px
  height: 16px
  border-radius: 50%
  background-color: #1976d2
  color: white
  font-size: 10px
  font-weight: 700
  line-height: 1
  flex-shrink: 0

// Inline column filter row
.filter-header-row
  th
    padding: 2px 4px !important
    background-color: #fafbfc

  .inline-filter-input, .inline-filter-select
    :deep(.q-field__control)
      min-height: 32px
      height: 32px
      font-size: 12px

    :deep(.q-field__marginal)
      height: 32px

    :deep(.q-field__native)
      padding: 0 4px
      font-size: 12px

    :deep(.q-field__append)
      padding: 0

  .inline-filter-select
    :deep(.q-chip)
      margin: 1px
      height: 18px
      font-size: 10px

</style>
