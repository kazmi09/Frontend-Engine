import { defineStore } from 'pinia';
import { LocalStorageService } from '@/services/localStorage';
import { encodeKey, validateKey } from '@/utils/customization-key';
import type { CustomizationKey, Customization, CustomizationInput } from '@/types/customization';

interface CustomizationState {
  customizations: Map<string, Customization>;
  isLoaded: boolean;
}

/**
 * Store for managing dataset-agnostic group customizations
 */
export const useCustomizationStore = defineStore('customization', {
  state: (): CustomizationState => ({
    customizations: new Map(),
    isLoaded: false
  }),
  
  getters: {
    /**
     * Get all customizations as an array
     */
    allCustomizations: (state): Customization[] => {
      return Array.from(state.customizations.values());
    },
    
    /**
     * Get customizations for a specific dataset
     */
    customizationsByDataset: (state) => (datasetId: string): Customization[] => {
      return Array.from(state.customizations.values())
        .filter(c => c.key.datasetId === datasetId);
    },
    
    /**
     * Check if a customization exists for a given key
     */
    hasCustomization: (state) => (key: CustomizationKey): boolean => {
      return state.customizations.has(encodeKey(key));
    }
  },
  
  actions: {
    /**
     * Initialize the store by loading customizations from localStorage
     */
    async initialize() {
      if (this.isLoaded) return;
      
      try {
        const loaded = LocalStorageService.load();
        this.customizations = loaded;
        this.isLoaded = true;
        console.log(`[CustomizationStore] Loaded ${this.customizations.size} customizations`);
      } catch (error) {
        console.error('[CustomizationStore] Failed to initialize:', error);
        this.customizations = new Map();
        this.isLoaded = true;
      }
    },
    
    /**
     * Save a customization for a group
     */
    saveCustomization(key: CustomizationKey, data: CustomizationInput) {
      if (!validateKey(key)) {
        console.error('[CustomizationStore] Invalid customization key:', key);
        return;
      }
      
      const encoded = encodeKey(key);
      const now = new Date().toISOString();
      const existing = this.customizations.get(encoded);
      
      const customization: Customization = {
        key,
        color: data.color,
        label: data.label,
        metadata: data.metadata,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };
      
      this.customizations.set(encoded, customization);
      LocalStorageService.save(this.customizations);
      
      console.log('[CustomizationStore] Saved customization:', { key, data });
    },
    
    /**
     * Get a customization by key
     */
    getCustomization(key: CustomizationKey): Customization | undefined {
      return this.customizations.get(encodeKey(key));
    },
    
    /**
     * Delete a specific customization
     */
    deleteCustomization(key: CustomizationKey) {
      const encoded = encodeKey(key);
      const deleted = this.customizations.delete(encoded);
      
      if (deleted) {
        LocalStorageService.save(this.customizations);
        console.log('[CustomizationStore] Deleted customization:', key);
      }
    },
    
    /**
     * Reset customizations - either for a specific dataset or globally
     */
    resetCustomizations(datasetId?: string) {
      if (!datasetId) {
        // Global reset
        this.customizations.clear();
        console.log('[CustomizationStore] Cleared all customizations');
      } else {
        // Dataset-specific reset
        const toDelete: string[] = [];
        
        this.customizations.forEach((customization, key) => {
          if (customization.key.datasetId === datasetId) {
            toDelete.push(key);
          }
        });
        
        toDelete.forEach(key => this.customizations.delete(key));
        console.log(`[CustomizationStore] Cleared ${toDelete.length} customizations for dataset: ${datasetId}`);
      }
      
      LocalStorageService.save(this.customizations);
    }
  }
});
