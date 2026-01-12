<template>
  <span class="text-sm">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ColumnConfig } from '@/lib/grid/types'

const props = defineProps<{
  value: any
  column: ColumnConfig
}>()

const displayValue = computed(() => {
  if (!props.value) return ''
  
  try {
    const date = new Date(props.value)
    if (isNaN(date.getTime())) return props.value
    
    return date.toLocaleDateString()
  } catch {
    return props.value
  }
})
</script>