<template>
  <div class="article-list-page">
    <div class="container">
      <h1>文章列表</h1>
      <div class="list">
        <div
          v-for="article in articles"
          :key="article._id"
          class="article-item"
        >
          <div class="content">
            <h2>
              <router-link :to="`/article/${article._id}`">{{ article.title }}</router-link>
            </h2>
            <p>{{ article.content.substring(0, 150) }}...</p>
            <div class="meta">
              <span>{{ article.author?.username }}</span>
              <span>{{ formatDate(article.createdAt) }}</span>
              <span>阅读 {{ article.views }}</span>
            </div>
          </div>
          <div class="tags">
            <span
              v-for="tag in article.tags"
              :key="tag"
              class="tag"
            >{{ tag }}</span>
          </div>
        </div>
      </div>
      <div v-if="articles.length === 0" class="empty">
        <p>暂无文章</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { articles as articleApi } from '../api'

const articles = ref([])

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const loadArticles = async () => {
  try {
    const res = await articleApi.list()
    articles.value = res.data
  } catch (err) {
    console.error(err)
  }
}

onMounted(loadArticles)
</script>

<style scoped>
.article-list-page {
  padding: 20px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

h1 {
  font-size: 32px;
  margin-bottom: 32px;
  text-align: center;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.article-item {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.article-item h2 a {
  color: #333;
  text-decoration: none;
  font-size: 22px;
  margin-bottom: 12px;
  display: block;
}

.article-item p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.meta {
  color: #999;
  font-size: 14px;
}

.meta span {
  margin-right: 16px;
}

.tags {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.tag {
  background: #f0f0f0;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

.empty {
  text-align: center;
  padding: 60px;
  color: #999;
}
</style>