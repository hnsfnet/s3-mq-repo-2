<template>
  <div class="article-detail">
    <div class="container">
      <div v-loading="articleStore.detailLoading" v-if="articleStore.currentArticle" class="article">
        <router-link to="/articles" class="back-link">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </router-link>
        <h1>{{ articleStore.currentArticle.title }}</h1>
        <div class="meta">
          <span class="author-item">
            <el-icon><User /></el-icon>
            {{ articleStore.currentArticle.author?.username }}
          </span>
          <span class="date-item">
            <el-icon><Calendar /></el-icon>
            {{ formatDate(articleStore.currentArticle.createdAt) }}
          </span>
          <span class="view-item">
            <el-icon><View /></el-icon>
            {{ articleStore.currentArticle.views }} 阅读
          </span>
          <span v-if="articleStore.currentArticle.category" class="category-badge">
            {{ articleStore.currentArticle.category }}
          </span>
        </div>
        <div class="tags" v-if="articleStore.currentArticle.tags && articleStore.currentArticle.tags.length > 0">
          <span
            v-for="tag in articleStore.currentArticle.tags"
            :key="tag"
            class="tag"
          >#{{ tag }}</span>
        </div>
        <div class="content">{{ articleStore.currentArticle.content }}</div>
        <div class="article-footer" v-if="formatDate(articleStore.currentArticle.updatedAt) !== formatDate(articleStore.currentArticle.createdAt)">
          <el-icon><Edit /></el-icon>
          最后更新于 {{ formatDate(articleStore.currentArticle.updatedAt) }}
        </div>
      </div>

      <div class="comments-section">
        <div class="comments-header">
          <h2>
            <el-icon><ChatDotRound /></el-icon>
            评论
            <span class="count-badge">{{ commentStore.commentCount }}</span>
          </h2>
          <el-button
            link
            type="primary"
            :icon="Refresh"
            @click="refreshComments"
            :loading="commentStore.loading"
          >刷新</el-button>
        </div>

        <div v-if="userStore.isLoggedIn" class="comment-form">
          <div class="form-header">
            <el-avatar :size="36" class="user-avatar">
              {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <span class="user-name">{{ userStore.userInfo?.username }}</span>
          </div>
          <el-input
            v-model="newComment"
            type="textarea"
            placeholder="写下你的评论..."
            :rows="3"
            maxlength="500"
            show-word-limit
            :disabled="commentStore.submitting"
          ></el-input>
          <div class="form-actions">
            <span class="tip">支持纯文本评论，友善发言</span>
            <el-button
              type="primary"
              @click="submitComment"
              :loading="commentStore.submitting"
              :disabled="!newComment.trim()"
            >
              <el-icon><Promotion /></el-icon>
              发表评论
            </el-button>
          </div>
        </div>
        <div v-else class="login-tip">
          <el-icon><Warning /></el-icon>
          请先
          <router-link to="/login">登录</router-link>
          后发表评论
          <router-link to="/register" class="register-link">立即注册</router-link>
        </div>

        <div v-loading="commentStore.loading" class="comments-list">
          <transition-group name="comment">
            <div
              v-for="(comment, index) in commentStore.comments"
              :key="comment._id || `temp-${index}`"
              :class="['comment-item', { 'optimistic': comment._isNew }"
            >
              <div class="comment-left">
                <el-avatar :size="40" class="avatar">
                  {{ comment.author?.username?.charAt(0)?.toUpperCase() || 'U' }}
                </el-avatar>
              </div>
              <div class="comment-right">
                <div class="comment-header">
                  <span class="author">{{ comment.author?.username || '匿名用户' }}</span>
                  <span class="time">
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(comment.createdAt) }}
                  </span>
                </div>
                <p class="comment-content">{{ comment.content }}</p>
                <div class="comment-actions" v-if="commentStore.canDeleteComment(comment, userStore.userInfo)">
                  <el-button
                    link
                    type="danger"
                    size="small"
                    @click="deleteComment(comment)"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </transition-group>
        </div>

        <div v-if="!commentStore.loading && commentStore.commentCount === 0" class="empty">
          <el-empty description="暂无评论，快来发表第一条评论吧！" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  User,
  Calendar,
  View,
  ChatDotRound,
  Refresh,
  Promotion,
  Warning,
  Clock,
  Delete,
  Edit
} from '@element-plus/icons-vue'
import { useArticleStore } from '../stores/article'
import { useCommentStore } from '../stores/comment'
import { useUserStore } from '../stores/user'

const route = useRoute()
const articleStore = useArticleStore()
const commentStore = useCommentStore()
const userStore = useUserStore()
const newComment = ref('')

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadData = async () => {
  const articleId = route.params.id
  await Promise.all([
    articleStore.loadArticleDetail(articleId),
    commentStore.loadComments(articleId)
  ])
}

const refreshComments = async () => {
  await commentStore.loadComments(route.params.id)
  ElMessage.success('评论已刷新')
}

const submitComment = async () => {
  const content = newComment.value.trim()
  if (!content) {
    ElMessage.error('请输入评论内容')
    return
  }
  if (content.length < 2) {
    ElMessage.error('评论内容至少需要2个字符')
    return
  }

  try {
    await commentStore.createComment(
      { content, article: route.params.id },
      userStore.userInfo
    )
    newComment.value = ''
    ElMessage.success('评论发表成功')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '评论发表失败，请重试')
  }
}

const deleteComment = async (comment) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await commentStore.deleteComment(comment._id)
    ElMessage.success('删除成功')
  } catch {
  }
}

onMounted(() => {
  loadData()
})

onBeforeUnmount(() => {
  articleStore.clearCurrentArticle()
  commentStore.clearComments()
})
</script>

<style scoped>
.article-detail {
  padding: 20px 0 60px;
  min-height: 100vh;
}

.container {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 20px;
}

.article {
  background: white;
  padding: 36px 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  margin-bottom: 28px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #999;
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 20px;
  transition: color 0.3s;
}

.back-link:hover {
  color: #667eea;
}

.article h1 {
  font-size: 32px;
  margin-bottom: 16px;
  color: #1a1a1a;
  line-height: 1.4;
  font-weight: 700;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  color: #888;
  font-size: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
}

.meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.category-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.tags {
  display: flex;
  gap: 8px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.tag {
  background: #f0f4ff;
  color: #667eea;
  padding: 5px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.tag:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.content {
  line-height: 1.9;
  color: #333;
  font-size: 16px;
  white-space: pre-wrap;
  word-break: break-word;
}

.article-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  color: #aaa;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.comments-section {
  background: white;
  padding: 32px 40px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 28px;
}

.comments-header h2 {
  font-size: 20px;
  margin: 0;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2px 12px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 500;
  min-width: 28px;
  text-align: center;
}

.comment-form {
  margin-bottom: 32px;
  padding: 20px;
  background: #fafbff;
  border-radius: 12px;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 600;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.tip {
  font-size: 12px;
  color: #999;
}

.login-tip {
  padding: 20px;
  background: #fff8e6;
  border: 1px solid #ffe58f;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 32px;
  color: #ad8b00;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-tip a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.login-tip a:hover {
  text-decoration: underline;
}

.register-link {
  margin-left: 8px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100px;
}

.comment-item {
  display: flex;
  gap: 14px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 12px;
  transition: all 0.3s;
}

.comment-item:hover {
  background: #f5f7ff;
}

.comment-item.optimistic {
  background: #f0fff4;
  border: 1px dashed #95de64;
}

.comment-left {
  flex-shrink: 0;
}

.avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-weight: 600;
  color: white;
}

.comment-right {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.author {
  font-weight: 600;
  color: #333;
  font-size: 15px;
}

.time {
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.comment-content {
  color: #555;
  line-height: 1.7;
  font-size: 14px;
  word-break: break-word;
  margin: 0;
}

.comment-actions {
  margin-top: 8px;
}

.empty {
  padding: 40px 0;
}

.comment-enter-active,
.comment-leave-active {
  transition: all 0.4s ease;
}

.comment-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.comment-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

@media (max-width: 640px) {
  .article {
    padding: 24px 20px;
  }

  .article h1 {
    font-size: 24px;
  }

  .comments-section {
    padding: 24px 20px;
  }

  .form-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .form-actions .el-button {
    width: 100%;
  }
}
</style>