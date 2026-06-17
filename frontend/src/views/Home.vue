<template>
  <div class="home">
    <div class="hero">
      <div class="container">
        <h1>欢迎来到我的博客</h1>
        <p>记录生活，分享技术，交流心得</p>
        <router-link to="/articles" class="btn">浏览文章</router-link>
      </div>
    </div>
    <div class="container">
      <h2>最新文章</h2>
      <div class="article-list">
        <div
          v-for="article in articles"
          :key="article._id"
          class="article-card"
        >
          <h3>
            <router-link :to="`/article/${article._id}`">{{ article.title }}</router-link>
          </h3>
          <p class="meta">
            <span>{{ article.author?.username }}</span>
            <span>{{ formatDate(article.createdAt) }}</span>
            <span>阅读 {{ article.views }}</span>
          </p>
          <p class="excerpt">{{ article.content.substring(0, 100) }}...</p>
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
    articles.value = res.data.slice(0, 5)
  } catch (err) {
    console.error(err)
  }
}

onMounted(loadArticles)
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
}

.hero h1 {
  font-size: 48px;
  margin-bottom: 16px;
}

.hero p {
  font-size: 18px;
  margin-bottom: 32px;
  opacity: 0.9;
}

.btn {
  background: white;
  color: #667eea;
  padding: 12px 32px;
  border-radius: 30px;
  text-decoration: none;
  font-weight: bold;
  display: inline-block;
  transition: transform 0.3s;
}

.btn:hover {
  transform: translateY(-2px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

h2 {
  font-size: 28px;
  margin-bottom: 24px;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

.article-list {
  display: grid;
  gap: 24px;
}

.article-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s;
}

.article-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.article-card h3 a {
  color: #333;
  text-decoration: none;
  font-size: 20px;
  margin-bottom: 12px;
  display: block;
}

.meta {
  color: #999;
  font-size: 14px;
  margin-bottom: 12px;
}

.meta span {
  margin-right: 16px;
}

.excerpt {
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.tags {
  display: flex;
  gap: 8px;
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
  padding: 40px;
  color: #999;
}
</style>