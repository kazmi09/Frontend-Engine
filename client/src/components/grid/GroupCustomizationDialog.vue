<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="(val) => $emit('update:modelValue', val)"
    persistent
  >
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Customize Group</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="$emit('update:modelValue', false)" />
      </q-card-section>

      <q-card-section>
        <div class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">Group: {{ groupColumnLabel }} = {{ groupValue }}</div>
        </div>

        <!-- Color Picker -->
        <div class="q-mb-md">
          <div class="text-weight-medium q-mb-xs">Background Color</div>
          
          <!-- Preset Color Buttons -->
          <div class="q-mb-sm">
            <div class="text-caption text-grey-7 q-mb-xs">Quick Colors:</div>
            <div class="row q-gutter-xs">
              <q-btn
                v-for="preset in colorPresets"
                :key="preset.value"
                :style="{ backgroundColor: preset.value, minWidth: '40px', height: '40px' }"
                flat
                dense
                @click="localColor = preset.value"
                class="color-preset-btn"
              >
                <q-tooltip>{{ preset.name }}</q-tooltip>
                <q-icon 
                  v-if="localColor === preset.value" 
                  name="check" 
                  color="white" 
                  size="sm"
                  style="text-shadow: 0 0 3px rgba(0,0,0,0.5)"
                />
              </q-btn>
              <q-btn
                flat
                dense
                outline
                style="min-width: 40px; height: 40px; border: 2px dashed #ccc"
                @click="localColor = ''"
              >
                <q-tooltip>Clear Color</q-tooltip>
                <q-icon name="clear" color="grey-6" size="sm" />
              </q-btn>
            </div>
          </div>
          
          <!-- Custom Color Input -->
          <div class="q-mt-sm">
            <q-input
              v-model="localColor"
              label="Custom Hex Color (e.g., #E3F2FD)"
              dense
              outlined
              :rules="[val => !val || /^#[0-9A-F]{6}$/i.test(val) || 'Invalid hex color']"
            >
              <template v-slot:append>
                <q-icon name="colorize" class="cursor-pointer" />
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-color
                    v-model="localColor"
                    format-model="hex"
                    no-header
                    no-footer
                  />
                </q-popup-proxy>
              </template>
            </q-input>
            <div class="q-mt-xs text-caption text-grey-6">
              Click a preset color above or enter a custom hex color
            </div>
          </div>
        </div>

        <!-- Custom Label -->
        <div class="q-mb-md">
          <q-input
            v-model="localLabel"
            label="Custom Label / Tag"
            dense
            outlined
            placeholder="e.g., Core Team, Priority Group"
            hint="Optional custom label to display instead of default"
          />
        </div>

        <!-- Metadata / Notes -->
        <div class="q-mb-md">
          <q-input
            v-model="localMetadata"
            label="Metadata / Notes"
            dense
            outlined
            type="textarea"
            rows="3"
            placeholder="e.g., High priority team, Important notes..."
            hint="Optional notes or summary text"
          />
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Reset"
          color="negative"
          @click="handleReset"
          :disable="!hasCustomization"
        />
        <q-space />
        <q-btn flat label="Cancel" @click="$emit('update:modelValue', false)" />
        <q-btn
          label="Save"
          color="primary"
          @click="handleSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: boolean
  groupColumnLabel: string
  groupValue: string
  currentColor?: string
  currentLabel?: string
  currentMetadata?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentColor: '',
  currentLabel: '',
  currentMetadata: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [customization: { color?: string; label?: string; metadata?: string }]
  reset: []
}>()

const localColor = ref(props.currentColor || '')
const localLabel = ref(props.currentLabel || '')
const localMetadata = ref(props.currentMetadata || '')

// Preset color options
const colorPresets = [
  { name: 'Red', value: '#FFEBEE' },
  { name: 'Pink', value: '#FCE4EC' },
  { name: 'Purple', value: '#F3E5F5' },
  { name: 'Blue', value: '#E3F2FD' },
  { name: 'Cyan', value: '#E0F7FA' },
  { name: 'Teal', value: '#E0F2F1' },
  { name: 'Green', value: '#E8F5E9' },
  { name: 'Light Green', value: '#F1F8E9' },
  { name: 'Yellow', value: '#FFFDE7' },
  { name: 'Amber', value: '#FFF8E1' },
  { name: 'Orange', value: '#FFF3E0' },
  { name: 'Grey', value: '#F5F5F5' },
]

// Watch for prop changes (when dialog opens with existing customization)
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    localColor.value = props.currentColor || ''
    localLabel.value = props.currentLabel || ''
    localMetadata.value = props.currentMetadata || ''
  }
})

watch(() => props.currentColor, (val) => {
  if (props.modelValue) {
    localColor.value = val || ''
  }
})

watch(() => props.currentLabel, (val) => {
  if (props.modelValue) {
    localLabel.value = val || ''
  }
})

watch(() => props.currentMetadata, (val) => {
  if (props.modelValue) {
    localMetadata.value = val || ''
  }
})

const hasCustomization = computed(() => {
  return !!(props.currentColor || props.currentLabel || props.currentMetadata)
})

const handleSave = () => {
  const customization: { color?: string; label?: string; metadata?: string } = {}
  
  if (localColor.value && /^#[0-9A-F]{6}$/i.test(localColor.value)) {
    customization.color = localColor.value
  }
  
  if (localLabel.value.trim()) {
    customization.label = localLabel.value.trim()
  }
  
  if (localMetadata.value.trim()) {
    customization.metadata = localMetadata.value.trim()
  }
  
  emit('save', customization)
  emit('update:modelValue', false)
}

const handleReset = () => {
  localColor.value = ''
  localLabel.value = ''
  localMetadata.value = ''
  emit('reset')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.color-preset-btn {
  border-radius: 4px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.color-preset-btn:hover {
  border-color: #1976d2;
  transform: scale(1.1);
}
</style>
