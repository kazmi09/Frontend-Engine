# How Expandable Rows Functionality Works - Precise Explanation

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA GRID TABLE                              │
├─────────────────────────────────────────────────────────────────────┤
│ [▶] │ ☑ │ John Doe    │ john@email.com │ Engineering │ $75,000    │ ← Row 1 (Collapsed)
├─────────────────────────────────────────────────────────────────────┤
│ [▼] │ ☑ │ Jane Smith  │ jane@email.com │ Sales       │ $65,000    │ ← Row 2 (Expanded)
├─────────────────────────────────────────────────────────────────────┤
│     ┌───────────────────────────────────────────────────────────┐   │
│     │  👤 JS  Jane Smith - Sales Manager                        │   │ ← Detail Panel
│     │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│     │  📧 Email: jane@email.com        [edit icon]              │   │
│     │  🏢 Department: Sales            [edit icon]              │   │
│     │  💼 Job Title: Sales Manager     [edit icon]              │   │
│     │  💰 Salary: $65,000              [edit icon]              │   │
│     │  📅 Hire Date: Jan 15, 2020      [edit icon]              │   │
│     │  ⏱️ Tenure: 4y 0m                                          │   │
│     │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │   │
│     │  [+ Add Custom Field]                                     │   │
│     └───────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│ [▶] │ ☑ │ Bob Johnson │ bob@email.com  │ Marketing   │ $70,000    │ ← Row 3 (Collapsed)
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Execution Flow

### STEP 1: User Clicks Chevron (▶)

**What Happens:**
```
User Action: Click on chevron icon
     ↓
ExpanderCell.vue receives click event
     ↓
handleToggle() function executes
```

**Code in ExpanderCell.vue:**
```vue
<button @click.stop="handleToggle">
  <q-icon :name="isExpanded ? 'expand_more' : 'chevron_right'" />
</button>
```

```typescript
const handleToggle = () => {
  console.log('[EXPANDER CELL] Clicked for rowId:', props.rowId)
  emit('toggle', props.rowId)  // Emit event to parent
}
```

**State at this moment:**
- `isExpanded` = false
- Icon shows: `chevron_right` (▶)
- Event emitted: `toggle` with rowId = "2"

---

### STEP 2: Event Reaches DataGrid

**What Happens:**
```
ExpanderCell emits 'toggle' event
     ↓
DataGrid.vue receives event via @toggle="handleToggleExpansion"
     ↓
handleToggleExpansion(rowId) executes
```

**Code in DataGrid.vue:**
```vue
<ExpanderCell
  :row-id="row.original.id"
  @toggle="handleToggleExpansion"
/>
```

```typescript
const handleToggleExpansion = (rowId: string) => {
  console.log('[DATAGRID] Toggle for rowId:', rowId)
  
  // Find the row in TanStack Table
  const tableRows = table.getRowModel().rows
  const targetRow = tableRows.find(r => r.original.id === rowId)
  
  if (targetRow) {
    // Use TanStack Table's built-in toggle
    targetRow.toggleExpanded()
  }
}
```

**State at this moment:**
- rowId = "2"
- targetRow found in TanStack Table
- About to call `toggleExpanded()`

---

### STEP 3: TanStack Table Updates Internal State

**What Happens:**
```
targetRow.toggleExpanded() called
     ↓
TanStack Table updates its internal expanded state
     ↓
New state: { "2": true }
     ↓
TanStack Table triggers onExpandedChange callback
```

**TanStack Table Internal Process:**
```typescript
// Inside TanStack Table (simplified)
toggleExpanded() {
  const currentState = this.getState().expanded  // {}
  const newState = {
    ...currentState,
    [this.id]: !currentState[this.id]  // { "2": true }
  }
  this.options.onExpandedChange(newState)
}
```

**State at this moment:**
- Old expanded state: `{}`
- New expanded state: `{ "2": true }`
- Callback about to be triggered

---

### STEP 4: State Syncs to Pinia Store

**What Happens:**
```
TanStack Table calls onExpandedChange
     ↓
DataGrid's callback receives new state
     ↓
Updates Pinia store with new expanded state
```

**Code in DataGrid.vue:**
```typescript
onExpandedChange: (updater) => {
  console.log('[TABLE] onExpandedChange called')
  
  // Get new state
  let newState = typeof updater === 'function' 
    ? updater(expandedRows.value) 
    : updater
  
  console.log('[TABLE] New state:', newState)  // { "2": true }
  
  // Update store for each row
  Object.keys(newState).forEach(rowId => {
    if (newState[rowId]) {
      gridStore.expandRow(rowId)  // Expand row 2
    } else {
      gridStore.collapseRow(rowId)
    }
  })
}
```

**Code in store.ts:**
```typescript
const expandRow = (rowId: string) => {
  console.log('[STORE] Expanding row:', rowId)
  expandedRows.value = { 
    ...expandedRows.value, 
    [rowId]: true 
  }
}
```

**State at this moment:**
- Pinia store `expandedRows`: `{ "2": true }`
- Vue reactivity triggered
- Components will re-render

---

### STEP 5: Vue Reactivity Triggers Re-render

**What Happens:**
```
Pinia store updated
     ↓
Vue detects reactive change
     ↓
All components using expandedRows re-render
     ↓
Template conditions re-evaluate
```

**Components that re-render:**

1. **ExpanderCell.vue** - Icon changes
```typescript
const isExpanded = computed(() => 
  gridStore.expandedRows[props.rowId] || false
)
// Now returns: true (for row 2)
```

```vue
<q-icon :name="isExpanded ? 'expand_more' : 'chevron_right'" />
<!-- Now shows: expand_more (▼) -->
```

2. **DataGrid.vue** - Checks if detail panel should render
```vue
<template v-if="row.getIsExpanded?.()">
  <DetailPanel ... />
</template>
<!-- Condition is now TRUE for row 2 -->
```

**State at this moment:**
- Chevron icon changed: ▶ → ▼
- DetailPanel component about to mount

---

### STEP 6: DetailPanel Component Renders

**What Happens:**
```
v-if="row.getIsExpanded?.()" evaluates to true
     ↓
DetailPanel.vue component mounts
     ↓
Receives props: row, rowId, columnCount, expandableConfig
     ↓
Renders content
```

**Code in DataGrid.vue:**
```vue
<template v-if="row.getIsExpanded?.()">
  <DetailPanel
    :row="row.original"
    :row-id="row.original.id"
    :column-count="row.getVisibleCells().length"
    :expandable-config="props.data.expandable!"
  />
</template>
```

**Code in DetailPanel.vue:**
```vue
<tr class="detail-panel-row">
  <td :colspan="columnCount" class="detail-panel-cell">
    <component
      :is="rendererComponent"
      :row="row"
      :rowId="rowId"
    />
  </td>
</tr>
```

**State at this moment:**
- DetailPanel mounted
- About to render EmployeeDetailPanel

---

### STEP 7: EmployeeDetailPanel Shows Content

**What Happens:**
```
DetailPanel renders component
     ↓
EmployeeDetailPanel.vue mounts
     ↓
Loads custom fields from localStorage
     ↓
Displays employee data
```

**Code in EmployeeDetailPanel.vue:**
```typescript
onMounted(() => {
  loadCustomFields()
})

const loadCustomFields = () => {
  const storageKey = `custom_fields_${props.rowId}`
  const stored = localStorage.getItem(storageKey)
  if (stored) {
    customFields.value = JSON.parse(stored)
  }
}
```

**Rendered Output:**
```html
<div class="employee-detail-panel">
  <!-- Header -->
  <div class="detail-header">
    <div class="avatar">JS</div>
    <h3>Jane Smith</h3>
  </div>
  
  <!-- Fields Grid -->
  <div class="detail-grid">
    <div class="detail-field">Email: jane@email.com</div>
    <div class="detail-field">Department: Sales</div>
    <div class="detail-field">Job Title: Sales Manager</div>
    <!-- ... more fields -->
  </div>
  
  <!-- Add Field Button -->
  <button>Add Custom Field</button>
</div>
```

**State at this moment:**
- Row is fully expanded
- Detail panel visible with all data
- User can now interact with fields

---

## Complete State Timeline

```
Time  | Component        | State                          | UI
------|------------------|--------------------------------|------------------
T0    | Initial          | expandedRows: {}               | All rows collapsed
      |                  | row.getIsExpanded(): false     | Chevrons: ▶
------|------------------|--------------------------------|------------------
T1    | User clicks      | Click event fired              | Visual: No change yet
      | ExpanderCell     |                                |
------|------------------|--------------------------------|------------------
T2    | ExpanderCell     | emit('toggle', '2')            | Visual: No change yet
      | emits event      |                                |
------|------------------|--------------------------------|------------------
T3    | DataGrid         | handleToggleExpansion('2')     | Visual: No change yet
      | receives event   | finds targetRow                |
------|------------------|--------------------------------|------------------
T4    | TanStack Table   | toggleExpanded() called        | Visual: No change yet
      | updates          | internal state: {"2": true}    |
------|------------------|--------------------------------|------------------
T5    | onExpandedChange | Callback triggered             | Visual: No change yet
      | callback         | newState: {"2": true}          |
------|------------------|--------------------------------|------------------
T6    | Pinia Store      | expandRow('2') called          | Visual: No change yet
      | updates          | expandedRows: {"2": true}      |
------|------------------|--------------------------------|------------------
T7    | Vue Reactivity   | Change detected                | Re-render starts
      | triggers         | Components marked dirty        |
------|------------------|--------------------------------|------------------
T8    | ExpanderCell     | isExpanded: true               | Chevron: ▶ → ▼
      | re-renders       | Icon changes                   |
------|------------------|--------------------------------|------------------
T9    | DataGrid         | row.getIsExpanded(): true      | DetailPanel appears
      | re-renders       | v-if condition: true           |
------|------------------|--------------------------------|------------------
T10   | DetailPanel      | Component mounts               | Panel slides down
      | mounts           | Receives props                 |
------|------------------|--------------------------------|------------------
T11   | EmployeeDetail   | Component mounts               | Content renders
      | Panel mounts     | Loads custom fields            | Fields visible
------|------------------|--------------------------------|------------------
T12   | Final State      | expandedRows: {"2": true}      | Row 2 expanded
      |                  | row.getIsExpanded(): true      | Detail panel shown
      |                  | UI fully rendered              | User can interact
```

---

## Collapse Flow (User Clicks ▼)

When user clicks the chevron again to collapse:

```
User clicks ▼
     ↓
Same flow as expansion (Steps 1-6)
     ↓
BUT: TanStack Table sets state to {"2": false} or removes "2" from state
     ↓
onExpandedChange receives new state without "2" or {"2": false}
     ↓
Store calls collapseRow('2')
     ↓
expandedRows becomes {} or {"2": false}
     ↓
Vue reactivity triggers
     ↓
ExpanderCell: isExpanded = false → Icon: ▼ → ▶
     ↓
DataGrid: row.getIsExpanded() = false → v-if = false
     ↓
DetailPanel unmounts (removed from DOM)
     ↓
Row is collapsed
```

---

## Key Synchronization Points

### 1. TanStack Table ↔ Pinia Store
```typescript
// TanStack Table is SOURCE OF TRUTH
state: {
  get expanded() {
    return expandedRows.value  // Read from Pinia
  }
}

// Pinia Store MIRRORS TanStack Table
onExpandedChange: (updater) => {
  // Write to Pinia when TanStack changes
  gridStore.expandRow(rowId)
}
```

### 2. Why Both?
- **TanStack Table**: Manages complex table logic (sorting, pagination, expansion)
- **Pinia Store**: Provides Vue reactivity for components
- **Sync Pattern**: TanStack → Pinia (one-way flow)

### 3. Critical Configuration
```typescript
// Tell TanStack how to identify rows
getRowId: (row) => row.id

// Enable expansion feature
enableExpanding: true

// Provide expansion row model
getExpandedRowModel: getExpandedRowModel()
```

Without these, expansion won't work!

---

## Data Structure at Each Layer

### 1. API Response
```typescript
{
  rows: [
    { id: "1", first_name: "John", ... },
    { id: "2", first_name: "Jane", ... },
  ],
  expandable: {
    renderer: EmployeeDetailPanel,
    requiredPermissions: ['admin', 'editor', 'viewer'],
    canExpand: () => true
  }
}
```

### 2. TanStack Table State
```typescript
{
  expanded: {
    "2": true  // Row 2 is expanded
  }
}
```

### 3. Pinia Store State
```typescript
{
  expandedRows: {
    "2": true  // Mirrors TanStack Table
  },
  detailPanelData: {
    "2": {
      data: null,
      loading: false,
      error: null
    }
  }
}
```

### 4. Component Props
```typescript
// ExpanderCell
{
  rowId: "2",
  canExpand: true
}

// DetailPanel
{
  row: { id: "2", first_name: "Jane", ... },
  rowId: "2",
  columnCount: 8,
  expandableConfig: { renderer: EmployeeDetailPanel, ... }
}

// EmployeeDetailPanel
{
  row: { id: "2", first_name: "Jane", ... },
  rowId: "2",
  data: null
}
```

---

## Summary: The Complete Picture

1. **User clicks chevron** → ExpanderCell emits event
2. **DataGrid receives event** → Calls TanStack Table's toggleExpanded()
3. **TanStack Table updates** → Internal state changes
4. **Callback triggers** → onExpandedChange receives new state
5. **Pinia store syncs** → expandedRows updated
6. **Vue reactivity** → Components re-render
7. **UI updates** → Chevron changes, DetailPanel appears
8. **Content renders** → EmployeeDetailPanel shows data

**The magic**: TanStack Table manages the logic, Pinia provides reactivity, Vue renders the UI. All three work together seamlessly through the synchronization pattern in `onExpandedChange`.
