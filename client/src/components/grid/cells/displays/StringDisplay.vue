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
  if (props.value === null || props.value === undefined) return ''
  return String(props.value)
})
</script>