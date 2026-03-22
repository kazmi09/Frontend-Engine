<template>
  <q-toggle
    v-model="localValue"
    dense
    :label="localValue ? 'Yes' : 'No'"
    class="boolean-editor"
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

<style lang="sass" scoped>
.boolean-editor
  min-height: 32px
  height: 32px
  display: flex
  align-items: center
</style>
