import { describe, it, expect, beforeEach } from 'vitest'
import { fc, test } from '@fast-check/vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useGridStore } from '@/lib/grid/store'
import ExpanderCell from './ExpanderCell.vue'
import { Quasar } from 'quasar'

describe('ExpanderCell Component - Property Tests', () => {
  beforeEach(() => {
    // Create a fresh Pinia instance for each test
    setActivePinia(createPinia())
  })

  describe('Property 4: Expander Icon State', () => {
    it('**Validates: Requirements 1.5** - icon should be chevron_right when collapsed', () => {
      const store = useGridStore()
      const rowId = 'test-row-1'

      // Ensure row is collapsed
      store.collapseRow(rowId)

      const wrapper = mount(ExpanderCell, {
        props: {
          rowId,
          canExpand: true
        },
        global: {
          plugins: [Quasar]
        }
      })

      // Icon should be chevron_right for collapsed state
      const icon = wrapper.find('.q-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('aria-label')).toContain('chevron_right')
    })

    it('**Validates: Requirements 1.5** - icon should be expand_more when expanded', () => {
      const store = useGridStore()
      const rowId = 'test-row-2'

      // Expand the row
      store.expandRow(rowId)

      const wrapper = mount(ExpanderCell, {
        props: {
          rowId,
          canExpand: true
        },
        global: {
          plugins: [Quasar]
        }
      })

      // Icon should be expand_more for expanded state
      const icon = wrapper.find('.q-icon')
      expect(icon.exists()).toBe(true)
      expect(icon.attributes('aria-label')).toContain('expand_more')
    })

    test.prop([
      fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
      fc.boolean()
    ], { numRuns: 100 })(
      '**Validates: Requirements 1.5** - icon should always match expansion state',
      (rowId, isExpanded) => {
        const store = useGridStore()

        // Set expansion state
        if (isExpanded) {
          store.expandRow(rowId)
        } else {
          store.collapseRow(rowId)
        }

        const wrapper = mount(ExpanderCell, {
          props: {
            rowId,
            canExpand: true
          },
          global: {
            plugins: [Quasar]
          }
        })

        // Icon should match expansion state
        const icon = wrapper.find('.q-icon')
        expect(icon.exists()).toBe(true)
        
        const expectedIcon = isExpanded ? 'expand_more' : 'chevron_right'
        expect(icon.attributes('aria-label')).toContain(expectedIcon)
      }
    )
  })

  describe('Property 19: Keyboard Toggle', () => {
    it('**Validates: Requirements 7.1** - Enter key should emit toggle event', () => {
      const store = useGridStore()
      const rowId = 'test-row-3'

      const wrapper = mount(ExpanderCell, {
        props: {
          rowId,
          canExpand: true
        },
        global: {
          plugins: [Quasar]
        }
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)

      // Trigger Enter key
      button.trigger('keydown.enter')

      // Should emit toggle event with rowId
      expect(wrapper.emitted('toggle')).toBeTruthy()
      expect(wrapper.emitted('toggle')?.[0]).toEqual([rowId])
    })

    it('**Validates: Requirements 7.2** - Space key should emit toggle event', () => {
      const store = useGridStore()
      const rowId = 'test-row-4'

      const wrapper = mount(ExpanderCell, {
        props: {
          rowId,
          canExpand: true
        },
        global: {
          plugins: [Quasar]
        }
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)

      // Trigger Space key
      button.trigger('keydown.space')

      // Should emit toggle event with rowId
      expect(wrapper.emitted('toggle')).toBeTruthy()
      expect(wrapper.emitted('toggle')?.[0]).toEqual([rowId])
    })

    test.prop([
      fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
      fc.constantFrom('keydown.enter', 'keydown.space')
    ], { numRuns: 100 })(
      '**Validates: Requirements 7.1, 7.2** - Enter/Space should always emit toggle event',
      (rowId, keyEvent) => {
        const wrapper = mount(ExpanderCell, {
          props: {
            rowId,
            canExpand: true
          },
          global: {
            plugins: [Quasar]
          }
        })

        const button = wrapper.find('button')
        expect(button.exists()).toBe(true)

        // Trigger keyboard event
        button.trigger(keyEvent)

        // Should emit toggle event with correct rowId
        expect(wrapper.emitted('toggle')).toBeTruthy()
        expect(wrapper.emitted('toggle')?.[0]).toEqual([rowId])
      }
    )
  })

  describe('Property 22: Aria-Expanded Attribute', () => {
    it('**Validates: Requirements 8.1** - aria-expanded should be "false" when collapsed', () => {
      const store = useGridStore()
      const rowId = 'test-row-5'

      // Ensure row is collapsed
      store.collapseRow(rowId)

      const wrapper = mount(ExpanderCell, {
        props: {
          rowId,
          canExpand: true
        },
        global: {
          plugins: [Quasar]
        }
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.attributes('aria-expanded')).toBe('false')
    })

    it('**Validates: Requirements 8.1** - aria-expanded should be "true" when expanded', () => {
      const store = useGridStore()
      const rowId = 'test-row-6'

      // Expand the row
      store.expandRow(rowId)

      const wrapper = mount(ExpanderCell, {
        props: {
          rowId,
          canExpand: true
        },
        global: {
          plugins: [Quasar]
        }
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.attributes('aria-expanded')).toBe('true')
    })

    test.prop([
      fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
      fc.boolean()
    ], { numRuns: 100 })(
      '**Validates: Requirements 8.1** - aria-expanded should always reflect expansion state',
      (rowId, isExpanded) => {
        const store = useGridStore()

        // Set expansion state
        if (isExpanded) {
          store.expandRow(rowId)
        } else {
          store.collapseRow(rowId)
        }

        const wrapper = mount(ExpanderCell, {
          props: {
            rowId,
            canExpand: true
          },
          global: {
            plugins: [Quasar]
          }
        })

        const button = wrapper.find('button')
        expect(button.exists()).toBe(true)
        
        const expectedValue = isExpanded ? 'true' : 'false'
        expect(button.attributes('aria-expanded')).toBe(expectedValue)
      }
    )
  })

  describe('Property 23: Aria-Label on Expander', () => {
    it('**Validates: Requirements 8.2** - aria-label should be present when collapsed', () => {
      const store = useGridStore()
      const rowId = 'test-row-7'

      // Ensure row is collapsed
      store.collapseRow(rowId)

      const wrapper = mount(ExpanderCell, {
        props: {
          rowId,
          canExpand: true
        },
        global: {
          plugins: [Quasar]
        }
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.attributes('aria-label')).toBe('Expand row')
    })

    it('**Validates: Requirements 8.2** - aria-label should be present when expanded', () => {
      const store = useGridStore()
      const rowId = 'test-row-8'

      // Expand the row
      store.expandRow(rowId)

      const wrapper = mount(ExpanderCell, {
        props: {
          rowId,
          canExpand: true
        },
        global: {
          plugins: [Quasar]
        }
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.attributes('aria-label')).toBe('Collapse row')
    })

    test.prop([
      fc.string().filter(s => s !== '__proto__' && s !== 'constructor' && s !== 'prototype'),
      fc.boolean()
    ], { numRuns: 100 })(
      '**Validates: Requirements 8.2** - aria-label should always be present and descriptive',
      (rowId, isExpanded) => {
        const store = useGridStore()

        // Set expansion state
        if (isExpanded) {
          store.expandRow(rowId)
        } else {
          store.collapseRow(rowId)
        }

        const wrapper = mount(ExpanderCell, {
          props: {
            rowId,
            canExpand: true
          },
          global: {
            plugins: [Quasar]
          }
        })

        const button = wrapper.find('button')
        expect(button.exists()).toBe(true)
        
        const ariaLabel = button.attributes('aria-label')
        expect(ariaLabel).toBeDefined()
        expect(ariaLabel).toBeTruthy()
        
        // Should contain either "Expand" or "Collapse"
        expect(ariaLabel).toMatch(/^(Expand|Collapse) row$/)
        
        // Should match expansion state
        if (isExpanded) {
          expect(ariaLabel).toBe('Collapse row')
        } else {
          expect(ariaLabel).toBe('Expand row')
        }
      }
    )
  })

  describe('Additional Edge Cases', () => {
    it('should not render button when canExpand is false', () => {
      const wrapper = mount(ExpanderCell, {
        props: {
          rowId: 'test-row-9',
          canExpand: false
        },
        global: {
          plugins: [Quasar]
        }
      })

      const button = wrapper.find('button')
      expect(button.exists()).toBe(false)
      
      const placeholder = wrapper.find('.expander-placeholder')
      expect(placeholder.exists()).toBe(true)
    })

    it('should emit toggle event on click', () => {
      const rowId = 'test-row-10'
      const wrapper = mount(ExpanderCell, {
        props: {
          rowId,
          canExpand: true
        },
        global: {
          plugins: [Quasar]
        }
      })

      const button = wrapper.find('button')
      button.trigger('click')

      expect(wrapper.emitted('toggle')).toBeTruthy()
      expect(wrapper.emitted('toggle')?.[0]).toEqual([rowId])
    })
  })
})