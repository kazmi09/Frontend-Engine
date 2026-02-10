<template>
  <div class="h-screen w-full flex flex-col bg-slate-50 dark:bg-neutral-950 overflow-hidden">
    <!-- Top Navigation -->
    <header class="h-14 border-b bg-white dark:bg-neutral-900 flex items-center px-6 justify-between flex-none z-30">
      <div class="flex items-center gap-4">
        <q-icon :name="gridIcon" size="md" class="text-primary" />
        <h1 class="text-xl font-semibold">{{ gridTitle }}</h1>
      </div>
      
      <div class="flex items-center gap-2">
        <q-btn
          flat
          round
          icon="refresh"
          @click="() => refetch()"
          :loading="isRefetching"
          class="text-gray-600"
        >
          <q-tooltip>Refresh Data</q-tooltip>
        </q-btn>
        
        <q-btn
          flat
          icon="arrow_back"
          label="Back"
          @click="$router.back()"
          class="text-gray-600"
        />
      </div>
    </header>

    <!-- Grid Toolbar -->
    <GridToolbar 
      :columns="data?.columns"
      @column-visibility-changed="handleColumnVisibilityChanged"
    />

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <div v-if="error" class="p-4">
        <q-banner class="text-negative">
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          Error loading data: {{ error.message }}
        </q-banner>
      </div>
      
      <div v-else-if="isLoading" class="flex-1 flex items-center justify-center">
        <q-spinner-dots size="50px" color="primary" />
      </div>
      
      <DataGrid 
        v-else-if="data" 
        :data="data" 
        :is-loading="isLoading"
        :has-next-page="useInfiniteScrollMode ? (hasNextPage || false) : false"
        :is-fetching-next="useInfiniteScrollMode ? (isInfiniteFetching || false) : false"
        class="flex-1"
        @load-more="() => useInfiniteScrollMode && fetchNextPage()"
        @bulk-edit="handleBulkEdit"
        @bulk-archive="handleBulkArchive"
        @bulk-delete="handleBulkDelete"
        @export="handleExport"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/vue-query'
import { useQuasar } from 'quasar'
import { createGridApi } from '@/lib/api/generic-grid'
import { useGridStore } from '@/lib/grid/store'
import { useGridStateStore } from '@/stores/gridState'
import { DataResult } from '@/lib/grid/types'
import DataGrid from '@/components/grid/DataGrid.vue'
import GridToolbar from '@/components/grid/GridToolbar.vue'
import GenericDetailPanel from '@/components/grid/GenericDetailPanel.vue'

const route = useRoute()
const queryClient = useQueryClient()
const gridStore = useGridStore()
const gridStateStore = useGridStateStore()
const $q = useQuasar()

// Get gridId from route parameter
const gridId = computed(() => route.params.gridId as string)

// Grid metadata (you could fetch this from an API or config)
const gridMetadata = computed(() => {
  const metadata: Record<string, { title: string; icon: string }> = {
    employees: { title: 'Employees', icon: 'people' },
    users: { title: 'Users', icon: 'person' },
    products: { title: 'Products', icon: 'inventory' },
    orders: { title: 'Orders', icon: 'shopping_cart' },
    customers: { title: 'Customers', icon: 'business' }
  }
  return metadata[gridId.value] || { title: gridId.value, icon: 'table_chart' }
})

const gridTitle = computed(() => gridMetadata.value.title)
const gridIcon = computed(() => gridMetadata.value.icon)

// Create generic API for current grid
const gridApi = computed(() => createGridApi({ 
  gridId: gridId.value,
  expandableComponent: GenericDetailPanel
}))

// Use storeToRefs to make store properties reactive
const { pageIndex, pageSize, searchText, filterBy } = storeToRefs(gridStore)

// Determine if we should use infinite scroll (for large page sizes)
const useInfiniteScrollMode = computed(() => pageSize.value >= 1000)
const CHUNK_SIZE = 100 // Load 100 rows at a time

// Regular query for normal page sizes
const { 
  data: regularData, 
  isLoading: isRegularLoading, 
  isRefetching: isRegularRefetching, 
  refetch: refetchRegular, 
  error: regularError 
} = useQuery<DataResult, Error>({
  queryKey: computed(() => {
    return [`${gridId.value}_regular`, pageIndex.value, pageSize.value, searchText.value, filterBy.value]
  }),
  queryFn: () => {
    return gridApi.value.getAll(pageIndex.value, pageSize.value, searchText.value, filterBy.value)
  },
  enabled: computed(() => !useInfiniteScrollMode.value),
  staleTime: 60_000,
})

// Infinite query for large page sizes
const {
  data: infiniteData,
  isLoading: isInfiniteLoading,
  isFetching: isInfiniteFetching,
  fetchNextPage,
  hasNextPage,
  refetch: refetchInfinite,
  error: infiniteError
} = useInfiniteQuery({
  queryKey: computed(() => {
    return [`${gridId.value}_infinite`, searchText.value, filterBy.value]
  }),
  queryFn: async ({ pageParam = 0 }) => {
    return gridApi.value.getAll(pageParam, CHUNK_SIZE, searchText.value, filterBy.value)
  },
  getNextPageParam: (lastPage, allPages) => {
    const loadedRows = allPages.reduce((sum, page) => sum + page.rows.length, 0)
    const totalRows = lastPage.pagination?.totalRows || 0
    return loadedRows < totalRows ? allPages.length : undefined
  },
  enabled: computed(() => useInfiniteScrollMode.value),
  staleTime: 60_000,
})

// Combine data from infinite query pages
const combinedInfiniteData = computed<DataResult | undefined>(() => {
  if (!infiniteData.value?.pages) return undefined
  
  const pages = infiniteData.value.pages
  const firstPage = pages[0]
  
  return {
    ...firstPage,
    rows: pages.flatMap(page => page.rows),
    pagination: {
      ...firstPage.pagination,
      pageSize: pages.reduce((sum, page) => sum + page.rows.length, 0),
      pageIndex: 0
    }
  }
})

// Unified data, loading, and error states
const data = computed(() => useInfiniteScrollMode.value ? combinedInfiniteData.value : regularData.value)
const isLoading = computed(() => useInfiniteScrollMode.value ? isInfiniteLoading.value : isRegularLoading.value)
const isRefetching = computed(() => useInfiniteScrollMode.value ? isInfiniteFetching.value : isRegularRefetching.value)
const error = computed(() => useInfiniteScrollMode.value ? infiniteError.value : regularError.value)

const refetch = () => {
  if (useInfiniteScrollMode.value) {
    refetchInfinite()
  } else {
    refetchRegular()
  }
}

// Invalidate cache when pagination, search, or filter changes
watch([pageIndex, pageSize, searchText, filterBy], () => {
  if (useInfiniteScrollMode.value) {
    queryClient.invalidateQueries({ queryKey: [`${gridId.value}_infinite`] })
  } else {
    queryClient.invalidateQueries({ queryKey: [`${gridId.value}_regular`] })
  }
})

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
      message: `Successfully updated ${data.selectedIds.length} records`,
      position: 'top'
    })
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: [`${gridId.value}_generic`] })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to update records',
      position: 'top'
    })
  }
}

const handleBulkArchive = async (selectedIds: string[]) => {
  try {
    await gridApi.value.bulkArchive(selectedIds)
    $q.notify({
      type: 'positive',
      message: `Successfully archived ${selectedIds.length} records`,
      position: 'top'
    })
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: [`${gridId.value}_generic`] })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to archive records',
      position: 'top'
    })
  }
}

const handleBulkDelete = async (selectedIds: string[]) => {
  try {
    await gridApi.value.bulkDelete(selectedIds)
    $q.notify({
      type: 'positive',
      message: `Successfully deleted ${selectedIds.length} records`,
      position: 'top'
    })
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: [`${gridId.value}_generic`] })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete records',
      position: 'top'
    })
  }
}

const handleExport = async (selectedIds: string[]) => {
  try {
    await gridApi.value.exportSelected(selectedIds)
    $q.notify({
      type: 'positive',
      message: `Successfully exported ${selectedIds.length} records`,
      position: 'top'
    })
  } catch (error: any) {
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to export records',
      position: 'top'
    })
  }
}
</script>
