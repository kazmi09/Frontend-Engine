<template>
  <q-toggle
    v-model="localValue"
    :label="localValue ? 'Yes' : 'No'"
    @update:model-value="handleChange"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ColumnConfig } from '@/lib/grid/types'

const props = defineProps<{
  modelValue: any
  column: ColumnConfig
  error?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'save': []
  'cancel': []
}>()

const localValue = ref(Boolean(props.modelValue))

// Watch for changes and emit
watch(localValue, (newValue) => {
  emit('update:modelValue', newValue)
})

const handleChange = () => {
  // Auto-save on toggle
  emit('save')
}
</script>