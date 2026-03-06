<template>
  <div 
    class="tw-flex tw-items-center tw-gap-2 tw-py-2 tw-px-4 tw-cursor-pointer hover:tw-bg-gray-100 dark:hover:tw-bg-gray-800 tw-transition-colors"
    :class="[
      'tw-font-medium',
      `tw-pl-${(level * 4) + 4}`,
      {
        'tw-bg-gray-50 dark:tw-bg-gray-900': level === 0,
        'tw-bg-gray-100/50 dark:tw-bg-gray-800/50': level === 1,
        'tw-bg-gray-200/30 dark:tw-bg-gray-700/30': level >= 2,
      }
    ]"
    @click="toggleExpansion"
  >
    <!-- Expand/Collapse Icon -->
    <q-icon 
      :name="isExpanded ? 'expand_more' : 'chevron_right'"
      size="sm"
      class="tw-text-gray-600 dark:tw-text-gray-400"
    />

    <!-- Group Label -->
    <span class="tw-flex-1 tw-text-sm">
      {{ groupLabel }}
    </span>

    <!-- Count Badge -->
    <q-badge 
      v-if="showCount"
      :label="count"
      color="primary"
      class="tw-ml-2"
    />

    <!-- Summary Information -->
    <div v-if="showSummary && summary && Object.keys(summary).length > 0" class="tw-flex tw-gap-4 tw-ml-4">
      <div 
        v-for="(value, key) in summary" 
        :key="key"
        class="tw-text-xs tw-text-gray-600 dark:tw-text-gray-400"
      >
        <span class="tw-font-medium">{{ key }}:</span>
        <span class="tw-ml-1">{{ formatSummaryValue(value) }}</span>
      </div>
    </div>

    <!-- Actions -->
    <div class="tw-flex tw-gap-1 tw-ml-2" @click.stop>
      <q-btn
        v-if="level === 0"
        flat
        dense
        size="xs"
        icon="unfold_more"
        @click="expandAll"
      >
        <q-tooltip>Expand All</q-tooltip>
      </q-btn>
      
      <q-btn
        v-if="level === 0"
        flat
        dense
        size="xs"
        icon="unfold_less"
        @click="collapseAll"
      >
        <q-tooltip>Collapse All</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QIcon, QBadge, QBtn, QTooltip } from 'quasar'

interface Props {
  groupLabel: string
  count: number
  isExpanded: boolean
  level: number
  summary?: Record<string, any>
  showCount?: boolean
  showSummary?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCount: true,
  showSummary: true,
})

const emit = defineEmits<{
  toggle: []
  expandAll: []
  collapseAll: []
}>()

const toggleExpansion = () => {
  emit('toggle')
}

const expandAll = () => {
  emit('expandAll')
}

const collapseAll = () => {
  emit('collapseAll')
}

const formatSummaryValue = (value: any): string => {
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  return String(value)
}
</script>

<style scoped>
/* Dynamic padding based on level */
.tw-pl-4 { padding-left: 1rem; }
.tw-pl-8 { padding-left: 2rem; }
.tw-pl-12 { padding-left: 3rem; }
.tw-pl-16 { padding-left: 4rem; }
.tw-pl-20 { padding-left: 5rem; }
</style>
