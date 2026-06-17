<template>
  <div class="article-detail">
    <div class="container">
      <div v-if="article" class="article">
        <h1>{{ article.title }}</h1>
        <div class="meta">
          <span>{{ article.author?.username }}</span>
          <span>{{ formatDate(article.createdAt) }}</span>
          <span>阅读 {{ article.views }}</span>
        </div>
        <div class="tags">
          <span
            v-for="tag in article.tags"
            :key="tag"
            class="tag"
          >{{ tag }}</span>
        </div>
        <div class="content" v-html="article.content"></div>
      </div>
      
      <div class="comments-section">
        <h2>评论 ({{ comments.length }})</h2>
        
        <div v-if="isLoggedIn" class="comment-form">
          <el-input
            v-model="newComment"
            type="textarea"
            placeholder="写下你的评论..."
            :rows="3"
          ></el-input>
          <el-button type="primary" @click="submitComment" class="submit-btn">发表评论</el-button>
        </div>
        <div v-else class="login-tip">
          <router-link to="/login">登录</router-link> 后才能发表评论
        </div>
        
        <div class="comments-list">
          <div
            v-for="comment in comments"
            :key="comment._id"
            class="comment-item"
          >
            <div class="comment-header">
              <span class="author">{{ comment.author?.username }}</span>
              <span class="time">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <p class="comment-content">{{ comment.content }}</p>
          </div>
        </div>
        
        <div v-if="comments.length === 0" class="empty">
          <p>暂无评论，快来发表第一条评论吧！</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { articles as articleApi, comments as commentApi } from '../api'

const route = useRoute()
const article = ref(null)
const comments = ref([])
const newComment = ref('')
const isLoggedIn = ref(!!localStorage.getItem('token'))

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const loadArticle = async () => {
  try {
    const res = await articleApi.get(route.params.id)
    article.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const loadComments = async () => {
  try {
    const res = await commentApi.list(route.params.id)
    comments.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) {
    ElMessage.error('请输入评论内容')
    return
  }
  try {
    await commentApi.create({
      content: newComment.value,
      article: route.params.id
    })
    newComment.value = ''
    ElMessage.success('评论成功')
    loadComments()
  } catch (err) {
    ElMessage.error('评论失败')
  }
}

onMounted(() => {
  loadArticle()
  loadComments()
})
</script>

<style scoped>
.article-detail {
  padding: 20px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.article {
  background: white;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
}

.article h1 {
  font-size: 32px;
  margin-bottom: 16px;
  color: #333;
}

.meta {
  color: #999;
  font-size: 14px;
  margin-bottom: 16px;
}

.meta span {
  margin-right: 16px;
}

.tags {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tag {
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

.content {
  line-height: 1.8;
  color: #333;
  font-size: 16px;
}

.comments-section {
  background: white;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.comments-section h2 {
  font-size: 20px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.comment-form {
  margin-bottom: 24px;
}

.submit-btn {
  margin-top: 12px;
}

.login-tip {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
  text-align: center;
  margin-bottom: 24px;
}

.login-tip a {
  color: #667eea;
  text-decoration: none;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.author {
  font-weight: bold;
  color: #333;
}

.time {
  color: #999;
  font-size: 12px;
}

.comment-content {
  color: #666;
  line-height: 1.6;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>