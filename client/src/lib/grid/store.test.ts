import { describe, it, expect, beforeEach } from 'vitest'
import { fc, test } from '@fast-check/vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGridStore } from './store'

describe('Grid Store - Expansion Actions', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('Property 2: Expansion State Toggle', () => {
    it('**Validates: Requirements 3.2, 3.3** - toggling expansion should change state from false to true', () => {
      const store = useGridStore()
      const rowId = 'test-row-1'

      // Initially, row should not be expanded
      expect(store.expandedRows[rowId]).toBeUndefined()

      // Toggle expansion
      store.toggleRowExpansion(rowId)

      // Row should now be expanded
      expect(store.expandedRows[rowId]).toBe(true)
    })

    it('**Validates: Requirements 3.2, 3.3** - toggling expansion should change state from true to false', () => {
      const store = useGridStore()
      const rowId = 'test-row-2'

      // Set row to expanded
      store.expandRow(rowId)
      expect(store.expandedRows[rowId]).toBe(true)

      // Toggle expansion
      store.toggleRowExpansion(rowId)

      // Row should now be collapsed
      expect(store.expandedRows[rowId]).toBe(false)
    })

    test.prop([
      fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
      fc.boolean()
    ], { numRuns: 100 })(
      '**Validates: Requirements 3.2, 3.3** - toggling expansion should always change state',
      (rowId, initialState) => {
        const store = useGridStore()

        // Set initial state
        store.expandedRows[rowId] = initialState

        // Toggle expansion
        store.toggleRowExpansion(rowId)

        // State should be opposite of initial state
        expect(store.expandedRows[rowId]).toBe(!initialState)
      }
    )
  })

  describe('Property 29: Expand All Rows', () => {
    it('**Validates: Requirements 10.4** - expandAllRows should add all IDs to state', () => {
      const store = useGridStore()
      const rowIds = ['row-1', 'row-2', 'row-3']

      // Expand all rows
      store.expandAllRows(rowIds)

      // All rows should be expanded
      rowIds.forEach(id => {
        expect(store.expandedRows[id]).toBe(true)
      })
    })

    test.prop([fc.array(fc.string(), { minLength: 0, maxLength: 20 })], { numRuns: 100 })(
      '**Validates: Requirements 10.4** - expandAllRows should add all provided IDs to state with value true',
      (rowIds) => {
        const store = useGridStore()

        // Expand all rows
        store.expandAllRows(rowIds)

        // All provided row IDs should be in the expanded state with value true
        rowIds.forEach(id => {
          expect(store.expandedRows[id]).toBe(true)
        })

        // The number of expanded rows should be at least the number of unique IDs
        const uniqueIds = new Set(rowIds)
        const expandedCount = Object.keys(store.expandedRows).filter(
          id => store.expandedRows[id] === true
        ).length
        expect(expandedCount).toBeGreaterThanOrEqual(uniqueIds.size)
      }
    )

    test.prop([fc.array(fc.string(), { minLength: 1, maxLength: 10 })], { numRuns: 100 })(
      '**Validates: Requirements 10.4** - expandAllRows should preserve existing expanded rows',
      (newRowIds) => {
        const store = useGridStore()

        // Set up some initially expanded rows
        const initialRowIds = ['existing-1', 'existing-2']
        initialRowIds.forEach(id => store.expandRow(id))

        // Expand additional rows
        store.expandAllRows(newRowIds)

        // Initial rows should still be expanded
        initialRowIds.forEach(id => {
          expect(store.expandedRows[id]).toBe(true)
        })

        // New rows should also be expanded
        newRowIds.forEach(id => {
          expect(store.expandedRows[id]).toBe(true)
        })
      }
    )
  })

  describe('Property 30: Collapse All Rows', () => {
    it('**Validates: Requirements 10.5** - collapseAllRows should clear state', () => {
      const store = useGridStore()

      // Expand some rows
      store.expandRow('row-1')
      store.expandRow('row-2')
      store.expandRow('row-3')

      // Verify rows are expanded
      expect(Object.keys(store.expandedRows).length).toBeGreaterThan(0)

      // Collapse all rows
      store.collapseAllRows()

      // State should be empty
      expect(store.expandedRows).toEqual({})
    })

    test.prop([fc.array(fc.string(), { minLength: 1, maxLength: 20 })], { numRuns: 100 })(
      '**Validates: Requirements 10.5** - collapseAllRows should clear all expanded rows regardless of how many',
      (rowIds) => {
        const store = useGridStore()

        // Expand all rows
        store.expandAllRows(rowIds)

        // Verify some rows are expanded
        const expandedBefore = Object.keys(store.expandedRows).filter(
          id => store.expandedRows[id] === true
        ).length
        expect(expandedBefore).toBeGreaterThan(0)

        // Collapse all rows
        store.collapseAllRows()

        // State should be completely empty
        expect(store.expandedRows).toEqual({})
        expect(Object.keys(store.expandedRows).length).toBe(0)
      }
    )

    test.prop([fc.array(fc.string(), { minLength: 0, maxLength: 20 })], { numRuns: 100 })(
      '**Validates: Requirements 10.5** - collapseAllRows should work even with empty state',
      (rowIds) => {
        const store = useGridStore()

        // Expand rows (might be empty array)
        if (rowIds.length > 0) {
          store.expandAllRows(rowIds)
        }

        // Collapse all rows
        store.collapseAllRows()

        // State should be empty regardless of initial state
        expect(store.expandedRows).toEqual({})
      }
    )
  })

  describe('Property 31: Expanded Row IDs Computed Property', () => {
    it('**Validates: Requirements 10.6** - expandedRowIds should return IDs with value true', () => {
      const store = useGridStore()

      // Expand some rows
      store.expandRow('row-1')
      store.expandRow('row-2')
      store.expandRow('row-3')

      // Collapse one row
      store.collapseRow('row-2')

      // expandedRowIds should only include rows with value true
      const expandedIds = store.expandedRowIds
      expect(expandedIds).toContain('row-1')
      expect(expandedIds).not.toContain('row-2')
      expect(expandedIds).toContain('row-3')
      expect(expandedIds.length).toBe(2)
    })

    test.prop([
      fc.array(fc.string(), { minLength: 0, maxLength: 20 }),
      fc.array(fc.string(), { minLength: 0, maxLength: 20 })
    ], { numRuns: 100 })(
      '**Validates: Requirements 10.6** - expandedRowIds should return exactly the IDs with value true',
      (expandedIds, collapsedIds) => {
        const store = useGridStore()

        // Expand some rows
        expandedIds.forEach(id => store.expandRow(id))

        // Set some rows to false (collapsed)
        collapsedIds.forEach(id => store.collapseRow(id))

        // Get the computed property
        const result = store.expandedRowIds

        // Result should only contain IDs that are in expandedIds but not in collapsedIds
        const expectedIds = expandedIds.filter(id => !collapsedIds.includes(id))
        const uniqueExpectedIds = [...new Set(expectedIds)]

        // Every ID in result should have value true in expandedRows
        result.forEach(id => {
          expect(store.expandedRows[id]).toBe(true)
        })

        // Result should contain all unique expected IDs
        uniqueExpectedIds.forEach(id => {
          expect(result).toContain(id)
        })

        // Result should not contain any collapsed IDs
        collapsedIds.forEach(id => {
          if (store.expandedRows[id] === false) {
            expect(result).not.toContain(id)
          }
        })
      }
    )

    test.prop([fc.dictionary(fc.string(), fc.boolean())], { numRuns: 100 })(
      '**Validates: Requirements 10.6** - expandedRowIds should match all keys with true values',
      (expandedRowsState) => {
        const store = useGridStore()

        // Set the expanded rows state directly
        store.expandedRows = expandedRowsState

        // Get the computed property
        const result = store.expandedRowIds

        // Calculate expected IDs (keys with value true)
        const expectedIds = Object.keys(expandedRowsState).filter(
          id => expandedRowsState[id] === true
        )

        // Result should match expected IDs
        expect(result.sort()).toEqual(expectedIds.sort())

        // Result length should match number of true values
        expect(result.length).toBe(expectedIds.length)
      }
    )

    it('**Validates: Requirements 10.6** - expandedRowIds should return empty array when no rows expanded', () => {
      const store = useGridStore()

      // Initially, no rows should be expanded
      expect(store.expandedRowIds).toEqual([])

      // Expand and then collapse all
      store.expandRow('row-1')
      store.collapseAllRows()

      // Should still be empty
      expect(store.expandedRowIds).toEqual([])
    })
  })
})
