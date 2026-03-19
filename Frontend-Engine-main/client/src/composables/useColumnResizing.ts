/**
 * useColumnResizing - Composable for handling column width adjustments
 */

import { ref, Ref } from 'vue'
import { Table } from '@tanstack/vue-table'
import { useGridStateStore } from '@/stores/gridState'
import '@/lib/grid/types' // Import for type augmentation

export interface UseColumnResizingOptions {
  gridId: string
  tableInstance: Table<any>
  minWidth?: number
  maxWidth?: number
  onWidthChange?: (columnId: string, width: number) => void
}

export interface UseColumnResizingReturn {
  isResizing: Ref<boolean>
  resizingColumnId: Ref<string | null>
  
  handleResizeStart: (columnId: string, event: MouseEvent) => void
  handleResizeMove: (event: MouseEvent) => void
  handleResizeEnd: (event: MouseEvent) => void
  handleDoubleClick: (columnId: string) => void
  
  getColumnWidth: (columnId: string) => number
}

// Debounce helper for resize updates
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

export function useColumnResizing(options: UseColumnResizingOptions): UseColumnResizingReturn {
  const {
    gridId,
    tableInstance,
    minWidth = 50,
    maxWidth = 1000,
    onWidthChange
  } = options
  
  const store = useGridStateStore()
  
  // State
  const isResizing = ref(false)
  const resizingColumnId = ref<string | null>(null)
  const startX = ref(0)
  const startWidth = ref(0)
  
  /**
   * Get column width from store or default
   */
  const getColumnWidth = (columnId: string): number => {
    const storedWidth = store.getColumnWidth(gridId, columnId).value
    if (storedWidth) return storedWidth
    
    // Get default width from column definition
    const column = tableInstance.getColumn(columnId)
    if (column) {
      const size = column.columnDef.size
      if (typeof size === 'number') return size
    }
    
    // Default width
    return 150
  }
  
  /**
   * Clamp width to min/max constraints
   */
  const clampWidth = (columnId: string, width: number): number => {
    const column = tableInstance.getColumn(columnId)
    
    // Get column-specific constraints if available
    const colMinWidth = column?.columnDef.minSize || minWidth
    const colMaxWidth = column?.columnDef.maxSize || maxWidth
    
    return Math.max(colMinWidth, Math.min(colMaxWidth, width))
  }
  
  /**
   * Update column width in store (debounced)
   */
  const debouncedUpdateWidth = debounce((columnId: string, width: number) => {
    store.updateColumnWidth(gridId, columnId, width)
    
    // Call callback if provided
    if (onWidthChange) {
      onWidthChange(columnId, width)
    }
  }, 100)
  
  /**
   * Handle resize start
   */
  const handleResizeStart = (columnId: string, event: MouseEvent) => {
    // Check if column is resizable
    const column = tableInstance.getColumn(columnId)
    if (!column) return
    
    const resizable = column.columnDef.meta?.resizable
    if (resizable === false) {
      return
    }
    
    event.preventDefault()
    event.stopPropagation()
    
    isResizing.value = true
    resizingColumnId.value = columnId
    startX.value = event.clientX
    startWidth.value = getColumnWidth(columnId)
    
    // Add global event listeners
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    
    // Add cursor style to body
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    
    console.log(`[Column Resizing] Resize started for column: ${columnId}`)
  }
  
  /**
   * Handle resize move
   */
  const handleResizeMove = (event: MouseEvent) => {
    if (!isResizing.value || !resizingColumnId.value) return
    
    event.preventDefault()
    
    const columnId = resizingColumnId.value
    const deltaX = event.clientX - startX.value
    const newWidth = clampWidth(columnId, startWidth.value + deltaX)
    
    // Update TanStack Table sizing immediately for visual feedback
    const currentSizing = tableInstance.getState().columnSizing
    tableInstance.setColumnSizing({
      ...currentSizing,
      [columnId]: newWidth
    })
    
    // Debounced store update
    debouncedUpdateWidth(columnId, newWidth)
  }
  
  /**
   * Handle resize end
   */
  const handleResizeEnd = (event: MouseEvent) => {
    if (!isResizing.value || !resizingColumnId.value) return
    
    event.preventDefault()
    
    const columnId = resizingColumnId.value
    const deltaX = event.clientX - startX.value
    const finalWidth = clampWidth(columnId, startWidth.value + deltaX)
    
    // Final store update (not debounced)
    store.updateColumnWidth(gridId, columnId, finalWidth)
    
    // Call callback if provided
    if (onWidthChange) {
      onWidthChange(columnId, finalWidth)
    }
    
    console.log(`[Column Resizing] Resize ended for column: ${columnId}, width: ${finalWidth}px`)
    
    // Clean up
    isResizing.value = false
    resizingColumnId.value = null
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    
    // Remove cursor style from body
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  
  /**
   * Handle double-click for auto-fit
   */
  const handleDoubleClick = (columnId: string) => {
    const column = tableInstance.getColumn(columnId)
    if (!column) return
    
    // Get all visible rows
    const rows = tableInstance.getRowModel().rows
    
    // Calculate max content width
    let maxWidth = 0
    
    // Check header width
    const headerText = column.columnDef.header as string
    if (headerText) {
      // Rough estimate: 8px per character + 32px padding
      maxWidth = Math.max(maxWidth, headerText.length * 8 + 32)
    }
    
    // Check cell content widths (sample first 100 rows for performance)
    const sampleSize = Math.min(rows.length, 100)
    for (let i = 0; i < sampleSize; i++) {
      const cell = rows[i].getAllCells().find(c => c.column.id === columnId)
      if (cell) {
        const value = cell.getValue()
        if (value !== null && value !== undefined) {
          const text = String(value)
          // Rough estimate: 8px per character + 32px padding
          maxWidth = Math.max(maxWidth, text.length * 8 + 32)
        }
      }
    }
    
    // Clamp to min/max constraints
    const autoFitWidth = clampWidth(columnId, maxWidth)
    
    // Update TanStack Table
    const currentSizing = tableInstance.getState().columnSizing
    tableInstance.setColumnSizing({
      ...currentSizing,
      [columnId]: autoFitWidth
    })
    
    // Update store
    store.updateColumnWidth(gridId, columnId, autoFitWidth)
    
    // Call callback if provided
    if (onWidthChange) {
      onWidthChange(columnId, autoFitWidth)
    }
    
    console.log(`[Column Resizing] Auto-fit column: ${columnId}, width: ${autoFitWidth}px`)
  }
  
  return {
    isResizing,
    resizingColumnId,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    handleDoubleClick,
    getColumnWidth
  }
}
