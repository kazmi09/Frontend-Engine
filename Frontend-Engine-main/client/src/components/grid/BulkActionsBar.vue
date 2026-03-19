<template>
  <div 
    v-if="selectedCount > 0"
    class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 transition-transform duration-300 ease-in-out"
    :class="selectedCount > 0 ? 'translate-y-0' : 'translate-y-full'"
  >
    <div class="max-w-7xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Selection Info -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <q-icon name="check_circle" class="text-blue-600" />
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ selectedCount }} {{ selectedCount === 1 ? 'item' : 'items' }} selected
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
}>()

const emit = defineEmits<{
  bulkEdit: [data: { selectedIds: string[], updates: Record<string, any> }]
  bulkArchive: [selectedIds: string[]]
  bulkDelete: [selectedIds: string[]]
  export: [selectedIds: string[]]
}>()

const gridStore = useGridStore()
const { rowSelection } = storeToRefs(gridStore)

// Loading states
const isLoading = ref(false)
const isExporting = ref(false)
const isArchiving = ref(false)
const isDeleting = ref(false)

// Dialog states
const showBulkEditDialog = ref(false)
const showDeleteDialog = ref(false)

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

// Actions
const clearSelection = () => {
  gridStore.setRowSelection({})
}

const openBulkEditDialog = () => {
  showBulkEditDialog.value = true
}

const handleBulkEdit = async (updates: Record<string, any>) => {
  isLoading.value = true
  try {
    emit('bulkEdit', { selectedIds: selectedIds.value, updates })
    showBulkEditDialog.value = false
  } finally {
    isLoading.value = false
  }
}

const exportSelected = async () => {
  isExporting.value = true
  try {
    emit('export', selectedIds.value)
  } finally {
    isExporting.value = false
  }
}

const archiveSelected = async () => {
  isArchiving.value = true
  try {
    emit('bulkArchive', selectedIds.value)
  } finally {
    isArchiving.value = false
  }
}

const confirmDelete = () => {
  showDeleteDialog.value = true
}

const deleteSelected = async () => {
  isDeleting.value = true
  try {
    emit('bulkDelete', selectedIds.value)
    showDeleteDialog.value = false
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
.fixed {
  z-index: 1000;
}
</style>