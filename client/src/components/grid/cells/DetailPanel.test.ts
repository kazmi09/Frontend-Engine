import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fc, test } from '@fast-check/vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useGridStore } from '@/lib/grid/store'
import DetailPanel from './DetailPanel.vue'
import { Quasar } from 'quasar'
import type { ExpandableConfig } from '@/lib/grid/types'
import { defineComponent, h } from 'vue'

// Simple test renderer component
const TestRenderer = defineComponent({
  props: ['row', 'rowId', 'data'],
  setup(props) {
    return () => h('div', { class: 'test-renderer' }, `Row: ${props.rowId}`)
  }
})

describe('DetailPanel Component - Property Tests', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('Property 7: Detail Panel Colspan', () => {
    it('**Validates: Requirements 2.5** - colspan should equal visible column count', () => {
      const columnCount = 5
      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row: { id: 'test-1', name: 'Test' },
          rowId: 'test-1',
          columnCount,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      const td = wrapper.find('td')
      expect(td.exists()).toBe(true)
      expect(td.attributes('colspan')).toBe(String(columnCount))
    })

    test.prop([
      fc.integer({ min: 1, max: 50 }),
      fc.record({
        id: fc.string(),
        name: fc.string()
      })
    ], { numRuns: 100 })(
      '**Validates: Requirements 2.5** - colspan should always equal the provided columnCount',
      (columnCount, row) => {
        const expandableConfig: ExpandableConfig = {
          renderer: TestRenderer
        }

        const wrapper = mount(DetailPanel, {
          props: {
            row,
            rowId: row.id,
            columnCount,
            expandableConfig
          },
          global: {
            plugins: [Quasar]
          }
        })

        const td = wrapper.find('td')
        expect(td.exists()).toBe(true)
        expect(td.attributes('colspan')).toBe(String(columnCount))
      }
    )
  })

  describe('Property 12: Lazy Load Invocation', () => {
    it('**Validates: Requirements 4.2, 4.6** - lazyLoad should be called on first expansion with correct params', async () => {
      const store = useGridStore()
      const row = { id: 'test-2', name: 'Test Row' }
      const rowId = 'test-2'
      const lazyLoadMock = vi.fn().mockResolvedValue({ details: 'loaded data' })

      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer,
        lazyLoad: lazyLoadMock
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row,
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      // Wait for onMounted to complete
      await flushPromises()

      // lazyLoad should have been called once
      expect(lazyLoadMock).toHaveBeenCalledTimes(1)
      expect(lazyLoadMock).toHaveBeenCalledWith(row, rowId)
    })

    it('**Validates: Requirements 4.2, 4.6** - lazyLoad should not be called if data already cached', async () => {
      const store = useGridStore()
      const row = { id: 'test-3', name: 'Test Row' }
      const rowId = 'test-3'
      const lazyLoadMock = vi.fn().mockResolvedValue({ details: 'loaded data' })

      // Pre-populate the cache
      store.setDetailPanelData(rowId, { details: 'cached data' })

      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer,
        lazyLoad: lazyLoadMock
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row,
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      // Wait for onMounted to complete
      await flushPromises()

      // lazyLoad should NOT have been called because data was cached
      expect(lazyLoadMock).not.toHaveBeenCalled()
    })

    test.prop([
      fc.record({
        id: fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
        name: fc.string(),
        value: fc.integer()
      })
    ], { numRuns: 100 })(
      '**Validates: Requirements 4.2, 4.6** - lazyLoad should always be called with row and rowId',
      async (row) => {
        const lazyLoadMock = vi.fn().mockResolvedValue({ details: 'data' })

        const expandableConfig: ExpandableConfig = {
          renderer: TestRenderer,
          lazyLoad: lazyLoadMock
        }

        const wrapper = mount(DetailPanel, {
          props: {
            row,
            rowId: row.id,
            columnCount: 3,
            expandableConfig
          },
          global: {
            plugins: [Quasar]
          }
        })

        await flushPromises()

        // Should be called with correct parameters
        expect(lazyLoadMock).toHaveBeenCalledWith(row, row.id)
      }
    )
  })

  describe('Property 13: Loading Indicator Display', () => {
    it('**Validates: Requirements 4.3** - loading indicator should appear when loading', async () => {
      const store = useGridStore()
      const rowId = 'test-4'
      
      // Set loading state
      store.setDetailPanelLoading(rowId, true)

      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row: { id: rowId, name: 'Test' },
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      // Loading indicator should be visible
      const loadingDiv = wrapper.find('.detail-panel-loading')
      expect(loadingDiv.exists()).toBe(true)
      
      // Should contain spinner
      const spinner = wrapper.find('.q-spinner')
      expect(spinner.exists()).toBe(true)
      
      // Should contain loading text
      expect(wrapper.text()).toContain('Loading details...')
    })

    it('**Validates: Requirements 4.3** - loading indicator should not appear when not loading', async () => {
      const store = useGridStore()
      const rowId = 'test-5'
      
      // Set data (not loading)
      store.setDetailPanelData(rowId, { details: 'data' })

      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row: { id: rowId, name: 'Test' },
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      // Loading indicator should NOT be visible
      const loadingDiv = wrapper.find('.detail-panel-loading')
      expect(loadingDiv.exists()).toBe(false)
    })

    test.prop([
      fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
      fc.boolean()
    ], { numRuns: 100 })(
      '**Validates: Requirements 4.3** - loading indicator visibility should match loading state',
      (rowId, isLoading) => {
        const store = useGridStore()

        if (isLoading) {
          store.setDetailPanelLoading(rowId, true)
        } else {
          store.setDetailPanelData(rowId, { details: 'data' })
        }

        const expandableConfig: ExpandableConfig = {
          renderer: TestRenderer
        }

        const wrapper = mount(DetailPanel, {
          props: {
            row: { id: rowId, name: 'Test' },
            rowId,
            columnCount: 3,
            expandableConfig
          },
          global: {
            plugins: [Quasar]
          }
        })

        const loadingDiv = wrapper.find('.detail-panel-loading')
        
        if (isLoading) {
          expect(loadingDiv.exists()).toBe(true)
        } else {
          expect(loadingDiv.exists()).toBe(false)
        }
      }
    )
  })

  describe('Property 14: Error Display and Retry', () => {
    it('**Validates: Requirements 4.4** - error message and retry button should appear on error', () => {
      const store = useGridStore()
      const rowId = 'test-6'
      const errorMessage = 'Failed to load data'
      
      // Set error state
      store.setDetailPanelError(rowId, errorMessage)

      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row: { id: rowId, name: 'Test' },
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      // Error div should be visible
      const errorDiv = wrapper.find('.detail-panel-error')
      expect(errorDiv.exists()).toBe(true)
      
      // Should contain error icon
      const errorIcon = wrapper.find('.q-icon')
      expect(errorIcon.exists()).toBe(true)
      
      // Should contain error message
      expect(wrapper.text()).toContain(errorMessage)
      
      // Should contain retry button
      const retryButton = wrapper.find('button')
      expect(retryButton.exists()).toBe(true)
      expect(retryButton.text()).toContain('Retry')
    })

    it('**Validates: Requirements 4.4** - retry button should emit retry event', () => {
      const store = useGridStore()
      const rowId = 'test-7'
      
      store.setDetailPanelError(rowId, 'Error')

      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row: { id: rowId, name: 'Test' },
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      const retryButton = wrapper.find('button')
      retryButton.trigger('click')

      // Should emit retry event with rowId
      expect(wrapper.emitted('retry')).toBeTruthy()
      expect(wrapper.emitted('retry')?.[0]).toEqual([rowId])
    })

    test.prop([
      fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
      fc.string({ minLength: 1 })
    ], { numRuns: 100 })(
      '**Validates: Requirements 4.4** - error display should always show error message and retry button',
      (rowId, errorMessage) => {
        const store = useGridStore()
        store.setDetailPanelError(rowId, errorMessage)

        const expandableConfig: ExpandableConfig = {
          renderer: TestRenderer
        }

        const wrapper = mount(DetailPanel, {
          props: {
            row: { id: rowId, name: 'Test' },
            rowId,
            columnCount: 3,
            expandableConfig
          },
          global: {
            plugins: [Quasar]
          }
        })

        // Error div should exist
        const errorDiv = wrapper.find('.detail-panel-error')
        expect(errorDiv.exists()).toBe(true)
        
        // Should contain the error message
        expect(wrapper.text()).toContain(errorMessage)
        
        // Should have retry button
        const retryButton = wrapper.find('button')
        expect(retryButton.exists()).toBe(true)
      }
    )
  })

  describe('Property 15: Lazy Load Caching', () => {
    it('**Validates: Requirements 4.5** - lazyLoad should only be called once per row', async () => {
      const store = useGridStore()
      const row = { id: 'test-8', name: 'Test Row' }
      const rowId = 'test-8'
      const lazyLoadMock = vi.fn().mockResolvedValue({ details: 'loaded data' })

      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer,
        lazyLoad: lazyLoadMock
      }

      // First mount - should call lazyLoad
      const wrapper1 = mount(DetailPanel, {
        props: {
          row,
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      await flushPromises()
      expect(lazyLoadMock).toHaveBeenCalledTimes(1)

      // Unmount
      wrapper1.unmount()

      // Second mount - should NOT call lazyLoad again (data is cached)
      const wrapper2 = mount(DetailPanel, {
        props: {
          row,
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      await flushPromises()
      
      // Should still be called only once (cached)
      expect(lazyLoadMock).toHaveBeenCalledTimes(1)
    })

    test.prop([
      fc.record({
        id: fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
        name: fc.string()
      }),
      fc.integer({ min: 2, max: 5 })
    ], { numRuns: 100 })(
      '**Validates: Requirements 4.5** - lazyLoad should be called exactly once regardless of mount count',
      async (row, mountCount) => {
        const store = useGridStore()
        const lazyLoadMock = vi.fn().mockResolvedValue({ details: 'data' })

        const expandableConfig: ExpandableConfig = {
          renderer: TestRenderer,
          lazyLoad: lazyLoadMock
        }

        // Mount and unmount multiple times
        for (let i = 0; i < mountCount; i++) {
          const wrapper = mount(DetailPanel, {
            props: {
              row,
              rowId: row.id,
              columnCount: 3,
              expandableConfig
            },
            global: {
              plugins: [Quasar]
            }
          })

          await flushPromises()
          wrapper.unmount()
        }

        // Should be called exactly once
        expect(lazyLoadMock).toHaveBeenCalledTimes(1)
      }
    )
  })

  describe('Property 24: Detail Panel Aria Attributes', () => {
    it('**Validates: Requirements 8.3, 8.4** - aria-labelledby and role should be present', () => {
      const rowId = 'test-9'
      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row: { id: rowId, name: 'Test' },
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      const contentDiv = wrapper.find('.detail-panel-content')
      expect(contentDiv.exists()).toBe(true)
      
      // Should have role="region"
      expect(contentDiv.attributes('role')).toBe('region')
      
      // Should have aria-labelledby referencing the row
      expect(contentDiv.attributes('aria-labelledby')).toBe(`row-${rowId}`)
    })

    test.prop([
      fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype')
    ], { numRuns: 100 })(
      '**Validates: Requirements 8.3, 8.4** - aria attributes should always be present and correct',
      (rowId) => {
        const expandableConfig: ExpandableConfig = {
          renderer: TestRenderer
        }

        const wrapper = mount(DetailPanel, {
          props: {
            row: { id: rowId, name: 'Test' },
            rowId,
            columnCount: 3,
            expandableConfig
          },
          global: {
            plugins: [Quasar]
          }
        })

        const contentDiv = wrapper.find('.detail-panel-content')
        expect(contentDiv.exists()).toBe(true)
        
        // Should have role="region"
        expect(contentDiv.attributes('role')).toBe('region')
        
        // Should have aria-labelledby with correct format
        const ariaLabelledBy = contentDiv.attributes('aria-labelledby')
        expect(ariaLabelledBy).toBe(`row-${rowId}`)
        expect(ariaLabelledBy).toContain(rowId)
      }
    )

    it('**Validates: Requirements 8.3, 8.4** - aria attributes should be present in all states', () => {
      const store = useGridStore()
      const rowId = 'test-10'
      
      // Test in loading state
      store.setDetailPanelLoading(rowId, true)
      
      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row: { id: rowId, name: 'Test' },
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      const contentDiv = wrapper.find('.detail-panel-content')
      expect(contentDiv.attributes('role')).toBe('region')
      expect(contentDiv.attributes('aria-labelledby')).toBe(`row-${rowId}`)
    })
  })

  describe('Additional Edge Cases', () => {
    it('should render slot content when renderer is a string', () => {
      const expandableConfig: ExpandableConfig = {
        renderer: 'detail-slot'
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row: { id: 'test-11', name: 'Test' },
          rowId: 'test-11',
          columnCount: 3,
          expandableConfig
        },
        slots: {
          default: '<div class="slot-content">Slot Content</div>'
        },
        global: {
          plugins: [Quasar]
        }
      })

      expect(wrapper.find('.slot-content').exists()).toBe(true)
      expect(wrapper.text()).toContain('Slot Content')
    })

    it('should render component when renderer is a component', () => {
      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row: { id: 'test-12', name: 'Test' },
          rowId: 'test-12',
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      expect(wrapper.find('.test-renderer').exists()).toBe(true)
    })

    it('should handle lazy load errors gracefully', async () => {
      const store = useGridStore()
      const rowId = 'test-13'
      const errorMessage = 'Network error'
      const lazyLoadMock = vi.fn().mockRejectedValue(new Error(errorMessage))

      const expandableConfig: ExpandableConfig = {
        renderer: TestRenderer,
        lazyLoad: lazyLoadMock
      }

      const wrapper = mount(DetailPanel, {
        props: {
          row: { id: rowId, name: 'Test' },
          rowId,
          columnCount: 3,
          expandableConfig
        },
        global: {
          plugins: [Quasar]
        }
      })

      await flushPromises()

      // Should display error
      const errorDiv = wrapper.find('.detail-panel-error')
      expect(errorDiv.exists()).toBe(true)
      expect(wrapper.text()).toContain(errorMessage)
    })
  })
})
