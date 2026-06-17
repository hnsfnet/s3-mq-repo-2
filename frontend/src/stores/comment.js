import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { comments as commentApi } from '../api'

export const useCommentStore = defineStore('comment', () => {
  const comments = ref([])
  const loading = ref(false)
  const submitting = ref(false)
  const currentArticleId = ref('')
  const total = ref(0)

  const commentCount = computed(() => comments.value.length)

  const loadComments = async (articleId) => {
    if (!articleId) return []
    loading.value = true
    currentArticleId.value = articleId
    try {
      const res = await commentApi.list(articleId)
      comments.value = res.data || []
      total.value = res.meta?.total || res.data.length
      return res.data
    } finally {
      loading.value = false
    }
  }

  const addCommentOptimistic = (commentData, userInfo) => {
    const tempId = `temp-${Date.now()}`
    const optimisticComment = {
      _id: tempId,
      _isNew: true,
      _tempId: tempId,
      content: commentData.content,
      author: userInfo ? {
        _id: userInfo.id,
        username: userInfo.username
      } : null,
      createdAt: new Date().toISOString(),
      article: commentData.article
    }
    comments.value.unshift(optimisticComment)
    total.value++
    return tempId
  }

  const replaceTempComment = (tempId, realComment) => {
    const idx = comments.value.findIndex(c => c._id === tempId)
    if (idx !== -1) {
      comments.value.splice(idx, 1, { ...realComment, _isNew: false })
    }
  }

  const removeTempComment = (tempId) => {
    const idx = comments.value.findIndex(c => c._id === tempId)
    if (idx !== -1) {
      comments.value.splice(idx, 1)
      total.value--
    }
  }

  const createComment = async (commentData, userInfo) => {
    const tempId = addCommentOptimistic(commentData, userInfo)
    submitting.value = true

    try {
      const res = await commentApi.create(commentData)
      replaceTempComment(tempId, res.data)
      return res.data
    } catch (err) {
      removeTempComment(tempId)
      throw err
    } finally {
      submitting.value = false
    }
  }

  const deleteComment = async (commentId) => {
    const originalComments = [...comments.value]
    const originalTotal = total.value
    comments.value = comments.value.filter(c => c._id !== commentId)
    total.value--

    try {
      await commentApi.delete(commentId)
      return true
    } catch (err) {
      comments.value = originalComments
      total.value = originalTotal
      throw err
    }
  }

  const canDeleteComment = (comment, currentUser) => {
    if (!currentUser || !comment.author) return false
    return comment.author._id === currentUser.id || 
           comment.author.username === currentUser.username
  }

  const clearComments = () => {
    comments.value = []
    currentArticleId.value = ''
    total.value = 0
  }

  return {
    comments,
    loading,
    submitting,
    currentArticleId,
    total,
    commentCount,
    loadComments,
    createComment,
    deleteComment,
    canDeleteComment,
    addCommentOptimistic,
    replaceTempComment,
    removeTempComment,
    clearComments
  }
})