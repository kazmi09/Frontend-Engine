<template>
  <div class="tw:flex tw:items-center">
    <q-icon 
      :name="value ? 'check_circle' : 'cancel'"
      :color="value ? 'positive' : 'negative'"
      size="xs"
    />
    <span class="tw:ml-2 tw:text-sm">{{ displayValue ? 'Yes' : 'No' }}</span>
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
