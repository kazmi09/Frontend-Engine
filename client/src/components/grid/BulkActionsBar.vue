<template>
  <div 
    v-if="selectedCount > 0"
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-transform duration-300 ease-in-out"
    :class="selectedCount > 0 ? 'translate-y-0' : 'translate-y-full'"
    style="z-index: 9999;"
  >
    <div class="max-w-7xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Selection Info -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <q-icon name="check_circle" class="text-blue-600" />
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ selectedCount }} {{ selectedCount === 1 ? (displayName || 'item') : (displayNamePlural || 'items') }} selected
            </span>
          </div>
          
          <q-btn
            flat
            dense
            size="sm"
            icon="close"
            @click="clearSelection"
            class="text-gray-500 hover:text-gray-700"
          >
            <q-tooltip>Clear selection</q-tooltip>
          </q-btn>
        </div>

        <!-- Bulk Actions -->
        <div class="flex items-center gap-2">
          <q-btn
            outline
            size="sm"
            icon="edit"
            label="Bulk Edit"
            @click="openBulkEditDialog"
            :loading="isLoading"
            class="text-blue-600 border-blue-600 hover:bg-blue-50"
          />
          
          <q-btn
            outline
            size="sm"
            icon="download"
            label="Export"
            @click="exportSelected"
            :loading="isExporting"
            class="text-green-600 border-green-600 hover:bg-green-50"
          />
          
          <q-btn
            outline
            size="sm"
            icon="archive"
            label="Archive"
            @click="archiveSelected"
            :loading="isArchiving"
            class="text-orange-600 border-orange-600 hover:bg-orange-50"
          />
          
          <q-btn
            outline
            size="sm"
            icon="delete"
            label="Delete"
            @click="confirmDelete"
            :loading="isDeleting"
            class="text-red-600 border-red-600 hover:bg-red-50"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Bulk Edit Dialog -->
  <BulkEditDialog
    v-model="showBulkEditDialog"
    :selected-count="selectedCount"
    :columns="editableColumns"
    @save="handleBulkEdit"
  />

  <!-- Delete Confirmation Dialog -->
  <q-dialog v-model="showDeleteDialog">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">Confirm Delete</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        Are you sure you want to delete {{ selectedCount }} {{ selectedCount === 1 ? 'item' : 'items' }}? 
        This action cannot be undone.
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn 
          flat 
          label="Delete" 
          color="negative" 
          @click="deleteSelected"
          :loading="isDeleting"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useGridStore } from '@/lib/grid/store'
import { ColumnConfig } from '@/lib/grid/types'
import BulkEditDialog from './BulkEditDialog.vue'

const props = defineProps<{
  columns: ColumnConfig[]
  bulkActionsConfig?: BulkActionsConfig
  displayName?: string
  displayNamePlural?: string
}>()

const emit = defineEmits<{
  bulkEdit: [data: { selectedIds: string[], updates: Record<string, any> }]
  bulkArchive: [selectedIds: string[]]
  bulkDelete: [selectedIds: string[]]
  export: [selectedIds: string[]]
  customAction: [data: { actionId: string, selectedIds: string[], action: CustomBulkAction }]
}>()

const gridStore = useGridStore()
const { rowSelection } = storeToRefs(gridStore)

// Loading states - track per action
const actionLoading = ref<Record<string, boolean>>({})

// Dialog states
const showBulkEditDialog = ref(false)
const showDeleteDialog = ref(false)
const showCustomActionDialog = ref(false)
const currentCustomAction = ref<CustomBulkAction | null>(null)

// Computed
const selectedCount = computed(() => {
  return Object.keys(rowSelection.value).filter(id => rowSelection.value[id]).length
})

const selectedIds = computed(() => {
  return Object.keys(rowSelection.value).filter(id => rowSelection.value[id])
})

const editableColumns = computed(() => {
  return props.columns.filter(col => col.editable !== false && col.id !== 'id')
})

const customActions = computed(() => {
  return props.bulkActionsConfig?.actions?.custom || []
})

// Actions
const clearSelection = () => {
  gridStore.setRowSelection({})
}

const openBulkEditDialog = () => {
  showBulkEditDialog.value = true
}

const handleBulkEdit = async (updates: Record<string, any>) => {
  actionLoading.value['edit'] = true
  try {
    emit('bulkEdit', { selectedIds: selectedIds.value, updates })
    showBulkEditDialog.value = false
  } finally {
    actionLoading.value['edit'] = false
  }
}

const exportSelected = async () => {
  actionLoading.value['export'] = true
  try {
    emit('export', selectedIds.value)
  } finally {
    actionLoading.value['export'] = false
  }
}

const archiveSelected = async () => {
  actionLoading.value['archive'] = true
  try {
    emit('bulkArchive', selectedIds.value)
  } finally {
    actionLoading.value['archive'] = false
  }
}

const confirmDelete = () => {
  showDeleteDialog.value = true
}

const deleteSelected = async () => {
  actionLoading.value['delete'] = true
  try {
    emit('bulkDelete', selectedIds.value)
    showDeleteDialog.value = false
  } finally {
    actionLoading.value['delete'] = false
  }
}

const handleCustomAction = (action: CustomBulkAction) => {
  currentCustomAction.value = action
  if (action.confirmationRequired !== false) {
    showCustomActionDialog.value = true
  } else {
    executeCustomAction()
  }
}

const executeCustomAction = async () => {
  if (!currentCustomAction.value) return
  
  const actionId = currentCustomAction.value.id
  actionLoading.value[actionId] = true
  
  try {
    emit('customAction', {
      actionId,
      selectedIds: selectedIds.value,
      action: currentCustomAction.value
    })
    showCustomActionDialog.value = false
  } finally {
    actionLoading.value[actionId] = false
    currentCustomAction.value = null
  }
}
</script>

<style scoped>
.fixed {
  z-index: 1000;
}
</style>