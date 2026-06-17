<template>
  <div class="home">
    <div class="hero">
      <div class="container">
        <h1>欢迎来到我的博客</h1>
        <p>记录生活，分享技术，交流心得</p>
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文章标题或内容..."
            size="large"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="content-wrapper">
        <div class="main-content">
          <div class="section-header">
            <h2>
              {{ selectedTag ? `标签: ${selectedTag}` : searchQuery ? `搜索结果: "${searchQuery}"` : '最新文章' }}
            </h2>
            <el-button
              v-if="selectedTag || searchQuery"
              link
              @click="clearFilters"
            >清除筛选</el-button>
          </div>
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
                <span v-if="article.category" class="category">{{ article.category }}</span>
              </p>
              <p class="excerpt">{{ article.content.substring(0, 100) }}...</p>
              <div class="tags">
                <span
                  v-for="tag in article.tags"
                  :key="tag"
                  class="tag"
                  @click="filterByTag(tag)"
                >#{{ tag }}</span>
              </div>
            </div>
          </div>
          <div v-if="articles.length === 0 && loading === false" class="empty">
            <el-empty description="没有找到相关文章" />
          </div>
          <div v-if="loading" class="loading">
            <el-skeleton :rows="3" animated />
          </div>
        </div>
        <aside class="sidebar">
          <div class="sidebar-card">
            <h3>热门标签</h3>
            <div class="tag-cloud">
              <span
                v-for="tag in popularTags"
                :key="tag._id"
                :class="['sidebar-tag', { active: selectedTag === tag.name }]"
                :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }"
                @click="filterByTag(tag.name)"
              >
                #{{ tag.name }}
                <span class="count">{{ tag.count }}</span>
              </span>
            </div>
            <div v-if="popularTags.length === 0" class="empty-tags">
              暂无标签
            </div>
          </div>
          <div class="sidebar-card">
            <h3>分类浏览</h3>
            <router-link to="/articles" class="browse-all">
              <el-icon><Reading /></el-icon>
              查看全部文章
            </router-link>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Search, Reading } from '@element-plus/icons-vue'
import { articles as articleApi, tags as tagApi } from '../api'

const articles = ref([])
const popularTags = ref([])
const searchQuery = ref('')
const selectedTag = ref('')
const loading = ref(false)

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const loadArticles = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    if (selectedTag.value) {
      params.tag = selectedTag.value
    }
    const res = await articleApi.list(params)
    articles.value = res.data.slice(0, 10)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const loadPopularTags = async () => {
  try {
    const res = await tagApi.popular(15)
    popularTags.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const handleSearch = () => {
  loadArticles()
}

const filterByTag = (tagName) => {
  selectedTag.value = selectedTag.value === tagName ? '' : tagName
  searchQuery.value = ''
  loadArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedTag.value = ''
  loadArticles()
}

onMounted(() => {
  loadArticles()
  loadPopularTags()
})
</script>

<style scoped>
.home {
  min-height: 100vh;
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 0 80px;
  text-align: center;
}

.hero h1 {
  font-size: 42px;
  margin-bottom: 12px;
}

.hero p {
  font-size: 16px;
  margin-bottom: 28px;
  opacity: 0.9;
}

.search-box {
  max-width: 600px;
  margin: 0 auto;
}

.search-box :deep(.el-input__wrapper) {
  border-radius: 25px 0 0 25px;
  padding: 8px 16px;
}

.search-box :deep(.el-input-group__append) {
  border-radius: 0 25px 25px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 32px;
}

@media (max-width: 768px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 8px;
  border-bottom: 2px solid #667eea;
}

.section-header h2 {
  font-size: 24px;
  margin: 0;
}

.article-list {
  display: grid;
  gap: 20px;
}

.article-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.15);
}

.article-card h3 a {
  color: #333;
  text-decoration: none;
  font-size: 20px;
  margin-bottom: 10px;
  display: block;
  transition: color 0.3s;
}

.article-card h3 a:hover {
  color: #667eea;
}

.meta {
  color: #999;
  font-size: 13px;
  margin-bottom: 12px;
}

.meta span {
  margin-right: 16px;
}

.category {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.excerpt {
  color: #666;
  line-height: 1.7;
  margin-bottom: 14px;
  font-size: 14px;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ec 100%);
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 12px;
  color: #667eea;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.tag:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.sidebar {
  position: sticky;
  top: 20px;
  align-self: flex-start;
}

.sidebar-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.sidebar-card h3 {
  font-size: 16px;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sidebar-tag {
  padding: 6px 12px;
  border-radius: 14px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sidebar-tag:hover {
  transform: scale(1.05);
}

.sidebar-tag.active {
  font-weight: bold;
}

.sidebar-tag .count {
  font-size: 10px;
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.1);
  padding: 1px 6px;
  border-radius: 8px;
}

.empty-tags {
  color: #999;
  font-size: 13px;
  text-align: center;
  padding: 20px;
}

.browse-all {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.browse-all:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.empty {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.loading {
  background: white;
  padding: 24px;
  border-radius: 12px;
}
</style>