<template>
  <q-input
    ref="inputRef"
    v-model="localValue"
    dense
    borderless
    :error="!!error"
    :error-message="error"
    class="clean-input"
    input-class="text-sm"
    @blur="$emit('save')"
    @keydown.enter.prevent="$emit('save')"
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
const localValue = ref(props.modelValue)

// Watch for changes and emit
watch(localValue, (newValue) => {
  emit('update:modelValue', newValue)
})

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<style lang="sass" scoped>
.clean-input
  :deep(.q-field__control)
    padding: 0 8px
    min-height: 36px
    
  :deep(.q-field__native)
    padding: 0
    
  :deep(.q-field__control:before)
    border: none
    
  :deep(.q-field__control:after)
    border: none
</style>