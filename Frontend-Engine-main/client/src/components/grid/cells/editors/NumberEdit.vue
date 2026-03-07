<template>
  <q-input
    ref="inputRef"
    v-model.number="localValue"
    type="number"
    dense
    outlined
    :error="!!error"
    :error-message="error"
    @blur="$emit('save')"
    @keydown.enter="$emit('save')"
    @keydown.escape="$emit('cancel')"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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

const inputRef = ref()
const localValue = ref(Number(props.modelValue) || 0)

// Watch for changes and emit
watch(localValue, (newValue) => {
  emit('update:modelValue', newValue)
})

onMounted(() => {
  inputRef.value?.focus()
})
</script>