# Group Customization Guide

## Overview

The data grid now supports dataset-agnostic group customization, allowing users to customize individual groups with custom colors, labels, and metadata. Customizations persist across browser sessions and work with any dataset.

## Features

- **Custom Colors**: Apply background colors to group headers
- **Custom Labels**: Override default group labels with custom text
- **Metadata/Notes**: Add notes or descriptions to groups
- **Persistent Storage**: Customizations are saved to localStorage
- **Dataset Agnostic**: Works with any dataset (users, products, orders, etc.)
- **Zero Configuration**: Already integrated into the DataGrid component

## How to Use

### For End Users

1. **Group your data**: Click the "Group By" button in the toolbar and select one or more columns to group by

2. **Customize a group**: 
   - Hover over any group header row
   - Click the three-dot menu icon (⋮) that appears on the right
   - Select "Customize Group"

3. **In the customization dialog**:
   - **Background Color**: Pick a color or enter a hex code (e.g., #E3F2FD)
   - **Custom Label**: Enter a custom label to display instead of the default
   - **Metadata/Notes**: Add notes or descriptions for the group

4. **Save or Reset**:
   - Click "Save" to apply your customization
   - Click "Reset" to remove customization and return to defaults
   - Click "Cancel" to close without changes

### Examples

#### Example 1: Color-code departments
```
Group by: Department
- Engineering → Blue background (#E3F2FD)
- Sales → Green background (#E8F5E9)
- Marketing → Purple background (#F3E5F5)
```

#### Example 2: Add custom labels
```
Group by: Status
- "active" → Custom label: "✓ Active Users"
- "inactive" → Custom label: "⏸ Inactive Users"
- "pending" → Custom label: "⏳ Pending Approval"
```

#### Example 3: Add metadata
```
Group by: Priority
- "high" → Metadata: "Requires immediate attention - escalate to manager"
- "medium" → Metadata: "Standard processing time: 2-3 days"
- "low" → Metadata: "Process when resources available"
```

## Technical Implementation

### Architecture

The customization system is built as a pure extension with zero modifications to existing components:

```
DataGrid (existing)
    ↓ uses
GroupCustomizationMenu (existing)
    ↓ triggers
Grid Store (updated)
    ↓ delegates to
Customization Store (new)
    ↓ persists to
LocalStorage Service (new)
```

### Key Components

1. **Customization Store** (`stores/customization.ts`)
   - Pinia store managing all customizations
   - Handles save, load, delete, and reset operations
   - Persists to localStorage automatically

2. **LocalStorage Service** (`services/localStorage.ts`)
   - Handles serialization and deserialization
   - Error handling for quota exceeded and corrupted data

3. **Key Encoding Utilities** (`utils/customization-key.ts`)
   - Encodes customization keys: `{datasetId}:{columnName}:{groupValue}`
   - Handles special characters and null values

4. **useGroupCustomization Composable** (`composables/useGroupCustomization.ts`)
   - Provides reactive access to customizations
   - Returns computed properties for color, label, style
   - Provides save and remove functions

### Data Structure

Customizations are stored with a composite key:

```typescript
{
  datasetId: "users",      // Dataset identifier
  columnName: "department", // Grouping column
  groupValue: "Engineering" // Group value
}
```

This ensures complete dataset independence - the same customization logic works for any dataset.

### Storage Format

LocalStorage key: `grid-customizations`

```json
[
  [
    "users:department:Engineering",
    {
      "key": {
        "datasetId": "users",
        "columnName": "department",
        "groupValue": "Engineering"
      },
      "color": "#E3F2FD",
      "label": "Engineering Team",
      "metadata": "Core development team",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
]
```

## For Developers

### Using the Composable (Optional)

If you want to add customization to a custom component:

```vue
<script setup lang="ts">
import { useGroupCustomization } from '@/composables/useGroupCustomization';

const props = defineProps<{
  datasetId: string;
  columnName: string;
  groupValue: string;
}>();

// Get reactive customization data
const { color, label, style, save, remove } = useGroupCustomization(
  props.datasetId,
  props.columnName,
  props.groupValue
);

// Use in template
</script>

<template>
  <div :style="style">
    <span>{{ label }}</span>
  </div>
</template>
```

### Accessing the Store Directly

```typescript
import { useCustomizationStore } from '@/stores/customization';

const store = useCustomizationStore();

// Get all customizations
const all = store.allCustomizations;

// Get customizations for a dataset
const userCustomizations = store.customizationsByDataset('users');

// Save a customization
store.saveCustomization(
  { datasetId: 'users', columnName: 'role', groupValue: 'admin' },
  { color: '#FF5722', label: 'Administrators' }
);

// Delete a customization
store.deleteCustomization(
  { datasetId: 'users', columnName: 'role', groupValue: 'admin' }
);

// Reset all customizations for a dataset
store.resetCustomizations('users');

// Reset all customizations globally
store.resetCustomizations();
```

## Edge Cases Handled

1. **Null Values**: Groups with null values can be customized (stored as `__NULL__`)
2. **Empty Strings**: Treated as distinct from null
3. **Special Characters**: Properly encoded using `encodeURIComponent`
4. **localStorage Quota**: Gracefully handles quota exceeded errors
5. **Corrupted Data**: Clears invalid data and continues operation

## Benefits

- **Zero Configuration**: Works out of the box with existing grids
- **Dataset Agnostic**: Same code works for any dataset
- **Persistent**: Survives page refreshes
- **Type Safe**: Full TypeScript support
- **Reactive**: Vue 3 reactivity ensures UI updates automatically
- **Non-Invasive**: No modifications to existing components

## Future Enhancements

Potential future features:
- Export/import customizations
- Share customizations between users
- Backend persistence (instead of localStorage)
- Bulk customization operations
- Customization templates
- Group-level permissions

## Troubleshooting

### Customizations not persisting
- Check browser console for localStorage errors
- Verify localStorage is enabled in browser
- Check if quota is exceeded (clear old data)

### Customizations not appearing
- Ensure grouping is enabled for the dataset
- Check that the group value matches exactly
- Verify the customization store is initialized in main.ts

### Performance issues
- LocalStorage operations are synchronous but fast
- Customizations are loaded once on app startup
- No performance impact on grid rendering
