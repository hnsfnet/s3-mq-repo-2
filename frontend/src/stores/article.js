import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { articles as articleApi } from '../api'

export const useArticleStore = defineStore('article', () => {
  const articles = ref([])
  const currentArticle = ref(null)
  const loading = ref(false)
  const detailLoading = ref(false)
  const total = ref(0)
  const filters = ref({
    search: '',
    tag: '',
    category: '',
    sort: 'newest',
    page: 1,
    limit: 20
  })

  const sortedArticles = computed(() => {
    let result = [...articles.value]
    if (filters.value.sort === 'views') {
      result.sort((a, b) => b.views - a.views)
    }
    return result
  })

  const hasMore = computed(() => {
    return articles.value.length < total.value
  })

  const loadArticles = async (params = {}) => {
    loading.value = true
    try {
      const queryParams = {}

      if (filters.value.search || params.search) {
        queryParams.search = params.search !== undefined ? params.search : filters.value.search
      }
      if (filters.value.tag || params.tag) {
        queryParams.tag = params.tag !== undefined ? params.tag : filters.value.tag
      }
      if (filters.value.category || params.category) {
        queryParams.category = params.category !== undefined ? params.category : filters.value.category
      }

      const sortBy = params.sort || filters.value.sort
      if (sortBy === 'views' || sortBy === 'popular') {
        queryParams.sort = 'views'
      } else if (sortBy === 'oldest') {
        queryParams.sort = 'oldest'
      }

      const page = params.page !== undefined ? params.page : filters.value.page
      const limit = params.limit !== undefined ? params.limit : filters.value.limit
      queryParams.page = page
      queryParams.limit = limit

      Object.keys(params).forEach(key => {
        if (params[key] !== undefined) {
          filters.value[key] = params[key]
        }
      })

      const res = await articleApi.list(queryParams)
      articles.value = res.data || []
      total.value = res.meta?.total || (res.data || []).length
      return res.data
    } finally {
      loading.value = false
    }
  }

  const loadMoreArticles = async () => {
    if (loading.value || !hasMore.value) return

    loading.value = true
    try {
      const nextPage = filters.value.page + 1
      const queryParams = {}

      if (filters.value.search) queryParams.search = filters.value.search
      if (filters.value.tag) queryParams.tag = filters.value.tag
      if (filters.value.category) queryParams.category = filters.value.category
      if (filters.value.sort === 'views' || filters.value.sort === 'popular') {
        queryParams.sort = 'views'
      }
      queryParams.page = nextPage
      queryParams.limit = filters.value.limit

      const res = await articleApi.list(queryParams)
      const newArticles = res.data || []
      articles.value = [...articles.value, ...newArticles]
      filters.value.page = nextPage
      total.value = res.meta?.total || total.value
      return newArticles
    } finally {
      loading.value = false
    }
  }

  const loadArticleDetail = async (id) => {
    detailLoading.value = true
    try {
      const res = await articleApi.get(id)
      currentArticle.value = res.data
      return res.data
    } finally {
      detailLoading.value = false
    }
  }

  const createArticle = async (data) => {
    loading.value = true
    try {
      const res = await articleApi.create(data)
      articles.value.unshift(res.data)
      total.value++
      return res.data
    } finally {
      loading.value = false
    }
  }

  const updateArticle = async (id, data) => {
    loading.value = true
    try {
      const res = await articleApi.update(id, data)
      const index = articles.value.findIndex(a => a._id === id)
      if (index !== -1) {
        articles.value.splice(index, 1, res.data)
      }
      if (currentArticle.value?._id === id) {
        currentArticle.value = res.data
      }
      return res.data
    } finally {
      loading.value = false
    }
  }

  const deleteArticle = async (id) => {
    loading.value = true
    try {
      await articleApi.delete(id)
      articles.value = articles.value.filter(a => a._id !== id)
      total.value--
      if (currentArticle.value?._id === id) {
        currentArticle.value = null
      }
      return true
    } finally {
      loading.value = false
    }
  }

  const setFilter = (key, value) => {
    filters.value[key] = value
  }

  const resetFilters = () => {
    filters.value = {
      search: '',
      tag: '',
      category: '',
      sort: 'newest',
      page: 1,
      limit: 20
    }
  }

  const incrementViews = (id) => {
    const article = articles.value.find(a => a._id === id)
    if (article) {
      article.views++
    }
    if (currentArticle.value?._id === id) {
      currentArticle.value.views++
    }
  }

  const clearCurrentArticle = () => {
    currentArticle.value = null
  }

  const clearArticles = () => {
    articles.value = []
    total.value = 0
  }

  return {
    articles,
    currentArticle,
    loading,
    detailLoading,
    total,
    filters,
    sortedArticles,
    hasMore,
    loadArticles,
    loadMoreArticles,
    loadArticleDetail,
    createArticle,
    updateArticle,
    deleteArticle,
    setFilter,
    resetFilters,
    incrementViews,
    clearCurrentArticle,
    clearArticles
  }
})