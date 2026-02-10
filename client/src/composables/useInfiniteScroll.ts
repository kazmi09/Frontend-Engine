import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useInfiniteQuery } from '@tanstack/vue-query'

interface InfiniteScrollOptions {
  queryKey: string[]
  queryFn: (pageIndex: number, pageSize: number) => Promise<any>
  pageSize: number
  prefetchThreshold?: number // Load next page when this % from bottom (default 80%)
  enabled?: boolean
}

export function useInfiniteScroll(options: InfiniteScrollOptions) {
  const {
    queryKey,
    queryFn,
    pageSize,
    prefetchThreshold = 0.8,
    enabled = true
  } = options

  const scrollContainerRef = ref<HTMLElement | null>(null)
  const isLoadingMore = ref(false)
  const currentPage = ref(0)
  const allData = ref<any[]>([])
  const totalRows = ref(0)
  const hasMore = computed(() => allData.value.length < totalRows.value)

  // Load a page of data
  const loadPage = async (pageIndex: number) => {
    if (isLoadingMore.value) return
    
    isLoadingMore.value = true
    try {
      const result = await queryFn(pageIndex, pageSize)
      
      if (pageIndex === 0) {
        // First page - replace data
        allData.value = result.rows
      } else {
        // Subsequent pages - append data
        allData.value = [...allData.value, ...result.rows]
      }
      
      totalRows.value = result.pagination?.totalRows || 0
      currentPage.value = pageIndex
    } finally {
      isLoadingMore.value = false
    }
  }

  // Check if we should load more data
  const checkScroll = () => {
    if (!scrollContainerRef.value || !enabled || !hasMore.value || isLoadingMore.value) {
      return
    }

    const container = scrollContainerRef.value
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    
    // Calculate how far down we've scrolled (0 to 1)
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
    
    // If we've scrolled past the threshold, load next page
    if (scrollPercentage >= prefetchThreshold) {
      console.log('[InfiniteScroll] Loading next page:', currentPage.value + 1)
      loadPage(currentPage.value + 1)
    }
  }

  // Scroll position info
  const scrollInfo = computed(() => {
    const start = 1
    const end = allData.value.length
    const total = totalRows.value
    
    return {
      start,
      end,
      total,
      percentage: total > 0 ? Math.round((end / total) * 100) : 0
    }
  })

  // Reset and load from beginning
  const reset = async () => {
    allData.value = []
    currentPage.value = 0
    totalRows.value = 0
    await loadPage(0)
  }

  // Load all data at once
  const loadAll = async () => {
    console.log('[InfiniteScroll] Loading all data...')
    isLoadingMore.value = true
    
    try {
      // Load with a very large page size
      const result = await queryFn(0, 999999)
      allData.value = result.rows
      totalRows.value = result.pagination?.totalRows || result.rows.length
      currentPage.value = 0
    } finally {
      isLoadingMore.value = false
    }
  }

  // Setup scroll listener
  onMounted(() => {
    if (scrollContainerRef.value) {
      scrollContainerRef.value.addEventListener('scroll', checkScroll)
    }
  })

  onUnmounted(() => {
    if (scrollContainerRef.value) {
      scrollContainerRef.value.removeEventListener('scroll', checkScroll)
    }
  })

  return {
    scrollContainerRef,
    allData,
    totalRows,
    isLoadingMore,
    hasMore,
    scrollInfo,
    loadPage,
    reset,
    loadAll,
    checkScroll
  }
}
