<template>
  <tr class="detail-panel-row">
    <td :colspan="columnCount" class="detail-panel-cell">
      <div 
        class="detail-panel-content"
        role="region"
        :aria-labelledby="`row-${rowId}`"
      >
        <!-- Loading State -->
        <div v-if="isLoading" class="detail-panel-loading">
          <q-spinner-dots size="40px" color="primary" />
          <span class="text-sm text-gray-600 mt-2">Loading details...</span>
        </div>
        
        <!-- Error State -->
        <div v-else-if="error" class="detail-panel-error">
          <q-icon name="error" size="md" color="negative" />
          <span class="text-sm text-negative">{{ error }}</span>
          <q-btn 
            flat 
            size="sm" 
            label="Retry" 
            @click="handleRetry"
            class="mt-2"
          />
        </div>
        
        <!-- Content -->
        <div v-else class="detail-panel-inner">
          <!-- Slot-based renderer -->
          <slot 
            v-if="!rendererComponent"
            :row="row" 
            :rowId="rowId" 
            :data="detailData"
          />
          
          <!-- Component-based renderer -->
          <component
            v-else
            :is="rendererComponent"
            :row="row"
            :rowId="rowId"
            :columns="columns"
            :gridId="gridId"
            :data="detailData"
          />
        </div>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useGridStore } from '@/lib/grid/store';
import type { ExpandableConfig } from '@/lib/grid/types';

const props = defineProps<{
  row: any;
  rowId: string;
  columnCount: number;
  expandableConfig: ExpandableConfig;
  columns?: any[];
  gridId?: string;
}>();

const emit = defineEmits<{
  retry: [rowId: string];
}>();

const gridStore = useGridStore();

const rendererComponent = computed(() => {
  const renderer = props.expandableConfig.renderer;
  return typeof renderer === 'string' ? null : renderer;
});

const detailPanelState = computed(() => 
  gridStore.detailPanelData[props.rowId]
);

const isLoading = computed(() => 
  detailPanelState.value?.loading || false
);

const error = computed(() => 
  detailPanelState.value?.error || null
);

const detailData = computed(() => 
  detailPanelState.value?.data || null
);

const handleRetry = () => {
  emit('retry', props.rowId);
};

// Load data on mount if lazy loading is configured
onMounted(async () => {
  if (props.expandableConfig.lazyLoad && !detailPanelState.value) {
    gridStore.setDetailPanelLoading(props.rowId, true);
    try {
      const data = await props.expandableConfig.lazyLoad(props.row, props.rowId);
      gridStore.setDetailPanelData(props.rowId, data);
    } catch (err) {
      gridStore.setDetailPanelError(
        props.rowId, 
        err instanceof Error ? err.message : 'Failed to load detail data'
      );
    }
  }
});
</script>

<style scoped>
.detail-panel-row {
  background-color: #f9fafb;
}

.detail-panel-cell {
  padding: 0 !important;
  border-bottom: 2px solid #e5e7eb;
}

.detail-panel-content {
  animation: slideDown 0.2s ease-out;
  overflow: hidden;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.detail-panel-loading,
.detail-panel-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.detail-panel-inner {
  padding: 1rem;
}
</style>
