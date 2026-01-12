<template>
  <div class="flex items-center">
    <q-icon 
      :name="displayValue ? 'check_circle' : 'cancel'"
      :color="displayValue ? 'positive' : 'negative'"
      size="sm"
    />
    <span class="ml-2 text-sm">{{ displayValue ? 'Yes' : 'No' }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ColumnConfig } from '@/lib/grid/types'

const props = defineProps<{
  value: any
  column: ColumnConfig
}>()

const displayValue = computed(() => {
  return Boolean(props.value)
})
</script>