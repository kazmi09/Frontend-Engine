# Add Custom Fields to Expanded Rows - User Guide

## Overview
You can now dynamically add custom fields to any employee's expanded detail panel directly from the UI. These fields are stored in the browser's localStorage and persist across sessions.

## How to Add a Custom Field

### Step 1: Expand a Row
Click the chevron icon (▶) next to any employee row to expand the detail panel.

### Step 2: Click "Add Custom Field"
At the bottom of the expanded panel, you'll see an "Add Custom Field" button. Click it.

### Step 3: Fill in the Form
A form will appear with two inputs:
- **Field Name**: Enter a descriptive name (e.g., "Phone Number", "Office Location", "Emergency Contact")
- **Field Type**: Select the type of data:
  - **Text**: For general text input
  - **Number**: For numeric values
  - **Email**: For email addresses
  - **Phone**: For phone numbers
  - **Date**: For date values
  - **URL**: For website links

### Step 4: Add the Field
Click the "Add Field" button or press Enter. The new field will appear in the detail panel grid.

### Step 5: Edit the Field Value
Click on the new field to edit its value. Press Enter or click outside to save.

## Features

### ✅ Editable Fields
- Click any custom field to edit its value
- Press Enter to save
- Press Escape to cancel
- Changes are saved to localStorage automatically

### ✅ Remove Fields
- Hover over a custom field to see a delete button (×)
- Click the × to remove the field
- Confirmation is instant

### ✅ Multiple Field Types
Choose from 6 different field types:
- **Text**: General purpose text
- **Number**: Numeric values with number input
- **Email**: Email addresses with validation
- **Phone**: Phone numbers with tel input
- **Date**: Date picker
- **URL**: Website links

### ✅ Persistent Storage
- Custom fields are saved per employee (by rowId)
- Data persists across browser sessions
- Stored in localStorage (no server required)

### ✅ Visual Feedback
- Success messages when fields are added/updated/removed
- Hover effects on editable fields
- Edit icon appears on hover
- Smooth animations

## Example Use Cases

### 1. Add Phone Number
```
Field Name: Phone Number
Field Type: Phone
Value: (555) 123-4567
```

### 2. Add Office Location
```
Field Name: Office Location
Field Type: Text
Value: Building A, Floor 3, Desk 42
```

### 3. Add Emergency Contact
```
Field Name: Emergency Contact
Field Type: Text
Value: Jane Doe - (555) 987-6543
```

### 4. Add LinkedIn Profile
```
Field Name: LinkedIn
Field Type: URL
Value: https://linkedin.com/in/johndoe
```

### 5. Add Performance Review Date
```
Field Name: Next Review
Field Type: Date
Value: 2024-06-15
```

## Technical Details

### Storage Location
Custom fields are stored in browser localStorage with the key format:
```
custom_fields_{rowId}
```

Example:
```
custom_fields_1 → [{ id: "custom_123", label: "Phone", type: "tel", value: "555-1234" }]
```

### Data Structure
Each custom field is stored as:
```typescript
{
  id: string;        // Unique identifier (e.g., "custom_1234567890_abc123")
  label: string;     // Display name (e.g., "Phone Number")
  type: string;      // Input type (e.g., "text", "number", "email")
  value: any;        // Field value (e.g., "555-1234")
}
```

### Limitations
- Custom fields are stored per browser (not synced across devices)
- No server-side persistence (localStorage only)
- Limited to browser's localStorage capacity (~5-10MB)
- Fields are specific to each employee row

## Code Implementation

### Component: EmployeeDetailPanel.vue

**Key Functions:**

1. **addCustomField()** - Creates a new custom field
2. **removeCustomField(index)** - Deletes a custom field
3. **startEditCustom(fieldId)** - Enters edit mode for a custom field
4. **saveCustomField(fieldId)** - Saves custom field value to localStorage
5. **loadCustomFields()** - Loads custom fields from localStorage on mount
6. **saveCustomFieldsToStorage()** - Persists custom fields to localStorage

**State Management:**
```typescript
const customFields = ref<CustomField[]>([])  // Array of custom fields
const showAddFieldForm = ref(false)          // Toggle add field form
const newField = reactive({                  // New field form data
  label: '',
  type: 'text'
})
```

## UI Layout

The expanded panel now has three sections:

1. **Header** - Employee name, avatar, and ID
2. **Standard Fields Grid** - Email, Department, Job Title, Salary, Hire Date, Tenure
3. **Custom Fields** - Dynamically added fields (rendered in the same grid)
4. **Add Field Section** - Button and form to add new fields

## Styling

Custom fields use the same styling as standard fields:
- Compact grid layout (3 columns)
- Hover effects with edit icon
- Blue border on hover
- White background for editable fields
- Smooth transitions

## Tips

1. **Organize Your Fields**: Use clear, descriptive names for custom fields
2. **Choose the Right Type**: Select the appropriate field type for better UX
3. **Keep It Simple**: Don't add too many custom fields (affects readability)
4. **Use Consistent Naming**: Use a naming convention across employees
5. **Test Before Committing**: Custom fields are easy to add/remove, so experiment!

## Future Enhancements

Potential improvements for future versions:
- Server-side persistence (save to database)
- Field templates (reusable field definitions)
- Bulk add fields to multiple employees
- Export/import custom field definitions
- Field validation rules
- Conditional field visibility
- Field grouping/sections
- Rich text editor for text fields
- File upload fields
- Dropdown/select fields with predefined options

## Troubleshooting

### Custom fields don't appear after refresh
- Check browser console for errors
- Verify localStorage is enabled in your browser
- Check if localStorage quota is exceeded

### Can't edit custom field
- Make sure you're clicking directly on the field value
- Check if another field is already in edit mode
- Try refreshing the page

### Delete button doesn't appear
- Hover over the field label area
- The × button appears on hover
- Make sure you're hovering over a custom field (not standard fields)

### Changes don't save
- Check browser console for errors
- Verify localStorage is working
- Try clearing localStorage and re-adding fields

## Summary

The custom fields feature provides a flexible way to extend employee data without modifying the database schema. It's perfect for:
- Quick prototyping
- User-specific data
- Temporary fields
- Non-critical information
- Personal notes and references

All changes are instant, persistent, and completely managed from the UI!
