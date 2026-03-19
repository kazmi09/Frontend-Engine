import { ref, Ref } from 'vue'

export interface CustomField {
  id: string
  label: string
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'url'
  value: any
}

export interface UseCustomFieldsOptions {
  rowId: string
  gridId: string
}

export interface UseCustomFieldsReturn {
  customFields: Ref<CustomField[]>
  addCustomField: (label: string, type: string) => void
  updateCustomField: (fieldId: string, value: any) => void
  removeCustomField: (fieldId: string) => void
  loadCustomFields: (newRowId?: string) => void
  saveCustomFields: () => void
}

export function useCustomFields(options: UseCustomFieldsOptions): UseCustomFieldsReturn {
  let rowId = options.rowId
  const gridId = options.gridId
  const customFields = ref<CustomField[]>([])
  
  // Generate storage key with gridId and rowId for namespacing
  const getStorageKey = () => `custom_fields_${gridId}_${rowId}`
  
  // Load custom fields from localStorage
  const loadCustomFields = (newRowId?: string) => {
    // Update rowId if provided
    if (newRowId !== undefined) {
      rowId = newRowId
      console.log('[useCustomFields] Updated rowId to:', newRowId)
    }
    
    try {
      const key = getStorageKey()
      console.log('[useCustomFields] Loading custom fields with key:', key)
      const stored = localStorage.getItem(key)
      
      if (stored) {
        customFields.value = JSON.parse(stored)
        console.log('[useCustomFields] Loaded custom fields:', customFields.value)
      } else {
        customFields.value = []
        console.log('[useCustomFields] No custom fields found in localStorage')
      }
    } catch (error) {
      console.error('Failed to load custom fields:', error)
      customFields.value = []
    }
  }
  
  // Save custom fields to localStorage
  const saveCustomFields = () => {
    try {
      const key = getStorageKey()
      console.log('[useCustomFields] Saving custom fields with key:', key, 'data:', customFields.value)
      localStorage.setItem(key, JSON.stringify(customFields.value))
    } catch (error) {
      console.error('Failed to save custom fields:', error)
      throw new Error('Unable to save custom fields. Storage may be full.')
    }
  }
  
  // Generate unique field ID using timestamp and random string
  const generateFieldId = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `custom_${timestamp}_${random}`
  }
  
  // Add a new custom field
  const addCustomField = (label: string, type: string) => {
    const trimmedLabel = label.trim()
    
    // Reject empty labels
    if (!trimmedLabel) {
      throw new Error('Field label cannot be empty')
    }
    
    const field: CustomField = {
      id: generateFieldId(),
      label: trimmedLabel,
      type: type as CustomField['type'],
      value: ''
    }
    
    customFields.value.push(field)
    saveCustomFields()
  }
  
  // Update a custom field value
  const updateCustomField = (fieldId: string, value: any) => {
    const field = customFields.value.find(f => f.id === fieldId)
    if (field) {
      field.value = value
      saveCustomFields()
    }
  }
  
  // Remove a custom field
  const removeCustomField = (fieldId: string) => {
    const index = customFields.value.findIndex(f => f.id === fieldId)
    if (index !== -1) {
      customFields.value.splice(index, 1)
      saveCustomFields()
    }
  }
  
  // Load fields on initialization
  loadCustomFields()
  
  return {
    customFields,
    addCustomField,
    updateCustomField,
    removeCustomField,
    loadCustomFields,
    saveCustomFields
  }
}
