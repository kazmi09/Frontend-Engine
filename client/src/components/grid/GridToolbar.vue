<template>
  <div class="bg-white dark:bg-dark q-px-sm q-py-xs tw:border-b flex items-center justify-between gap-3 tw:flex-none tw:min-h-[48px]">
    <!-- Left side: Search and Filter -->
    <div class="tw:flex tw:items-center tw:gap-3 tw:flex-1 tw:min-w-0 tw:flex-wrap">
      <!-- Search Input -->
      <q-input
        :model-value="searchText"
        outlined
        dense
        placeholder="Search..."
        class="tw:min-w-[200px] tw:max-w-xs tw:flex-1"
        clearable
        @update:model-value="(val) => gridStore.setSearchText(val != null ? String(val) : '')"
        @clear="clearSearch"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <!-- Active Column Filter Chips -->
      <template v-if="hasColumnFilters">
        <q-chip
          v-for="(value, columnId) in activeColumnFilters"
          :key="columnId"
          removable
          @remove="gridStore.removeColumnFilter(String(columnId))"
          color="primary"
          text-color="white"
          size="sm"
          icon="filter_list"
        >
          {{ getColumnLabel(String(columnId)) }}: {{ formatFilterValue(value) }}
        </q-chip>
        <q-chip
          v-if="columnFilterCount > 1"
          removable
          @remove="gridStore.clearAllColumnFilters"
          color="red"
          text-color="white"
          size="sm"
          icon="filter_list_off"
        >
          Clear All ({{ columnFilterCount }})
        </q-chip>
      </template>

      <!-- Active Search Indicator -->
      <q-chip
        v-if="hasSearch"
        removable
        @remove="clearSearch"
        color="blue-grey"
        text-color="white"
        size="sm"
        icon="search"
      >
        Search: "{{ searchText }}"
      </q-chip>
    </div>

    <!-- Right side: Actions -->
    <div class="tw:flex tw:items-center tw:gap-1 tw:flex-none tw:flex-wrap tw:justify-end">
      <!-- Column Visibility -->
      <q-btn-dropdown
        flat
        dense
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
        dense
        icon="restore"
        @click="gridStore.resetLayout"
      >
        <q-tooltip>Reset Layout</q-tooltip>
      </q-btn>

      <!-- Grouping -->
      <q-btn-dropdown
        v-if="groupableColumns.length > 0"
        flat
        dense
        icon="workspaces"
        :label="hasActiveGrouping ? `Group By (${grouping.length})` : 'Group By'"
        dropdown-icon="expand_more"
        :color="hasActiveGrouping ? 'primary' : undefined"
      >
        <q-list>
          <q-item-label header>Group By Columns</q-item-label>
          <q-item
            v-for="column in groupableColumns"
            :key="column.id"
            clickable
            @click="toggleGrouping(column.id)"
          >
            <q-item-section side>
              <q-checkbox
                :model-value="isGroupedBy(column.id)"
                @update:model-value="toggleGrouping(column.id)"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ column.label }}</q-item-label>
              <q-item-label caption v-if="isGroupedBy(column.id)">
                Level {{ getGroupingLevel(column.id) + 1 }}
              </q-item-label>
            </q-item-section>
          </q-item>
          
          <q-separator v-if="hasActiveGrouping" />
          
          <q-item
            v-if="hasActiveGrouping"
            clickable
            @click="clearGrouping"
          >
            <q-item-section avatar>
              <q-icon name="clear" color="negative" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="tw:text-red-600">Clear All Grouping</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <!-- Export (placeholder) -->
      <q-btn
        flat
        dense
        icon="download"
        @click="exportData"
      >
        <q-tooltip>Export Data</q-tooltip>
      </q-btn>

      <!-- Role switcher for permission testing -->
      <q-select
        v-model="selectedRole"
        :options="roleOptions"
        outlined
        dense
        emit-value
        map-options
        label="Role"
        class="tw:min-w-[120px]"
      >
        <template v-slot:prepend>
          <q-icon name="person_outline" />
        </template>
      </q-select>
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
  groupableColumns?: string[] // List of column IDs that can be grouped
  /**
   * Currently active role used for permission testing.
   * When undefined, the toolbar will default to "admin" for the dropdown label only;
   * it does not mutate the underlying auth user.
   */
  activeRole?: string | null
}>()

const emit = defineEmits<{
  columnVisibilityChanged: [visibility: Record<string, boolean>]
  roleChanged: [role: string]
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
  hasSearch,
  hasColumnFilters,
  activeColumnFilters,
  grouping
} = storeToRefs(gridStore)

// Fixed demo/testing roles. These are generic, not dataset-specific,
// and simply drive the client-side permission resolver.
const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Viewer', value: 'viewer' }
]

// Two-way binding helper for the role dropdown
const selectedRole = computed({
  get: () => props.activeRole ?? 'admin',
  set: (value: string) => {
    emit('roleChanged', value)
  }
})

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

// Groupable columns - filter by groupableColumns prop or allow all
const groupableColumns = computed(() => {
  if (!props.columns) return []
  if (!props.groupableColumns || props.groupableColumns.length === 0) {
    // If no specific groupable columns defined, allow all columns
    return props.columns
  }
  // Filter to only groupable columns
  return props.columns.filter(col => props.groupableColumns?.includes(col.id))
})

// Column filter count
const columnFilterCount = computed(() => Object.keys(activeColumnFilters.value).length)

// Get column label by id
const getColumnLabel = (columnId: string): string => {
  const col = props.columns?.find(c => c.id === columnId)
  return col?.label || columnId
}

// Format filter value for display in chip
const formatFilterValue = (value: any): string => {
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  return String(value)
}

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

const exportData = () => {
  $q.notify({
    type: 'info',
    message: 'Export functionality coming soon',
    position: 'top-right'
  })
}

// Grouping helpers
const isGroupedBy = (columnId: string) => {
  return grouping.value.includes(columnId)
}

const hasActiveGrouping = computed(() => {
  return grouping.value.length > 0
})

const toggleGrouping = (columnId: string) => {
  const currentGrouping = [...grouping.value]
  const index = currentGrouping.indexOf(columnId)
  
  if (index >= 0) {
    // Remove from grouping
    currentGrouping.splice(index, 1)
  } else {
    // Add to grouping
    currentGrouping.push(columnId)
  }
  
  gridStore.setGrouping(currentGrouping)
}

const clearGrouping = () => {
  gridStore.setGrouping([])
}

const getGroupingLevel = (columnId: string): number => {
  return grouping.value.indexOf(columnId)
}
</script>

<style lang="sass" scoped>
.q-input, .q-select
  :deep(.q-field__control)
    min-height: 32px
    height: 32px
</style>
