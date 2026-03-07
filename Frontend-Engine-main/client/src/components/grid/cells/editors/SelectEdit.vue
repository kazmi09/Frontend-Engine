<template>
  <q-select
    ref="selectRef"
    v-model="localValue"
    :options="options"
    dense
    outlined
    emit-value
    map-options
    :error="!!error"
    :error-message="error"
    @blur="$emit('save')"
    @keydown.enter="$emit('save')"
    @keydown.escape="$emit('cancel')"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
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

const selectRef = ref()
const localValue = ref(props.modelValue)

const options = computed(() => {
  return (props.column.options || []).map(option => ({
    label: option,
    value: option
  }))
})

// Watch for changes and emit
watch(localValue, (newValue) => {
  emit('update:modelValue', newValue)
})

onMounted(() => {
  selectRef.value?.focus()
})
</script>