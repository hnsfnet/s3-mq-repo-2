<template>
  <div class="article-list-page">
    <div class="container">
      <div class="page-header">
        <h1>
        <el-icon><Document /></el-icon>
        文章列表
      </h1>
      <p class="subtitle">共 {{ articleStore.total }} 篇文章</p>
    </div>

      <div class="main-content">
        <aside class="filter-sidebar">
          <div class="filter-card">
            <h3 class="filter-title">
              <el-icon><Filter /></el-icon>
              筛选条件
            </h3>
            
            <div class="filter-group">
              <label>搜索</label>
              <el-input
                v-model="localFilters.search"
                placeholder="输入关键词..."
                clearable
                @keyup.enter="applyFilters"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <div class="filter-group">
              <label>分类</label>
              <el-select
                v-model="localFilters.category"
                placeholder="全部分类"
                clearable
                style="width: 100%"
                @change="applyFilters"
              >
                <el-option label="技术" value="技术" />
                <el-option label="生活" value="生活" />
                <el-option label="随笔" value="随笔" />
                <el-option label="教程" value="教程" />
              </el-select>
            </div>

            <div class="filter-group">
              <label>标签</label>
              <div class="tag-list">
                <span
                  v-for="tag in tagStore.tags"
                  :key="tag._id || tag.name"
                  :class="['tag-option', { active: localFilters.tag === tag.name }]"
                  @click="toggleTag(tag.name)"
                >
                  #{{ tag.name }}
                  <span class="count">{{ tag.count || 0 }}</span>
                </span>
              </div>
            </div>

            <div class="filter-group">
              <label>排序</label>
              <el-radio-group v-model="localFilters.sort" @change="applyFilters">
                <el-radio value="latest">最新</el-radio>
                <el-radio value="popular">热门</el-radio>
              </el-radio-group>
            </div>

            <el-button type="primary" style="width: 100%" @click="applyFilters">
              应用筛选
            </el-button>
            <el-button text style="width: 100%; margin-top: 8px" @click="resetFilters">
              重置
            </el-button>
          </div>

          <div class="active-filters-card" v-if="hasActiveFilters">
            <h3 class="filter-title">已选条件</h3>
            <div class="active-tags">
              <el-tag
                v-if="localFilters.search"
                closable
                type="info"
                @close="clearFilter('search')"
              >
                搜索: {{ localFilters.search }}
              </el-tag>
              <el-tag
                v-if="localFilters.category"
                closable
                type="warning"
                @close="clearFilter('category')"
              >
                分类: {{ localFilters.category }}
              </el-tag>
              <el-tag
                v-if="localFilters.tag"
                closable
                type="success"
                @close="clearFilter('tag')"
              >
                标签: {{ localFilters.tag }}
              </el-tag>
            </div>
          </div>
        </aside>

        <div class="articles-section">
          <div v-loading="articleStore.loading" class="articles-list">
            <router-link
              v-for="article in articleStore.articles"
              :key="article._id"
              :to="`/article/${article._id}`"
              class="article-item"
            >
              <div class="article-header">
                <h3 class="article-title">{{ article.title }}</h3>
                <span v-if="article.category" class="article-category">
                  {{ article.category }}
                </span>
              </div>
              <p class="article-summary">{{ truncateText(article.content, 150) }}</p>
              <div class="article-tags" v-if="article.tags && article.tags.length > 0">
                <span v-for="tag in article.tags.slice(0, 4)" :key="tag" class="tag">
                  #{{ tag }}
                </span>
              </div>
              <div class="article-footer">
                <span class="author">
                  <el-icon><User /></el-icon>
                  {{ article.author?.username || '匿名' }}
                </span>
                <span class="views">
                  <el-icon><View /></el-icon>
                  {{ article.views || 0 }} 阅读
                </span>
                <span class="date">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(article.createdAt) }}
                </span>
              </div>
            </router-link>
          </div>

          <div v-if="!articleStore.loading && articleStore.articles.length === 0" class="empty-state">
            <el-empty description="没有找到相关文章">
              <el-button type="primary" @click="resetFilters">重置筛选</el-button>
            </el-empty>
          </div>

          <div v-if="articleStore.total > articleStore.articles.length" class="pagination">
            <el-pagination
              background
              :current-page="articleStore.filters.page"
              :page-size="articleStore.filters.limit"
              :total="articleStore.total"
              layout="prev, pager, next, jumper"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Document,
  Filter,
  Search,
  User,
  View,
  Calendar
} from '@element-plus/icons-vue'
import { useArticleStore } from '../stores/article'
import { useTagStore } from '../stores/tag'

const route = useRoute()
const articleStore = useArticleStore()
const tagStore = useTagStore()

const localFilters = reactive({
  search: '',
  category: '',
  tag: '',
  sort: 'latest'
})

const hasActiveFilters = computed(() => {
  return localFilters.search || localFilters.category || localFilters.tag
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

const applyFilters = () => {
  articleStore.setFilter('search', localFilters.search)
  articleStore.setFilter('category', localFilters.category)
  articleStore.setFilter('tag', localFilters.tag)
  articleStore.setFilter('sort', localFilters.sort)
  articleStore.setFilter('page', 1)
  articleStore.loadArticles()
}

const resetFilters = () => {
  localFilters.search = ''
  localFilters.category = ''
  localFilters.tag = ''
  localFilters.sort = 'latest'
  applyFilters()
}

const toggleTag = (tagName) => {
  if (localFilters.tag === tagName) {
    localFilters.tag = ''
  } else {
    localFilters.tag = tagName
  }
  applyFilters()
}

const clearFilter = (filterName => {
  if (filterName === 'search') localFilters.search = ''
  if (filterName === 'category') localFilters.category = ''
  if (filterName === 'tag') localFilters.tag = ''
  applyFilters()
}

const handlePageChange = (page) => {
  articleStore.setFilter('page', page)
  articleStore.loadArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(async () => {
  if (route.query.search) localFilters.search = route.query.search
  if (route.query.tag) localFilters.tag = route.query.tag
  if (route.query.category) localFilters.category = route.query.category

  articleStore.setFilter('search', localFilters.search)
  articleStore.setFilter('tag', localFilters.tag)
  articleStore.setFilter('category', localFilters.category)
  articleStore.setFilter('page', 1)

  await Promise.all([
    articleStore.loadArticles(),
    tagStore.loadAllTags()
  ])
})
</script>

<style scoped>
.article-list-page {
  min-height: 100vh;
  padding-bottom: 60px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  text-align: center;
  padding: 40px 0 30px;
}

.page-header h1 {
  font-size: 32px;
  margin: 0 0 8px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.subtitle {
  color: #888;
  margin: 0;
  font-size: 15px;
}

.main-content {
  display: flex;
  gap: 24px;
}

.filter-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-card,
.active-filters-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.filter-title {
  font-size: 16px;
  margin: 0 0 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.filter-group {
  margin-bottom: 18px;
}

.filter-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-option {
  background: #f5f7fa;
  color: #666;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-option:hover {
  background: #e8ecf5;
}

.tag-option.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tag-option .count {
  font-size: 11px;
  opacity: 0.7;
}

.active-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.articles-section {
  flex: 1;
  min-width: 0;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 300px;
}

.article-item {
  background: white;
  border-radius: 12px;
  padding: 22px 24px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: block;
}

.article-item:hover {
  transform: translateX(4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 12px;
}

.article-title {
  font-size: 20px;
  margin: 0;
  color: #222;
  font-weight: 600;
  line-height: 1.4;
  flex: 1;
}

.article-category {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  flex-shrink: 0;
}

.article-summary {
  color: #666;
  line-height: 1.7;
  margin-bottom: 12px;
  font-size: 14px;
}

.article-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.article-tags .tag {
  background: #f0f4ff;
  color: #667eea;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.article-footer {
  display: flex;
  gap: 16px;
  color: #999;
  font-size: 13px;
  padding-top: 12px;
  border-top: 1px solid #f5f5f5;
}

.article-footer span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  padding: 60px 0;
  background: white;
  border-radius: 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 900px) {
  .main-content {
    flex-direction: column;
  }

  .filter-sidebar {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .page-header h1 {
    font-size: 24px;
  }

  .article-item {
    padding: 18px;
  }

  .article-title {
    font-size: 18px;
  }

  .article-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>