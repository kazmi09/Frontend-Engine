# Design Document: Grid Feature Parity

## Overview

This design enhances the GenericDetailPanel component to achieve feature parity with EmployeeDetailPanel, ensuring all grids in the application have consistent functionality. The key enhancement is adding custom fields support to GenericDetailPanel, making it a truly universal detail panel component that can be used across all grids.

The design follows a component enhancement approach rather than creating new components, maximizing code reuse and maintainability. The custom fields feature will be implemented as a composable that can be integrated into GenericDetailPanel, following Vue 3 composition API best practices.

## Architecture

### Component Hierarchy

```
DataGrid (unchanged)
├── GridToolbar (unchanged)
├── DataGrid.vue (unchanged)
│   ├── ExpanderCell (unchanged)
│   ├── EditableCell (unchanged)
│   └── DetailPanel (unchanged)
│       └── GenericDetailPanel (enhanced)
│           └── CustomFieldsSection (new)
└── BulkActionsBar (unchanged)
```

### Data Flow

1. **Custom Fields Storage**: Custom fields are stored in localStorage with keys formatted as `custom_fields_{gridId}_{rowId}`
2. **Field Definitions**: Each custom field has an ID, label, type, and value
3. **State Management**: Custom fields state is managed locally within GenericDetailPanel using Vue reactive refs
4. **Persistence**: Changes to custom fields (add, edit, delete) immediately persist to localStorage

### Key Design Decisions

1. **Enhance GenericDetailPanel**: Rather than creating a new component, we enhance the existing GenericDetailPanel to include custom fields functionality
2. **Composable Pattern**: Extract custom fields logic into a `useCustomFields` composable for reusability and testability
3. **localStorage for Persistence**: Use browser localStorage for custom field persistence (simple, client-side, no backend changes needed)
4. **Grid ID Namespacing**: Include gridId in storage keys to prevent conflicts between different grids
5. **Type Safety**: Use TypeScript interfaces for custom field definitions

## Components and Interfaces

### Enhanced GenericDetailPanel

**Props:**
```typescript
interface GenericDetailPanelProps {
  row: any                      // The row data
  rowId: string                 // Unique row identifier
  columns?: ColumnConfig[]      // Column configuration
  config?: DetailPanelConfig    // Panel configuration
  gridId?: string               // Grid identifier for namespacing
}

interface DetailPanelConfig {
  icon?: string                 // Icon name for header
  showId?: boolean              // Whether to show record ID
  columns?: number              // Number of columns in grid layout
  titleField?: string           // Field to use for title
  subtitleField?: string        // Field to use for subtitle
  idField?: string              // Field to use for ID display
  enableCustomFields?: boolean  // Whether to enable custom fields (default: true)
}
```

**New Features:**
- Custom fields section below standard fields
- Add custom field button and form
- Custom field inline editing
- Custom field deletion
- localStorage persistence

### CustomFieldsSection Component

A new sub-component to encapsulate custom fields UI:

**Props:**
```typescript
interface CustomFieldsSectionProps {
  rowId: string
  gridId: string
  customFields: CustomField[]
  onAdd: (field: Omit<CustomField, 'id' | 'value'>) => void
  onUpdate: (fieldId: string, value: any) => void
  onRemove: (fieldId: string) => void
}

interface CustomField {
  id: string
  label: string
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'url'
  value: any
}
```

### useCustomFields Composable

A composable to manage custom fields logic:

```typescript
interface UseCustomFieldsOptions {
  rowId: string
  gridId: string
}

interface UseCustomFieldsReturn {
  customFields: Ref<CustomField[]>
  addCustomField: (label: string, type: string) => void
  updateCustomField: (fieldId: string, value: any) => void
  removeCustomField: (fieldId: string) => void
  loadCustomFields: () => void
  saveCustomFields: () => void
}

function useCustomFields(options: UseCustomFieldsOptions): UseCustomFieldsReturn
```

**Responsibilities:**
- Load custom fields from localStorage on initialization
- Provide methods to add, update, and remove custom fields
- Automatically persist changes to localStorage
- Generate unique field IDs
- Validate field data

## Data Models

### CustomField Model

```typescript
interface CustomField {
  id: string                    // Unique identifier (e.g., "custom_1234567890_abc123")
  label: string                 // Display label (e.g., "Phone Number")
  type: FieldType               // Input type
  value: any                    // Current value
}

type FieldType = 'text' | 'number' | 'email' | 'tel' | 'date' | 'url'
```

### LocalStorage Schema

**Key Format:** `custom_fields_{gridId}_{rowId}`

**Value Format:**
```json
[
  {
    "id": "custom_1234567890_abc123",
    "label": "Phone Number",
    "type": "tel",
    "value": "+1-555-0123"
  },
  {
    "id": "custom_1234567891_def456",
    "label": "LinkedIn URL",
    "type": "url",
    "value": "https://linkedin.com/in/johndoe"
  }
]
```

### Field Type Mapping

| Field Type | HTML Input Type | Validation |
|------------|----------------|------------|
| text       | text           | None       |
| number     | number         | Numeric    |
| email      | email          | Email format |
| tel        | tel            | None       |
| date       | date           | Date format |
| url        | url            | URL format |

## Implementation Details

### GenericDetailPanel Enhancement

**Changes Required:**

1. **Import useCustomFields composable**
2. **Initialize custom fields state**
3. **Add custom fields section to template**
4. **Handle custom field interactions**

**Template Structure:**
```vue
<template>
  <div class="generic-detail-panel">
    <!-- Existing header -->
    <div class="detail-header">...</div>
    
    <!-- Existing editable fields grid -->
    <div class="detail-grid">...</div>
    
    <!-- NEW: Custom fields section -->
    <div class="custom-fields-section">
      <!-- Display existing custom fields -->
      <div v-for="field in customFields" :key="field.id" class="detail-field">
        <div class="field-label-row">
          <label class="field-label">{{ field.label }}</label>
          <q-btn @click="removeCustomField(field.id)" />
        </div>
        <div class="field-value editable" @click="startEditCustom(field.id)">
          <!-- Inline editing logic -->
        </div>
      </div>
      
      <!-- Add custom field button/form -->
      <div class="add-field-section">
        <q-btn v-if="!showAddForm" @click="showAddForm = true">
          Add Custom Field
        </q-btn>
        <div v-else class="add-field-form">
          <input v-model="newFieldLabel" placeholder="Field Name" />
          <select v-model="newFieldType">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="email">Email</option>
            <option value="tel">Phone</option>
            <option value="date">Date</option>
            <option value="url">URL</option>
          </select>
          <q-btn @click="addCustomField">Add</q-btn>
          <q-btn @click="showAddForm = false">Cancel</q-btn>
        </div>
      </div>
    </div>
    
    <!-- Existing indicators -->
    <div v-if="isSaving" class="saving-indicator">...</div>
    <div v-if="saveError" class="error-message">...</div>
    <div v-if="successMessage" class="success-message">...</div>
  </div>
</template>
```

**Script Setup:**
```typescript
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCustomFields } from '@/composables/useCustomFields'
import { useGridUpdate } from '@/composables/useGridUpdate'

const props = defineProps<GenericDetailPanelProps>()

// Existing logic...
const updateMutation = useGridUpdate(props.gridId || 'default')
const editingField = ref<string | null>(null)
// ... other existing state

// NEW: Custom fields integration
const {
  customFields,
  addCustomField: addField,
  updateCustomField,
  removeCustomField: removeField
} = useCustomFields({
  rowId: props.rowId,
  gridId: props.gridId || 'default'
})

// NEW: Add field form state
const showAddForm = ref(false)
const newFieldLabel = ref('')
const newFieldType = ref<FieldType>('text')

// NEW: Add custom field handler
const addCustomField = () => {
  if (!newFieldLabel.value.trim()) return
  
  addField(newFieldLabel.value, newFieldType.value)
  
  // Reset form
  newFieldLabel.value = ''
  newFieldType.value = 'text'
  showAddForm.value = false
  
  // Show success message
  successMessage.value = 'Custom field added!'
  setTimeout(() => successMessage.value = null, 2000)
}

// NEW: Remove custom field handler
const removeCustomField = (fieldId: string) => {
  removeField(fieldId)
  successMessage.value = 'Field removed'
  setTimeout(() => successMessage.value = null, 2000)
}

// NEW: Edit custom field handlers
const startEditCustom = (fieldId: string) => {
  const field = customFields.value.find(f => f.id === fieldId)
  if (!field) return
  
  editingField.value = fieldId
  editValues[fieldId] = field.value
}

const saveCustomField = (fieldId: string) => {
  const newValue = editValues[fieldId]
  updateCustomField(fieldId, newValue)
  editingField.value = null
  
  successMessage.value = 'Field updated!'
  setTimeout(() => successMessage.value = null, 2000)
}

// Existing methods remain unchanged...
</script>
```

### useCustomFields Composable Implementation

**File:** `client/src/composables/useCustomFields.ts`

```typescript
import { ref, Ref } from 'vue'

export interface CustomField {
  id: string
  label: string
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'url'
  value: any
}

export interface UseCustomFieldsOptions {
  rowId: string
  gridId: string
}

export function useCustomFields(options: UseCustomFieldsOptions) {
  const { rowId, gridId } = options
  const customFields = ref<CustomField[]>([])
  
  // Generate storage key
  const getStorageKey = () => `custom_fields_${gridId}_${rowId}`
  
  // Load custom fields from localStorage
  const loadCustomFields = () => {
    const key = getStorageKey()
    const stored = localStorage.getItem(key)
    
    if (stored) {
      try {
        customFields.value = JSON.parse(stored)
      } catch (error) {
        console.error('Failed to load custom fields:', error)
        customFields.value = []
      }
    }
  }
  
  // Save custom fields to localStorage
  const saveCustomFields = () => {
    const key = getStorageKey()
    localStorage.setItem(key, JSON.stringify(customFields.value))
  }
  
  // Generate unique field ID
  const generateFieldId = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `custom_${timestamp}_${random}`
  }
  
  // Add a new custom field
  const addCustomField = (label: string, type: string) => {
    const field: CustomField = {
      id: generateFieldId(),
      label: label.trim(),
      type: type as CustomField['type'],
      value: ''
    }
    
    customFields.value.push(field)
    saveCustomFields()
  }
  
  // Update a custom field value
  const updateCustomField = (fieldId: string, value: any) => {
    const field = customFields.value.find(f => f.id === fieldId)
    if (field) {
      field.value = value
      saveCustomFields()
    }
  }
  
  // Remove a custom field
  const removeCustomField = (fieldId: string) => {
    const index = customFields.value.findIndex(f => f.id === fieldId)
    if (index !== -1) {
      customFields.value.splice(index, 1)
      saveCustomFields()
    }
  }
  
  // Load fields on initialization
  loadCustomFields()
  
  return {
    customFields,
    addCustomField,
    updateCustomField,
    removeCustomField,
    loadCustomFields,
    saveCustomFields
  }
}
```

### Styling Updates

The GenericDetailPanel styles will be updated to match EmployeeDetailPanel:

```scss
// Custom fields section
.custom-fields-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delete-field-btn {
  opacity: 0;
  transition: opacity 0.2s;
  color: #ef4444;
}

.detail-field:hover .delete-field-btn {
  opacity: 1;
}

// Add field section
.add-field-section {
  margin-top: 12px;
}

.add-field-trigger {
  display: flex;
  justify-content: center;
}

.add-field-form {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-input,
.form-select {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  color: #1f2937;
  background: white;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
```

## Error Handling

### localStorage Errors

**Scenario:** localStorage is full or unavailable

**Handling:**
- Wrap all localStorage operations in try-catch blocks
- Log errors to console
- Display user-friendly error message: "Unable to save custom fields. Storage may be full."
- Gracefully degrade: custom fields won't persist but can still be used in current session

### Invalid Data in localStorage

**Scenario:** Corrupted or invalid JSON in localStorage

**Handling:**
- Catch JSON.parse errors
- Log warning to console
- Initialize with empty array
- Don't crash the component

### Field ID Collisions

**Scenario:** Duplicate field IDs (extremely unlikely but possible)

**Handling:**
- Use timestamp + random string for ID generation
- Collision probability is negligible
- If collision detected, regenerate ID

## Testing Strategy

### Unit Tests

Unit tests will verify specific behaviors and edge cases:

1. **useCustomFields Composable Tests**
   - Test field addition with valid data
   - Test field update with new values
   - Test field removal
   - Test localStorage persistence
   - Test loading from localStorage
   - Test handling of corrupted localStorage data
   - Test unique ID generation

2. **GenericDetailPanel Tests**
   - Test rendering with custom fields
   - Test add field form display/hide
   - Test field deletion confirmation
   - Test inline editing of custom fields
   - Test integration with useCustomFields composable

3. **Edge Cases**
   - Empty field labels (should be rejected)
   - Very long field labels (should be truncated or handled)
   - Special characters in field labels
   - Maximum number of custom fields (localStorage limits)
   - Rapid add/remove operations

### Property-Based Tests

Property-based tests will verify universal properties across all inputs. Each test should run a minimum of 100 iterations.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Consolidations Made:**
1. **Column visibility properties (1.1, 1.2, 1.4)** can be combined into a single comprehensive property about column visibility state consistency
2. **Custom field persistence properties (2.5, 2.9, 9.1, 9.2)** all test round-trip persistence and can be combined
3. **Custom field lifecycle properties (2.3, 2.7)** test add/remove operations and can be combined
4. **Bulk operation properties (4.7, 4.8, 4.9)** all test post-operation behavior and can be combined
5. **Filter round-trip properties (5.3, 5.4)** test the same pattern and can be combined
6. **Grid consistency properties (1.5, 5.7, 6.6, 7.8, 8.5)** all test cross-grid consistency and can be combined
7. **Permission enforcement properties (8.1, 8.2, 8.3, 8.4)** all test permission-based UI hiding and can be combined

### Core Properties

**Property 1: Column Visibility State Consistency**

*For any* grid with column configuration, when a user toggles column visibility, the grid display, toolbar checkboxes, and store state should all reflect the same visibility state for each column.

**Validates: Requirements 1.1, 1.2, 1.4**

**Property 2: Layout Reset Idempotence**

*For any* grid with modified column visibility, resetting the layout should restore all columns to visible state, and resetting again should produce the same result.

**Validates: Requirements 1.3**

**Property 3: Custom Field Persistence Round-Trip**

*For any* custom field with valid label and type, adding the field then reading from localStorage should return an equivalent field definition, and updating the field value then reading from localStorage should return the updated value.

**Validates: Requirements 2.5, 2.9, 9.1, 9.2**

**Property 4: Custom Field Lifecycle**

*For any* detail panel, the number of custom fields should increase by one after adding a field and decrease by one after removing a field, and the field should be present in localStorage after adding and absent after removing.

**Validates: Requirements 2.3, 2.7, 9.3**

**Property 5: Custom Field Reload Persistence**

*For any* set of custom fields added to a row, closing and reopening the detail panel should display the same custom fields with the same values.

**Validates: Requirements 2.6, 9.4**

**Property 6: Storage Key Namespacing**

*For any* two different grids with the same row ID, custom fields added to one grid should not appear in the other grid, and the localStorage keys should include both grid ID and row ID.

**Validates: Requirements 3.6, 9.5**

**Property 7: Field Editability Enforcement**

*For any* field marked as non-editable in the column configuration, clicking on the field should not enter edit mode, and the field should display without an edit icon.

**Validates: Requirements 3.7**

**Property 8: Field Type Input Mapping**

*For any* field type (string, number, date, select, boolean), entering edit mode should display the appropriate HTML input type, and the input should accept values valid for that type.

**Validates: Requirements 3.4, 7.2**

**Property 9: Edit Mode Cancel Restoration**

*For any* editable field with an original value, entering edit mode, changing the value, and pressing Escape should restore the original value without saving.

**Validates: Requirements 7.4**

**Property 10: Edit Mode Save Triggers**

*For any* editable field in edit mode with a changed value, both pressing Enter and clicking outside the field should trigger a save operation.

**Validates: Requirements 7.3**

**Property 11: Bulk Operation Cleanup**

*For any* bulk operation (edit, delete, archive, export) that completes, the row selection should be cleared, a notification should be displayed, and the grid data should be refreshed.

**Validates: Requirements 4.7, 4.8, 4.9**

**Property 12: Bulk Actions Bar Visibility**

*For any* grid, when one or more rows are selected, the bulk actions bar should appear with the correct count of selected rows, and when no rows are selected, the bar should be hidden.

**Validates: Requirements 4.1, 4.2**

**Property 13: Search Filter Round-Trip**

*For any* grid with data, applying a search or filter then clearing it should return the grid to displaying all rows.

**Validates: Requirements 5.3, 5.4**

**Property 14: Search Result Accuracy**

*For any* search text, all displayed rows should contain the search text in at least one field, and all rows containing the search text should be displayed.

**Validates: Requirements 5.1**

**Property 15: Column Filter Accuracy**

*For any* column filter selection, all displayed rows should match the filter criteria for that column, and all rows matching the criteria should be displayed.

**Validates: Requirements 5.2**

**Property 16: Active Filter Count Accuracy**

*For any* combination of active search and column filters, the filter chip count should equal the number of active filters.

**Validates: Requirements 5.5**

**Property 17: Row Expansion Toggle**

*For any* expandable row, clicking the expander icon should toggle the expansion state (collapsed to expanded or expanded to collapsed), and the detail panel should be visible when expanded and hidden when collapsed.

**Validates: Requirements 6.2, 6.3**

**Property 18: Single Expand Mode Enforcement**

*For any* grid with single expand mode enabled, expanding a row should collapse all other currently expanded rows, ensuring at most one row is expanded at any time.

**Validates: Requirements 6.4**

**Property 19: Pagination Expansion Cleanup**

*For any* grid with expanded rows, navigating to a different page should collapse all previously expanded rows.

**Validates: Requirements 6.5**

**Property 20: Permission-Based UI Hiding**

*For any* user role, UI elements requiring permissions the user lacks (expander column, edit fields, delete button, archive button) should not be displayed or should be disabled.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

**Property 21: Cross-Grid Feature Consistency**

*For any* feature (column visibility, search, filter, expansion, inline editing, permissions), performing the same operations on the employees grid and users grid should produce equivalent results and behavior.

**Validates: Requirements 1.5, 5.7, 6.6, 7.8, 8.5**

**Property 22: Detail Panel Configuration Application**

*For any* valid detail panel configuration (icon, title field, subtitle field, column count), the Generic_Detail_Panel should apply the configuration and display accordingly.

**Validates: Requirements 3.2**

**Property 23: Editable Field Detection**

*For any* column configuration, all columns marked as editable should appear in the detail panel, and all columns marked as non-editable (except the ID field) should either not appear or appear as read-only.

**Validates: Requirements 3.3**

**Property 24: Detail Panel Header Completeness**

*For any* row data, the detail panel header should display an icon, title (from configured title field), subtitle (from configured subtitle field), and record ID.

**Validates: Requirements 10.2**

**Property 25: Responsive Grid Layout**

*For any* configured column count, the detail panel fields should be arranged in a grid with that many columns.

**Validates: Requirements 10.3**

### Edge Case Properties

**Property 26: Empty Field Label Rejection**

*For any* custom field with an empty or whitespace-only label, the add operation should be rejected and the field should not be added.

**Validates: Requirements 2.3** (edge case)

**Property 27: localStorage Unavailability Graceful Degradation**

*For any* custom field operation when localStorage is unavailable or full, the operation should fail gracefully with an error message, and the component should not crash.

**Validates: Requirements 2.5, 2.9** (edge case)

**Property 28: Corrupted localStorage Recovery**

*For any* row with corrupted custom field data in localStorage, loading the detail panel should initialize with an empty custom fields array and log a warning, without crashing.

**Validates: Requirements 2.6** (edge case)

**Property 29: Maximum Custom Fields Handling**

*For any* row approaching localStorage size limits, attempting to add more custom fields should either succeed or fail gracefully with a clear error message about storage limits.

**Validates: Requirements 2.3** (edge case)



## Testing Strategy

### Dual Testing Approach

This feature will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library:** We will use **fast-check** for property-based testing in TypeScript/Vue.

**Configuration:**
- Each property test must run a minimum of 100 iterations
- Each test must reference its design document property using a comment tag
- Tag format: `// Feature: grid-feature-parity, Property {number}: {property_text}`

**Example Property Test:**

```typescript
import fc from 'fast-check'
import { describe, it, expect } from 'vitest'
import { useCustomFields } from '@/composables/useCustomFields'

describe('Custom Fields Composable', () => {
  // Feature: grid-feature-parity, Property 3: Custom Field Persistence Round-Trip
  it('should persist custom fields to localStorage and retrieve them', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }), // field label
        fc.constantFrom('text', 'number', 'email', 'tel', 'date', 'url'), // field type
        fc.string(), // field value
        (label, type, value) => {
          const gridId = 'test-grid'
          const rowId = 'test-row'
          
          // Clear localStorage before test
          localStorage.clear()
          
          const { customFields, addCustomField, updateCustomField } = useCustomFields({
            gridId,
            rowId
          })
          
          // Add field
          addCustomField(label, type)
          
          // Verify field was added
          expect(customFields.value).toHaveLength(1)
          expect(customFields.value[0].label).toBe(label)
          expect(customFields.value[0].type).toBe(type)
          
          // Update field value
          const fieldId = customFields.value[0].id
          updateCustomField(fieldId, value)
          
          // Read from localStorage
          const storageKey = `custom_fields_${gridId}_${rowId}`
          const stored = JSON.parse(localStorage.getItem(storageKey) || '[]')
          
          // Verify persistence
          expect(stored).toHaveLength(1)
          expect(stored[0].label).toBe(label)
          expect(stored[0].type).toBe(type)
          expect(stored[0].value).toBe(value)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Unit Testing

**Focus Areas:**

1. **useCustomFields Composable**
   - Test adding a field with valid data
   - Test updating a field value
   - Test removing a field
   - Test loading from localStorage
   - Test handling corrupted localStorage data
   - Test empty label rejection
   - Test unique ID generation

2. **GenericDetailPanel Component**
   - Test rendering with no custom fields
   - Test rendering with existing custom fields
   - Test add field form display/hide
   - Test field deletion
   - Test inline editing of custom fields
   - Test configuration application (icon, title, subtitle, columns)
   - Test editable vs non-editable field rendering

3. **Integration Tests**
   - Test full flow: add field → edit value → save → reload → verify
   - Test multiple fields on same row
   - Test fields on different rows don't interfere
   - Test fields on different grids don't interfere

**Example Unit Test:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GenericDetailPanel from '@/components/grid/GenericDetailPanel.vue'

describe('GenericDetailPanel', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  
  it('should display add custom field button', () => {
    const wrapper = mount(GenericDetailPanel, {
      props: {
        row: { id: '1', name: 'Test' },
        rowId: '1',
        gridId: 'test-grid',
        columns: []
      }
    })
    
    expect(wrapper.find('[data-test="add-custom-field-btn"]').exists()).toBe(true)
  })
  
  it('should show add field form when button clicked', async () => {
    const wrapper = mount(GenericDetailPanel, {
      props: {
        row: { id: '1', name: 'Test' },
        rowId: '1',
        gridId: 'test-grid',
        columns: []
      }
    })
    
    await wrapper.find('[data-test="add-custom-field-btn"]').trigger('click')
    
    expect(wrapper.find('[data-test="add-field-form"]').exists()).toBe(true)
  })
  
  it('should reject empty field labels', async () => {
    const wrapper = mount(GenericDetailPanel, {
      props: {
        row: { id: '1', name: 'Test' },
        rowId: '1',
        gridId: 'test-grid',
        columns: []
      }
    })
    
    await wrapper.find('[data-test="add-custom-field-btn"]').trigger('click')
    await wrapper.find('[data-test="field-label-input"]').setValue('   ')
    await wrapper.find('[data-test="add-field-submit"]').trigger('click')
    
    // Field should not be added
    expect(wrapper.findAll('[data-test="custom-field"]')).toHaveLength(0)
  })
})
```

### Test Coverage Goals

- **Line Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%
- **Function Coverage**: Minimum 85%

### Testing Priorities

**High Priority (Must Test):**
1. Custom fields persistence (Properties 3, 4, 5)
2. Storage key namespacing (Property 6)
3. Field editability enforcement (Property 7)
4. Cross-grid consistency (Property 21)
5. Permission-based UI hiding (Property 20)

**Medium Priority (Should Test):**
1. Column visibility state consistency (Property 1)
2. Bulk operation cleanup (Property 11)
3. Search and filter accuracy (Properties 14, 15)
4. Row expansion behavior (Properties 17, 18, 19)

**Low Priority (Nice to Test):**
1. Visual layout properties (Properties 24, 25)
2. Configuration application (Property 22)
3. UI state indicators

### Manual Testing Checklist

Some aspects require manual verification:

- [ ] Visual consistency between GenericDetailPanel and EmployeeDetailPanel
- [ ] Hover states on editable fields
- [ ] Responsive grid layout at different screen sizes
- [ ] Accessibility (keyboard navigation, screen readers)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Performance with large numbers of custom fields (50+)
- [ ] localStorage quota handling in different browsers

### Performance Testing

**Scenarios to Test:**

1. **Large Number of Custom Fields**: Test with 50+ custom fields per row
2. **Rapid Add/Remove**: Test adding and removing fields quickly
3. **Multiple Rows**: Test with 100+ rows each having custom fields
4. **localStorage Size**: Test approaching browser storage limits

**Performance Targets:**

- Adding a custom field: < 100ms
- Loading custom fields: < 50ms
- Saving a field value: < 100ms
- Rendering detail panel with 50 fields: < 500ms

## Migration Strategy

### Phase 1: Enhance GenericDetailPanel

1. Create `useCustomFields` composable
2. Add custom fields section to GenericDetailPanel
3. Add styling to match EmployeeDetailPanel
4. Write unit tests for composable
5. Write property tests for persistence

### Phase 2: Update Grid Configurations

1. Ensure both grids use GenericDetailPanel
2. Configure detail panel for each grid (icon, title field, etc.)
3. Test custom fields on both grids
4. Verify storage key namespacing works

### Phase 3: Deprecate EmployeeDetailPanel

1. Move EmployeeDetailPanel to examples folder (already done)
2. Update documentation to reference GenericDetailPanel
3. Remove any remaining references to EmployeeDetailPanel

### Phase 4: Testing and Validation

1. Run full test suite
2. Perform manual testing checklist
3. Test cross-browser compatibility
4. Performance testing
5. User acceptance testing

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate**: Revert to previous version using git
2. **Short-term**: Fix critical bugs in hotfix branch
3. **Long-term**: Address root causes and re-deploy

**Rollback Triggers:**
- Custom fields not persisting correctly
- Data loss or corruption
- Performance degradation > 50%
- Critical accessibility issues
- Cross-browser compatibility failures

## Success Metrics

**Functional Metrics:**
- All property tests passing (100% pass rate)
- Unit test coverage > 80%
- Zero data loss incidents
- Zero localStorage corruption incidents

**User Experience Metrics:**
- Custom fields feature adoption > 50% of users
- Average custom fields per row: 2-5
- User satisfaction score > 4/5

**Performance Metrics:**
- Detail panel load time < 500ms
- Custom field operations < 100ms
- No performance regressions vs. current implementation

## Future Enhancements

Potential improvements for future iterations:

1. **Backend Persistence**: Move custom fields from localStorage to backend database
2. **Field Validation**: Add validation rules for custom fields (required, min/max, regex)
3. **Field Templates**: Allow users to create reusable field templates
4. **Bulk Field Operations**: Add/remove custom fields across multiple rows
5. **Field Import/Export**: Export custom field definitions and import to other rows
6. **Rich Field Types**: Support for rich text, file upload, multi-select
7. **Field Permissions**: Control which users can add/edit custom fields
8. **Field History**: Track changes to custom field values over time
