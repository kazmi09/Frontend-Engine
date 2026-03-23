/**
 * useColumnReordering - Composable for handling column drag-and-drop reordering
 */

import { ref, Ref } from 'vue'
import { Table } from '@tanstack/vue-table'
import { useGridStateStore } from '@/stores/gridState'
import '@/lib/grid/types' // Import for type augmentation

export interface UseColumnReorderingOptions {
  gridId: string
  tableInstance: Table<any>
  onOrderChange?: (newOrder: string[]) => void
}

export interface UseColumnReorderingReturn {
  isDragging: Ref<boolean>
  draggedColumnId: Ref<string | null>
  /** The column currently being dragged over (for indicator styling) */
  dragOverColumnId: Ref<string | null>
  /** Which side of the target column to place the indicator */
  dropSide: Ref<'left' | 'right' | null>

  handleDragStart: (columnId: string, event: DragEvent) => void
  handleDragOver: (columnId: string, event: DragEvent) => void
  handleDragEnd: (event: DragEvent) => void
  handleDrop: (targetColumnId: string, event: DragEvent) => void
}

export function useColumnReordering(options: UseColumnReorderingOptions): UseColumnReorderingReturn {
  const { gridId, tableInstance, onOrderChange } = options
  const store = useGridStateStore()

  // State
  const isDragging = ref(false)
  const draggedColumnId = ref<string | null>(null)
  const dragOverColumnId = ref<string | null>(null)
  const dropSide = ref<'left' | 'right' | null>(null)

  /** Ghost element created during drag, removed on dragend */
  let ghostEl: HTMLElement | null = null

  /**
   * Check if a column is pinned
   */
  const isColumnPinned = (columnId: string): boolean => {
    const column = tableInstance.getColumn(columnId)
    if (!column) return false

    const pinned = column.columnDef.meta?.pinned
    return pinned === 'left' || pinned === 'right'
  }

  /**
   * Get the pinned region of a column
   */
  const getColumnPinnedRegion = (columnId: string): 'left' | 'right' | null => {
    const column = tableInstance.getColumn(columnId)
    if (!column) return null

    return (column.columnDef.meta?.pinned as 'left' | 'right') || null
  }

  /**
   * Validate if a drop position is valid
   */
  const isValidDropPosition = (draggedId: string, targetId: string): boolean => {
    const draggedPinned = getColumnPinnedRegion(draggedId)
    const targetPinned = getColumnPinnedRegion(targetId)

    // If dragged column is pinned, target must be in same pinned region
    if (draggedPinned) {
      return draggedPinned === targetPinned
    }

    // If dragged column is not pinned, target must also not be pinned
    return !targetPinned
  }

  /**
   * Build a floating pill ghost image for the drag operation.
   * Creates a styled div, appends it off-screen, and uses it as the drag image.
   */
  const createGhostImage = (label: string, event: DragEvent) => {
    // Remove any lingering ghost
    if (ghostEl) {
      ghostEl.remove()
      ghostEl = null
    }

    const el = document.createElement('div')
    el.textContent = label
    Object.assign(el.style, {
      position: 'fixed',
      top: '-200px',
      left: '-200px',
      padding: '4px 12px',
      background: '#1976d2',
      color: '#fff',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      pointerEvents: 'none',
      zIndex: '9999',
    })
    document.body.appendChild(el)
    ghostEl = el

    if (event.dataTransfer) {
      event.dataTransfer.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2)
    }

    // Clean up after the browser has captured the ghost image
    setTimeout(() => {
      el.remove()
      if (ghostEl === el) ghostEl = null
    }, 0)
  }

  /**
   * Handle drag start
   */
  const handleDragStart = (columnId: string, event: DragEvent) => {
    // Check if column is reorderable
    const column = tableInstance.getColumn(columnId)
    if (!column) return

    const reorderable = column.columnDef.meta?.reorderable
    if (reorderable === false) {
      event.preventDefault()
      return
    }

    isDragging.value = true
    draggedColumnId.value = columnId
    dragOverColumnId.value = null
    dropSide.value = null

    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', columnId)
    }

    // Build a human-friendly label from the column definition
    const label = (column.columnDef.header as string) ?? columnId
    createGhostImage(label, event)

    console.log(`[Column Reordering] Drag started for column: ${columnId}`)
  }

  /**
   * Handle drag over
   */
  const handleDragOver = (columnId: string, event: DragEvent) => {
    if (!draggedColumnId.value) return

    event.preventDefault()

    // Check if drop is valid
    if (!isValidDropPosition(draggedColumnId.value, columnId)) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none'
      }
      dragOverColumnId.value = null
      dropSide.value = null
      return
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    // Determine which half of the target column the cursor is on
    const target = event.currentTarget as HTMLElement
    if (target) {
      const rect = target.getBoundingClientRect()
      const midpoint = rect.left + rect.width / 2
      dragOverColumnId.value = columnId
      dropSide.value = event.clientX < midpoint ? 'left' : 'right'
    }
  }

  /**
   * Handle drag end
   */
  const handleDragEnd = (event: DragEvent) => {
    isDragging.value = false
    draggedColumnId.value = null
    dragOverColumnId.value = null
    dropSide.value = null

    console.log('[Column Reordering] Drag ended')
  }

  /**
   * Handle drop
   */
  const handleDrop = (targetColumnId: string, event: DragEvent) => {
    event.preventDefault()

    if (!draggedColumnId.value) return

    const draggedId = draggedColumnId.value

    // Validate drop position
    if (!isValidDropPosition(draggedId, targetColumnId)) {
      console.warn(`[Column Reordering] Invalid drop position: ${draggedId} -> ${targetColumnId}`)
      handleDragEnd(event)
      return
    }

    // Don't do anything if dropping on itself
    if (draggedId === targetColumnId) {
      handleDragEnd(event)
      return
    }

    // Get current column order
    const currentOrder = store.getColumnOrder(gridId).value
    const newOrder = [...currentOrder]

    // Find indices
    const draggedIndex = newOrder.indexOf(draggedId)
    const targetIndex = newOrder.indexOf(targetColumnId)

    if (draggedIndex === -1 || targetIndex === -1) {
      console.warn('[Column Reordering] Column not found in order')
      handleDragEnd(event)
      return
    }

    // Calculate drop position based on mouse position
    const target = event.currentTarget as HTMLElement
    let insertIndex = targetIndex

    if (target) {
      const rect = target.getBoundingClientRect()
      const midpoint = rect.left + rect.width / 2

      // If dropping on right side, insert after target
      if (event.clientX >= midpoint) {
        insertIndex = targetIndex + 1
      }
    }

    // Adjust insert index if dragging from left to right
    if (draggedIndex < insertIndex) {
      insertIndex--
    }

    // Remove from current position
    newOrder.splice(draggedIndex, 1)

    // Insert at new position
    newOrder.splice(insertIndex, 0, draggedId)

    // Update store
    store.updateColumnOrder(gridId, newOrder)

    // Update TanStack Table
    tableInstance.setColumnOrder(newOrder)

    // Call callback if provided
    if (onOrderChange) {
      onOrderChange(newOrder)
    }

    console.log(`[Column Reordering] Moved ${draggedId} to position ${insertIndex}`)
    console.log('[Column Reordering] New order:', newOrder)

    // Clean up
    handleDragEnd(event)
  }

  return {
    isDragging,
    draggedColumnId,
    dragOverColumnId,
    dropSide,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  }
}
