# Debugging Steps for Row ID and Column Visibility Issues

## Summary of Fixes

### Issue 1: Column Visibility Not Persisting ✅ FIXED
**Problem**: When hiding columns via the toolbar dropdown, changes weren't persisting after page refresh.

**Root Cause**: TanStack Table's `onColumnVisibilityChange` handler only fires when the table itself changes visibility internally. When the GridToolbar button changes visibility, it updates the main grid store but doesn't trigger the persistence handler.

**Solution**:
1. Added `columnVisibilityChanged` event emitter in `GridToolbar.vue`
2. Added event handlers in `Dashboard.vue` and `Users.vue` to catch the event
3. Handlers call `gridStateStore.updateColumnVisibility()` to persist to localStorage
4. Used correct gridIds: 'employees' for Dashboard, 'users' for Users page

**Files Modified**:
- `client/src/components/grid/GridToolbar.vue` - Added emit for columnVisibilityChanged
- `client/src/pages/Dashboard.vue` - Added handleColumnVisibilityChanged handler
- `client/src/pages/Users.vue` - Added handleColumnVisibilityChanged handler

### Issue 2: Row IDs Have Suffixes (Custom Fields Not Loading) ✅ FIXED
**Problem**: Row IDs were showing as `1276-97` instead of `1276`, causing custom fields to save with wrong keys and not load after search.

**Root Cause**: TanStack Table's `getRowId` function receives an `index` parameter, and if not handled correctly, the library may append it to the ID.

**Solution**:
1. Updated `getRowId` in `DataGrid.vue` to explicitly accept the `index` parameter
2. Return only the primary key value, ignoring the index
3. Added detailed logging to track row ID generation
4. Ensured server sends correct `primaryKey` field in response
5. Added `gridId` to server response for proper grid identification

**Files Modified**:
- `client/src/components/grid/DataGrid.vue` - Updated getRowId signature and logging
- `server/generic-grid-service.ts` - Improved primaryKey detection and added gridId to response
- `client/src/components/grid/DataGrid.vue` - Added logging for gridId usage

### Issue 3: Grid ID Consistency ✅ FIXED
**Problem**: Grid state was being saved under 'default' instead of the actual grid name.

**Solution**:
1. Server now sends `gridId` in the DataResult
2. DataGrid uses `props.data.gridId` instead of hardcoded 'default'
3. Dashboard and Users pages use correct gridIds ('employees' and 'users')

**Files Modified**:
- `server/generic-grid-service.ts` - Added gridId to response
- `client/src/components/grid/DataGrid.vue` - Use gridId from props
- `client/src/pages/Dashboard.vue` - Use 'employees' gridId
- `client/src/pages/Users.vue` - Use 'users' gridId

## Testing Steps

### 1. Clear localStorage (IMPORTANT - Do this first!)
```javascript
// Open browser DevTools (F12) > Console tab, then run:
localStorage.clear()
// Or manually delete keys in Application > Local Storage
```

### 2. Test Column Visibility Persistence
1. Open the employees grid
2. Click "Columns" dropdown in toolbar
3. Uncheck a column (e.g., "Email")
4. Verify column disappears
5. Refresh the page (F5)
6. ✅ Column should stay hidden
7. Check localStorage: `grid_state_employees` should show `"email": false`

### 3. Test Custom Fields After Search
1. Without searching, find employee ID 1276 (scroll or use pagination)
2. Click the chevron to expand the row
3. Add a custom field: "Phone Number" = "123-456-7890"
4. Close the expanded row
5. Use the search filter: search for "1276" in "Employee ID"
6. Expand the row again
7. ✅ Custom field should appear with the saved value
8. Check console logs - should show:
   ```
   [DataGrid] getRowId - primaryKey: employee_id, row: {...}, index: 0, rowId: "1276"
   [useCustomFields] Loading custom fields with key: custom_fields_employees_1276
   ```
9. Check localStorage: key should be `custom_fields_employees_1276` (no suffix!)

## Expected Console Output

### Column Visibility Change:
```
[GridToolbar] Toggle column visibility: {columnId: "email", currentVisibility: {...}}
[GridToolbar] New visibility state: {email: false, ...}
[Dashboard] Column visibility changed from toolbar: {email: false, ...}
Persisted grid state for employees
```

### Row Expansion with Custom Fields:
```
[DataGrid] Using gridId: employees
[DataGrid] getRowId - primaryKey: employee_id, row: {employee_id: 1276, ...}, index: 0, rowId: "1276"
[useCustomFields] Loading custom fields with key: custom_fields_employees_1276
[useCustomFields] Loaded 1 custom fields
```

## localStorage Structure After Fixes

```javascript
// Grid state (column visibility, order, widths)
grid_state_employees: {
  "columnOrder": ["employee_id", "first_name", ...],
  "columnWidths": {"employee_id": 120, ...},
  "columnVisibility": {"employee_id": true, "email": false, ...},
  "version": 1,
  "lastUpdated": 1769946939970
}

// Custom fields (no more suffixes!)
custom_fields_employees_1276: [
  {"id": "custom_123", "label": "Phone Number", "type": "tel", "value": "123-456-7890"}
]
```

## If Issues Persist

1. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Restart dev server**: Stop and run `npm run dev` again
3. **Check console for errors**: Look for red error messages
4. **Verify server is running**: Should see "serving on port 5000"
5. **Check network tab**: Verify API responses include `primaryKey` and `gridId`

## Rollback Instructions

If these changes cause issues, revert these files:
- `client/src/components/grid/GridToolbar.vue`
- `client/src/components/grid/DataGrid.vue`
- `client/src/pages/Dashboard.vue`
- `client/src/pages/Users.vue`
- `server/generic-grid-service.ts`

