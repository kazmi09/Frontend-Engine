# Expandable Rows / Nested Detail Panels - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Breakdown](#component-breakdown)
4. [Data Flow](#data-flow)
5. [Code Walkthrough](#code-walkthrough)
6. [How to Use](#how-to-use)
7. [Customization Guide](#customization-guide)

---

## Overview

The expandable rows feature allows users to click a chevron icon next to each row in the data grid to expand/collapse a detail panel showing additional information. The expanded panel supports:
- ✅ Inline editing with persistence
- ✅ Compact, responsive UI
- ✅ Keyboard navigation
- ✅ Permission-based access control
- ✅ Single or multiple row expansion modes
- ✅ Lazy loading support
- ✅ Accessibility (ARIA attributes)

---

## Architecture

### High-Level Flow
```
User clicks chevron → ExpanderCell emits event → DataGrid handles toggle 
→ TanStack Table updates state → Store syncs state → DetailPanel renders
```

### Key Technologies
- **TanStack Table v8**: Manages table state and expansion logic
- **Pinia Store**: Centralized state management for expanded rows
- **Vue 3 Composition API**: Reactive components
- **Quasar Framework**: UI components

### File Structure
```
client/src/
├── components/grid/
│   ├── DataGrid.vue                    # Main grid component
│   ├── EmployeeDetailPanel.vue         # Custom detail panel content
│   └── cells/
│       ├── ExpanderCell.vue            # Chevron button component
│       └── DetailPanel.vue             # Detail panel wrapper
├── lib/
│   ├── grid/
│   │   ├── store.ts                    # Pinia store for grid state
│   │   └── types.ts                    # TypeScript interfaces
│   └── api/
│       └── employee_local.ts           # API with expandable config
└── composables/
    └── useGridUpdate.ts                # Mutation hook for updates
```

---

## Component Breakdown

### 1. ExpanderCell.vue
**Purpose**: Renders the chevron button that toggles row expansion

**Key Features**:
- Shows chevron_right when collapsed, expand_more when expanded
- Emits `toggle` event with rowId
- Accessible with ARIA attributes
- Keyboard support (Enter, Space)

**Props**:
```typescript
{
  rowId: string;        // Unique identifier for the row
  canExpand: boolean;   // Whether this row can be expanded
}
```

**Events**:
```typescript
{
  toggle: [rowId: string];  // Emitted when user clicks chevron
}
```

**Code Highlights**:
```vue
<button
  @click.stop="handleToggle"
  :aria-expanded="isExpanded ? 'true' : 'false'"
>
  <q-icon :name="isExpanded ? 'expand_more' : 'chevron_right'" />
</button>
```

The `.stop` modifier prevents event bubbling to parent row click handlers.

---

### 2. DetailPanel.vue
**Purpose**: Wrapper component that renders the expanded content

**Key Features**:
- Handles loading, error, and content states
- Supports lazy loading
- Renders custom component or slot content
- Animated slide-down effect

**Props**:
```typescript
{
  row: any;                           // Row data
  rowId: string;                      // Row identifier
  columnCount: number;                // Number of columns (for colspan)
  expandableConfig: ExpandableConfig; // Configuration object
}
```

**Expandable Config Interface**:
```typescript
interface ExpandableConfig {
  renderer: Component | string;              // Component to render
  requiredPermissions?: string[];            // User roles allowed
  canExpand?: (row: any) => boolean;        // Function to check if row can expand
  singleExpand?: boolean;                    // Only one row expanded at a time
  defaultExpanded?: string[];                // Row IDs to expand by default
  lazyLoad?: (row: any, rowId: string) => Promise<any>; // Async data loading
}
```

**Code Highlights**:
```vue
<tr class="detail-panel-row">
  <td :colspan="columnCount" class="detail-panel-cell">
    <!-- Loading State -->
    <div v-if="isLoading">Loading...</div>
    
    <!-- Error State -->
    <div v-else-if="error">{{ error }}</div>
    
    <!-- Content -->
    <component v-else :is="rendererComponent" :row="row" :rowId="rowId" />
  </td>
</tr>
```

---

### 3. EmployeeDetailPanel.vue
**Purpose**: Custom content component showing employee details with inline editing

**Key Features**:
- Compact 3-column grid layout
- Inline editing for 5 fields (email, department, job_title, salary, hire_date)
- Uses `useGridUpdate` composable for persistence
- Visual feedback (hover effects, edit icons, saving indicator)
- Keyboard shortcuts (Enter to save, Escape to cancel)

**Props**:
```typescript
{
  row: any;      // Employee data
  rowId: string; // Employee ID
  data?: any;    // Optional lazy-loaded data
}
```

**Editable Fields**:
1. **Email** - Text input with email validation
2. **Department** - Text input with badge display
3. **Job Title** - Text input
4. **Salary** - Number input with currency formatting
5. **Hire Date** - Date input with formatted display

**Editing Flow**:
```typescript
// 1. User clicks field
startEdit('email')
  → editingField.value = 'email'
  → editValues.email = row.email
  → Focus input

// 2. User types and presses Enter
saveField('email')
  → Validate value hasn't changed
  → Call updateMutation.mutateAsync()
  → Update row data
  → Cancel edit mode

// 3. Changes persist to database via API
```

**Code Highlights**:
```vue
<div class="field-value editable" @click="startEdit('email')">
  <template v-if="editingField === 'email'">
    <input
      v-model="editValues.email"
      @blur="saveField('email')"
      @keydown.enter="saveField('email')"
      @keydown.escape="cancelEdit"
    />
  </template>
  <template v-else>
    <span>{{ row.email }}</span>
    <q-icon name="edit" class="edit-icon" />
  </template>
</div>
```

---

### 4. DataGrid.vue
**Purpose**: Main grid component that orchestrates everything

**Key Responsibilities**:
1. Configure TanStack Table with expansion support
2. Render ExpanderCell in first column
3. Render DetailPanel below expanded rows
4. Handle expansion toggle events
5. Sync TanStack Table state with Pinia store

**TanStack Table Configuration**:
```typescript
const table = useVueTable({
  data: computed(() => props.data?.rows || []),
  columns: columns.value,
  
  // State binding
  state: {
    expanded: expandedRows.value,  // Bind to Pinia store
    // ... other state
  },
  
  // Callbacks
  onExpandedChange: (updater) => {
    // Sync TanStack Table state → Pinia store
  },
  
  // Row models
  getCoreRowModel: getCoreRowModel(),
  getExpandedRowModel: getExpandedRowModel(),
  
  // Configuration
  getRowId: (row) => row.id,  // Tell TanStack how to identify rows
  enableExpanding: true,
})
```

**Column Definition with Expander**:
```typescript
const columns = computed(() => {
  const cols = []
  
  // Add expander column if config exists
  if (props.data.expandable && hasExpandPermission.value) {
    cols.push({
      id: "expander",
      header: "",
      cell: ({ row }) => row.original,
      size: 50,
      enableSorting: false,
    })
  }
  
  // ... other columns
  return cols
})
```

**Template Structure**:
```vue
<tbody>
  <template v-for="row in table.getRowModel().rows" :key="row.id">
    <!-- Main Row -->
    <tr>
      <td v-for="cell in row.getVisibleCells()">
        <!-- Expander Cell -->
        <ExpanderCell
          v-if="cell.column.id === 'expander'"
          :row-id="row.original.id"
          @toggle="handleToggleExpansion"
        />
        <!-- Other cells... -->
      </td>
    </tr>
    
    <!-- Detail Panel Row (conditionally rendered) -->
    <template v-if="row.getIsExpanded?.()">
      <DetailPanel
        :row="row.original"
        :row-id="row.original.id"
        :column-count="row.getVisibleCells().length"
        :expandable-config="props.data.expandable!"
      />
    </template>
  </template>
</tbody>
```

**Toggle Handler**:
```typescript
const handleToggleExpansion = (rowId: string) => {
  // Find row in TanStack Table
  const tableRows = table.getRowModel().rows
  const targetRow = tableRows.find(r => r.original.id === rowId)
  
  if (targetRow) {
    // Handle single expand mode
    if (props.data?.expandable?.singleExpand && !targetRow.getIsExpanded?.()) {
      gridStore.collapseAllRows()
    }
    
    // Toggle using TanStack Table API
    targetRow.toggleExpanded()
  }
}
```

**State Synchronization**:
```typescript
onExpandedChange: (updater) => {
  // Get new state from TanStack Table
  let newState = typeof updater === 'function' 
    ? updater(expandedRows.value) 
    : updater
  
  // Get previously expanded rows
  const previouslyExpanded = Object.keys(expandedRows.value)
  
  // Update store for all rows in new state
  Object.keys(newState).forEach(rowId => {
    if (newState[rowId]) {
      gridStore.expandRow(rowId)
    } else {
      gridStore.collapseRow(rowId)
    }
  })
  
  // Collapse rows not in new state
  previouslyExpanded.forEach(rowId => {
    if (!(rowId in newState)) {
      gridStore.collapseRow(rowId)
    }
  })
}
```

---

### 5. Grid Store (store.ts)
**Purpose**: Centralized state management for expansion

**State**:
```typescript
{
  expandedRows: Record<string, boolean>,     // { "row-1": true, "row-2": false }
  detailPanelData: DetailPanelState,         // Lazy-loaded data per row
}
```

**Actions**:
```typescript
// Expand a single row
expandRow(rowId: string) {
  expandedRows.value = { ...expandedRows.value, [rowId]: true }
}

// Collapse a single row
collapseRow(rowId: string) {
  expandedRows.value = { ...expandedRows.value, [rowId]: false }
}

// Toggle row expansion
toggleRowExpansion(rowId: string) {
  const newExpandedRows = { ...expandedRows.value }
  newExpandedRows[rowId] = !newExpandedRows[rowId]
  expandedRows.value = newExpandedRows
}

// Expand multiple rows
expandAllRows(rowIds: string[]) {
  const newExpandedRows = { ...expandedRows.value }
  rowIds.forEach(id => { newExpandedRows[id] = true })
  expandedRows.value = newExpandedRows
}

// Collapse all rows
collapseAllRows() {
  expandedRows.value = {}
}

// Cleanup invalid row IDs (on pagination/data change)
cleanupExpandedRows(validRowIds: string[]) {
  const validSet = new Set(validRowIds)
  Object.keys(expandedRows.value).forEach(id => {
    if (!validSet.has(id)) {
      delete expandedRows.value[id]
      delete detailPanelData.value[id]
    }
  })
}
```

---

### 6. API Configuration (employee_local.ts)
**Purpose**: Configure expandable behavior for the employee grid

**Configuration**:
```typescript
export const employeeLocalApi = {
  getAll: async (...params): Promise<DataResult> => {
    const response = await fetch(url)
    const result = await response.json()
    
    // Add expandable configuration
    result.expandable = {
      renderer: EmployeeDetailPanel,                    // Component to render
      requiredPermissions: ['admin', 'editor', 'viewer'], // All roles
      canExpand: () => true,                            // All rows expandable
      // Optional:
      // singleExpand: true,                            // Only one at a time
      // defaultExpanded: ['1', '2'],                   // Pre-expand rows
      // lazyLoad: async (row, rowId) => { ... }       // Load data on expand
    }
    
    return result
  }
}
```

---

## Data Flow

### Expansion Flow (User clicks chevron)
```
1. User clicks chevron in ExpanderCell
   ↓
2. ExpanderCell.handleToggle() called
   ↓
3. Emit 'toggle' event with rowId
   ↓
4. DataGrid.handleToggleExpansion(rowId) receives event
   ↓
5. Find row in TanStack Table: table.getRowModel().rows.find(...)
   ↓
6. Call row.toggleExpanded() (TanStack Table API)
   ↓
7. TanStack Table updates internal state
   ↓
8. TanStack Table calls onExpandedChange callback
   ↓
9. DataGrid syncs state to Pinia store
   ↓
10. Store updates expandedRows reactive ref
   ↓
11. Vue reactivity triggers re-render
   ↓
12. Template checks: v-if="row.getIsExpanded?.()"
   ↓
13. DetailPanel component renders
   ↓
14. EmployeeDetailPanel shows employee details
```

### Collapse Flow (User clicks chevron again)
```
1. User clicks chevron (already expanded)
   ↓
2. Same flow as expansion through step 8
   ↓
9. onExpandedChange receives new state without this rowId
   ↓
10. Store sets expandedRows[rowId] = false
   ↓
11. Vue reactivity triggers re-render
   ↓
12. row.getIsExpanded() returns false
   ↓
13. DetailPanel is removed from DOM
```

### Edit Flow (User edits field in detail panel)
```
1. User clicks editable field in EmployeeDetailPanel
   ↓
2. startEdit(fieldName) called
   ↓
3. editingField.value = fieldName
   ↓
4. Input field renders and focuses
   ↓
5. User types new value
   ↓
6. User presses Enter or clicks outside
   ↓
7. saveField(fieldName) called
   ↓
8. Call updateMutation.mutateAsync({ rowId, columnId, value })
   ↓
9. useGridUpdate composable sends PATCH request
   ↓
10. Server updates database
   ↓
11. Response returns updated data
   ↓
12. TanStack Query invalidates cache
   ↓
13. Grid refetches data
   ↓
14. UI updates with new value
```

---

## Code Walkthrough

### Step 1: Configure Expandable in API
```typescript
// client/src/lib/api/employee_local.ts
result.expandable = {
  renderer: EmployeeDetailPanel,
  requiredPermissions: ['admin', 'editor', 'viewer'],
  canExpand: () => true,
}
```

### Step 2: DataGrid Adds Expander Column
```typescript
// client/src/components/grid/DataGrid.vue
const columns = computed(() => {
  const cols = []
  
  if (props.data.expandable && hasExpandPermission.value) {
    cols.push({
      id: "expander",
      header: "",
      cell: ({ row }) => row.original,
      size: 50,
    })
  }
  
  // ... other columns
  return cols
})
```

### Step 3: TanStack Table Configuration
```typescript
const table = useVueTable({
  // Bind expanded state to Pinia store
  state: {
    get expanded() {
      return expandedRows.value
    },
  },
  
  // Sync TanStack → Pinia
  onExpandedChange: (updater) => {
    let newState = typeof updater === 'function' 
      ? updater(expandedRows.value) 
      : updater
    
    // Update store for each row
    Object.keys(newState).forEach(rowId => {
      if (newState[rowId]) {
        gridStore.expandRow(rowId)
      } else {
        gridStore.collapseRow(rowId)
      }
    })
    
    // Collapse rows not in new state
    Object.keys(expandedRows.value).forEach(rowId => {
      if (!(rowId in newState)) {
        gridStore.collapseRow(rowId)
      }
    })
  },
  
  // Enable expansion
  getExpandedRowModel: getExpandedRowModel(),
  enableExpanding: true,
  getRowId: (row) => row.id,
})
```

### Step 4: Render Expander Cell
```vue
<!-- client/src/components/grid/DataGrid.vue -->
<td v-for="cell in row.getVisibleCells()">
  <ExpanderCell
    v-if="cell.column.id === 'expander'"
    :row-id="row.original.id"
    :can-expand="canExpandRow(row)"
    @toggle="handleToggleExpansion"
  />
</td>
```

### Step 5: Handle Toggle Event
```typescript
const handleToggleExpansion = (rowId: string) => {
  const tableRows = table.getRowModel().rows
  const targetRow = tableRows.find(r => r.original.id === rowId)
  
  if (targetRow) {
    // Handle single expand mode
    if (props.data?.expandable?.singleExpand && !targetRow.getIsExpanded?.()) {
      gridStore.collapseAllRows()
    }
    
    // Toggle using TanStack Table API
    targetRow.toggleExpanded()
  }
}
```

### Step 6: Render Detail Panel
```vue
<!-- client/src/components/grid/DataGrid.vue -->
<template v-if="row.getIsExpanded?.()">
  <DetailPanel
    :row="row.original"
    :row-id="row.original.id"
    :column-count="row.getVisibleCells().length"
    :expandable-config="props.data.expandable!"
  />
</template>
```

### Step 7: Detail Panel Renders Content
```vue
<!-- client/src/components/grid/cells/DetailPanel.vue -->
<tr class="detail-panel-row">
  <td :colspan="columnCount">
    <component
      :is="rendererComponent"
      :row="row"
      :rowId="rowId"
      :data="detailData"
    />
  </td>
</tr>
```

### Step 8: Employee Detail Panel Shows Data
```vue
<!-- client/src/components/grid/EmployeeDetailPanel.vue -->
<div class="employee-detail-panel">
  <div class="detail-header">
    <div class="avatar">{{ getInitials(row.first_name, row.last_name) }}</div>
    <h3>{{ row.first_name }} {{ row.last_name }}</h3>
  </div>
  
  <div class="detail-grid">
    <!-- Editable fields -->
    <div class="detail-field" @click="startEdit('email')">
      <label>Email</label>
      <input v-if="editingField === 'email'" v-model="editValues.email" />
      <span v-else>{{ row.email }}</span>
    </div>
    <!-- ... more fields -->
  </div>
</div>
```

---

## How to Use

### Basic Usage
1. **View the grid** - Chevron icons appear in the first column
2. **Click chevron** - Row expands to show detail panel
3. **Click again** - Row collapses
4. **Edit fields** - Click any field in the detail panel to edit
5. **Save changes** - Press Enter or click outside to save

### Keyboard Shortcuts
- **Enter/Space** on chevron - Toggle expansion
- **Enter** in edit field - Save changes
- **Escape** in edit field - Cancel editing

### Permission Control
Only users with specified roles can expand rows:
```typescript
result.expandable = {
  requiredPermissions: ['admin', 'editor'], // Only admin and editor
}
```

### Single Expand Mode
Only one row can be expanded at a time:
```typescript
result.expandable = {
  singleExpand: true,
}
```

### Default Expanded Rows
Pre-expand specific rows on load:
```typescript
result.expandable = {
  defaultExpanded: ['1', '2', '3'],
}
```

### Lazy Loading
Load data only when row is expanded:
```typescript
result.expandable = {
  lazyLoad: async (row, rowId) => {
    const response = await fetch(`/api/employee/${rowId}/details`)
    return response.json()
  },
}
```

---

## Customization Guide

### Create Custom Detail Panel

1. **Create new component**:
```vue
<!-- client/src/components/grid/MyCustomDetailPanel.vue -->
<template>
  <div class="my-custom-panel">
    <h3>{{ row.name }}</h3>
    <p>{{ row.description }}</p>
    <!-- Your custom content -->
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  row: any
  rowId: string
  data?: any
}>()
</script>
```

2. **Configure in API**:
```typescript
import MyCustomDetailPanel from '@/components/grid/MyCustomDetailPanel.vue'

result.expandable = {
  renderer: MyCustomDetailPanel,
}
```

### Add More Editable Fields

1. **Add field to template**:
```vue
<div class="detail-field">
  <label>Phone</label>
  <div class="field-value editable" @click="startEdit('phone')">
    <template v-if="editingField === 'phone'">
      <input
        ref="phoneInput"
        v-model="editValues.phone"
        @blur="saveField('phone')"
        @keydown.enter="saveField('phone')"
        @keydown.escape="cancelEdit"
      />
    </template>
    <template v-else>
      <span>{{ row.phone }}</span>
      <q-icon name="edit" class="edit-icon" />
    </template>
  </div>
</div>
```

2. **Add ref**:
```typescript
const phoneInput = ref<HTMLInputElement>()
```

3. **Update startEdit**:
```typescript
const startEdit = (fieldName: string) => {
  editingField.value = fieldName
  editValues[fieldName] = props.row[fieldName]
  
  nextTick(() => {
    const inputRef = {
      email: emailInput,
      phone: phoneInput, // Add here
      // ... other fields
    }[fieldName]
    
    inputRef?.value?.focus()
  })
}
```

### Conditional Row Expansion

Only allow certain rows to expand:
```typescript
result.expandable = {
  canExpand: (row) => {
    // Only expand rows with salary > 50000
    return row.salary > 50000
  },
}
```

### Custom Styling

Override styles in your detail panel component:
```vue
<style scoped>
.my-custom-panel {
  background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: white;
}
</style>
```

---

## Key Concepts

### Why TanStack Table + Pinia?
- **TanStack Table**: Handles complex table logic (sorting, pagination, expansion)
- **Pinia Store**: Provides reactive state accessible across components
- **Sync Pattern**: TanStack Table is source of truth, Pinia mirrors it for Vue reactivity

### Why getRowId is Critical
```typescript
getRowId: (row) => row.id
```
Without this, TanStack Table uses array indices as row IDs, which breaks when:
- Data is sorted
- Pagination changes
- Rows are filtered

### Why onExpandedChange is Complex
TanStack Table can:
1. Pass a function updater: `(oldState) => newState`
2. Pass direct state: `{ "row-1": true }`
3. Remove rows from state entirely (not set to false)

Our handler must handle all three cases to properly sync with Pinia.

### Why .stop on Click Handler
```vue
<button @click.stop="handleToggle">
```
Without `.stop`, the click event bubbles to the parent `<tr>`, which might have its own click handler (e.g., row selection).

---

## Troubleshooting

### Chevron doesn't appear
- Check `expandable` config exists in API response
- Verify user has required permissions
- Check console for errors

### Clicking chevron does nothing
- Check `getRowId` is configured
- Verify `enableExpanding: true` in table config
- Check `onExpandedChange` callback is working

### Detail panel doesn't show
- Check `row.getIsExpanded()` returns true
- Verify `DetailPanel` component is rendered
- Check `expandedRows` state in Vue DevTools

### Edits don't persist
- Verify `useGridUpdate` composable is working
- Check API endpoint is correct
- Check network tab for PATCH requests
- Verify server is updating database

### State gets out of sync
- Check `cleanupExpandedRows` is called on pagination
- Verify `onExpandedChange` handles all cases
- Check for race conditions in async operations

---

## Performance Considerations

### Lazy Loading
For expensive data, use lazy loading:
```typescript
lazyLoad: async (row, rowId) => {
  // Only fetch when row expands
  return await fetchDetailData(rowId)
}
```

### Cleanup on Pagination
Always cleanup expanded rows when page changes:
```typescript
watch(pageIndex, () => {
  const validRowIds = props.data.rows.map(r => r.id)
  gridStore.cleanupExpandedRows(validRowIds)
})
```

### Virtualization
For very large datasets, consider virtual scrolling (not yet implemented).

---

## Summary

The expandable rows feature is built on:
1. **TanStack Table** - Manages expansion state and row models
2. **Pinia Store** - Provides reactive state for Vue components
3. **ExpanderCell** - Chevron button that triggers expansion
4. **DetailPanel** - Wrapper that renders expanded content
5. **EmployeeDetailPanel** - Custom content with inline editing
6. **DataGrid** - Orchestrates everything and syncs state

The key to making it work is proper state synchronization between TanStack Table and Pinia, using the `onExpandedChange` callback to mirror TanStack's state into the reactive Pinia store.
