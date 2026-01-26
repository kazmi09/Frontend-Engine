 `12# Implementation Plan: Expandable Rows / Nested Detail Panels

## Overview

This implementation plan breaks down the expandable rows feature into incremental, testable steps. Each task builds on previous work, starting with core type definitions and store extensions, then implementing UI components, and finally integrating everything into the DataGrid. The plan emphasizes early validation through property-based tests and includes checkpoints to ensure quality at each stage.

## Tasks

- [ ] 1. Extend type definitions and store for expansion state
  - [x] 1.1 Add expandable types to `types.ts`
    - Create `ExpandableConfig<TData>` interface with renderer, lazyLoad, defaultExpanded, singleExpand, requiredPermissions, and canExpand properties
    - Create `DetailPanelState` interface for tracking loading/error/data state per row
    - Extend `DataResult` interface to include optional `expandable` property
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 6.1_
  
  - [x] 1.2 Extend Grid Store with expansion state management
    - Add `expandedRows` ref (Record<string, boolean>) to store
    - Add `detailPanelData` ref (DetailPanelState) to store
    - Implement `expandedRowIds` computed property
    - Implement `expandRow`, `collapseRow`, `toggleRowExpansion` actions
    - Implement `expandAllRows`, `collapseAllRows` actions
    - Implement `setDetailPanelData`, `setDetailPanelLoading`, `setDetailPanelError` actions
    - Implement `cleanupExpandedRows` action
    - _Requirements: 3.1, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 1.3 Write property tests for store expansion actions
    - **Property 2: Expansion State Toggle** - toggling expansion should change state
    - **Property 29: Expand All Rows** - expandAllRows should add all IDs to state
    - **Property 30: Collapse All Rows** - collapseAllRows should clear state
    - **Property 31: Expanded Row IDs Computed Property** - expandedRowIds should return IDs with value true
    - _Requirements: 3.2, 3.3, 10.4, 10.5, 10.6_

- [ ] 2. Create ExpanderCell component
  - [x] 2.1 Implement ExpanderCell.vue component
    - Create component with rowId and canExpand props
    - Render button with chevron icon (right when collapsed, down when expanded)
    - Emit toggle event on click
    - Add keyboard handlers for Enter and Space keys
    - Add ARIA attributes (aria-expanded, aria-label)
    - Style with hover and focus states
    - _Requirements: 1.1, 1.2, 1.5, 7.1, 7.2, 8.1, 8.2_
  
  - [x] 2.2 Write property tests for ExpanderCell
    - **Property 4: Expander Icon State** - icon should match expansion state
    - **Property 19: Keyboard Toggle** - Enter/Space should emit toggle event
    - **Property 22: Aria-Expanded Attribute** - aria-expanded should reflect state
    - **Property 23: Aria-Label on Expander** - aria-label should be present
    - _Requirements: 1.5, 7.1, 7.2, 8.1, 8.2_

- [ ] 3. Create DetailPanel component
  - [x] 3.1 Implement DetailPanel.vue component
    - Create component with row, rowId, columnCount, expandableConfig props
    - Render table row with single cell spanning all columns
    - Implement loading state with spinner
    - Implement error state with message and retry button
    - Implement content state with slot and component renderer support
    - Add ARIA attributes (aria-labelledby, role="region")
    - Add slide-down animation
    - _Requirements: 1.3, 1.4, 2.1, 2.2, 2.5, 4.3, 4.4, 8.3, 8.4_
  
  - [x] 3.2 Implement lazy loading logic in DetailPanel
    - On mount, check if lazyLoad is configured
    - If configured and no cached data, set loading state and invoke lazyLoad callback
    - Pass row data and rowId to callback
    - On success, store data in Grid Store
    - On error, store error message in Grid Store
    - _Requirements: 4.1, 4.2, 4.6_
  
  - [-] 3.3 Write property tests for DetailPanel
    - **Property 7: Detail Panel Colspan** - colspan should equal visible column count
    - **Property 12: Lazy Load Invocation** - lazyLoad should be called on first expansion with correct params
    - **Property 13: Loading Indicator Display** - loading indicator should appear when loading
    - **Property 14: Error Display and Retry** - error message and retry button should appear on error
    - **Property 15: Lazy Load Caching** - lazyLoad should only be called once per row
    - **Property 24: Detail Panel Aria Attributes** - aria-labelledby and role should be present
    - _Requirements: 2.5, 4.2, 4.3, 4.4, 4.5, 4.6, 8.3, 8.4_

- [ ] 4. Checkpoint - Ensure component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Integrate expansion into DataGrid component
  - [x] 5.1 Add expander column to column definitions
    - Check if expandable config exists and user has permissions
    - Add expander column as first column if conditions met
    - Configure column with fixed 50px width, no sorting, no hiding
    - _Requirements: 1.1, 5.2, 6.2_
  
  - [x] 5.2 Add expansion state to TanStack Table configuration
    - Import `getExpandedRowModel` from TanStack Table
    - Add `expanded` to table state, reading from Grid Store
    - Add `onExpandedChange` handler to sync with Grid Store
    - Enable expanding with `enableExpanding: true`
    - Add `getExpandedRowModel()` to table config
    - _Requirements: 3.1_
  
  - [x] 5.3 Update DataGrid template to render expander cells
    - In tbody, check if cell.column.id === 'expander'
    - Render ExpanderCell component with rowId and canExpand props
    - Implement canExpand logic checking expandableConfig.canExpand function
    - Handle toggle event by calling Grid Store toggleRowExpansion
    - _Requirements: 1.1, 1.2_
  
  - [x] 5.4 Update DataGrid template to render detail panels
    - After each main row, conditionally render DetailPanel if row.getIsExpanded()
    - Pass row data, rowId, columnCount, and expandableConfig as props
    - Provide slot passthrough for custom detail content
    - Handle retry event by re-invoking lazy load
    - _Requirements: 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.6_
  
  - [ ] 5.5 Write property tests for DataGrid expansion integration
    - **Property 1: Expander Column Visibility** - expander column should appear when configured with permissions
    - **Property 3: Detail Panel Visibility** - detail panel should be in DOM iff row is expanded
    - **Property 5: Expanded Row Visual Indicator** - expanded rows should have visual indicator class
    - **Property 6: Detail Renderer Props** - renderer should receive row data, rowId, and index
    - _Requirements: 1.1, 1.3, 1.4, 1.6, 2.3, 2.4, 5.2, 6.2_

- [ ] 6. Implement expansion state persistence
  - [x] 6.1 Add cleanup logic for pagination changes
    - Watch pageIndex in DataGrid
    - On change, call cleanupExpandedRows with current page row IDs
    - _Requirements: 3.4, 3.7_
  
  - [x] 6.2 Add cleanup logic for data refresh
    - Watch props.data.rows in DataGrid
    - On change, call cleanupExpandedRows with new row IDs
    - _Requirements: 3.7_
  
  - [ ] 6.3 Write property tests for state persistence
    - **Property 8: Expand State Persistence Across Pagination** - state should persist when changing pages
    - **Property 9: Expand State Persistence Across Sorting** - state should persist when sorting
    - **Property 10: Expand State Persistence Across Filtering** - state should persist for visible rows after filtering
    - **Property 11: Expand State Cleanup** - invalid row IDs should be removed from state
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

- [ ] 7. Implement advanced configuration features
  - [x] 7.1 Implement defaultExpanded initialization
    - In DataGrid onMounted hook, check if expandableConfig.defaultExpanded exists
    - Call expandAllRows with defaultExpanded array
    - _Requirements: 5.5_
  
  - [x] 7.2 Implement singleExpand mode
    - In toggleRowExpansion handler, check if singleExpand is enabled
    - If enabled and expanding a row, call collapseAllRows before expanding
    - _Requirements: 5.6, 5.7_
  
  - [x] 7.3 Implement permission-based expansion control
    - Create computed property hasExpandPermission checking user role against requiredPermissions
    - Use in expander column visibility logic
    - Add permission check to store actions (expandRow, toggleRowExpansion, expandAllRows)
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ] 7.4 Write property tests for advanced features
    - **Property 16: Default Expanded State** - rows in defaultExpanded should start expanded
    - **Property 17: Single Expand Mode** - only one row should be expanded when singleExpand is true
    - **Property 18: Permission-Based Programmatic Expansion** - store actions should respect permissions
    - _Requirements: 5.5, 5.6, 5.7, 6.3_

- [ ] 8. Implement keyboard navigation
  - [ ] 8.1 Add directional arrow key handlers to ExpanderCell
    - Add keydown handler for Right Arrow (expand if collapsed)
    - Add keydown handler for Left Arrow (collapse if expanded)
    - Prevent default behavior to avoid scrolling
    - _Requirements: 7.3, 7.4_
  
  - [ ] 8.2 Implement tab navigation in DetailPanel
    - Ensure DetailPanel content is in normal DOM flow
    - Test that focusable elements receive focus with Tab key
    - _Requirements: 7.5_
  
  - [ ] 8.3 Write property tests for keyboard navigation
    - **Property 20: Directional Keyboard Navigation** - arrow keys should control expansion
    - **Property 21: Tab Navigation in Detail Panel** - Tab should move focus within panel
    - _Requirements: 7.3, 7.4, 7.5_

- [ ] 9. Implement accessibility features
  - [ ] 9.1 Add aria-live region for expansion announcements
    - Add hidden aria-live region to DataGrid template
    - Update region text when expansion state changes
    - Announce "Row expanded" or "Row collapsed" to screen readers
    - _Requirements: 8.5_
  
  - [ ] 9.2 Write property tests for accessibility
    - **Property 25: Aria-Live Announcements** - aria-live region should update on state change
    - _Requirements: 8.5_

- [ ] 10. Checkpoint - Ensure all core features work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement virtualization compatibility (optional)
  - [ ] 11.1 Add dynamic row height calculation
    - Research TanStack Table row height API
    - Implement height calculation that accounts for expanded detail panels
    - _Requirements: 9.1_
  
  - [ ] 11.2 Implement conditional detail panel rendering for virtualization
    - Add logic to only render detail panels for rows in viewport
    - Test with TanStack Virtual or similar virtualization library
    - _Requirements: 9.2, 9.3_
  
  - [ ] 11.3 Write property tests for virtualization
    - **Property 26: Dynamic Row Height** - row height should increase when expanded
    - **Property 27: Virtualized Detail Panel Rendering** - only visible panels should render
    - **Property 28: Detail Panel Lifecycle with Scrolling** - panels should mount/unmount with scrolling
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 12. Create example implementation in Dashboard
  - [x] 12.1 Create example detail panel component
    - Create `EmployeeDetailPanel.vue` component
    - Display additional employee information (address, department, manager, etc.)
    - Style with Quasar components
    - _Requirements: 2.6_
  
  - [x] 12.2 Configure expandable in Dashboard.vue
    - Add expandable config to DataResult
    - Set renderer to EmployeeDetailPanel component
    - Optionally add lazyLoad function to fetch additional data
    - Test with different user roles
    - _Requirements: 5.1, 5.3, 5.4_
  
  - [ ] 12.3 Write integration tests for Dashboard example
    - Test full user workflow: expand row, view details, collapse row
    - Test lazy loading with mock API
    - Test permission-based access
    - _Requirements: All requirements_

- [ ] 13. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 31 correctness properties are tested
  - Check accessibility with screen reader
  - Test with different user roles
  - Test with large datasets

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (all 31 properties will be tested)
- Unit tests validate specific examples and edge cases
- Task 11 (virtualization) can be deferred to a future iteration if needed
- The implementation leverages TanStack Table's built-in expansion API for consistency
- All test tasks are required for comprehensive coverage from the start
