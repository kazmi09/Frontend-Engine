<template>
  <div class="generic-detail-panel">
    <!-- Header -->
    <div class="detail-header">
      <div class="record-info">
        <div class="record-icon">
          <q-icon :name="config.icon || 'description'" size="md" />
        </div>
        <div>
          <h3 class="record-title">{{ getRecordTitle() }}</h3>
          <p class="record-subtitle">{{ getRecordSubtitle() }}</p>
        </div>
      </div>
      <div class="record-id" v-if="config.showId !== false">
        <span class="id-label">ID:</span>
        <span class="id-value">#{{ getRecordId() }}</span>
      </div>
    </div>

    <!-- Editable Fields Grid -->
    <div class="detail-grid" :style="{ gridTemplateColumns: `repeat(${config.columns || 2}, 1fr)` }">
      <div 
        v-for="field in editableFields" 
        :key="field.id"
        class="detail-field"
      >
        <label class="field-label">{{ field.label }}</label>
        <div 
          class="field-value"
          :class="{ 
            editable: field.editable !== false, 
            readonly: field.editable === false 
          }"
          @click="field.editable !== false ? startEdit(field.id) : null"
        >
          <template v-if="editingField === field.id">
            <!-- String/Text Input -->
            <input
              v-if="field.type === 'string'"
              :ref="el => fieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              type="text"
              class="field-input"
              @blur="saveField(field.id)"
              @keydown.enter="saveField(field.id)"
              @keydown.escape="cancelEdit"
            />
            
            <!-- Number Input -->
            <input
              v-else-if="field.type === 'number'"
              :ref="el => fieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              type="number"
              class="field-input"
              @blur="saveField(field.id)"
              @keydown.enter="saveField(field.id)"
              @keydown.escape="cancelEdit"
            />
            
            <!-- Date Input -->
            <input
              v-else-if="field.type === 'date'"
              :ref="el => fieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              type="date"
              class="field-input"
              @blur="saveField(field.id)"
              @keydown.enter="saveField(field.id)"
              @keydown.escape="cancelEdit"
            />
            
            <!-- Select Input -->
            <select
              v-else-if="field.type === 'select'"
              :ref="el => fieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              class="field-input"
              @blur="saveField(field.id)"
              @keydown.enter="saveField(field.id)"
              @keydown.escape="cancelEdit"
            >
              <option v-for="option in field.options" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
            
            <!-- Boolean Input -->
            <select
              v-else-if="field.type === 'boolean'"
              :ref="el => fieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              class="field-input"
              @blur="saveField(field.id)"
              @keydown.enter="saveField(field.id)"
              @keydown.escape="cancelEdit"
            >
              <option :value="true">Yes</option>
              <option :value="false">No</option>
            </select>
          </template>
          
          <template v-else>
            <!-- Display Value -->
            <span class="field-text">{{ formatFieldValue(field, row[field.id]) }}</span>
            <q-icon 
              v-if="field.editable !== false" 
              name="edit" 
              size="xs" 
              class="edit-icon" 
            />
          </template>
        </div>
      </div>
    </div>

    <!-- Custom Fields Section -->
    <div v-if="config.enableCustomFields !== false" class="custom-fields-section">
      <!-- Display existing custom fields -->
      <div 
        v-for="field in customFields" 
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
            @click="removeCustomFieldHandler(field.id)"
          >
            <q-tooltip>Remove field</q-tooltip>
          </q-btn>
        </div>
        <div 
          class="field-value editable"
          @click="startEditCustom(field.id)"
        >
          <template v-if="editingCustomField === field.id">
            <!-- Text Input -->
            <input
              v-if="field.type === 'text'"
              :ref="el => customFieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              type="text"
              class="field-input"
              @blur="saveCustomField(field.id)"
              @keydown.enter="saveCustomField(field.id)"
              @keydown.escape="cancelEditCustom"
            />
            
            <!-- Number Input -->
            <input
              v-else-if="field.type === 'number'"
              :ref="el => customFieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              type="number"
              class="field-input"
              @blur="saveCustomField(field.id)"
              @keydown.enter="saveCustomField(field.id)"
              @keydown.escape="cancelEditCustom"
            />
            
            <!-- Email Input -->
            <input
              v-else-if="field.type === 'email'"
              :ref="el => customFieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              type="email"
              class="field-input"
              @blur="saveCustomField(field.id)"
              @keydown.enter="saveCustomField(field.id)"
              @keydown.escape="cancelEditCustom"
            />
            
            <!-- Phone Input -->
            <input
              v-else-if="field.type === 'tel'"
              :ref="el => customFieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              type="tel"
              class="field-input"
              @blur="saveCustomField(field.id)"
              @keydown.enter="saveCustomField(field.id)"
              @keydown.escape="cancelEditCustom"
            />
            
            <!-- Date Input -->
            <input
              v-else-if="field.type === 'date'"
              :ref="el => customFieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              type="date"
              class="field-input"
              @blur="saveCustomField(field.id)"
              @keydown.enter="saveCustomField(field.id)"
              @keydown.escape="cancelEditCustom"
            />
            
            <!-- URL Input -->
            <input
              v-else-if="field.type === 'url'"
              :ref="el => customFieldRefs[field.id] = el"
              v-model="editValues[field.id]"
              type="url"
              class="field-input"
              @blur="saveCustomField(field.id)"
              @keydown.enter="saveCustomField(field.id)"
              @keydown.escape="cancelEditCustom"
            />
          </template>
          
          <template v-else>
            <span class="field-text">{{ field.value || 'N/A' }}</span>
            <q-icon name="edit" size="xs" class="edit-icon" />
          </template>
        </div>
      </div>
      
      <!-- Add Custom Field Section -->
      <div class="add-field-section">
        <div v-if="!showAddFieldForm" class="add-field-trigger">
          <q-btn
            flat
            icon="add"
            label="Add Custom Field"
            color="primary"
            size="sm"
            @click="showAddFieldForm = true"
            data-test="add-custom-field-btn"
          />
        </div>
        
        <div v-else class="add-field-form" data-test="add-field-form">
          <div class="form-row">
            <div class="form-field">
              <label class="form-label">Field Name</label>
              <input
                v-model="newFieldLabel"
                type="text"
                class="form-input"
                placeholder="e.g., Phone Number"
                data-test="field-label-input"
                @keydown.enter="addCustomFieldHandler"
              />
            </div>
            <div class="form-field">
              <label class="form-label">Field Type</label>
              <select v-model="newFieldType" class="form-select">
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
              label="Cancel"
              size="sm"
              @click="showAddFieldForm = false; newFieldLabel = ''; newFieldType = 'text'"
            />
            <q-btn
              unelevated
              label="Add Field"
              color="primary"
              size="sm"
              @click="addCustomFieldHandler"
            />
          </div>
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
import { ref, reactive, nextTick, computed, watch } from 'vue'
import { useGridUpdate } from '@/composables/useGridUpdate'
import { useCustomFields, CustomField } from '@/composables/useCustomFields'
import { ColumnConfig } from '@/lib/grid/types'

interface DetailPanelConfig {
  icon?: string
  showId?: boolean
  columns?: number
  titleField?: string
  subtitleField?: string
  idField?: string
  enableCustomFields?: boolean
}

const props = defineProps<{
  row: any
  rowId: string
  columns?: ColumnConfig[]
  config?: DetailPanelConfig
  gridId?: string
}>()

const updateMutation = useGridUpdate(props.gridId || 'default')

// Custom fields integration
const {
  customFields,
  addCustomField: addField,
  updateCustomField,
  removeCustomField: removeField,
  loadCustomFields
} = useCustomFields({
  rowId: props.rowId,
  gridId: props.gridId || 'default'
})

// Watch for rowId changes and reload custom fields
watch(() => props.rowId, (newRowId) => {
  console.log('[GenericDetailPanel] Row ID changed, reloading custom fields for:', newRowId)
  loadCustomFields(newRowId)
}, { immediate: false })

// Custom field form state
const showAddFieldForm = ref(false)
const newFieldLabel = ref('')
const newFieldType = ref<CustomField['type']>('text')
const editingCustomField = ref<string | null>(null)
const customFieldRefs = reactive<Record<string, any>>({})

const editingField = ref<string | null>(null)
const editValues = reactive<Record<string, any>>({})
const isSaving = ref(false)
const saveError = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const fieldRefs = reactive<Record<string, any>>({})

// Default config
const config = computed(() => ({
  icon: 'description',
  showId: true,
  columns: 2,
  titleField: 'name',
  subtitleField: 'type',
  idField: 'id',
  enableCustomFields: true,
  ...props.config
}))

// Get editable fields (exclude primary key and non-editable fields)
const editableFields = computed(() => {
  if (!props.columns || !Array.isArray(props.columns)) {
    return []
  }
  return props.columns.filter(col => 
    col.editable !== false && 
    col.id !== config.value.idField
  )
})

const getRecordTitle = () => {
  const titleField = config.value.titleField
  if (titleField && props.row[titleField]) {
    return props.row[titleField]
  }
  
  // Fallback: try common title fields
  const commonTitleFields = ['name', 'title', 'first_name', 'email', 'subject']
  for (const field of commonTitleFields) {
    if (props.row[field]) {
      return props.row[field]
    }
  }
  
  return 'Record Details'
}

const getRecordSubtitle = () => {
  const subtitleField = config.value.subtitleField
  if (subtitleField && props.row[subtitleField]) {
    return props.row[subtitleField]
  }
  
  // Fallback: try common subtitle fields
  const commonSubtitleFields = ['type', 'category', 'department', 'status', 'last_name']
  for (const field of commonSubtitleFields) {
    if (props.row[field]) {
      return props.row[field]
    }
  }
  
  return 'Details'
}

const getRecordId = () => {
  const idField = config.value.idField
  return props.row[idField] || props.rowId
}

const formatFieldValue = (field: ColumnConfig, value: any) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A'
  }
  
  switch (field.type) {
    case 'date':
      try {
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return value
      }
    
    case 'number':
      return value
    
    case 'boolean':
      return value ? 'Yes' : 'No'
    
    default:
      return value
  }
}

const startEdit = (fieldName: string) => {
  editingField.value = fieldName
  editValues[fieldName] = props.row[fieldName]
  saveError.value = null
  
  nextTick(() => {
    const element = fieldRefs[fieldName]
    if (element && element.focus) {
      element.focus()
    }
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

// Custom field handlers
const addCustomFieldHandler = () => {
  if (!newFieldLabel.value.trim()) {
    saveError.value = 'Field name cannot be empty'
    setTimeout(() => saveError.value = null, 2000)
    return
  }
  
  try {
    addField(newFieldLabel.value, newFieldType.value)
    
    // Reset form
    newFieldLabel.value = ''
    newFieldType.value = 'text'
    showAddFieldForm.value = false
    
    // Show success message
    successMessage.value = 'Custom field added!'
    setTimeout(() => successMessage.value = null, 2000)
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Failed to add field'
    setTimeout(() => saveError.value = null, 2000)
  }
}

const removeCustomFieldHandler = (fieldId: string) => {
  removeField(fieldId)
  successMessage.value = 'Field removed'
  setTimeout(() => successMessage.value = null, 2000)
}

const startEditCustom = (fieldId: string) => {
  const field = customFields.value.find(f => f.id === fieldId)
  if (!field) return
  
  editingCustomField.value = fieldId
  editValues[fieldId] = field.value
  saveError.value = null
  
  nextTick(() => {
    const element = customFieldRefs[fieldId]
    if (element && element.focus) {
      element.focus()
    }
  })
}

const saveCustomField = (fieldId: string) => {
  const newValue = editValues[fieldId]
  updateCustomField(fieldId, newValue)
  editingCustomField.value = null
  
  successMessage.value = 'Field updated!'
  setTimeout(() => successMessage.value = null, 2000)
}

const cancelEditCustom = () => {
  editingCustomField.value = null
  saveError.value = null
}
</script>

<style scoped>
.generic-detail-panel {
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

.record-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.record-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.record-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.record-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.record-id {
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

/* Custom Fields Section */
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
</style>