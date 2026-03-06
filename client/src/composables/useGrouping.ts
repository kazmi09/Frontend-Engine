import { computed, Ref } from 'vue'
import type { GroupRow, GroupingConfig } from '@/lib/grid/types'

interface GroupingOptions {
  data: any[]
  groupBy: string[]
  groupExpanded: Record<string, boolean>
  groupingConfig?: GroupingConfig
}

/**
 * Groups data by specified fields and creates group header rows
 */
export function useGrouping(options: GroupingOptions) {
  const { data, groupBy, groupExpanded, groupingConfig } = options

  /**
   * Generate a unique key for a group
   */
  const generateGroupKey = (field: string, value: any, level: number): string => {
    return `group-${level}-${field}-${String(value)}`
  }

  /**
   * Format group value for display
   */
  const formatGroupValue = (value: any, field: string): string => {
    if (value === null || value === undefined) return '(Empty)'
    if (value === '') return '(Blank)'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (value instanceof Date) return value.toLocaleDateString()
    return String(value)
  }

  /**
   * Calculate summary for a group
   */
  const calculateGroupSummary = (rows: any[], summaryFields?: GroupingConfig['summaryFields']): Record<string, any> => {
    if (!summaryFields || summaryFields.length === 0) return {}

    const summary: Record<string, any> = {}

    summaryFields.forEach(({ field, aggregation, label }) => {
      const key = label || field
      const values = rows.map(row => row[field]).filter(v => v !== null && v !== undefined)

      switch (aggregation) {
        case 'sum':
          summary[key] = values.reduce((sum, val) => sum + Number(val), 0)
          break
        case 'avg':
          summary[key] = values.length > 0 
            ? values.reduce((sum, val) => sum + Number(val), 0) / values.length 
            : 0
          break
        case 'min':
          summary[key] = values.length > 0 ? Math.min(...values.map(Number)) : 0
          break
        case 'max':
          summary[key] = values.length > 0 ? Math.max(...values.map(Number)) : 0
          break
        case 'count':
          summary[key] = values.length
          break
      }
    })

    return summary
  }

  /**
   * Group data recursively by multiple fields
   */
  const groupDataRecursively = (
    rows: any[],
    fields: string[],
    level: number = 0,
    parentKey: string = ''
  ): any[] => {
    if (fields.length === 0 || rows.length === 0) {
      return rows
    }

    const [currentField, ...remainingFields] = fields
    const grouped = new Map<any, any[]>()

    // Group rows by current field
    rows.forEach(row => {
      const value = row[currentField]
      if (!grouped.has(value)) {
        grouped.set(value, [])
      }
      grouped.get(value)!.push(row)
    })

    // Convert groups to array with group headers
    const result: any[] = []

    // Sort group keys
    const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
      if (a === null || a === undefined) return 1
      if (b === null || b === undefined) return -1
      return String(a).localeCompare(String(b))
    })

    sortedKeys.forEach(groupValue => {
      const groupRows = grouped.get(groupValue)!
      const groupKey = generateGroupKey(currentField, groupValue, level)
      const fullGroupKey = parentKey ? `${parentKey}/${groupKey}` : groupKey
      
      // Create custom group label if function provided
      const groupLabel = groupingConfig?.customGroupHeader
        ? groupingConfig.customGroupHeader(groupValue, currentField, groupRows.length)
        : `${currentField}: ${formatGroupValue(groupValue, currentField)}`

      // Create group header row
      const groupHeader: GroupRow = {
        isGroupHeader: true,
        groupField: currentField,
        groupValue,
        groupLabel,
        count: groupRows.length,
        rows: groupRows,
        isExpanded: groupExpanded[fullGroupKey] !== false, // Default to expanded
        level,
        summary: calculateGroupSummary(groupRows, groupingConfig?.summaryFields),
      }

      result.push(groupHeader)

      // If group is expanded, add child rows or sub-groups
      if (groupHeader.isExpanded) {
        if (remainingFields.length > 0) {
          // Recursively group by remaining fields
          const subGroups = groupDataRecursively(
            groupRows,
            remainingFields,
            level + 1,
            fullGroupKey
          )
          result.push(...subGroups)
        } else {
          // Add actual data rows
          result.push(...groupRows)
        }
      }
    })

    return result
  }

  /**
   * Main grouping function
   */
  const groupedData = computed(() => {
    if (!groupBy || groupBy.length === 0) {
      return data
    }

    return groupDataRecursively(data, groupBy, 0)
  })

  /**
   * Get all group keys for expand/collapse all functionality
   */
  const allGroupKeys = computed(() => {
    const keys: string[] = []
    
    const extractKeys = (rows: any[], level: number = 0, parentKey: string = '') => {
      rows.forEach(row => {
        if (row.isGroupHeader) {
          const groupKey = generateGroupKey(row.groupField, row.groupValue, level)
          const fullKey = parentKey ? `${parentKey}/${groupKey}` : groupKey
          keys.push(fullKey)
          
          if (row.isExpanded && row.rows) {
            extractKeys(row.rows, level + 1, fullKey)
          }
        }
      })
    }

    if (groupBy && groupBy.length > 0) {
      extractKeys(groupedData.value)
    }

    return keys
  })

  /**
   * Check if a row is a group header
   */
  const isGroupHeader = (row: any): row is GroupRow => {
    return row && row.isGroupHeader === true
  }

  return {
    groupedData,
    allGroupKeys,
    isGroupHeader,
    generateGroupKey,
    formatGroupValue,
  }
}
