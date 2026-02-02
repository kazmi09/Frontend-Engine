# Implementation Plan: Grid Feature Parity

## Overview

This implementation plan enhances the GenericDetailPanel component to achieve feature parity with EmployeeDetailPanel by adding custom fields functionality. The approach focuses on creating a reusable composable for custom fields logic and integrating it into the existing GenericDetailPanel component.

## Tasks

- [x] 1. Create useCustomFields composable
  - Create `client/src/composables/useCustomFields.ts` file
  - Implement CustomField interface with id, label, type, and value properties
  - Implement UseCustomFieldsOptions interface with rowId and gridId
  - Implement loadCustomFields function to read from localStorage
  - Implement saveCustomFields function to write to localStorage
  - Implement generateFieldId function to create unique IDs using timestamp and random string
  - Implement addCustomField function to add new fields
  - Implement updateCustomField function to modify field values
  - Implement removeCustomField function to delete fields
  - Export useCustomFields function that returns reactive state and methods
  - _Requirements: 2.3, 2.5, 2.7, 2.9, 9.1, 9.2, 9.3_

- [ ]* 1.1 Write property test for custom field persistence round-trip
  - **Property 3: Custom Field Persistence Round-Trip**
  - **Validates: Requirements 2.5, 2.9, 9.1, 9.2**
  - Test that adding a field and reading from localStorage returns equivalent data
  - Test that updating a field value and reading from localStorage returns updated value
  - Use fast-check to generate random field labels, types, and values
  - Run minimum 100 iterations

- [ ]* 1.2 Write property test for custom field lifecycle
  - **Property 4: Custom Field Lifecycle**
  - **Validates: Requirements 2.3, 2.7, 9.3**
  - Test that adding a field increases count by one
  - Test that removing a field decreases count by one
  - Test that field is present in localStorage after adding
  - Test that field is absent from localStorage after removing
  - Run minimum 100 iterations

- [ ]* 1.3 Write property test for storage key namespacing
  - **Property 6: Storage Key Namespacing**
  - **Validates: Requirements 3.6, 9.5**
  - Test that fields from different grids with same row ID don't interfere
  - Test that storage keys include both gridId and rowId
  - Run minimum 100 iterations

- [ ]* 1.4 Write unit tests for useCustomFields composable
  - Test adding field with valid data
  - Test updating field value
  - Test removing field
  - Test loading from localStorage
  - Test handling corrupted localStorage data (edge case)
  - Test empty label rejection (edge case)
  - Test localStorage unavailability graceful degradation (edge case)
  - Test unique ID generation

- [x] 2. Enhance GenericDetailPanel component
  - [x] 2.1 Import useCustomFields composable into GenericDetailPanel.vue
    - Add import statement for useCustomFields
    - Add import for CustomField type
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Initialize custom fields state in GenericDetailPanel
    - Call useCustomFields with rowId and gridId props
    - Destructure customFields, addCustomField, updateCustomField, removeCustomField
    - Add showAddForm ref for controlling form visibility
    - Add newFieldLabel and newFieldType refs for form inputs
    - Add customFieldRefs reactive object for input element references
    - _Requirements: 2.1, 2.3_

  - [x] 2.3 Add custom fields display section to template
    - Add custom-fields-section div after existing detail-grid
    - Loop through customFields array with v-for
    - Display each field with label, value, and delete button
    - Add field-label-row with label and delete button
    - Add field-value div with click handler for editing
    - Show edit icon on hover
    - _Requirements: 2.1, 2.8, 2.10_

  - [x] 2.4 Implement custom field inline editing
    - Add startEditCustom function to enter edit mode for custom fields
    - Add saveCustomField function to save custom field values
    - Handle Enter key to save
    - Handle Escape key to cancel
    - Handle blur event to save
    - Focus input element when entering edit mode
    - Display appropriate input type based on field type
    - _Requirements: 2.8, 2.9_

  - [x] 2.5 Add custom field form UI
    - Add add-field-section div with conditional rendering
    - Show "Add Custom Field" button when form is hidden
    - Show form with field name input and type select when visible
    - Add form-row with two form-field divs
    - Add Cancel and Add buttons
    - Style form to match EmployeeDetailPanel
    - _Requirements: 2.2, 2.4_

  - [x] 2.6 Implement add custom field handler
    - Create addCustomFieldHandler function
    - Validate field label is not empty
    - Call addCustomField from composable
    - Reset form state (label, type)
    - Hide form
    - Show success message
    - _Requirements: 2.3, 2.5_

  - [x] 2.7 Implement remove custom field handler
    - Create removeCustomFieldHandler function
    - Call removeCustomField from composable
    - Show success message
    - _Requirements: 2.7_

  - [ ]* 2.8 Write property test for custom field reload persistence
    - **Property 5: Custom Field Reload Persistence**
    - **Validates: Requirements 2.6, 9.4**
    - Test that closing and reopening detail panel shows same custom fields
    - Test that field values persist across panel reloads
    - Run minimum 100 iterations

  - [ ]* 2.9 Write unit tests for GenericDetailPanel custom fields
    - Test rendering with no custom fields
    - Test rendering with existing custom fields
    - Test add field button displays
    - Test add field form shows/hides
    - Test field deletion
    - Test inline editing of custom fields
    - Test empty label rejection

- [x] 3. Add styling for custom fields section
  - Add custom-fields-section styles matching EmployeeDetailPanel
  - Add field-label-row styles with flexbox layout
  - Add delete-field-btn styles with opacity transition
  - Add add-field-section styles
  - Add add-field-form styles with border and padding
  - Add form-row grid layout styles
  - Add form-field, form-label, form-input, form-select styles
  - Add form-actions styles for button layout
  - Ensure hover states work correctly
  - _Requirements: 10.1, 10.5, 10.6_

- [ ] 4. Update GenericDetailPanel configuration
  - [x] 4.1 Add enableCustomFields option to DetailPanelConfig interface
    - Default value should be true
    - Allow grids to disable custom fields if needed
    - _Requirements: 3.1_

  - [x] 4.2 Conditionally render custom fields section based on config
    - Check enableCustomFields config option
    - Only render custom fields section if enabled
    - _Requirements: 3.1_

- [x] 5. Checkpoint - Test custom fields functionality
  - Manually test adding custom fields in both employees and users grids
  - Verify fields persist after page reload
  - Verify fields are namespaced by grid ID
  - Verify inline editing works for all field types
  - Verify field deletion works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Verify column visibility functionality
  - [ ] 6.1 Test column visibility toggle in GridToolbar
    - Verify clicking checkbox shows/hides column
    - Verify state persists in grid store
    - Verify toolbar checkboxes reflect current state
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ]* 6.2 Write property test for column visibility state consistency
    - **Property 1: Column Visibility State Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.4**
    - Test that grid display, toolbar checkboxes, and store state all match
    - Run minimum 100 iterations

  - [ ]* 6.3 Write property test for layout reset idempotence
    - **Property 2: Layout Reset Idempotence**
    - **Validates: Requirements 1.3**
    - Test that reset restores all columns to visible
    - Test that resetting twice produces same result
    - Run minimum 100 iterations

- [ ] 7. Verify bulk operations functionality
  - [ ] 7.1 Test bulk actions bar appearance
    - Verify bar appears when rows selected
    - Verify bar shows correct count
    - Verify bar hides when no rows selected
    - _Requirements: 4.1, 4.2_

  - [ ]* 7.2 Write property test for bulk operation cleanup
    - **Property 11: Bulk Operation Cleanup**
    - **Validates: Requirements 4.7, 4.8, 4.9**
    - Test that selection is cleared after operation
    - Test that notification is displayed
    - Test that grid data is refreshed
    - Run minimum 100 iterations

  - [ ]* 7.3 Write property test for bulk actions bar visibility
    - **Property 12: Bulk Actions Bar Visibility**
    - **Validates: Requirements 4.1, 4.2**
    - Test bar appears with correct count when rows selected
    - Test bar hides when no rows selected
    - Run minimum 100 iterations

- [ ] 8. Verify search and filter functionality
  - [ ] 8.1 Test search functionality
    - Verify search filters rows correctly
    - Verify clearing search shows all rows
    - _Requirements: 5.1, 5.3_

  - [ ] 8.2 Test filter functionality
    - Verify column filter works correctly
    - Verify clearing filter shows all rows
    - _Requirements: 5.2, 5.4_

  - [ ]* 8.3 Write property test for search result accuracy
    - **Property 14: Search Result Accuracy**
    - **Validates: Requirements 5.1**
    - Test that all displayed rows contain search text
    - Test that all matching rows are displayed
    - Run minimum 100 iterations

  - [ ]* 8.4 Write property test for column filter accuracy
    - **Property 15: Column Filter Accuracy**
    - **Validates: Requirements 5.2**
    - Test that all displayed rows match filter criteria
    - Test that all matching rows are displayed
    - Run minimum 100 iterations

  - [ ]* 8.5 Write property test for search filter round-trip
    - **Property 13: Search Filter Round-Trip**
    - **Validates: Requirements 5.3, 5.4**
    - Test that applying then clearing search/filter returns all rows
    - Run minimum 100 iterations

- [ ] 9. Verify expandable rows functionality
  - [ ] 9.1 Test row expansion toggle
    - Verify clicking expander toggles expansion state
    - Verify detail panel shows when expanded
    - _Requirements: 6.2, 6.3_

  - [ ] 9.2 Test single expand mode
    - Verify expanding a row collapses others in single expand mode
    - _Requirements: 6.4_

  - [ ]* 9.3 Write property test for row expansion toggle
    - **Property 17: Row Expansion Toggle**
    - **Validates: Requirements 6.2, 6.3**
    - Test that clicking toggles state correctly
    - Test that detail panel visibility matches expansion state
    - Run minimum 100 iterations

  - [ ]* 9.4 Write property test for single expand mode enforcement
    - **Property 18: Single Expand Mode Enforcement**
    - **Validates: Requirements 6.4**
    - Test that expanding a row collapses others
    - Test that at most one row is expanded
    - Run minimum 100 iterations

  - [ ]* 9.5 Write property test for pagination expansion cleanup
    - **Property 19: Pagination Expansion Cleanup**
    - **Validates: Requirements 6.5**
    - Test that navigating pages collapses expanded rows
    - Run minimum 100 iterations

- [ ] 10. Verify inline editing functionality
  - [ ] 10.1 Test edit mode entry
    - Verify clicking editable field enters edit mode
    - Verify appropriate input type is displayed
    - _Requirements: 7.1, 7.2_

  - [ ] 10.2 Test edit mode save and cancel
    - Verify Enter and blur save changes
    - Verify Escape cancels and restores original value
    - _Requirements: 7.3, 7.4_

  - [ ]* 10.3 Write property test for field type input mapping
    - **Property 8: Field Type Input Mapping**
    - **Validates: Requirements 3.4, 7.2**
    - Test that each field type displays correct input type
    - Run minimum 100 iterations

  - [ ]* 10.4 Write property test for edit mode cancel restoration
    - **Property 9: Edit Mode Cancel Restoration**
    - **Validates: Requirements 7.4**
    - Test that Escape restores original value without saving
    - Run minimum 100 iterations

  - [ ]* 10.5 Write property test for edit mode save triggers
    - **Property 10: Edit Mode Save Triggers**
    - **Validates: Requirements 7.3**
    - Test that both Enter and blur trigger save
    - Run minimum 100 iterations

- [ ] 11. Verify permissions functionality
  - [ ] 11.1 Test permission-based UI hiding
    - Test with different user roles (admin, editor, viewer)
    - Verify expander column hidden for users without expand permission
    - Verify edit fields disabled for users without edit permission
    - Verify delete button hidden for users without delete permission
    - Verify archive button hidden for users without archive permission
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 11.2 Write property test for permission-based UI hiding
    - **Property 20: Permission-Based UI Hiding**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
    - Test that UI elements requiring permissions are hidden/disabled
    - Run minimum 100 iterations

- [ ] 12. Verify cross-grid consistency
  - [ ] 12.1 Test feature parity between employees and users grids
    - Test column visibility works identically on both grids
    - Test search and filter work identically on both grids
    - Test expansion works identically on both grids
    - Test inline editing works identically on both grids
    - Test permissions work identically on both grids
    - Test custom fields work identically on both grids
    - _Requirements: 1.5, 5.7, 6.6, 7.8, 8.5_

  - [ ]* 12.2 Write property test for cross-grid feature consistency
    - **Property 21: Cross-Grid Feature Consistency**
    - **Validates: Requirements 1.5, 5.7, 6.6, 7.8, 8.5**
    - Test that same operations produce equivalent results on both grids
    - Run minimum 100 iterations

- [ ] 13. Final checkpoint - Comprehensive testing
  - Run full test suite (unit tests and property tests)
  - Verify all property tests pass with 100+ iterations
  - Verify test coverage meets goals (80% line, 75% branch, 85% function)
  - Perform manual testing checklist from design document
  - Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)
  - Test performance with large numbers of custom fields (50+)
  - Test localStorage quota handling
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Documentation and cleanup
  - Update component documentation for GenericDetailPanel
  - Add JSDoc comments to useCustomFields composable
  - Update README with custom fields feature description
  - Verify EmployeeDetailPanel is in examples folder (already done)
  - Remove any remaining references to EmployeeDetailPanel in production code
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- The implementation follows Vue 3 Composition API best practices
- Custom fields are stored in localStorage with namespaced keys
- The useCustomFields composable is reusable and testable
