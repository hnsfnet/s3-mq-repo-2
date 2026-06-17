import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tags as tagApi } from '../api'

interface Tag {
  _id: string
  name: string
  description?: string
  color: string
  count: number
  createdAt?: string
  [key: string]: any
}

interface TagCreateData {
  name: string
  description?: string
  color?: string
}

export const useTagStore = defineStore('tag', () => {
  const tags = ref<Tag[]>([])
  const popularTags = ref<Tag[]>([])
  const currentTag = ref<Tag | null>(null)
  const loading = ref(false)
  const total = ref(0)

  const allTags = computed(() => tags.value)

  const tagMap = computed(() => {
    const map: Record<string, Tag> = {}
    ;[...tags.value, ...popularTags.value].forEach(tag => {
      map[tag.name] = tag
    })
    return map
  })

  const loadAllTags = async (params: Record<string, any> = {}): Promise<Tag[]> => {
    loading.value = true
    try {
      const res = await tagApi.list(params)
      tags.value = res.data
      total.value = res.meta?.total || (res.data || []).length
      return res.data
    } finally {
      loading.value = false
    }
  }

  const loadPopularTags = async (limit: number = 10): Promise<Tag[]> => {
    loading.value = true
    try {
      const res = await tagApi.popular(limit)
      popularTags.value = res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  const loadTagDetail = async (name: string): Promise<Tag> => {
    loading.value = true
    try {
      const res = await tagApi.get(name)
      currentTag.value = res.data?.tag || res.data
      return res.data
    } finally {
      loading.value = false
    }
  }

  const createTag = async (data: TagCreateData): Promise<Tag> => {
    loading.value = true
    try {
      const res = await tagApi.create(data)
      tags.value.push(res.data)
      return res.data
    } finally {
      loading.value = false
    }
  }

  const updateTag = async (id: string, data: Partial<TagCreateData>): Promise<Tag> => {
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

  const deleteTag = async (id: string): Promise<boolean> => {
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

  const getTagByName = (name: string): Tag | undefined => {
    return tags.value.find(t => t.name === name) ||
           popularTags.value.find(t => t.name === name) ||
           tagMap.value[name]
  }

  const getTagColor = (name: string): string => {
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