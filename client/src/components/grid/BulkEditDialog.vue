<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 500px; max-width: 700px">
      <q-card-section>
        <div class="text-h6">Bulk Edit {{ selectedCount }} Items</div>
        <div class="text-caption text-grey-6">
          Only fields with values will be updated. Leave fields empty to keep existing values.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="grid grid-cols-1 gap-4">
          <div v-for="column in columns" :key="column.id" class="flex flex-col gap-2">
            <label class="text-sm font-medium text-gray-700">
              {{ column.label }}
            </label>
            
            <!-- String Input -->
            <q-input
              v-if="column.type === 'string'"
              v-model="formData[column.id]"
              outlined
              dense
              :placeholder="`Update ${column.label.toLowerCase()}`"
              clearable
            />
            
            <!-- Number Input -->
            <q-input
              v-else-if="column.type === 'number'"
              v-model.number="formData[column.id]"
              type="number"
              outlined
              dense
              :placeholder="`Update ${column.label.toLowerCase()}`"
              clearable
            />
            
            <!-- Date Input -->
            <q-input
              v-else-if="column.type === 'date'"
              v-model="formData[column.id]"
              type="date"
              outlined
              dense
              clearable
            />
            
            <!-- Boolean Input -->
            <q-select
              v-else-if="column.type === 'boolean'"
              v-model="formData[column.id]"
              :options="booleanOptions"
              outlined
              dense
              emit-value
              map-options
              clearable
              :placeholder="`Update ${column.label.toLowerCase()}`"
            />
            
            <!-- Select Input -->
            <q-select
              v-else-if="column.type === 'select' && column.options"
              v-model="formData[column.id]"
              :options="column.options"
              outlined
              dense
              clearable
              :placeholder="`Update ${column.label.toLowerCase()}`"
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" @click="cancel" />
        <q-btn 
          flat 
          label="Update Items" 
          color="primary" 
          @click="save"
          :disable="!hasChanges"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ColumnConfig } from '@/lib/grid/types'

const props = defineProps<{
  modelValue: boolean
  selectedCount: number
  columns: ColumnConfig[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [updates: Record<string, any>]
}>()

// Form data
const formData = ref<Record<string, any>>({})

const booleanOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const hasChanges = computed(() => {
  return Object.values(formData.value).some(value => 
    value !== null && value !== undefined && value !== ''
  )
})

// Methods
const cancel = () => {
  isOpen.value = false
  resetForm()
}

const save = () => {
  const updates: Record<string, any> = {}
  
  // Add field updates
  Object.keys(formData.value).forEach(key => {
    const value = formData.value[key]
    if (value !== null && value !== undefined && value !== '') {
      updates[key] = value
    }
  })
  
  emit('save', updates)
  resetForm()
}

const resetForm = () => {
  formData.value = {}
}

// Reset form when dialog opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})
</script>