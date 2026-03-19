<template>
  <div 
    class="relative w-full h-full flex items-center cell-container"
    :style="{ minHeight: '40px', height: '40px' }"
    :class="cellClass"
    @click="startEdit"
  >
    <!-- Display Mode -->
    <div 
      v-if="!isEditing" 
      class="w-full px-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded overflow-hidden transition-colors"
      :class="{ 'opacity-50': !isEditable }"
    >
      <div class="truncate">
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
    <div v-else class="w-full h-full flex items-center edit-mode-container">
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
    <div v-if="isCellLoading" class="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
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
      class="absolute top-2 right-2 text-negative"
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

// Permissions
const hasPermission = computed(() => 
  !props.column.requiredPermissions || 
  props.column.requiredPermissions.includes(authStore.user.role)
)

const isEditable = computed(() => 
  props.column.editable && hasPermission.value
)

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