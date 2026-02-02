# Implementation Plan: Column Management

## Overview

This implementation plan breaks down the column management feature into discrete coding tasks. The approach follows a layered architecture: first establishing the state management foundation (Pinia store + localStorage), then building the UI interactions (drag/drop, resize), and finally integrating with TanStack Table and adding comprehensive testing.

## Tasks

- [-] 1. Set up state management foundation
  - [x] 1.1 Create GridStateStorage class for localStorage operations
    - Implement save, load, remove, clear methods
    - Add version migration logic
    - Handle JSON serialization/deserialization errors
    - _Requirements: 3.1, 3.2, 3.6, 6.4, 6.5_
  
  - [ ] 1.2 Write property test for state persistence round-trip
    - **Property 11: State persistence round-trip**
    - **Validates: Requirements 3.2, 3.4**
  
  - [ ] 1.3 Write property test for corrupted state fallback
    - **Property 13: Corrupted state fallback**
    - **Validates: Requirements 3.6**
  
  - [ ] 1.4 Write unit tests for GridStateStorage edge cases
    - Test empty localStorage
    - Test quota exceeded error
    - Test invalid JSON handling
    - _Requirements: 3.3, 3.6_

- [-] 2. Create Pinia store for grid state management
  - [x] 2.1 Implement useGridStateStore with state, actions, and getters
    - Define GridState and GridConfig interfaces
    - Implement updateColumnOrder, updateColumnWidth, updateColumnVisibility actions
    - Implement initializeGrid, resetGrid, exportGridState, importGridState actions
    - Add debounced persistState action
    - Integrate GridStateStorage for persistence
    - _Requirements: 1.5, 2.7, 3.1, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 6.3, 6.6_
  
  - [ ] 2.2 Write property test for grid isolation by ID
    - **Property 12: Grid isolation by ID**
    - **Validates: Requirements 3.5**
  
  - [ ] 2.3 Write property test for localStorage writes debouncing
    - **Property 21: localStorage writes are debounced**
    - **Validates: Requirements 6.6**
  
  - [ ] 2.4 Write property test for state updates are reactive
    - **Property 19: State updates are reactive**
    - **Validates: Requirements 6.2**
  
  - [ ] 2.5 Write unit tests for store actions
    - Test initializeGrid with default config
    - Test resetGrid clears localStorage
    - Test exportGridState produces valid JSON
    - Test importGridState with valid and invalid JSON
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3_

- [ ] 3. Checkpoint - Ensure state management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 4. Implement column reordering composable
  - [x] 4.1 Create useColumnReordering composable with drag/drop logic
    - Implement handleDragStart, handleDragOver, handleDrop, handleDragEnd
    - Add visual feedback state (isDragging, draggedColumnId, dropIndicatorPosition)
    - Validate drop positions (respect pinned columns)
    - Update Pinia store on successful drop
    - Sync with TanStack Table's setColumnOrder API
    - Add touch event support for mobile
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [ ] 4.2 Write property test for column reordering updates state correctly
    - **Property 1: Column reordering updates state correctly**
    - **Validates: Requirements 1.3**
  
  - [ ] 4.3 Write property test for invalid drag operations preserve state
    - **Property 2: Invalid drag operations preserve state**
    - **Validates: Requirements 1.4**
  
  - [ ] 4.4 Write property test for pinned columns respect boundaries
    - **Property 4: Pinned columns respect boundaries**
    - **Validates: Requirements 1.6**
  
  - [ ] 4.5 Write property test for touch and mouse equivalence
    - **Property 5: Touch and mouse equivalence**
    - **Validates: Requirements 1.7**
  
  - [ ] 4.6 Write unit tests for drag/drop edge cases
    - Test dragging first column to last position
    - Test dragging to same position (no-op)
    - Test dragging pinned column outside pinned region
    - Test interrupted drag operation
    - _Requirements: 1.4, 1.6_

- [-] 5. Implement column resizing composable
  - [x] 5.1 Create useColumnResizing composable with resize logic
    - Implement handleResizeStart, handleResizeMove, handleResizeEnd
    - Add resize state (isResizing, resizingColumnId)
    - Enforce min/max width constraints
    - Implement handleDoubleClick for auto-fit
    - Update Pinia store with debouncing
    - Sync with TanStack Table's setColumnSizing API
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  
  - [ ] 5.2 Write property test for resize operations update width in real-time
    - **Property 6: Resize operations update width in real-time**
    - **Validates: Requirements 2.3**
  
  - [ ] 5.3 Write property test for width constraints are enforced
    - **Property 7: Width constraints are enforced**
    - **Validates: Requirements 2.4, 2.5**
  
  - [ ] 5.4 Write property test for auto-fit adjusts width correctly
    - **Property 8: Auto-fit adjusts width correctly**
    - **Validates: Requirements 2.6**
  
  - [ ] 5.5 Write property test for resize events are debounced
    - **Property 29: Resize events are debounced**
    - **Validates: Requirements 9.1**
  
  - [ ] 5.6 Write unit tests for resize edge cases
    - Test resizing below minimum width
    - Test resizing above maximum width
    - Test double-click auto-fit
    - Test interrupted resize operation
    - _Requirements: 2.4, 2.5, 2.6_

- [ ] 6. Checkpoint - Ensure composable tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 7. Integrate column management into grid component
  - [x] 7.1 Update EnterpriseGrid component with drag/drop and resize handlers
    - Add draggable attribute to column headers
    - Add drag event handlers (dragstart, dragover, drop, dragend)
    - Add resize handles to column borders
    - Add mousedown handler for resize start
    - Add global mousemove and mouseup handlers for resize
    - Initialize grid state on mount
    - Sync TanStack Table state with Pinia store
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.2, 3.4_
  
  - [ ] 7.2 Add visual feedback for drag and resize operations
    - Style dragged column with opacity and ghost image
    - Render drop indicators between columns
    - Show resize cursor on column borders
    - Add live preview during resize
    - _Requirements: 1.1, 1.2, 2.1, 2.2_
  
  - [ ] 7.3 Write integration tests for grid component
    - Test drag and drop updates column order
    - Test resize updates column width
    - Test state persists to localStorage
    - Test state restores on mount
    - _Requirements: 1.3, 2.3, 3.1, 3.2_

- [ ] 8. Implement keyboard accessibility
  - [ ] 8.1 Add keyboard navigation for column reordering
    - Add tabindex to column headers
    - Handle arrow key events for reordering
    - Update ARIA attributes for screen readers
    - Announce changes to screen readers
    - _Requirements: 8.1, 8.2, 8.5_
  
  - [ ] 8.2 Add keyboard navigation for column resizing
    - Add tabindex to resize handles
    - Handle arrow key events for resizing
    - Update ARIA attributes for screen readers
    - Announce width changes to screen readers
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [ ] 8.3 Write property test for keyboard reordering moves columns correctly
    - **Property 27: Keyboard reordering moves columns correctly**
    - **Validates: Requirements 8.2**
  
  - [ ] 8.4 Write property test for keyboard resizing adjusts width incrementally
    - **Property 28: Keyboard resizing adjusts width incrementally**
    - **Validates: Requirements 8.4**
  
  - [ ] 8.5 Write unit tests for keyboard accessibility
    - Test arrow keys move columns
    - Test arrow keys resize columns
    - Test ARIA announcements
    - _Requirements: 8.2, 8.4, 8.5_

- [ ] 9. Implement state reset and export/import functionality
  - [ ] 9.1 Add reset button to grid toolbar
    - Create reset action in store
    - Clear localStorage on reset
    - Restore default state
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ] 9.2 Add export/import buttons to grid toolbar
    - Create export action that returns JSON string
    - Create import action that accepts JSON string
    - Validate imported JSON
    - Display error messages for invalid imports
    - Persist imported state to localStorage
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 9.3 Write property test for reset restores default state
    - **Property 14: Reset restores default state**
    - **Validates: Requirements 4.1, 4.2**
  
  - [ ] 9.4 Write property test for export produces valid JSON
    - **Property 15: Export produces valid JSON**
    - **Validates: Requirements 5.1**
  
  - [ ] 9.5 Write property test for import/export round-trip
    - **Property 16: Import/export round-trip**
    - **Validates: Requirements 5.2**
  
  - [ ] 9.6 Write property test for invalid import rejection
    - **Property 17: Invalid import rejection**
    - **Validates: Requirements 5.3**
  
  - [ ] 9.7 Write property test for imported state persists
    - **Property 18: Imported state persists**
    - **Validates: Requirements 5.4**
  
  - [ ] 9.8 Write unit tests for reset and import/export
    - Test reset clears localStorage
    - Test export with empty state
    - Test import with missing fields
    - Test import with wrong version
    - _Requirements: 4.2, 5.3_

- [ ] 10. Implement integration with existing features
  - [ ] 10.1 Ensure column operations preserve other state
    - Test reordering preserves visibility settings
    - Test visibility changes preserve order and width
    - Test hidden columns excluded from visible order
    - Test row expand state preserved during column operations
    - Test edit state preserved during column operations
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6_
  
  - [ ] 10.2 Write property test for reordering preserves visibility
    - **Property 22: Reordering preserves visibility**
    - **Validates: Requirements 7.1**
  
  - [ ] 10.3 Write property test for visibility changes preserve order and width
    - **Property 23: Visibility changes preserve order and width**
    - **Validates: Requirements 7.2**
  
  - [ ] 10.4 Write property test for hidden columns excluded from visible order
    - **Property 24: Hidden columns excluded from visible order**
    - **Validates: Requirements 7.3**
  
  - [ ] 10.5 Write property test for row expand state preserved
    - **Property 25: Row expand state preserved during column operations**
    - **Validates: Requirements 7.5**
  
  - [ ] 10.6 Write property test for edit state preserved
    - **Property 26: Edit state preserved during column operations**
    - **Validates: Requirements 7.6**
  
  - [ ] 10.7 Write integration tests for feature compatibility
    - Test column reordering with pinned columns
    - Test column resizing with expandable rows
    - Test state persistence with inline editing
    - _Requirements: 7.1, 7.2, 7.5, 7.6_

- [ ] 11. Add schema versioning and migration
  - [ ] 11.1 Implement version migration logic in GridStateStorage
    - Add migration functions for each version transition
    - Test migration from v0 to v1 (example)
    - Handle migration failures gracefully
    - _Requirements: 6.4, 6.5_
  
  - [ ] 11.2 Write property test for schema migration preserves data
    - **Property 20: Schema migration preserves data**
    - **Validates: Requirements 6.5**
  
  - [ ] 11.3 Write unit tests for version migration
    - Test migration from old version to current
    - Test migration with missing fields
    - Test migration failure fallback
    - _Requirements: 6.5_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (29 total)
- Unit tests validate specific examples and edge cases
- Integration tests verify feature compatibility with existing grid features
