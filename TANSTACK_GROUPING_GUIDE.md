# TanStack Table Native Grouping Implementation

## Overview
Implemented enterprise-grade grouping using TanStack Table's built-in grouping features. This provides hierarchical row grouping with aggregations, working seamlessly with existing features like virtualization, pagination, sorting, and filtering.

## Architecture

### TanStack Table Grouping
Instead of custom data transformation, we leverage TanStack Table's native grouping:
- **getGroupedRowModel()**: Automatically groups rows based on `grouping` state
- **Row.getIsGrouped**: Identifies group header rows
- **Cell.getIsAggregated()**: Identifies aggregated cells
- **Cell.getIsPlaceholder()**: Identifies placeholder cells for grouped columns
- **Row.depth**: Provides nesting level for indentation

## Implementation Details

### 1. DataGrid.vue Changes

#### Table Configuration
```typescript
// Enable grouping in table options
enableGrouping: true,
manualGrouping: false, // Let TanStack handle grouping
groupedColumnMode: false, // Don't hide grouped columns

// Add grouped row model
getGroupedRowModel: getGroupedRowModel(),

// Enable grouping per column
enableGrouping: true,
aggregationFn: col.type === 'number' ? 'mean' : 'count',
```

#### State Management
```typescript
// Grouping state from store
state: {
  get grouping() {
    return grouping.value // e.g., ["university", "role"]
  }
}

// Handle grouping changes
onGroupingChange: (updater) => {
  const newGrouping = typeof updater === 'function' 
    ? updater(grouping.value) 
    : updater
  gridStore.setGrouping(newGrouping)
}
```

#### Row Rendering
```vue
<!-- Group Header Row -->
<tr v-if="row.getIsGrouped" @click="row.toggleExpanded()">
  <td :colspan="columns.length" :style="{ paddingLeft: `${row.depth * 2 + 1}rem` }">
    <q-icon :name="row.getIsExpanded() ? 'expand_more' : 'chevron_right'" />
    <span>{{ row.groupingColumnId }}: {{ row.groupingValue }}</span>
    <q-badge :label="row.subRows.length" />
    
    <!-- Aggregated values -->
    <div v-for="cell in row.getVisibleCells().filter(c => c.getIsAggregated())">
      {{ cell.column.columnDef.header }}: {{ cell.getValue() }}
    </div>
  </td>
</tr>

<!-- Data Row -->
<tr v-else-if="!row.getIsGrouped">
  <td v-for="cell in row.getVisibleCells()">
    <!-- Aggregated Cell -->
    <span v-if="cell.getIsAggregated()">{{ cell.getValue() }}</span>
    
    <!-- Placeholder Cell (grouped column) -->
    <template v-else-if="cell.getIsPlaceholder()"></template>
    
    <!-- Regular Cell -->
    <EditableCell v-else :value="cell.getValue()" />
  </td>
</tr>
```

### 2. GridToolbar.vue - Group By Controls

```vue
<q-btn-dropdown label="Group By">
  <q-list>
    <q-item v-for="column in groupableColumns" @click="toggleGrouping(column.id)">
      <q-checkbox :model-value="isGroupedBy(column.id)" />
      <q-item-label>{{ column.label }}</q-item-label>
    </q-item>
    
    <q-separator v-if="hasActiveGrouping" />
    
    <q-item v-if="hasActiveGrouping" @click="clearGrouping">
      <q-item-label class="tw-text-red-600">Clear Grouping</q-item-label>
    </q-item>
  </q-list>
</q-btn-dropdown>
```

### 3. Grid Store - Grouping State

```typescript
interface GridState {
  grouping: string[] // e.g., ["university", "role"]
  groupExpanded: Record<string, boolean> // Not used with TanStack grouping
}

// Actions
setGrouping(fields: string[]) {
  this.grouping = fields
}
```

### 4. Grid Configuration

```typescript
// shared/grid-config.ts
grouping: {
  enabled: true,
  allowMultipleGroups: true,
  collapsible: true,
  showGroupCount: true,
  showGroupSummary: true,
  summaryFields: [
    { field: 'age', aggregation: 'avg', label: 'Avg Age' },
    { field: 'height', aggregation: 'avg', label: 'Avg Height' }
  ]
}
```

## Features

### ✅ Single-Level Grouping
```typescript
grouping: ["university"]
```
**Result:**
```
▶ California Institute of Technology (2)
  Abigail Rivera
  Isabella Anderson
▶ Harvard University (1)
  Avery Perez
```

### ✅ Multi-Level Grouping
```typescript
grouping: ["university", "role"]
```
**Result:**
```
▶ California Institute of Technology
  ▶ user (1)
    Abigail Rivera
  ▶ moderator (1)
    Isabella Anderson
▶ Harvard University
  ▶ admin (1)
    Avery Perez
```

### ✅ Aggregations
- **count**: Number of rows in group
- **mean**: Average of numeric values
- **sum**: Total of numeric values
- **min/max**: Min/max values

### ✅ Visual Hierarchy
- Indentation based on `row.depth`
- Different background colors for group rows
- Expand/collapse icons
- Count badges

### ✅ Integration with Existing Features
- ✅ Virtualized scrolling
- ✅ Server-side pagination
- ✅ Sorting
- ✅ Filtering
- ✅ Column visibility
- ✅ Column resizing
- ✅ Column reordering

## Usage

### Enable Grouping
1. Click "Group By" in toolbar
2. Select columns to group by (e.g., University, then Role)
3. Groups appear automatically

### Interact with Groups
- Click group header to expand/collapse
- View aggregated values in group headers
- Nested groups show hierarchy with indentation

### Clear Grouping
- Click "Clear Grouping" in Group By dropdown
- Or uncheck all grouped columns

## API Response Format

Backend continues to return flat rows:
```json
{
  "rows": [
    {"id": 19, "firstName": "Abigail", "university": "Caltech", "role": "user"},
    {"id": 7, "firstName": "Alexander", "university": "UIUC", "role": "moderator"}
  ],
  "pagination": { "totalRows": 100, "pageIndex": 0, "pageSize": 30 }
}
```

TanStack Table handles grouping client-side automatically.

## Benefits of TanStack Native Grouping

### 1. Performance
- Optimized grouping algorithm
- Efficient row model updates
- Works with virtualization

### 2. Maintainability
- Less custom code
- Standard TanStack API
- Well-documented

### 3. Features
- Built-in aggregations
- Automatic placeholder cells
- Depth tracking
- Expand/collapse state

### 4. Flexibility
- Easy to add new aggregation functions
- Custom cell renderers
- Works with all TanStack features

## Aggregation Functions

### Built-in
- `count`: Count rows
- `mean`: Average
- `sum`: Total
- `min`: Minimum
- `max`: Maximum
- `extent`: [min, max]
- `unique`: Unique values
- `uniqueCount`: Count unique

### Custom
```typescript
aggregationFn: (columnId, leafRows, childRows) => {
  // Custom aggregation logic
  return aggregatedValue
}
```

## Testing Scenarios

### 1. Single Field Grouping
- Group by Gender → See male/female groups
- Group by Role → See admin/moderator/user groups
- Group by University → See university groups

### 2. Multi-Level Grouping
- Group by Gender → Role
- Group by University → Role
- Group by Role → Gender

### 3. Aggregations
- Verify count badges
- Check average age calculations
- Validate sum/min/max values

### 4. Expand/Collapse
- Click group headers
- Verify nested groups expand independently
- Check state persistence

### 5. Integration
- Group + Sort → Verify sorting within groups
- Group + Filter → Verify filtered groups
- Group + Pagination → Verify groups across pages
- Group + Virtualization → Verify smooth scrolling

## Future Enhancements

1. **Drag-to-Group**: Drag column headers to group
2. **Group Sorting**: Sort groups by count or aggregated values
3. **Group Filtering**: Filter to show only certain groups
4. **Persistent State**: Save grouping preferences
5. **Export Grouped Data**: Export with hierarchy
6. **Custom Aggregations**: User-defined aggregation functions
7. **Group Actions**: Bulk operations on groups

## Migration from Custom Grouping

The previous custom grouping implementation has been replaced with TanStack native grouping:

**Before (Custom):**
- Custom `useGrouping` composable
- Manual data transformation
- Custom `GroupHeader` component
- Manual expand/collapse tracking

**After (TanStack Native):**
- Built-in `getGroupedRowModel()`
- Automatic grouping by TanStack
- Standard row rendering with `row.getIsGrouped`
- Built-in expand/collapse via `row.toggleExpanded()`

**Benefits:**
- Less code to maintain
- Better performance
- Standard API
- More features out of the box
