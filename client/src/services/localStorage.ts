import type { Customization } from '@/types/customization';

const STORAGE_KEY = 'grid-customizations';

/**
 * Service for persisting group customizations to localStorage
 */
export class LocalStorageService {
  /**
   * Save customizations to localStorage
   */
  static save(customizations: Map<string, Customization>): void {
    try {
      const data = Array.from(customizations.entries());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded. Unable to save customizations.');
      } else {
        console.error('Failed to save customizations:', error);
      }
      // Continue execution even if save fails
    }
  }
  
  /**
   * Load customizations from localStorage
   */
  static load(): Map<string, Customization> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return new Map();
      
      const parsed = JSON.parse(data);
      
      // Validate that parsed data is an array
      if (!Array.isArray(parsed)) {
        console.warn('Invalid customization data format, clearing storage');
        localStorage.removeItem(STORAGE_KEY);
        return new Map();
      }
      
      return new Map(parsed);
    } catch (error) {
      console.error('Failed to load customizations:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
      return new Map();
    }
  }
  
  /**
   * Clear all customizations from localStorage
   */
  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
