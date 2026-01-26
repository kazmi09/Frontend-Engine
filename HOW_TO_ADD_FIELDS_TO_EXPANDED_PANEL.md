# How to Add Fields to Expanded Panel

This guide shows you how to add more information to the expandable row detail panel.

## 📁 File to Edit

**File:** `client/src/components/grid/EmployeeDetailPanel.vue`

## 🎯 Quick Examples

### Example 1: Add a Simple Text Field

```vue
<div>
  <div class="text-xs text-gray-500">Field Label</div>
  <div class="text-sm">{{ row.your_field_name || 'N/A' }}</div>
</div>
```

**Replace:**
- `Field Label` - The label you want to display
- `your_field_name` - The actual field name from your database

### Example 2: Add a Field with Icon

```vue
<div class="flex items-center gap-2">
  <q-icon name="phone" size="sm" class="text-blue-500" />
  <div>
    <div class="text-xs text-gray-500">Phone</div>
    <div class="text-sm">{{ row.phone || 'N/A' }}</div>
  </div>
</div>
```

### Example 3: Add a Badge/Status Field

```vue
<div>
  <div class="text-xs text-gray-500">Status</div>
  <div class="text-sm">
    <q-badge :color="row.status === 'Active' ? 'green' : 'red'" :label="row.status" />
  </div>
</div>
```

### Example 4: Add a Clickable Link

```vue
<div>
  <div class="text-xs text-gray-500">Website</div>
  <div class="text-sm text-blue-600 hover:underline">
    <a :href="row.website" target="_blank">{{ row.website }}</a>
  </div>
</div>
```

### Example 5: Add a Formatted Number

```vue
<div>
  <div class="text-xs text-gray-500">Performance Score</div>
  <div class="text-lg font-bold text-green-600">{{ row.performance_score }}%</div>
</div>
```

## 📋 Where to Add Fields

### Option A: Add to Existing Sections

Find one of these sections in the file:
- **Contact Information** (around line 30)
- **Employment Details** (around line 50)
- **Compensation** (around line 75)

Add your field inside the `<div class="space-y-2 pl-6">` section.

### Option B: Create a New Section

Add a completely new section (I've added an example at the bottom):

```vue
<div class="mt-6 pt-4 border-t border-gray-200">
  <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-3">
    <q-icon name="info" size="sm" class="text-indigo-500" />
    Your Section Title
  </h3>
  <div class="grid grid-cols-2 gap-4 pl-6">
    <!-- Add your fields here -->
    <div>
      <div class="text-xs text-gray-500">Field 1</div>
      <div class="text-sm">{{ row.field1 }}</div>
    </div>
    <div>
      <div class="text-xs text-gray-500">Field 2</div>
      <div class="text-sm">{{ row.field2 }}</div>
    </div>
  </div>
</div>
```

## 🎨 Styling Options

### Colors for Badges
- `color="blue"` - Blue
- `color="green"` - Green
- `color="red"` - Red
- `color="orange"` - Orange
- `color="purple"` - Purple

### Icons (Quasar Material Icons)
- `name="phone"` - Phone
- `name="email"` - Email
- `name="location_on"` - Location
- `name="work"` - Work
- `name="person"` - Person
- `name="calendar_today"` - Calendar
- `name="attach_money"` - Money

Full icon list: https://fonts.google.com/icons

## 🔧 Available Row Data

Your current database fields (accessible via `row.field_name`):
- `row.employee_id` - Employee ID
- `row.first_name` - First Name
- `row.last_name` - Last Name
- `row.email` - Email
- `row.department` - Department
- `row.job_title` - Job Title
- `row.salary` - Salary
- `row.hire_date` - Hire Date

## 💡 Pro Tips

1. **Always use `|| 'N/A'`** to show "N/A" when data is missing:
   ```vue
   {{ row.field_name || 'N/A' }}
   ```

2. **Format dates** using the existing `formatDate()` function:
   ```vue
   {{ formatDate(row.hire_date) }}
   ```

3. **Format currency** using the existing `formatSalary()` function:
   ```vue
   {{ formatSalary(row.salary) }}
   ```

4. **Use grid layouts** for multiple fields:
   ```vue
   <div class="grid grid-cols-2 gap-4">  <!-- 2 columns -->
   <div class="grid grid-cols-3 gap-4">  <!-- 3 columns -->
   <div class="grid grid-cols-4 gap-4">  <!-- 4 columns -->
   ```

## 🚀 Quick Start

1. Open `client/src/components/grid/EmployeeDetailPanel.vue`
2. Find the "Additional Information (Example)" section I added
3. Replace the example fields with your actual fields
4. Save the file
5. The page will auto-reload and show your changes!

## 📝 Example: Adding Phone and Address

```vue
<div class="mt-6 pt-4 border-t border-gray-200">
  <h3 class="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-3">
    <q-icon name="contact_phone" size="sm" class="text-indigo-500" />
    Contact Details
  </h3>
  <div class="grid grid-cols-2 gap-4 pl-6">
    <div>
      <div class="text-xs text-gray-500">Phone Number</div>
      <div class="text-sm font-medium">{{ row.phone || 'N/A' }}</div>
    </div>
    <div>
      <div class="text-xs text-gray-500">Address</div>
      <div class="text-sm">{{ row.address || 'N/A' }}</div>
    </div>
  </div>
</div>
```

That's it! You're ready to customize your expanded panel! 🎉
