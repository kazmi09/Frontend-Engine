import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GridState, FilterState, DetailPanelState } from './types'
import { OnChangeFn, ColumnSizingState, VisibilityState, SortingState, ColumnOrderState, ColumnPinningState, RowSelectionState } from "@tanstack/vue-table"

const initialState: GridState = {
  columnVisibility: {},
  columnOrder: [],
  columnPinning: { left: [], right: [] },
  columnSizing: {},
  sorting: [],
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
  
  // Expansion state
  const expandedRows = ref<Record<string, boolean>>({})
  const detailPanelData = ref<DetailPanelState>({})
  
  // Computed
  const hasFilters = computed(() => Object.keys(filters.value).length > 0)
  const hasSearch = computed(() => searchText.value.length > 0)
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
    searchText.value = text
    pageIndex.value = 0 // Reset to first page when searching
  }
  
  const setFilterBy = (field: string) => {
    filterBy.value = field
    pageIndex.value = 0 // Reset to first page when filtering
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
    expandedRows.value = {}
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
    
    // Computed
    hasFilters,
    hasSearch,
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
    
    // Expansion state
    expandedRows,
    detailPanelData,
    
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
  }
})