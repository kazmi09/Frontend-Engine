<template>
  <span class="text-sm font-mono text-right">{{ displayValue }}</span>
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
  const num = Number(props.value)
  if (isNaN(num)) return props.value
  return num.toLocaleString()
})
</script>