<template>
  <button
    v-if="canExpand"
    @click.stop="handleToggle"
    @keydown.enter.prevent="handleToggle"
    @keydown.space.prevent="handleToggle"
    class="expander-button"
    :aria-expanded="isExpanded ? 'true' : 'false'"
    :aria-label="isExpanded ? 'Collapse row' : 'Expand row'"
    type="button"
  >
    <q-icon 
      :name="isExpanded ? 'expand_more' : 'chevron_right'" 
      size="sm"
      class="transition-transform"
    />
  </button>
  <span v-else class="expander-placeholder"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGridStore } from '@/lib/grid/store';

const props = defineProps<{
  rowId: string;
  canExpand: boolean;
}>();

const emit = defineEmits<{
  toggle: [rowId: string];
}>();

const gridStore = useGridStore();

const isExpanded = computed(() => 
  gridStore.expandedRows[props.rowId] || false
);

const handleToggle = () => {
  console.log('=== EXPANDER CELL CLICK ===')
  console.log('[EXPANDER CELL] handleToggle called for rowId:', props.rowId)
  console.log('[EXPANDER CELL] Current isExpanded:', isExpanded.value)
  console.log('[EXPANDER CELL] canExpand:', props.canExpand)
  emit('toggle', props.rowId);
  console.log('[EXPANDER CELL] Emitted toggle event with rowId:', props.rowId)
  console.log('=== END EXPANDER CELL CLICK ===')
};
</script>

<style scoped>
.expander-button {
  padding: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  min-width: 32px;
  min-height: 32px;
}

.expander-button:hover {
  background-color: rgba(59, 130, 246, 0.1);
  transform: scale(1.1);
}

.expander-button:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.expander-button .q-icon {
  font-size: 24px !important;
  color: #3b82f6;
  font-weight: bold;
}

.expander-placeholder {
  display: inline-block;
  width: 32px;
}
</style>
