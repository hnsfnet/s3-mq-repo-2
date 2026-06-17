<template>
  <div class="home">
    <div class="container">
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">欢迎来到我的博客</h1>
          <p class="hero-subtitle">记录技术、生活与思考</p>
          <div class="hero-search">
            <el-input
              v-model="searchQuery"
              placeholder="搜索文章..."
              size="large"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" size="large" @click="handleSearch">
              搜索
            </el-button>
          </div>
        </div>
      </section>

      <div class="main-content">
        <div class="articles-section">
          <div class="section-header">
            <h2>
              <el-icon><Document /></el-icon>
              {{ hasFilters ? '搜索结果' : '最新文章' }}
            </h2>
            <div v-if="hasFilters" class="active-filters">
              <el-tag
                v-if="articleStore.filters.search"
                closable
                type="info"
                @close="clearSearch"
              >
                搜索: {{ articleStore.filters.search }}
              </el-tag>
              <el-tag
                v-if="articleStore.filters.tag"
                closable
                type="success"
                @close="clearTag"
              >
                标签: {{ articleStore.filters.tag }}
              </el-tag>
            </div>
          </div>

          <div v-loading="articleStore.loading" class="articles-grid">
            <router-link
              v-for="article in articleStore.articles"
              :key="article._id"
              :to="`/article/${article._id}`"
              class="article-card"
            >
              <div class="card-header">
                <h3 class="card-title">{{ article.title }}</h3>
              </div>
              <p class="card-summary">{{ truncateText(article.content, 120) }}</p>
              <div class="card-tags" v-if="article.tags && article.tags.length > 0">
                <span
                  v-for="tag in article.tags.slice(0, 3)"
                  :key="tag"
                  class="card-tag"
                  @click.stop="filterByTag(tag)"
                >{{ tag }}</span>
              </div>
              <div class="card-footer">
                <span class="author">
                  <el-icon><User /></el-icon>
                  {{ article.author?.username || '匿名' }}
                </span>
                <span class="views">
                  <el-icon><View /></el-icon>
                  {{ article.views || 0 }}
                </span>
                <span class="date">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(article.createdAt) }}
                </span>
              </div>
            </router-link>
          </div>

          <div v-if="!articleStore.loading && articleStore.articles.length === 0" class="empty">
            <el-empty description="暂无文章" />
          </div>

          <div v-if="articleStore.total > articleStore.articles.length" class="load-more">
            <el-button @click="loadMore" :loading="loadingMore">
              加载更多
            </el-button>
          </div>
        </div>

        <aside class="sidebar">
          <div class="sidebar-card">
            <h3 class="sidebar-title">
              <el-icon><TrendCharts /></el-icon>
              热门标签
            </h3>
            <div v-loading="tagStore.loading" class="tag-cloud">
              <span
                v-for="tag in tagStore.popularTags"
                :key="tag._id || tag.name"
                :class="['tag-item', { active: articleStore.filters.tag === tag.name }]"
                :style="{ fontSize: getTagFontSize(tag.count) + 'px' }"
                @click="filterByTag(tag.name)"
              >
                #{{ tag.name }}
                <span class="count">{{ tag.count || 0 }}</span>
              </span>
            </div>
            <div v-if="!tagStore.loading && tagStore.popularTags.length === 0" class="empty-tags">
              暂无标签
            </div>
          </div>

          <div class="sidebar-card">
            <h3 class="sidebar-title">
              <el-icon><DataAnalysis /></el-icon>
              数据统计
            </h3>
            <div class="stats-list">
              <div class="stat-item">
                <span class="stat-number">{{ articleStore.total }}</span>
                <span class="stat-label">文章总数</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ tagStore.total }}</span>
                <span class="stat-label">标签总数</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ totalViews }}</span>
                <span class="stat-label">总阅读量</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  Document,
  User,
  View,
  Calendar,
  TrendCharts,
  DataAnalysis
} from '@element-plus/icons-vue'
import { useArticleStore } from '../stores/article'
import { useTagStore } from '../stores/tag'

const router = useRouter()
const articleStore = useArticleStore()
const tagStore = useTagStore()
const searchQuery = ref('')
const loadingMore = ref(false)

const hasFilters = computed(() => {
  return articleStore.filters.search || articleStore.filters.tag
})

const totalViews = computed(() => {
  return articleStore.articles.reduce((sum, article) => sum + (article.views || 0), 0)
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const getTagFontSize = (count) => {
  const baseSize = 12
  const maxSize = 20
  const maxCount = 20
  const size = baseSize + (count / maxCount) * (maxSize - baseSize)
  return Math.min(size, maxSize)
}

const handleSearch = () => {
  router.push({
    path: '/articles',
    query: { search: searchQuery.value }
  })
}

const filterByTag = (tagName) => {
  router.push({
    path: '/articles',
    query: { tag: tagName }
  })
}

const clearSearch = () => {
  articleStore.setFilter('search', '')
  loadArticles()
}

const clearTag = () => {
  articleStore.setFilter('tag', '')
  loadArticles()
}

const loadArticles = async () => {
  await articleStore.loadArticles({ page: 1 })
}

const loadMore = async () => {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    await articleStore.loadMoreArticles()
  } finally {
    loadingMore.value = false
  }
}

onMounted(async () => {
  articleStore.setFilter('page', 1)
  await Promise.all([
    articleStore.loadArticles(),
    tagStore.loadPopularTags(10)
  ])
})
</script>

<style scoped>
.home {
  min-height: 100vh;
  padding-bottom: 60px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 60px 40px;
  margin: 30px 0 40px;
  color: white;
  text-align: center;
}

.hero-title {
  font-size: 42px;
  margin-bottom: 12px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 30px;
}

.hero-search {
  display: flex;
  gap: 12px;
  max-width: 500px;
  margin: 0 auto;
}

.hero-search :deep(.el-input__wrapper) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.main-content {
  display: flex;
  gap: 30px;
}

.articles-section {
  flex: 1;
  min-width: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.section-header h2 {
  font-size: 22px;
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.active-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.articles-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 200px;
}

.article-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: block;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.card-header {
  margin-bottom: 12px;
}

.card-title {
  font-size: 19px;
  margin: 0;
  color: #222;
  font-weight: 600;
  line-height: 1.4;
}

.card-summary {
  color: #666;
  line-height: 1.7;
  margin-bottom: 14px;
  font-size: 14px;
}

.card-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.card-tag {
  background: #f0f4ff;
  color: #667eea;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.card-tag:hover {
  background: #667eea;
  color: white;
}

.card-footer {
  display: flex;
  gap: 16px;
  color: #999;
  font-size: 13px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.card-footer span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty {
  padding: 60px 0;
}

.load-more {
  text-align: center;
  margin-top: 30px;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sidebar-card {
  background: white;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.sidebar-title {
  font-size: 17px;
  margin: 0 0 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 60px;
}

.tag-item {
  background: #f7f8fa;
  color: #666;
  padding: 6px 12px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-item:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tag-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tag-item .count {
  font-size: 11px;
  opacity: 0.7;
}

.empty-tags {
  text-align: center;
  color: #ccc;
  padding: 20px 0;
  font-size: 14px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-number {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  color: #888;
  font-size: 14px;
}

@media (max-width: 960px) {
  .main-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }

  .hero {
    padding: 40px 24px;
  }

  .hero-title {
    font-size: 30px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 30px 16px;
  }

  .hero-title {
    font-size: 24px;
  }

  .article-card {
    padding: 18px;
  }

  .card-title {
    font-size: 17px;
  }
}
</style>