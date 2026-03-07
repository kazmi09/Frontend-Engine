import { computed } from 'vue';
import { useCustomizationStore } from '@/stores/customization';
import type { CustomizationKey, CustomizationInput } from '@/types/customization';

/**
 * Composable for accessing and managing group customizations
 * 
 * @param datasetId - Unique identifier for the dataset (e.g., "users", "products")
 * @param columnName - Name of the grouping column
 * @param groupValue - Value of the group (can be null)
 * @returns Reactive customization data and save function
 */
export function useGroupCustomization(
  datasetId: string,
  columnName: string,
  groupValue: string | null
) {
  const store = useCustomizationStore();
  
  const key: CustomizationKey = {
    datasetId,
    columnName,
    groupValue
  };
  
  // Reactive computed properties
  const customization = computed(() => store.getCustomization(key));
  
  const color = computed(() => customization.value?.color);
  
  const label = computed(() => {
    if (customization.value?.label) {
      return customization.value.label;
    }
    return groupValue === null ? '(Empty)' : String(groupValue);
  });
  
  const metadata = computed(() => customization.value?.metadata);
  
  const style = computed(() => {
    const styles: Record<string, string> = {};
    
    if (color.value) {
      styles.backgroundColor = color.value;
      styles.borderLeft = `4px solid ${color.value}`;
    }
    
    return styles;
  });
  
  const hasCustomization = computed(() => {
    return !!(customization.value?.color || customization.value?.label || customization.value?.metadata);
  });
  
  /**
   * Save customization for this group
   */
  function save(data: CustomizationInput) {
    store.saveCustomization(key, data);
  }
  
  /**
   * Delete customization for this group
   */
  function remove() {
    store.deleteCustomization(key);
  }
  
  return {
    customization,
    color,
    label,
    metadata,
    style,
    hasCustomization,
    save,
    remove
  };
}
