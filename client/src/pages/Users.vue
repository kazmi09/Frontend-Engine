<template>
  <div class="h-screen w-full flex flex-col bg-slate-50 dark:bg-neutral-950 overflow-hidden">
    <!-- Top Navigation -->
    <header class="h-14 border-b bg-white dark:bg-neutral-900 flex items-center px-6 justify-between flex-none z-30">
      <div class="flex items-center gap-4">
        <q-icon name="people" size="md" class="text-primary" />
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
          label="Back to Employees"
          @click="$router.push('/')"
          class="text-gray-600"
        />
      </div>
    </header>

    <!-- Grid Toolbar -->
    <GridToolbar :columns="data?.columns" />

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
        class="flex-1"
        @bulk-edit="handleBulkEdit"
        @bulk-archive="handleBulkArchive"
        @bulk-delete="handleBulkDelete"
        @export="handleExport"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useQuasar } from 'quasar'
import { createGridApi } from '@/lib/api/generic-grid'
import { useGridStore } from '@/lib/grid/store'
import { DataResult } from '@/lib/grid/types'
import DataGrid from '@/components/grid/DataGrid.vue'
import GridToolbar from '@/components/grid/GridToolbar.vue'
import GenericDetailPanel from '@/components/grid/GenericDetailPanel.vue'

const queryClient = useQueryClient()
const gridStore = useGridStore()
const $q = useQuasar()

// Use storeToRefs to make store properties reactive
const { pageIndex, pageSize, searchText, filterBy } = storeToRefs(gridStore)

// Create generic API for users grid (DummyJSON API)
const usersApi = createGridApi({ 
  gridId: 'users',
  expandableComponent: GenericDetailPanel
})

// React Query: fetch users with client-side pagination and search
const { data, isLoading, isRefetching, refetch, error } = useQuery<DataResult, Error>({
  queryKey: computed(() => {
    const key = ["users_generic", pageIndex.value, pageSize.value, searchText.value, filterBy.value]
    console.log('Users query key:', key)
    return key
  }),
  queryFn: () => {
    console.log('Executing users query function...')
    return usersApi.getAll(pageIndex.value, pageSize.value, searchText.value, filterBy.value)
  },
  staleTime: 60_000,
})

// Debug logging
watch(data, (newData) => {
  console.log('Users page received data:', newData)
}, { immediate: true })

// Invalidate cache when pagination, search, or filter changes
watch([pageIndex, pageSize, searchText, filterBy], () => {
  queryClient.invalidateQueries({ queryKey: ["users_generic"] })
})

// Bulk action handlers
const handleBulkEdit = async (data: { selectedIds: string[], updates: Record<string, any> }) => {
  try {
    await usersApi.bulkEdit(data.selectedIds, data.updates)
    
    // Show success notification
    $q.notify({
      type: 'positive',
      message: `Successfully updated ${data.selectedIds.length} users`,
      position: 'top'
    })
    
    // Clear selection and refresh data
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: ["users_generic"] })
  } catch (error: any) {
    console.error('Bulk edit error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to update users',
      position: 'top'
    })
  }
}

const handleBulkArchive = async (selectedIds: string[]) => {
  // DummyJSON doesn't support archiving, show info message
  $q.notify({
    type: 'info',
    message: 'Archive functionality not supported by DummyJSON API',
    position: 'top'
  })
}

const handleBulkDelete = async (selectedIds: string[]) => {
  try {
    await usersApi.bulkDelete(selectedIds)
    
    // Show success notification
    $q.notify({
      type: 'positive',
      message: `Successfully deleted ${selectedIds.length} users`,
      position: 'top'
    })
    
    // Clear selection and refresh data
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: ["users_generic"] })
  } catch (error: any) {
    console.error('Bulk delete error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete users',
      position: 'top'
    })
  }
}

const handleExport = async (selectedIds: string[]) => {
  try {
    await usersApi.exportSelected(selectedIds)
    
    // Show success notification
    $q.notify({
      type: 'positive',
      message: `Successfully exported ${selectedIds.length} users`,
      position: 'top'
    })
  } catch (error: any) {
    console.error('Export error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to export users',
      position: 'top'
    })
  }
}
</script>

<style lang="sass" scoped>
.q-page
  min-height: 100vh
</style>