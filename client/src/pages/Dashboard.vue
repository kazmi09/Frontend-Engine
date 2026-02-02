<template>
  <div class="h-screen w-full flex flex-col bg-slate-50 dark:bg-neutral-950 overflow-hidden">
    <!-- Top Navigation -->
    <header class="h-14 border-b bg-white dark:bg-neutral-900 flex items-center px-6 justify-between flex-none z-30">
      <div class="flex items-center gap-4">
        <q-icon name="dashboard" size="md" class="text-primary" />
        <!--<h1 class="text-xl font-semibold">Enterprise Data Grid</h1>-->
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
          icon="people"
          label="Users"
          @click="$router.push('/grid/users')"
          class="text-blue-600"
        />
        
        <q-btn
          flat
          icon="dashboard"
          label="Employees"
          @click="$router.push('/grid/employees')"
          class="text-green-600"
        />
        
        <q-btn
          flat
          icon="inventory"
          label="Products"
          @click="$router.push('/grid/products')"
          class="text-purple-600"
        />
        
        <q-select
          v-model="currentRole"
          :options="roleOptions"
          dense
          outlined
          emit-value
          map-options
          style="min-width: 120px"
          @update:model-value="authStore.setUserRole"
        >
          <template v-slot:prepend>
            <q-icon name="person" />
          </template>
        </q-select>
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
import GenericDetailPanel from '@/components/grid/GenericDetailPanel.vue'
import { useGridStore } from '@/lib/grid/store'
import { useGridStateStore } from '@/stores/gridState'
import { useAuthStore } from '@/lib/auth/store'
import { DataResult } from '@/lib/grid/types'
import DataGrid from '@/components/grid/DataGrid.vue'
import GridToolbar from '@/components/grid/GridToolbar.vue'

const queryClient = useQueryClient()
const gridStore = useGridStore()
const gridStateStore = useGridStateStore()
const authStore = useAuthStore()
const $q = useQuasar()

// Create generic API for employees grid
const employeeApi = createGridApi({ 
  gridId: 'employees',
  expandableComponent: GenericDetailPanel
})

// Use storeToRefs to make store properties reactive
const { pageIndex, pageSize, searchText, filterBy } = storeToRefs(gridStore)
const { user } = storeToRefs(authStore)

// Role management
const currentRole = computed({
  get: () => user.value.role,
  set: (value) => authStore.setUserRole(value)
})

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' }
]

// React Query: fetch employees with server-side pagination, search, and filtering
console.log('Setting up query with params:', {
  pageIndex: pageIndex.value,
  pageSize: pageSize.value,
  searchText: searchText.value,
  filterBy: filterBy.value
})

const { data, isLoading, isRefetching, refetch, error } = useQuery<DataResult, Error>({
  queryKey: computed(() => {
    const key = ["employees_generic", pageIndex.value, pageSize.value, searchText.value, filterBy.value]
    console.log('Query key:', key)
    return key
  }),
  queryFn: () => {
    console.log('Executing query function...')
    return employeeApi.getAll(pageIndex.value, pageSize.value, searchText.value, filterBy.value)
  },
  staleTime: 60_000,
})

// Debug logging
watch(data, (newData) => {
  console.log('Dashboard received data:', newData)
}, { immediate: true })

// Invalidate cache when pagination, search, or filter changes to ensure fresh data
watch([pageIndex, pageSize, searchText, filterBy], () => {
  queryClient.invalidateQueries({ queryKey: ["employees_generic"] })
})

// Bulk action handlers
const handleColumnVisibilityChanged = (visibility: Record<string, boolean>) => {
  console.log('[Dashboard] Column visibility changed from toolbar:', visibility)
  
  // Persist to gridState store - use 'employees' as gridId
  const gridId = 'employees'
  Object.keys(visibility).forEach(columnId => {
    gridStateStore.updateColumnVisibility(gridId, columnId, visibility[columnId])
  })
}

const handleBulkEdit = async (data: { selectedIds: string[], updates: Record<string, any> }) => {
  try {
    await employeeApi.bulkEdit(data.selectedIds, data.updates)
    
    // Show success notification
    $q.notify({
      type: 'positive',
      message: `Successfully updated ${data.selectedIds.length} employees`,
      position: 'top'
    })
    
    // Clear selection and refresh data
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: ["employees_generic"] })
  } catch (error: any) {
    console.error('Bulk edit error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to update employees',
      position: 'top'
    })
  }
}

const handleBulkArchive = async (selectedIds: string[]) => {
  try {
    await employeeApi.bulkArchive(selectedIds)
    
    // Show success notification
    $q.notify({
      type: 'positive',
      message: `Successfully archived ${selectedIds.length} employees`,
      position: 'top'
    })
    
    // Clear selection and refresh data
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: ["employees_generic"] })
  } catch (error: any) {
    console.error('Bulk archive error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to archive employees',
      position: 'top'
    })
  }
}

const handleBulkDelete = async (selectedIds: string[]) => {
  try {
    await employeeApi.bulkDelete(selectedIds)
    
    // Show success notification
    $q.notify({
      type: 'positive',
      message: `Successfully deleted ${selectedIds.length} employees`,
      position: 'top'
    })
    
    // Clear selection and refresh data
    gridStore.setRowSelection({})
    queryClient.invalidateQueries({ queryKey: ["employees_generic"] })
  } catch (error: any) {
    console.error('Bulk delete error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to delete employees',
      position: 'top'
    })
  }
}

const handleExport = async (selectedIds: string[]) => {
  try {
    await employeeApi.exportSelected(selectedIds)
    
    // Show success notification
    $q.notify({
      type: 'positive',
      message: `Successfully exported ${selectedIds.length} employees`,
      position: 'top'
    })
  } catch (error: any) {
    console.error('Export error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Failed to export employees',
      position: 'top'
    })
  }
}
</script>

<style lang="sass" scoped>
.q-page
  min-height: 100vh
</style>