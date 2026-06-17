import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tags as tagApi } from '../api'

export const useTagStore = defineStore('tag', () => {
  const tags = ref([])
  const popularTags = ref([])
  const currentTag = ref(null)
  const loading = ref(false)
  const total = ref(0)

  const allTags = computed(() => tags.value)

  const tagMap = computed(() => {
    const map = {}
    ;[...tags.value, ...popularTags.value].forEach(tag => {
      map[tag.name] = tag
    })
    return map
  })

  const loadAllTags = async (params = {}) => {
    loading.value = true
    try {
      const res = await tagApi.list(params)
      tags.value = res.data
      total.value = res.meta?.total || res.data.length
      return res.data
    } finally {
      loading.value = false
    }
  }

  const loadPopularTags = async (limit = 10) => {
    loading.value = true
    try {
      const res = await tagApi.popular(limit)
      popularTags.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  const loadTagDetail = async (name) => {
    loading.value = true
    try {
      const res = await tagApi.get(name)
      currentTag.value = res.data.tag
      return res.data
    } finally {
      loading.value = false
    }
  }

  const createTag = async (data) => {
    loading.value = true
    try {
      const res = await tagApi.create(data)
      tags.value.push(res.data)
      return res.data
    } finally {
      loading.value = false
    }
  }

  const updateTag = async (id, data) => {
    loading.value = true
    try {
      const res = await tagApi.update(id, data)
      const index = tags.value.findIndex(t => t._id === id)
      if (index !== -1) {
        tags.value.splice(index, 1, res.data)
      }
      const popularIndex = popularTags.value.findIndex(t => t._id === id)
      if (popularIndex !== -1) {
        popularTags.value.splice(popularIndex, 1, res.data)
      }
      return res.data
    } finally {
      loading.value = false
    }
  }

  const deleteTag = async (id) => {
    loading.value = true
    try {
      await tagApi.delete(id)
      tags.value = tags.value.filter(t => t._id !== id)
      popularTags.value = popularTags.value.filter(t => t._id !== id)
      if (currentTag.value?._id === id) {
        currentTag.value = null
      }
      return true
    } finally {
      loading.value = false
    }
  }

  const getTagByName = (name) => {
    return tags.value.find(t => t.name === name) || 
           popularTags.value.find(t => t.name === name) ||
           tagMap.value[name]
  }

  const getTagColor = (name) => {
    const tag = getTagByName(name)
    return tag?.color || '#667eea'
  }

  return {
    tags,
    popularTags,
    currentTag,
    loading,
    total,
    allTags,
    tagMap,
    loadAllTags,
    loadPopularTags,
    loadTagDetail,
    createTag,
    updateTag,
    deleteTag,
    getTagByName,
    getTagColor
  }
})