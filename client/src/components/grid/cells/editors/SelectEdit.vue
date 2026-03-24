<template>
  <q-select
    ref="selectRef"
    v-model="localValue"
    :options="options"
    dense
    borderless
    emit-value
    map-options
    :error="!!error"
    :error-message="error"
    hide-bottom-space
    class="clean-input"
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

<style lang="sass" scoped>
.clean-input
  width: 100%

  :deep(.q-field__control)
    padding: 0 8px
    min-height: 32px
    height: 32px
    
  :deep(.q-field__native)
    padding: 0
    font-size: 0.875rem
    min-height: 32px
    height: 32px
    
  :deep(.q-field__selected-item)
    font-size: 0.875rem
    
  :deep(.q-field__control:before)
    border: none
    
  :deep(.q-field__control:after)
    border: none
</style>
