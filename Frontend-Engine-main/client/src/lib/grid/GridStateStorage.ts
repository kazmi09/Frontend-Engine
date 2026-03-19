/**
 * GridStateStorage - Handles serialization, deserialization, and localStorage interactions for grid state
 */

export interface GridConfig {
  columnOrder: string[]
  columnWidths: Record<string, number>
  columnVisibility: Record<string, boolean>
  version: number
  lastUpdated: number
}

export interface IGridStateStorage {
  save(gridId: string, config: GridConfig): void
  load(gridId: string): GridConfig | null
  remove(gridId: string): void
  clear(): void
  migrate(oldConfig: any, fromVersion: number, toVersion: number): GridConfig
}

export class GridStateStorage implements IGridStateStorage {
  private readonly STORAGE_PREFIX = 'grid_state_'
  private readonly CURRENT_VERSION = 1

  /**
   * Save grid configuration to localStorage
   */
  save(gridId: string, config: GridConfig): void {
    try {
      const key = this.getStorageKey(gridId)
      const serialized = JSON.stringify(config)
      console.log('[GridStateStorage] Saving to localStorage:')
      console.log('  - Key:', key)
      console.log('  - Config:', config)
      localStorage.setItem(key, serialized)
      console.log('[GridStateStorage] ✅ Successfully saved to localStorage')
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.error('[GridStateStorage] localStorage quota exceeded. Unable to save grid state.')
        throw new Error('Storage quota exceeded. Please clear some data.')
      }
      console.error('[GridStateStorage] Failed to save grid state:', error)
      throw error
    }
  }

  /**
   * Load grid configuration from localStorage
   */
  load(gridId: string): GridConfig | null {
    try {
      const key = this.getStorageKey(gridId)
      console.log('[GridStateStorage] Loading from localStorage with key:', key)
      
      const serialized = localStorage.getItem(key)

      if (!serialized) {
        console.log('[GridStateStorage] No data found in localStorage for key:', key)
        return null
      }

      console.log('[GridStateStorage] Found data in localStorage:', serialized.substring(0, 200))
      const config = JSON.parse(serialized)

      // Version migration
      if (config.version !== this.CURRENT_VERSION) {
        console.log('[GridStateStorage] Migrating from version', config.version, 'to', this.CURRENT_VERSION)
        return this.migrate(config, config.version || 0, this.CURRENT_VERSION)
      }

      console.log('[GridStateStorage] Loaded config:', config)
      return config
    } catch (error) {
      console.error('[GridStateStorage] Failed to parse grid state:', error)
      // Return null to fall back to default state
      return null
    }
  }

  /**
   * Remove grid configuration from localStorage
   */
  remove(gridId: string): void {
    const key = this.getStorageKey(gridId)
    localStorage.removeItem(key)
  }

  /**
   * Clear all grid configurations from localStorage
   */
  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }

  /**
   * Migrate old configuration to new schema version
   */
  migrate(oldConfig: any, fromVersion: number, toVersion: number): GridConfig {
    let config = { ...oldConfig }

    // v0 -> v1 migration
    if (fromVersion === 0 && toVersion >= 1) {
      config = {
        columnOrder: config.columnOrder || [],
        columnWidths: config.columnWidths || {},
        columnVisibility: config.columnVisibility || {},
        version: 1,
        lastUpdated: Date.now()
      }
    }

    // Future migrations can be added here
    // Example: v1 -> v2
    // if (fromVersion <= 1 && toVersion >= 2) {
    //   config = { ...config, newField: defaultValue, version: 2 }
    // }

    return config
  }

  /**
   * Get the localStorage key for a grid ID
   */
  private getStorageKey(gridId: string): string {
    return `${this.STORAGE_PREFIX}${gridId}`
  }
}

// Export singleton instance
export const gridStateStorage = new GridStateStorage()
