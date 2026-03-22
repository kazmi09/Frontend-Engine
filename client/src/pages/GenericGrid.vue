<template>
  <div class="tw:h-full tw:w-full tw:flex tw:flex-col tw:bg-slate-50 dark:tw:bg-neutral-950 tw:overflow-hidden">
    <!-- Top Navigation -->
    <header class="tw:h-12 tw:border-b tw:bg-white dark:tw:bg-neutral-900 tw:flex tw:items-center tw:px-4 tw:justify-between tw:flex-none tw:z-30">
      <div class="tw:flex tw:items-center tw:gap-4">
        <q-icon :name="gridIcon" size="md" class="text-primary" />
      </div>
      
      <div class="tw:flex tw:items-center tw:gap-2">
        <q-btn
          flat
          dense
          round
          icon="refresh"
          @click="() => refetch()"
          :loading="isRefetching"
          class="tw:text-gray-600"
        >
          <q-tooltip>Refresh Data</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          dense
          icon="arrow_back"
          label="Back"
          @click="$router.back()"
          class="tw:text-gray-600"
        />
      </div>
    </header>

    <!-- Grid Toolbar -->
    <GridToolbar 
      :columns="permissionAwareData?.columns"
      :groupable-columns="data?.grouping?.enabled ? (data?.columns?.map(c => c.id) || []) : []"
      :active-role="effectiveRole"
      @column-visibility-changed="handleColumnVisibilityChanged"
      @role-changed="handleRoleChanged"
    />

    <!-- Main Content Area -->
    <main class="tw:flex-1 tw:flex tw:flex-col tw:overflow-hidden">
      <div v-if="error" class="tw:p-4">
        <q-banner class="text-negative">
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          Error loading data: {{ error.message }}
        </q-banner>
      </div>
      
      <!-- Show skeleton on initial load -->
      <div v-else-if="isLoading && !data" class="tw:flex-1 tw:overflow-hidden">
        <div class="tw:flex-1 tw:overflow-auto tw:border tw:border-gray-200 dark:tw:border-gray-700 tw:rounded-lg tw:bg-white tw:m-6">
          <q-markup-table flat bordered class="skeleton-table">
            <thead>
              <tr>
                <th class="tw:text-left" style="width: 50px">
                  <q-skeleton type="QCheckbox" animation="wave" />
                </th>
                <th v-for="i in 7" :key="i" class="tw:text-left">
                  <q-skeleton type="text" animation="wave" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 15" :key="i">
                <td>
                  <q-skeleton type="QCheckbox" animation="wave" />
                </td>
                <td v-for="j in 7" :key="j">
                  <q-skeleton type="text" :width="`${50 + (j * 10)}%`" animation="wave" />
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </div>
      
      <DataGrid 
        v-else-if="permissionAwareData" 
        :data="permissionAwareData" 
        :is-loading="isLoading"
        :has-next-page="hasNextPage || false"
        :is-fetching-next="isRefetching || false"
        :grouping-config="(gridConfig as any)?.grouping"
        :display-name="displayName"
        :display-name-plural="displayNamePlural"
        :active-role="effectiveRole"
        class="tw:flex-1"
        @load-more="() => fetchNextPage()"
        @bulk-edit="handleBulkEdit"
        @bulk-archive="handleBulkArchive"
        @bulk-delete="handleBulkDelete"
        @export="handleExport"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useQuasar } from 'quasar'
import { createGridApi } from '@/lib/api/generic-grid'
import { useGridStore } from '@/lib/grid/store'
import { useGridStateStore } from '@/stores/gridState'
import { DataResult } from '@/lib/grid/types'
import { useAuthStore } from '@/lib/auth/store'
import { resolveColumnPermissions } from '@/lib/grid/permissions'
import DataGrid from '@/components/grid/DataGrid.vue'
import GridToolbar from '@/components/grid/GridToolbar.vue'
import GenericDetailPanel from '@/components/grid/GenericDetailPanel.vue'

const route = useRoute()
const queryClient = useQueryClient()
const gridStore = useGridStore()
const gridStateStore = useGridStateStore()
const authStore = useAuthStore()
const $q = useQuasar()

// Get gridId from route parameter
const gridId = computed(() => route.params.gridId as string)

// Fetch grid config to get metadata
const { data: gridConfig } = useQuery({
  queryKey: computed(() => ['gridConfig', gridId.value]),
  queryFn: async () => {
    const response = await fetch(`/api/grid/${gridId.value}/config`)
    if (!response.ok) throw new Error('Failed to fetch grid config')
    return response.json()
  }
})

// Grid metadata from config
const gridTitle = computed(() => gridConfig.value?.name || gridId.value)
const gridIcon = computed(() => gridConfig.value?.icon || 'table_chart')
const displayName = computed(() => gridConfig.value?.displayName || 'item')
const displayNamePlural = computed(() => gridConfig.value?.displayNamePlural || 'items')

// Create generic API for current grid
const gridApi = computed(() => createGridApi({ 
  gridId: gridId.value,
  expandableComponent: GenericDetailPanel
}))

// Use storeToRefs to make store properties reactive
const { searchText, filterBy } = storeToRefs(gridStore)
const { user } = storeToRefs(authStore)

// Active role for permission testing / demos.
// Defaults to the authenticated user role but can be overridden via the toolbar.
const activeRole = ref<string | null>(user.value?.role ?? null)
const effectiveRole = computed(() => activeRole.value || user.value?.role || null)

const CHUNK_SIZE = 100 // Load 100 rows at a time

// Infinite scroll is the only data-fetching path
const {
  data: infiniteData,
  isLoading,
  isFetching: isRefetching,
  fetchNextPage,
  hasNextPage,
  refetch,
  error
} = useInfiniteQuery<DataResult, Error>({
  queryKey: computed(() => [`${gridId.value}_infinite`, searchText.value, filterBy.value]),
  queryFn: async ({ pageParam }) => {
    return gridApi.value.getAll(pageParam as number, CHUNK_SIZE, searchText.value, filterBy.value) as Promise<DataResult>
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage: DataResult, allPages: DataResult[]) => {
    const loadedRows = allPages.reduce((sum, page) => sum + page.rows.length, 0)
    const totalRows = lastPage.pagination?.totalRows || 0
    return loadedRows < totalRows ? allPages.length : undefined
  },
  staleTime: 0,
  gcTime: 0,
})

// Combine data from all loaded pages
const data = computed<DataResult | undefined>(() => {
  if (!infiniteData.value?.pages) return undefined
  const pages = infiniteData.value.pages as DataResult[]
  const firstPage = pages[0]
  return {
    ...firstPage,
    rows: pages.flatMap((page) => page.rows),
    pagination: {
      ...firstPage.pagination,
      pageSize: pages.reduce((sum, page) => sum + page.rows.length, 0),
      pageIndex: 0
    }
  } as DataResult
})

// Apply config-driven, role-based column permissions on the client.
// This keeps the grid engine completely data-agnostic: it only consumes
// declarative permissions from the configuration and the current (or test) role.
const permissionAwareData = computed<DataResult | undefined>(() => {
  if (!data.value) return undefined

  const role = effectiveRole.value
  const columns = data.value.columns || []

  const resolvedColumns = resolveColumnPermissions(columns, role)

  return {
    ...data.value,
    columns: resolvedColumns,
  }
})

const handleRoleChanged = (role: string) => {
  activeRole.value = role
}

// Column visibility handler
const handleColumnVisibilityChanged = (visibility: Record<string, boolean>) => {
  Object.keys(visibility).forEach(columnId => {
    gridStateStore.updateColumnVisibility(gridId.value, columnId, visibility[columnId])
  })
}

// Bulk action handlers
const handleBulkEdit = async (data: { selectedIds: string[], updates: Record<string, any> }) => {
  try {
    await gridApi.value.bulkEdit(data.selectedIds, data.updates)
    $q.notify({
      type: 'positive',
      message: `Successfully updated ${data.selectedIds.length} ${displayNamePlural.value}`,
      position: 'top'
    })
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: [`${gridId.value}_generic`] })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || `Failed to update ${displayNamePlural.value}`,
      position: 'top'
    })
  }
}

const handleBulkArchive = async (selectedIds: string[]) => {
  try {
    await gridApi.value.bulkArchive(selectedIds)
    $q.notify({
      type: 'positive',
      message: `Successfully archived ${selectedIds.length} ${displayNamePlural.value}`,
      position: 'top'
    })
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: [`${gridId.value}_generic`] })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || `Failed to archive ${displayNamePlural.value}`,
      position: 'top'
    })
  }
}

const handleBulkDelete = async (selectedIds: string[]) => {
  try {
    await gridApi.value.bulkDelete(selectedIds)
    $q.notify({
      type: 'positive',
      message: `Successfully deleted ${selectedIds.length} ${displayNamePlural.value}`,
      position: 'top'
    })
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: [`${gridId.value}_generic`] })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || `Failed to delete ${displayNamePlural.value}`,
      position: 'top'
    })
  }
}

const handleExport = async (selectedIds: string[]) => {
  try {
    await gridApi.value.exportSelected(selectedIds)
    $q.notify({
      type: 'positive',
      message: `Successfully exported ${selectedIds.length} ${displayNamePlural.value}`,
      position: 'top'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || `Failed to export ${displayNamePlural.value}`,
      position: 'top'
    })
  }
}
</script>


<style lang="sass" scoped>
.skeleton-table
  :deep(thead)
    background-color: #f5f5f5
    
  :deep(th)
    padding: 8px 16px
    font-weight: 500
    
  :deep(td)
    padding: 8px 16px
    
  :deep(tbody tr)
    transition: background-color 0.2s
    
    &:hover
      background-color: #fafafa
</style>
