<template>
  <div class="group-customization-menu">
    <!-- Menu Button -->
    <q-btn
      flat
      dense
      round
      size="sm"
      icon="more_vert"
      class="group-menu-btn"
      color="grey-7"
      @click.stop="menuRef?.show()"
    >
      <q-tooltip>Customize Group</q-tooltip>
    </q-btn>

    <!-- Context Menu -->
    <q-menu
      ref="menuRef"
      :target="true"
      @before-show="handleMenuShow"
    >
      <q-list style="min-width: 200px">
        <q-item-label header>Group Settings</q-item-label>
        
        <q-item
          clickable
          v-close-popup
          @click="openDialog"
        >
          <q-item-section avatar>
            <q-icon name="palette" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Customize Group</q-item-label>
            <q-item-label caption v-if="hasCustomization">
              Customized
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-separator v-if="hasCustomization" />

        <q-item
          v-if="hasCustomization"
          clickable
          v-close-popup
          @click="handleReset"
        >
          <q-item-section avatar>
            <q-icon name="refresh" color="negative" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-negative">Reset Customization</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>

    <!-- Customization Dialog -->
    <GroupCustomizationDialog
      v-model="dialogOpen"
      :group-column-label="groupColumnLabel"
      :group-value="groupValue"
      :current-color="currentCustomization?.color"
      :current-label="currentCustomization?.label"
      :current-metadata="currentCustomization?.metadata"
      @save="handleSave"
      @reset="handleReset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { QMenu } from 'quasar'
import GroupCustomizationDialog from './GroupCustomizationDialog.vue'

interface Props {
  dataset: string
  groupColumn: string
  groupColumnLabel: string
  groupValue: string
  currentCustomization?: {
    color?: string
    label?: string
    metadata?: string
  } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [customization: { color?: string; label?: string; metadata?: string }]
  reset: []
}>()

const menuRef = ref<QMenu>()
const dialogOpen = ref(false)

const hasCustomization = computed(() => {
  return !!(
    props.currentCustomization?.color ||
    props.currentCustomization?.label ||
    props.currentCustomization?.metadata
  )
})

const handleMenuShow = () => {
  // Menu is about to show
}

const openDialog = () => {
  dialogOpen.value = true
}

const handleSave = (customization: { color?: string; label?: string; metadata?: string }) => {
  emit('save', customization)
}

const handleReset = () => {
  emit('reset')
}
</script>

<style scoped>
.group-menu-btn {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.group-customization-menu:hover .group-menu-btn,
.group-customization-menu:focus-within .group-menu-btn,
.group-menu-btn:hover {
  opacity: 1 !important;
}
</style>
