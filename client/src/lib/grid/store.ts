import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GridState, FilterState, DetailPanelState, ColumnFilterState } from './types'
import { OnChangeFn, ColumnSizingState, VisibilityState, SortingState, ColumnOrderState, ColumnPinningState, RowSelectionState } from "@tanstack/vue-table"
import { useCustomizationStore } from '@/stores/customization'

const initialState: GridState = {
  columnVisibility: {},
  columnOrder: [],
  columnPinning: { left: [], right: [] },
  columnSizing: {},
  sorting: [],
  grouping: [],
  groupExpanded: {},
}

export const useGridStore = defineStore('grid', () => {
  // State
  const columnVisibility = ref<VisibilityState>(initialState.columnVisibility)
  const columnOrder = ref<ColumnOrderState>(initialState.columnOrder)
  const columnPinning = ref<ColumnPinningState>(initialState.columnPinning)
  const columnSizing = ref<ColumnSizingState>(initialState.columnSizing)
  const sorting = ref<SortingState>(initialState.sorting)
  
  // Pagination
  const pageIndex = ref(0)
  const pageSize = ref(20)
  
  // Selection
  const rowSelection = ref<RowSelectionState>({})
  
  // Search and filtering
  const searchText = ref('')
  const filterBy = ref('')
  const filters = ref<FilterState>({})
  
  // Inline column filters (used by header filter row)
  const columnFilters = ref<ColumnFilterState>({})
  
  // Expansion state
  const expandedRows = ref<Record<string, boolean>>({})
  const detailPanelData = ref<DetailPanelState>({})
  
  // Grouping state
  const grouping = ref<string[]>(initialState.grouping)
  const groupExpanded = ref<Record<string, boolean>>(initialState.groupExpanded)
  
  // Computed
  const hasFilters = computed(() => Object.keys(filters.value).length > 0)
  const hasSearch = computed(() => searchText.value.length > 0)
  const hasColumnFilters = computed(() => Object.keys(columnFilters.value).length > 0)
  // Returns only non-empty column filter entries
  const activeColumnFilters = computed(() => {
    const active: ColumnFilterState = {}
    for (const [key, val] of Object.entries(columnFilters.value)) {
      if (val === '' || val === null || val === undefined) continue
      if (Array.isArray(val) && val.length === 0) continue
      active[key] = val
    }
    return active
  })
  // TanStack-compatible columnFilters array derived from the columnFilters record
  const tanstackColumnFilters = computed(() => {
    return Object.entries(activeColumnFilters.value).map(([id, value]) => ({ id, value }))
  })
  const expandedRowIds = computed(() => 
    Object.keys(expandedRows.value).filter(id => expandedRows.value[id])
  )
  
  // Actions
  const setColumnVisibility: OnChangeFn<VisibilityState> = (updaterOrValue) => {
    console.log('Store setColumnVisibility called with:', updaterOrValue)
    if (typeof updaterOrValue === 'function') {
      const newValue = updaterOrValue(columnVisibility.value)
      console.log('Function updater result:', newValue)
      columnVisibility.value = newValue
    } else {
      console.log('Direct value update:', updaterOrValue)
      columnVisibility.value = updaterOrValue
    }
    console.log('New columnVisibility state:', columnVisibility.value)
  }
  
  const setColumnOrder: OnChangeFn<ColumnOrderState> = (updaterOrValue) => {
    if (typeof updaterOrValue === 'function') {
      columnOrder.value = updaterOrValue(columnOrder.value)
    } else {
      columnOrder.value = updaterOrValue
    }
  }
  
  const setColumnPinning: OnChangeFn<ColumnPinningState> = (updaterOrValue) => {
    if (typeof updaterOrValue === 'function') {
      columnPinning.value = updaterOrValue(columnPinning.value)
    } else {
      columnPinning.value = updaterOrValue
    }
  }
  
  const setColumnSizing: OnChangeFn<ColumnSizingState> = (updaterOrValue) => {
    if (typeof updaterOrValue === 'function') {
      columnSizing.value = updaterOrValue(columnSizing.value)
    } else {
      columnSizing.value = updaterOrValue
    }
  }
  
  const setSorting: OnChangeFn<SortingState> = (updaterOrValue) => {
    console.log('Store setSorting called with:', updaterOrValue)
    if (typeof updaterOrValue === 'function') {
      const newValue = updaterOrValue(sorting.value)
      console.log('Function updater result:', newValue)
      sorting.value = newValue
    } else {
      console.log('Direct value update:', updaterOrValue)
      sorting.value = updaterOrValue
    }
    console.log('New sorting state:', sorting.value)
  }
  
  const setPageIndex = (index: number) => {
    pageIndex.value = index
  }
  
  const setPageSize = (size: number) => {
    pageSize.value = size
    pageIndex.value = 0 // Reset to first page when changing page size
  }
  
  const setRowSelection: OnChangeFn<RowSelectionState> = (updaterOrValue) => {
    if (typeof updaterOrValue === 'function') {
      rowSelection.value = updaterOrValue(rowSelection.value)
    } else {
      rowSelection.value = updaterOrValue
    }
  }
  
  const setSearchText = (text: string) => {
    searchText.value = text ?? ''
    pageIndex.value = 0 // Reset to first page when searching
  }
  
  const setFilterBy = (field: string) => {
    filterBy.value = field ?? ''
    pageIndex.value = 0
  }
  
  const setFilter = (columnId: string, filter: FilterState[string] | null) => {
    if (filter === null) {
      delete filters.value[columnId]
    } else {
      filters.value[columnId] = filter
    }
    pageIndex.value = 0 // Reset to first page when filtering
  }
  
  const resetLayout = () => {
    columnVisibility.value = initialState.columnVisibility
    columnOrder.value = initialState.columnOrder
    columnPinning.value = initialState.columnPinning
    columnSizing.value = initialState.columnSizing
    sorting.value = initialState.sorting
  }
  
  const resetFilters = () => {
    searchText.value = ''
    filterBy.value = ''
    filters.value = {}
    columnFilters.value = {}
    pageIndex.value = 0
  }
  
  // Inline column filter actions
  const setColumnFilter = (columnId: string, value: string | number | boolean | (string | number | boolean)[]) => {
    columnFilters.value = { ...columnFilters.value, [columnId]: value }
    pageIndex.value = 0
  }
  
  const removeColumnFilter = (columnId: string) => {
    const next = { ...columnFilters.value }
    delete next[columnId]
    columnFilters.value = next
    pageIndex.value = 0
  }
  
  const clearAllColumnFilters = () => {
    columnFilters.value = {}
    pageIndex.value = 0
  }
  
  // Expansion actions
  const expandRow = (rowId: string) => {
    expandedRows.value = { ...expandedRows.value, [rowId]: true }
  }
  
  const collapseRow = (rowId: string) => {
    expandedRows.value = { ...expandedRows.value, [rowId]: false }
  }
  
  const toggleRowExpansion = (rowId: string) => {
    console.log('[STORE] toggleRowExpansion called for:', rowId)
    console.log('[STORE] Before:', JSON.stringify(expandedRows.value))
    
    // Create a new object to ensure Vue reactivity
    const newExpandedRows = { ...expandedRows.value }
    newExpandedRows[rowId] = !newExpandedRows[rowId]
    expandedRows.value = newExpandedRows
    
    console.log('[STORE] After:', JSON.stringify(expandedRows.value))
  }
  
  const expandAllRows = (rowIds: string[]) => {
    const newExpandedRows = { ...expandedRows.value }
    rowIds.forEach(id => {
      newExpandedRows[id] = true
    })
    expandedRows.value = newExpandedRows
  }
  
  const collapseAllRows = () => {
    // Preserve group expansions (which use colons in their IDs like 'Gender:female')
    const newExpandedRows: Record<string, boolean> = {}
    Object.keys(expandedRows.value).forEach(id => {
      if (id.includes(':')) {
        newExpandedRows[id] = true
      }
    })
    expandedRows.value = newExpandedRows
  }
  
  const setDetailPanelData = (rowId: string, data: any) => {
    detailPanelData.value[rowId] = {
      data,
      loading: false,
      error: null,
    }
  }
  
  const setDetailPanelLoading = (rowId: string, loading: boolean) => {
    if (!detailPanelData.value[rowId]) {
      detailPanelData.value[rowId] = { data: null, loading, error: null }
    } else {
      detailPanelData.value[rowId].loading = loading
    }
  }
  
  const setDetailPanelError = (rowId: string, error: string) => {
    if (!detailPanelData.value[rowId]) {
      detailPanelData.value[rowId] = { data: null, loading: false, error }
    } else {
      detailPanelData.value[rowId].error = error
    }
  }
  
  const cleanupExpandedRows = (validRowIds: string[]) => {
    const validSet = new Set(validRowIds)
    Object.keys(expandedRows.value).forEach(id => {
      if (!validSet.has(id)) {
        delete expandedRows.value[id]
        delete detailPanelData.value[id]
      }
    })
  }
  
  // Grouping actions
  const setGrouping = (fields: string[]) => {
    grouping.value = fields
    // Reset group expansion when grouping changes
    groupExpanded.value = {}
  }
  
  const toggleGroupExpansion = (groupKey: string) => {
    groupExpanded.value = {
      ...groupExpanded.value,
      [groupKey]: !groupExpanded.value[groupKey]
    }
  }
  
  const expandAllGroups = (groupKeys: string[]) => {
    const newExpanded = { ...groupExpanded.value }
    groupKeys.forEach(key => {
      newExpanded[key] = true
    })
    groupExpanded.value = newExpanded
  }
  
  const collapseAllGroups = () => {
    groupExpanded.value = {}
  }
  
  // Group customization actions - delegate to customization store
  const setGroupCustomization = (
    dataset: string,
    groupColumn: string,
    groupValue: string,
    customization: {
      color?: string
      label?: string
      metadata?: string
    }
  ) => {
    const customizationStore = useCustomizationStore()
    customizationStore.saveCustomization(
      { datasetId: dataset, columnName: groupColumn, groupValue },
      customization
    )
  }
  
  // Reset group customization
  const resetGroupCustomization = (
    dataset: string,
    groupColumn: string,
    groupValue: string
  ) => {
    const customizationStore = useCustomizationStore()
    customizationStore.deleteCustomization(
      { datasetId: dataset, columnName: groupColumn, groupValue }
    )
  }
  
  // Get group customization
  const getGroupCustomization = (
    dataset: string,
    groupColumn: string,
    groupValue: string
  ) => {
    const customizationStore = useCustomizationStore()
    return customizationStore.getCustomization(
      { datasetId: dataset, columnName: groupColumn, groupValue }
    )
  }
  
  return {
    // State
    columnVisibility,
    columnOrder,
    columnPinning,
    columnSizing,
    sorting,
    pageIndex,
    pageSize,
    rowSelection,
    searchText,
    filterBy,
    filters,
    columnFilters,
    
    // Computed
    hasFilters,
    hasSearch,
    hasColumnFilters,
    activeColumnFilters,
    tanstackColumnFilters,
    expandedRowIds,
    
    // Actions
    setColumnVisibility,
    setColumnOrder,
    setColumnPinning,
    setColumnSizing,
    setSorting,
    setPageIndex,
    setPageSize,
    setRowSelection,
    setSearchText,
    setFilterBy,
    setFilter,
    resetLayout,
    resetFilters,
    setColumnFilter,
    removeColumnFilter,
    clearAllColumnFilters,
    
    // Expansion state
    expandedRows,
    detailPanelData,
    
    // Grouping state
    grouping,
    groupExpanded,
    
    // Expansion actions
    expandRow,
    collapseRow,
    toggleRowExpansion,
    expandAllRows,
    collapseAllRows,
    setDetailPanelData,
    setDetailPanelLoading,
    setDetailPanelError,
    cleanupExpandedRows,
    
    // Grouping actions
    setGrouping,
    toggleGroupExpansion,
    expandAllGroups,
    collapseAllGroups,
    
    // Group customization actions
    setGroupCustomization,
    resetGroupCustomization,
    getGroupCustomization,
  }
})