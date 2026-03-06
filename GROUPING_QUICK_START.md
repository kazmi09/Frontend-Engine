# Grouping Quick Start Guide

## For End Users

### How to Group Data

1. **Open any grid** (e.g., Users, Products)

2. **Click "Group By" button** in the toolbar (icon: workspaces)

3. **Select columns to group by**:
   - Check "University" → Groups by university
   - Check "Role" → Adds role as second level
   - Check "Gender" → Adds gender as third level

4. **Interact with groups**:
   - Click group header to expand/collapse
   - View count badges (e.g., "5 users")
   - See aggregated values (e.g., "Avg Age: 28.5")

5. **Clear grouping**:
   - Click "Clear Grouping" in dropdown
   - Or uncheck all columns

---

## For Developers

### Enable Grouping for a New Grid

**Step 1: Add grouping config** (`shared/grid-config.ts`)
```typescript
export const GRID_CONFIGS: Record<string, GridConfig> = {
  myGrid: {
    // ... other config
    grouping: {
      enabled: true,
      allowMultipleGroups: true,
      collapsible: true,
      showGroupCount: true,
      showGroupSummary: true,
      summaryFields: [
        { field: 'price', aggregation: 'sum', label: 'Total' },
        { field: 'quantity', aggregation: 'avg', label: 'Avg Qty' }
      ]
    }
  }
}
```

**Step 2: That's it!** 
The grid automatically:
- Shows "Group By" button
- Enables grouping for all columns
- Handles expand/collapse
- Displays aggregations

### Customize Groupable Columns

**Option 1: All columns groupable** (default)
```vue
<GridToolbar :columns="data?.columns" />
```

**Option 2: Specific columns only**
```vue
<GridToolbar 
  :columns="data?.columns"
  :groupable-columns="['university', 'role', 'gender']"
/>
```

### Custom Aggregations

**In column definition:**
```typescript
{
  id: 'price',
  label: 'Price',
  type: 'number',
  aggregationFn: 'sum' // or 'mean', 'min', 'max', 'count'
}
```

**Custom function:**
```typescript
{
  id: 'status',
  label: 'Status',
  aggregationFn: (columnId, leafRows, childRows) => {
    // Count active items
    return leafRows.filter(row => row.status === 'active').length
  }
}
```

---

## Examples

### Example 1: E-commerce Orders
```typescript
grouping: {
  enabled: true,
  summaryFields: [
    { field: 'total', aggregation: 'sum', label: 'Total Revenue' },
    { field: 'quantity', aggregation: 'sum', label: 'Total Items' },
    { field: 'discount', aggregation: 'avg', label: 'Avg Discount' }
  ]
}
```

**Group by**: Customer → Status
**Result**:
```
▶ John Doe (5 orders) - Total Revenue: $1,250
  ▶ Completed (3)
    Order #1001
    Order #1002
    Order #1003
  ▶ Pending (2)
    Order #1004
    Order #1005
```

### Example 2: Inventory Management
```typescript
grouping: {
  enabled: true,
  summaryFields: [
    { field: 'quantity', aggregation: 'sum', label: 'Total Stock' },
    { field: 'value', aggregation: 'sum', label: 'Total Value' }
  ]
}
```

**Group by**: Category → Warehouse
**Result**:
```
▶ Electronics (150 items) - Total Value: $45,000
  ▶ Warehouse A (80)
    Product A
    Product B
  ▶ Warehouse B (70)
    Product C
    Product D
```

### Example 3: CRM Contacts
```typescript
grouping: {
  enabled: true,
  summaryFields: [
    { field: 'dealValue', aggregation: 'sum', label: 'Pipeline Value' },
    { field: 'lastContact', aggregation: 'max', label: 'Last Activity' }
  ]
}
```

**Group by**: Status → Assigned To
**Result**:
```
▶ Hot Lead (12 contacts) - Pipeline: $250,000
  ▶ Sales Rep A (7)
    Contact 1
    Contact 2
  ▶ Sales Rep B (5)
    Contact 3
    Contact 4
```

---

## Troubleshooting

### Grouping button not showing
- Check `grouping.enabled: true` in grid config
- Verify columns are defined

### Groups not expanding
- Ensure `collapsible: true` in config
- Check browser console for errors

### Aggregations not showing
- Set `showGroupSummary: true`
- Define `summaryFields` in config
- Ensure field types are correct (number for avg/sum)

### Performance issues
- Enable virtualization (automatic for large datasets)
- Limit nesting depth to 3 levels
- Consider server-side grouping for 10,000+ rows

---

## API Reference

### GridConfig.grouping
```typescript
interface GroupingConfig {
  enabled: boolean                    // Enable grouping feature
  allowMultipleGroups?: boolean       // Allow multi-level grouping
  collapsible?: boolean               // Allow expand/collapse
  showGroupCount?: boolean            // Show count badges
  showGroupSummary?: boolean          // Show aggregated values
  summaryFields?: {
    field: string                     // Column to aggregate
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'
    label?: string                    // Display label
  }[]
}
```

### Built-in Aggregations
- `count`: Count rows in group
- `sum`: Sum of numeric values
- `mean` (or `avg`): Average of numeric values
- `min`: Minimum value
- `max`: Maximum value
- `extent`: [min, max] tuple
- `unique`: Array of unique values
- `uniqueCount`: Count of unique values

---

## Best Practices

1. **Limit nesting**: 2-3 levels max for readability
2. **Choose meaningful groups**: Group by categorical fields
3. **Use aggregations**: Show useful summaries (totals, averages)
4. **Test performance**: With realistic data volumes
5. **Consider UX**: Default to collapsed for large groups
6. **Document groups**: Explain grouping options to users

---

## Support

- **Technical Guide**: See `TANSTACK_GROUPING_GUIDE.md`
- **Complete Overview**: See `GROUPING_COMPLETE.md`
- **TanStack Docs**: https://tanstack.com/table/latest/docs/guide/grouping

---

**Happy Grouping!** 🎉
