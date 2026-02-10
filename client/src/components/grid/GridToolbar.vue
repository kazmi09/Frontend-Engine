<template>
  <div class="bg-white dark:bg-neutral-900 border-b px-6 py-3 flex items-center justify-between gap-4 flex-none">
    <!-- Left side: Search and Filter -->
    <div class="flex items-center gap-4 flex-1">
      <!-- Search Input -->
      <q-input
        v-model="searchText"
        outlined
        dense
        placeholder="Search..."
        style="min-width: 300px"
        clearable
        @clear="clearSearch"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <!-- Filter By Select -->
      <q-select
        v-model="filterBy"
        :options="filterOptions"
        outlined
        dense
        emit-value
        map-options
        placeholder="Filter by column"
        style="min-width: 180px"
        clearable
        @clear="clearFilter"
      >
        <template v-slot:prepend>
          <q-icon name="filter_list" />
        </template>
      </q-select>

      <!-- Active Filters Indicator -->
      <q-chip
        v-if="hasActiveFilters"
        removable
        @remove="gridStore.resetFilters"
        color="primary"
        text-color="white"
        icon="filter_list"
      >
        {{ activeFiltersCount }} filter{{ activeFiltersCount > 1 ? 's' : '' }}
      </q-chip>
    </div>

    <!-- Right side: Actions -->
    <div class="flex items-center gap-2">
      <!-- Column Visibility -->
      <q-btn-dropdown
        flat
        icon="view_column"
        label="Columns"
        dropdown-icon="expand_more"
      >
        <q-list>
          <q-item
            v-for="column in availableColumns"
            :key="column.id"
            clickable
            @click="toggleColumnVisibility(column.id)"
          >
            <q-item-section side>
              <q-checkbox
                :model-value="isColumnVisible(column.id)"
                @update:model-value="toggleColumnVisibility(column.id)"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ column.label }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <!-- Reset Layout -->
      <q-btn
        flat
        icon="restore"
        @click="gridStore.resetLayout"
      >
        <q-tooltip>Reset Layout</q-tooltip>
      </q-btn>

      <!-- Export (placeholder) -->
      <q-btn
        flat
        icon="download"
        @click="exportData"
      >
        <q-tooltip>Export Data</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useGridStore } from '@/lib/grid/store'
import { ColumnConfig } from '@/lib/grid/types'
import { useQuasar } from 'quasar'

const props = defineProps<{
  columns?: ColumnConfig[]
}>()

const emit = defineEmits<{
  columnVisibilityChanged: [visibility: Record<string, boolean>]
}>()

const gridStore = useGridStore()
const $q = useQuasar()

// Use storeToRefs to make store properties reactive in template
const { 
  searchText, 
  filterBy, 
  filters,
  columnVisibility,
  hasFilters,
  hasSearch
} = storeToRefs(gridStore)

// Available columns for filtering
const filterOptions = computed(() => {
  if (!props.columns) return []
  return props.columns.map(col => ({
    label: col.label,
    value: col.id
  }))
})

// Available columns for visibility toggle
const availableColumns = computed(() => props.columns || [])

// Active filters count
const hasActiveFilters = computed(() => hasFilters.value || hasSearch.value)
const activeFiltersCount = computed(() => {
  let count = 0
  if (hasSearch.value) count++
  if (hasFilters.value) count += Object.keys(filters.value).length
  return count
})

// Column visibility helpers
const isColumnVisible = (columnId: string) => {
  return columnVisibility.value[columnId] !== false
}

const toggleColumnVisibility = (columnId: string) => {
  console.log('[GridToolbar] Toggle column visibility:', { columnId, currentVisibility: columnVisibility.value })
  
  const newVisibility = {
    ...columnVisibility.value,
    [columnId]: !isColumnVisible(columnId)
  }
  
  console.log('[GridToolbar] New visibility state:', newVisibility)
  gridStore.setColumnVisibility(newVisibility)
  
  // IMPORTANT: Also persist to gridState store since this change comes from outside TanStack Table
  // The onColumnVisibilityChange handler in DataGrid won't fire for external changes
  emit('columnVisibilityChanged', newVisibility)
}

// Actions
const clearSearch = () => {
  gridStore.setSearchText('')
}

const clearFilter = () => {
  gridStore.setFilterBy('')
}

const exportData = () => {
  $q.notify({
    type: 'info',
    message: 'Export functionality coming soon',
    position: 'top-right'
  })
}
</script>

<style lang="sass" scoped>
.q-input, .q-select
  .q-field__control
    min-height: 40px
</style>