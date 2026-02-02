/**
 * Grid State Store - Manages persistable grid state with localStorage integration
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gridStateStorage, GridConfig } from '@/lib/grid/GridStateStorage'

interface GridState {
  grids: Record<string, GridConfig>
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

export const useGridStateStore = defineStore('gridState', () => {
  // State
  const grids = ref<Record<string, GridConfig>>({})
  
  // Getters
  const getGridConfig = (gridId: string) => {
    return computed(() => grids.value[gridId])
  }
  
  const getColumnOrder = (gridId: string) => {
    return computed(() => grids.value[gridId]?.columnOrder || [])
  }
  
  const getColumnWidth = (gridId: string, columnId: string) => {
    return computed(() => grids.value[gridId]?.columnWidths[columnId])
  }
  
  const isColumnVisible = (gridId: string, columnId: string) => {
    return computed(() => {
      const visibility = grids.value[gridId]?.columnVisibility[columnId]
      return visibility !== false // Default to visible if not specified
    })
  }
  
  // Actions - Column Order Management
  const updateColumnOrder = (gridId: string, columnOrder: string[]) => {
    if (!grids.value[gridId]) {
      console.warn(`Grid ${gridId} not initialized`)
      return
    }
    
    grids.value[gridId] = {
      ...grids.value[gridId],
      columnOrder,
      lastUpdated: Date.now()
    }
    
    debouncedPersist(gridId)
  }
  
  const moveColumn = (gridId: string, columnId: string, toIndex: number) => {
    if (!grids.value[gridId]) {
      console.warn(`Grid ${gridId} not initialized`)
      return
    }
    
    const currentOrder = [...grids.value[gridId].columnOrder]
    const fromIndex = currentOrder.indexOf(columnId)
    
    if (fromIndex === -1) {
      console.warn(`Column ${columnId} not found in order`)
      return
    }
    
    // Remove from current position
    currentOrder.splice(fromIndex, 1)
    // Insert at new position
    currentOrder.splice(toIndex, 0, columnId)
    
    updateColumnOrder(gridId, currentOrder)
  }
  
  // Actions - Column Width Management
  const updateColumnWidth = (gridId: string, columnId: string, width: number) => {
    if (!grids.value[gridId]) {
      console.warn(`Grid ${gridId} not initialized`)
      return
    }
    
    grids.value[gridId] = {
      ...grids.value[gridId],
      columnWidths: {
        ...grids.value[gridId].columnWidths,
        [columnId]: width
      },
      lastUpdated: Date.now()
    }
    
    debouncedPersist(gridId)
  }
  
  const updateColumnWidths = (gridId: string, widths: Record<string, number>) => {
    if (!grids.value[gridId]) {
      console.warn(`Grid ${gridId} not initialized`)
      return
    }
    
    grids.value[gridId] = {
      ...grids.value[gridId],
      columnWidths: {
        ...grids.value[gridId].columnWidths,
        ...widths
      },
      lastUpdated: Date.now()
    }
    
    debouncedPersist(gridId)
  }
  
  const autoFitColumn = (gridId: string, columnId: string) => {
    // This will be implemented by the component that has access to the DOM
    // The component will calculate the width and call updateColumnWidth
    console.log(`Auto-fit requested for column ${columnId} in grid ${gridId}`)
  }
  
  // Actions - Column Visibility Management
  const updateColumnVisibility = (gridId: string, columnId: string, visible: boolean) => {
    if (!grids.value[gridId]) {
      console.warn(`Grid ${gridId} not initialized`)
      return
    }
    
    grids.value[gridId] = {
      ...grids.value[gridId],
      columnVisibility: {
        ...grids.value[gridId].columnVisibility,
        [columnId]: visible
      },
      lastUpdated: Date.now()
    }
    
    debouncedPersist(gridId)
  }
  
  // Actions - State Lifecycle
  const initializeGrid = (gridId: string, defaultConfig: Partial<GridConfig>) => {
    console.log('[gridStateStore] initializeGrid called for:', gridId)
    console.log('[gridStateStore] Default config:', defaultConfig)
    
    // Try to load from localStorage first
    const savedConfig = gridStateStorage.load(gridId)
    
    if (savedConfig) {
      grids.value[gridId] = savedConfig
      console.log('[gridStateStore] ✅ Loaded grid state from localStorage:', savedConfig)
    } else {
      // Use default config
      grids.value[gridId] = {
        columnOrder: defaultConfig.columnOrder || [],
        columnWidths: defaultConfig.columnWidths || {},
        columnVisibility: defaultConfig.columnVisibility || {},
        version: 1,
        lastUpdated: Date.now()
      }
      console.log('[gridStateStore] ⚠️ No saved state found, using default config')
    }
  }
  
  const resetGrid = (gridId: string, defaultConfig?: Partial<GridConfig>) => {
    if (defaultConfig) {
      grids.value[gridId] = {
        columnOrder: defaultConfig.columnOrder || [],
        columnWidths: defaultConfig.columnWidths || {},
        columnVisibility: defaultConfig.columnVisibility || {},
        version: 1,
        lastUpdated: Date.now()
      }
    }
    
    // Clear from localStorage
    gridStateStorage.remove(gridId)
    console.log(`Reset grid ${gridId} to default state`)
  }
  
  const exportGridState = (gridId: string): string => {
    const config = grids.value[gridId]
    if (!config) {
      throw new Error(`Grid ${gridId} not found`)
    }
    
    return JSON.stringify(config, null, 2)
  }
  
  const importGridState = (gridId: string, stateJson: string): void => {
    try {
      const config = JSON.parse(stateJson) as GridConfig
      
      // Validate required fields
      if (!config.columnOrder || !config.columnWidths || !config.columnVisibility) {
        throw new Error('Invalid grid state: missing required fields')
      }
      
      // Update state
      grids.value[gridId] = {
        ...config,
        lastUpdated: Date.now()
      }
      
      // Persist immediately
      persistState(gridId)
      
      console.log(`Imported grid state for ${gridId}`)
    } catch (error) {
      console.error('Failed to import grid state:', error)
      throw new Error('Invalid JSON format or missing required fields')
    }
  }
  
  // Actions - Persistence
  const persistState = (gridId: string) => {
    const config = grids.value[gridId]
    if (!config) {
      console.warn(`Grid ${gridId} not found, cannot persist`)
      return
    }
    
    try {
      gridStateStorage.save(gridId, config)
      console.log(`Persisted grid state for ${gridId}`)
    } catch (error) {
      console.error(`Failed to persist grid state for ${gridId}:`, error)
    }
  }
  
  const loadState = (gridId: string): GridConfig | null => {
    return gridStateStorage.load(gridId)
  }
  
  // Debounced persist (300ms delay)
  const debouncedPersist = debounce(persistState, 300)
  
  return {
    // State
    grids,
    
    // Getters
    getGridConfig,
    getColumnOrder,
    getColumnWidth,
    isColumnVisible,
    
    // Actions - Column Order
    updateColumnOrder,
    moveColumn,
    
    // Actions - Column Width
    updateColumnWidth,
    updateColumnWidths,
    autoFitColumn,
    
    // Actions - Column Visibility
    updateColumnVisibility,
    
    // Actions - State Lifecycle
    initializeGrid,
    resetGrid,
    exportGridState,
    importGridState,
    
    // Actions - Persistence
    persistState,
    loadState
  }
})
