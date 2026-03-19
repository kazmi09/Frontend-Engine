<template>
  <div class="employee-detail-panel">
    <!-- Compact Header -->
    <div class="detail-header">
      <div class="employee-info">
        <div class="avatar">
          {{ getInitials(row.first_name, row.last_name) }}
        </div>
        <div>
          <h3 class="employee-name">{{ row.first_name }} {{ row.last_name }}</h3>
          <p class="employee-title">{{ row.job_title || 'Employee' }}</p>
        </div>
      </div>
      <div class="employee-id">
        <span class="id-label">ID:</span>
        <span class="id-value">#{{ row.employee_id }}</span>
      </div>
    </div>

    <!-- Compact Editable Fields Grid -->
    <div class="detail-grid">
      <!-- Email -->
      <div class="detail-field">
        <label class="field-label">Email</label>
        <div class="field-value editable" @click="startEdit('email')">
          <template v-if="editingField === 'email'">
            <input
              ref="emailInput"
              v-model="editValues.email"
              type="email"
              class="field-input"
              @blur="saveField('email')"
              @keydown.enter="saveField('email')"
              @keydown.escape="cancelEdit"
            />
          </template>
          <template v-else>
            <span class="field-text">{{ row.email }}</span>
            <q-icon name="edit" size="xs" class="edit-icon" />
          </template>
        </div>
      </div>

      <!-- Department -->
      <div class="detail-field">
        <label class="field-label">Department</label>
        <div class="field-value editable" @click="startEdit('department')">
          <template v-if="editingField === 'department'">
            <input
              ref="departmentInput"
              v-model="editValues.department"
              type="text"
              class="field-input"
              @blur="saveField('department')"
              @keydown.enter="saveField('department')"
              @keydown.escape="cancelEdit"
            />
          </template>
          <template v-else>
            <q-badge :color="getDepartmentColor(row.department)" :label="row.department || 'N/A'" />
            <q-icon name="edit" size="xs" class="edit-icon" />
          </template>
        </div>
      </div>

      <!-- Job Title -->
      <div class="detail-field">
        <label class="field-label">Job Title</label>
        <div class="field-value editable" @click="startEdit('job_title')">
          <template v-if="editingField === 'job_title'">
            <input
              ref="job_titleInput"
              v-model="editValues.job_title"
              type="text"
              class="field-input"
              @blur="saveField('job_title')"
              @keydown.enter="saveField('job_title')"
              @keydown.escape="cancelEdit"
            />
          </template>
          <template v-else>
            <span class="field-text">{{ row.job_title || 'N/A' }}</span>
            <q-icon name="edit" size="xs" class="edit-icon" />
          </template>
        </div>
      </div>

      <!-- Salary -->
      <div class="detail-field">
        <label class="field-label">Salary</label>
        <div class="field-value editable" @click="startEdit('salary')">
          <template v-if="editingField === 'salary'">
            <input
              ref="salaryInput"
              v-model="editValues.salary"
              type="number"
              class="field-input"
              @blur="saveField('salary')"
              @keydown.enter="saveField('salary')"
              @keydown.escape="cancelEdit"
            />
          </template>
          <template v-else>
            <span class="field-text salary">{{ formatSalary(row.salary) }}</span>
            <q-icon name="edit" size="xs" class="edit-icon" />
          </template>
        </div>
      </div>

      <!-- Hire Date -->
      <div class="detail-field">
        <label class="field-label">Hire Date</label>
        <div class="field-value editable" @click="startEdit('hire_date')">
          <template v-if="editingField === 'hire_date'">
            <input
              ref="hire_dateInput"
              v-model="editValues.hire_date"
              type="date"
              class="field-input"
              @blur="saveField('hire_date')"
              @keydown.enter="saveField('hire_date')"
              @keydown.escape="cancelEdit"
            />
          </template>
          <template v-else>
            <span class="field-text">{{ formatDate(row.hire_date) }}</span>
            <q-icon name="edit" size="xs" class="edit-icon" />
          </template>
        </div>
      </div>

      <!-- Tenure (Read-only) -->
      <div class="detail-field">
        <label class="field-label">Tenure</label>
        <div class="field-value readonly">
          <span class="field-text">{{ calculateTenure(row.hire_date) }}</span>
        </div>
      </div>

      <!-- Dynamic Custom Fields -->
      <div 
        v-for="(field, index) in customFields" 
        :key="field.id"
        class="detail-field"
      >
        <div class="field-label-row">
          <label class="field-label">{{ field.label }}</label>
          <q-btn
            flat
            dense
            round
            size="xs"
            icon="close"
            class="delete-field-btn"
            @click="removeCustomField(index)"
          >
            <q-tooltip>Remove field</q-tooltip>
          </q-btn>
        </div>
        <div class="field-value editable" @click="startEditCustom(field.id)">
          <template v-if="editingField === field.id">
            <input
              :ref="el => customFieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              :type="field.type"
              class="field-input"
              @blur="saveCustomField(field.id)"
              @keydown.enter="saveCustomField(field.id)"
              @keydown.escape="cancelEdit"
            />
          </template>
          <template v-else>
            <span class="field-text">{{ field.value || 'Click to edit' }}</span>
            <q-icon name="edit" size="xs" class="edit-icon" />
          </template>
        </div>
      </div>
    </div>

    <!-- Add Custom Field Section -->
    <div class="add-field-section">
      <div v-if="!showAddFieldForm" class="add-field-trigger">
        <q-btn
          flat
          dense
          icon="add"
          label="Add Custom Field"
          color="primary"
          size="sm"
          @click="showAddFieldForm = true"
        />
      </div>

      <!-- Add Field Form -->
      <div v-else class="add-field-form">
        <div class="form-row">
          <div class="form-field">
            <label class="form-label">Field Name</label>
            <input
              ref="newFieldNameInput"
              v-model="newField.label"
              type="text"
              class="form-input"
              placeholder="e.g., Phone Number"
              @keydown.enter="addCustomField"
            />
          </div>
          <div class="form-field">
            <label class="form-label">Field Type</label>
            <select v-model="newField.type" class="form-select">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
              <option value="tel">Phone</option>
              <option value="date">Date</option>
              <option value="url">URL</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <q-btn
            flat
            dense
            label="Cancel"
            size="sm"
            @click="cancelAddField"
          />
          <q-btn
            flat
            dense
            label="Add Field"
            color="primary"
            size="sm"
            :disable="!newField.label"
            @click="addCustomField"
          />
        </div>
      </div>
    </div>

    <!-- Loading/Saving Indicator -->
    <div v-if="isSaving" class="saving-indicator">
      <q-spinner size="16px" color="primary" />
      <span>Saving...</span>
    </div>

    <!-- Error Message -->
    <div v-if="saveError" class="error-message">
      <q-icon name="error" size="sm" color="negative" />
      <span>{{ saveError }}</span>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="success-message">
      <q-icon name="check_circle" size="sm" color="positive" />
      <span>{{ successMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { useGridUpdate } from '@/composables/useGridUpdate'

const props = defineProps<{
  row: any
  rowId: string
  data?: any
}>()

const updateMutation = useGridUpdate()

const editingField = ref<string | null>(null)
const editValues = reactive<Record<string, any>>({})
const isSaving = ref(false)
const saveError = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Refs for input elements
const emailInput = ref<HTMLInputElement>()
const departmentInput = ref<HTMLInputElement>()
const job_titleInput = ref<HTMLInputElement>()
const salaryInput = ref<HTMLInputElement>()
const hire_dateInput = ref<HTMLInputElement>()
const newFieldNameInput = ref<HTMLInputElement>()

// Custom fields management
interface CustomField {
  id: string
  label: string
  type: string
  value: any
}

const customFields = ref<CustomField[]>([])
const customFieldRefs = reactive<Record<string, HTMLInputElement>>({})
const showAddFieldForm = ref(false)
const newField = reactive({
  label: '',
  type: 'text'
})

// Load custom fields from localStorage on mount
onMounted(() => {
  loadCustomFields()
})

const loadCustomFields = () => {
  const storageKey = `custom_fields_${props.rowId}`
  const stored = localStorage.getItem(storageKey)
  if (stored) {
    try {
      customFields.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to load custom fields:', e)
    }
  }
}

const saveCustomFieldsToStorage = () => {
  const storageKey = `custom_fields_${props.rowId}`
  localStorage.setItem(storageKey, JSON.stringify(customFields.value))
}

const addCustomField = () => {
  if (!newField.label.trim()) return
  
  const fieldId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  customFields.value.push({
    id: fieldId,
    label: newField.label,
    type: newField.type,
    value: ''
  })
  
  saveCustomFieldsToStorage()
  
  // Reset form
  newField.label = ''
  newField.type = 'text'
  showAddFieldForm.value = false
  
  // Show success message
  successMessage.value = 'Custom field added successfully!'
  setTimeout(() => {
    successMessage.value = null
  }, 3000)
}

const removeCustomField = (index: number) => {
  customFields.value.splice(index, 1)
  saveCustomFieldsToStorage()
  
  successMessage.value = 'Field removed'
  setTimeout(() => {
    successMessage.value = null
  }, 2000)
}

const cancelAddField = () => {
  newField.label = ''
  newField.type = 'text'
  showAddFieldForm.value = false
}

const startEditCustom = (fieldId: string) => {
  const field = customFields.value.find(f => f.id === fieldId)
  if (!field) return
  
  editingField.value = fieldId
  editValues[fieldId] = field.value
  saveError.value = null
  
  nextTick(() => {
    customFieldRefs[fieldId]?.focus()
  })
}

const saveCustomField = async (fieldId: string) => {
  const field = customFields.value.find(f => f.id === fieldId)
  if (!field) return
  
  const newValue = editValues[fieldId]
  
  // Update the field value
  field.value = newValue
  saveCustomFieldsToStorage()
  
  cancelEdit()
  
  // Show success message
  successMessage.value = 'Field updated!'
  setTimeout(() => {
    successMessage.value = null
  }, 2000)
}

const getInitials = (firstName: string, lastName: string) => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return `${first}${last}`
}

const getDepartmentColor = (department: string) => {
  const colors: Record<string, string> = {
    'Engineering': 'blue',
    'Sales': 'green',
    'Marketing': 'purple',
    'HR': 'orange',
    'Finance': 'teal',
    'Legal': 'red',
    'Product': 'indigo',
  }
  return colors[department] || 'grey'
}

const formatSalary = (salary: string | number) => {
  if (!salary) return 'N/A'
  const numSalary = typeof salary === 'string' ? parseFloat(salary) : salary
  if (isNaN(numSalary)) return salary
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(numSalary)
}

const formatDate = (date: string) => {
  if (!date) return 'N/A'
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return date
  }
}

const calculateTenure = (hireDate: string) => {
  if (!hireDate) return 'N/A'
  try {
    const hire = new Date(hireDate)
    const now = new Date()
    const years = now.getFullYear() - hire.getFullYear()
    const months = now.getMonth() - hire.getMonth()
    
    let totalMonths = years * 12 + months
    if (totalMonths < 0) totalMonths = 0
    
    const displayYears = Math.floor(totalMonths / 12)
    const displayMonths = totalMonths % 12
    
    if (displayYears === 0) {
      return `${displayMonths} month${displayMonths !== 1 ? 's' : ''}`
    } else if (displayMonths === 0) {
      return `${displayYears} year${displayYears !== 1 ? 's' : ''}`
    } else {
      return `${displayYears}y ${displayMonths}m`
    }
  } catch {
    return 'N/A'
  }
}

const startEdit = (fieldName: string) => {
  editingField.value = fieldName
  editValues[fieldName] = props.row[fieldName]
  saveError.value = null
  
  nextTick(() => {
    // Focus the appropriate input
    const inputRef = {
      email: emailInput,
      department: departmentInput,
      job_title: job_titleInput,
      salary: salaryInput,
      hire_date: hire_dateInput,
    }[fieldName]
    
    inputRef?.value?.focus()
  })
}

const cancelEdit = () => {
  editingField.value = null
  saveError.value = null
}

const saveField = async (fieldName: string) => {
  const newValue = editValues[fieldName]
  const oldValue = props.row[fieldName]
  
  // Don't save if value hasn't changed
  if (newValue === oldValue) {
    cancelEdit()
    return
  }
  
  isSaving.value = true
  saveError.value = null
  
  try {
    await updateMutation.mutateAsync({
      rowId: props.rowId,
      columnId: fieldName,
      value: newValue
    })
    
    // Update the row data
    props.row[fieldName] = newValue
    cancelEdit()
    
    // Show success message
    successMessage.value = 'Saved successfully!'
    setTimeout(() => {
      successMessage.value = null
    }, 2000)
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Failed to save'
    // Keep editing mode open on error
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.employee-detail-panel {
  background: #fafafa;
  border-left: 3px solid #3b82f6;
  padding: 12px 16px;
  max-width: 800px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.employee-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.employee-title {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.employee-id {
  display: flex;
  align-items: center;
  gap: 4px;
}

.id-label {
  font-size: 11px;
  color: #6b7280;
}

.id-value {
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px 16px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-value {
  font-size: 13px;
  color: #1f2937;
  padding: 6px 8px;
  border-radius: 4px;
  min-height: 32px;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
}

.field-value.editable {
  cursor: pointer;
  background: white;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.field-value.editable:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.field-value.editable:hover .edit-icon {
  opacity: 1;
}

.field-value.readonly {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}

.field-text {
  flex: 1;
}

.field-text.salary {
  font-weight: 600;
  color: #059669;
}

.edit-icon {
  opacity: 0;
  transition: opacity 0.2s;
  color: #3b82f6;
}

.field-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: #1f2937;
  padding: 0;
}

.field-input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  border-radius: 2px;
  padding: 2px;
}

.saving-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px;
  background: #eff6ff;
  border-radius: 4px;
  font-size: 12px;
  color: #1e40af;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px;
  background: #fef2f2;
  border-radius: 4px;
  font-size: 12px;
  color: #991b1b;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px;
  background: #f0fdf4;
  border-radius: 4px;
  font-size: 12px;
  color: #166534;
}

/* Add Custom Field Section */
.add-field-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
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

/* Custom Field Specific Styles */
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
</style>
