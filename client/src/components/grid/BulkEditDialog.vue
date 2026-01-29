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
          
          <!-- Special Salary Adjustment for Admin -->
          <div v-if="hasSalaryColumn" class="border-t pt-4">
            <label class="text-sm font-medium text-gray-700 mb-2 block">
              Salary Adjustment
            </label>
            <div class="flex gap-2">
              <q-select
                v-model="salaryAdjustmentType"
                :options="salaryAdjustmentOptions"
                outlined
                dense
                style="min-width: 120px"
              />
              <q-input
                v-model.number="salaryAdjustmentValue"
                type="number"
                outlined
                dense
                :placeholder="salaryAdjustmentType === 'percentage' ? 'Percentage' : 'Amount'"
                :suffix="salaryAdjustmentType === 'percentage' ? '%' : '$'"
              />
            </div>
            <div class="text-caption text-grey-6 mt-1">
              {{ salaryAdjustmentType === 'percentage' ? 'Increase/decrease salary by percentage' : 'Add/subtract fixed amount' }}
            </div>
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

// Salary adjustment
const salaryAdjustmentType = ref<'percentage' | 'amount'>('percentage')
const salaryAdjustmentValue = ref<number | null>(null)

const salaryAdjustmentOptions = [
  { label: 'Percentage', value: 'percentage' },
  { label: 'Fixed Amount', value: 'amount' }
]

const booleanOptions = [
  { label: 'Yes', value: true },
  { label: 'No', value: false }
]

// Computed
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const hasSalaryColumn = computed(() => {
  return props.columns.some(col => col.id === 'salary')
})

const hasChanges = computed(() => {
  const hasFormChanges = Object.values(formData.value).some(value => 
    value !== null && value !== undefined && value !== ''
  )
  const hasSalaryChanges = salaryAdjustmentValue.value !== null && salaryAdjustmentValue.value !== undefined
  return hasFormChanges || hasSalaryChanges
})

// Methods
const cancel = () => {
  isOpen.value = false
  resetForm()
}

const save = () => {
  const updates: Record<string, any> = {}
  
  // Add regular field updates
  Object.keys(formData.value).forEach(key => {
    const value = formData.value[key]
    if (value !== null && value !== undefined && value !== '') {
      updates[key] = value
    }
  })
  
  // Add salary adjustment if specified
  if (salaryAdjustmentValue.value !== null && salaryAdjustmentValue.value !== undefined) {
    updates._salaryAdjustment = {
      type: salaryAdjustmentType.value,
      value: salaryAdjustmentValue.value
    }
  }
  
  emit('save', updates)
  resetForm()
}

const resetForm = () => {
  formData.value = {}
  salaryAdjustmentType.value = 'percentage'
  salaryAdjustmentValue.value = null
}

// Reset form when dialog opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})
</script>