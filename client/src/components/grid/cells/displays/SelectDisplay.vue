<template>
  <q-chip 
    :label="displayValue"
    size="sm"
    :color="chipColor"
    text-color="white"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ColumnConfig } from '@/lib/grid/types'

const props = defineProps<{
  value: any
  column: ColumnConfig
}>()

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return ''
  return String(props.value)
})

const chipColor = computed(() => {
  // Simple color mapping based on value
  const colors = ['primary', 'secondary', 'accent', 'positive', 'negative', 'info', 'warning']
  const index = displayValue.value.length % colors.length
  return colors[index]
})
</script>