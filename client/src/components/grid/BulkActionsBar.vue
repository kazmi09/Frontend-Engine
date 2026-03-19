<template>
  <div 
    v-if="selectedCount > 0"
    class="fixed-bottom tw:bg-white dark:tw:bg-dark border-top shadow-up-5 tw:transition-transform tw:duration-300 tw:ease-in-out"
    :class="selectedCount > 0 ? 'tw:translate-y-0' : 'tw:translate-y-full'"
    style="z-index: 9999;"
  >
    <div class="tw:max-w-7xl tw:mx-auto tw:px-4 tw:py-3">
      <div class="tw:flex tw:items-center tw:justify-between">
        <!-- Selection Info -->
        <div class="tw:flex tw:items-center tw:gap-4">
          <div class="tw:flex tw:items-center tw:gap-2">
            <q-icon name="check_circle" color="primary" />
            <span class="tw:text-sm tw:font-medium text-grey-9">
              {{ selectedCount }} {{ selectedCount === 1 ? (displayName || 'item') : (displayNamePlural || 'items') }} selected
            </span>
          </div>
          
          <q-btn
            flat
            dense
            size="sm"
            icon="close"
            @click="clearSelection"
            class="tw:text-gray-500 hover:tw:text-gray-700"
          >
            <q-tooltip>Clear selection</q-tooltip>
          </q-btn>
        </div>

        <!-- Bulk Actions -->
        <div class="tw:flex tw:items-center tw:gap-2">
          <q-btn
            outline
            size="sm"
            icon="edit"
            label="Bulk Edit"
            color="primary"
            @click="openBulkEditDialog"
            :loading="isLoading"
          />
          
          <q-btn
            outline
            size="sm"
            icon="download"
            label="Export"
            color="positive"
            @click="exportSelected"
            :loading="isExporting"
          />
          
          <q-btn
            outline
            size="sm"
            icon="archive"
            label="Archive"
            color="warning"
            @click="archiveSelected"
            :loading="isArchiving"
          />
          
          <q-btn
            outline
            size="sm"
            icon="delete"
            label="Delete"
            color="negative"
            @click="confirmDelete"
            :loading="isDeleting"
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
