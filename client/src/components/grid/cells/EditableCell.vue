<template>
  <div 
    class="tw:relative tw:w-full tw:h-full tw:flex tw:items-center cell-container"
    :style="{ minHeight: '32px', height: '32px' }"
    :class="cellClass"
    @click="startEdit"
  >
    <!-- Display Mode -->
    <div 
      v-if="!isEditing" 
      class="tw:w-full tw:px-1.5 tw:py-0.5 tw:cursor-pointer hover:tw:bg-gray-50 dark:hover:tw:bg-gray-800 tw:rounded tw:overflow-hidden tw:transition-colors"
      :class="{ 'tw:opacity-50': !isEditable }"
    >
      <div class="tw:truncate tw:block tw:w-full">
        <component 
          :is="displayComponent" 
          :value="displayValue" 
          :column="column"
        />
        <q-tooltip 
          v-if="displayValue"
          anchor="top middle" 
          self="bottom middle"
          :offset="[0, 8]"
          max-width="400px"
        >
          {{ displayValue }}
        </q-tooltip>
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-else class="tw:w-full tw:h-full tw:flex tw:items-center edit-mode-container">
      <component
        :is="editComponent"
        v-model="editValue"
        :column="column"
        :error="error"
        @save="onCommit"
        @cancel="onCancel"
        @keydown.enter="onCommit"
        @keydown.escape="onCancel"
      />
    </div>

    <!-- Loading Indicator -->
    <div v-if="isCellLoading" class="tw:absolute tw:inset-0 tw:flex tw:items-center tw:justify-center tw:bg-white/80 dark:tw:bg-gray-900/80">
      <q-spinner
        size="20px"
        color="primary"
      />
    </div>

    <!-- Error Indicator -->
    <q-icon
      v-else-if="error"
      name="error"
      size="18px"
      class="tw:absolute tw:top-1 tw:right-1 tw:text-negative"
    >
      <q-tooltip>{{ error }}</q-tooltip>
    </q-icon>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ColumnConfig } from '@/lib/grid/types'
import { useGridUpdate } from '@/composables/useGridUpdate'
import { useAuthStore } from '@/lib/auth/store'

// Cell display components
import StringDisplay from './displays/StringDisplay.vue'
import NumberDisplay from './displays/NumberDisplay.vue'
import BooleanDisplay from './displays/BooleanDisplay.vue'
import DateDisplay from './displays/DateDisplay.vue'
import SelectDisplay from './displays/SelectDisplay.vue'

// Cell edit components
import StringEdit from './editors/StringEdit.vue'
import NumberEdit from './editors/NumberEdit.vue'
import BooleanEdit from './editors/BooleanEdit.vue'
import DateEdit from './editors/DateEdit.vue'
import SelectEdit from './editors/SelectEdit.vue'

const props = defineProps<{
  value: any
  rowId: string
  column: ColumnConfig
  width: number
  gridId: string
  /**
   * Optional override for the current role used in permission checks.
   * When provided, this takes precedence over the authenticated user role,
   * allowing the toolbar role switcher to drive view/edit behaviour.
   */
  activeRole?: string | null
}>()

const editValue = ref(props.value)
const isEditing = ref(false)
const error = ref<string | null>(null)

const updateMutation = useGridUpdate(props.gridId)
const authStore = useAuthStore()

// Check if this specific cell is updating
const isCellLoading = computed(() => 
  updateMutation.isCellUpdating(props.rowId, props.column.id)
)

// Sync editValue when prop changes (e.g., from rollback)
watch(() => props.value, (newValue) => {
  editValue.value = newValue
})

// Permissions (view + edit) are fully config-driven via ColumnConfig.
// We intentionally avoid hard-coding any role names here.
// If an activeRole override is provided (from the toolbar), it takes precedence.
const currentRole = computed(() => props.activeRole ?? authStore.user.role)

// Whether the current user is allowed to see this column's value
const hasViewPermission = computed(() => {
  const perms = props.column.permissions

  // Fine-grained config takes precedence
  if (perms?.view && perms.view.length > 0) {
    return perms.view.includes(currentRole.value)
  }

  // Backwards-compatible: legacy requiredPermissions
  if (props.column.requiredPermissions && props.column.requiredPermissions.length > 0) {
    return props.column.requiredPermissions.includes(currentRole.value)
  }

  // No restriction configured → visible to all roles
  return true
})

// Whether the current user is allowed to edit this column
const hasEditPermission = computed(() => {
  const perms = props.column.permissions
  const baseEditable = props.column.editable !== false

  if (!baseEditable) return false

  if (perms?.edit && perms.edit.length > 0) {
    return perms.edit.includes(currentRole.value)
  }

  // Legacy behaviour: if requiredPermissions is present and we passed the view
  // check above, gate editing by the same list.
  if (props.column.requiredPermissions && props.column.requiredPermissions.length > 0) {
    return props.column.requiredPermissions.includes(currentRole.value)
  }

  // No edit restriction configured beyond the base flag
  return baseEditable
})

const isEditable = computed(() => hasViewPermission.value && hasEditPermission.value)

// Display value formatting
const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return ''
  return props.value
})

// Component selection based on column type
const displayComponent = computed(() => {
  switch (props.column.type) {
    case 'number': return NumberDisplay
    case 'boolean': return BooleanDisplay
    case 'date': return DateDisplay
    case 'select': return SelectDisplay
    default: return StringDisplay
  }
})

const editComponent = computed(() => {
  switch (props.column.type) {
    case 'number': return NumberEdit
    case 'boolean': return BooleanEdit
    case 'date': return DateEdit
    case 'select': return SelectEdit
    default: return StringEdit
  }
})

// Cell styling
const cellClass = computed(() => {
  const classes = []
  if (isEditing.value) classes.push('editing')
  if (!isEditable.value) classes.push('readonly')
  if (error.value) classes.push('error')
  return classes.join(' ')
})

// Validation
const validate = (val: any): string | null => {
  if (props.column.validator) {
    return props.column.validator(val)
  }
  return null
}

// Actions
const startEdit = () => {
  if (!isEditable.value) return
  isEditing.value = true
  error.value = null
  
  nextTick(() => {
    // Focus the input element
    const input = document.activeElement?.querySelector('input, select, textarea') as HTMLElement
    input?.focus()
  })
}

const onCommit = () => {
  const validationError = validate(editValue.value)
  if (validationError) {
    error.value = validationError
    return
  }
  
  error.value = null
  isEditing.value = false
  
  if (editValue.value !== props.value) {
    updateMutation.mutate({ 
      rowId: props.rowId, 
      columnId: props.column.id, 
      value: editValue.value 
    })
  }
}

const onCancel = () => {
  isEditing.value = false
  editValue.value = props.value
  error.value = null
}
</script>

<style lang="sass" scoped>
.cell-container
  transition: all 0.2s ease

.editing
  background-color: rgba(25, 118, 210, 0.05)
  border: 2px solid #1976d2
  border-radius: 4px
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1)

.edit-mode-container
  padding: 0
  margin: 0

.readonly
  cursor: not-allowed

.error
  background-color: rgba(244, 67, 54, 0.05)
  border: 2px solid #f44336
  border-radius: 4px
</style>
