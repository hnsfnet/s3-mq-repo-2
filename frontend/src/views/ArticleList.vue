<template>
  <div class="article-list-page">
    <div class="container">
      <div class="page-header">
        <h1>文章列表</h1>
        <p class="subtitle">共 {{ totalArticles }} 篇文章</p>
      </div>

      <div class="search-filters">
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索文章标题或内容..."
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
        </div>

        <div class="filter-row">
          <div class="filter-group">
            <span class="filter-label">分类:</span>
            <el-radio-group v-model="selectedCategory" @change="loadArticles">
              <el-radio-button value="">全部</el-radio-button>
              <el-radio-button value="默认">默认</el-radio-button>
              <el-radio-button value="技术">技术</el-radio-button>
              <el-radio-button value="生活">生活</el-radio-button>
              <el-radio-button value="随笔">随笔</el-radio-button>
            </el-radio-group>
          </div>

          <div class="filter-group">
            <span class="filter-label">排序:</span>
            <el-select v-model="sortBy" style="width: 140px" @change="handleSort">
              <el-option label="最新发布" value="newest" />
              <el-option label="阅读最多" value="views" />
            </el-select>
          </div>
        </div>

        <div class="tag-filter" v-if="allTags.length > 0">
          <span class="filter-label">标签筛选:</span>
          <div class="tag-list">
            <span
              :class="['filter-tag', { active: selectedTag === '' }]"
              @click="selectTag('')"
            >全部</span>
            <span
              v-for="tag in allTags"
              :key="tag._id"
              :class="['filter-tag', { active: selectedTag === tag.name }]"
              :style="{
                '--tag-color': tag.color,
                borderColor: selectedTag === tag.name ? tag.color : 'transparent'
              }"
              @click="selectTag(tag.name)"
            >
              <span v-if="selectedTag === tag.name" class="check">✓</span>
              #{{ tag.name }}
              <span class="tag-count">{{ tag.count }}</span>
            </span>
          </div>
        </div>

        <div v-if="hasActiveFilters" class="active-filters">
          <el-tag
            v-if="searchQuery"
            closable
            type="info"
            @close="clearSearch"
          >搜索: {{ searchQuery }}</el-tag>
          <el-tag
            v-if="selectedTag"
            closable
            type="warning"
            @close="clearTagFilter"
          >标签: {{ selectedTag }}</el-tag>
          <el-tag
            v-if="selectedCategory"
            closable
            type="success"
            @close="clearCategoryFilter"
          >分类: {{ selectedCategory }}</el-tag>
          <el-button link type="primary" @click="clearAllFilters">
            清除全部
          </el-button>
        </div>
      </div>

      <div class="list" v-if="!loading && filteredArticles.length > 0">
        <div
          v-for="article in filteredArticles"
          :key="article._id"
          class="article-item"
        >
          <div class="content">
            <div class="category-badge" v-if="article.category">
              {{ article.category }}
            </div>
            <h2>
              <router-link :to="`/article/${article._id}`">{{ article.title }}</router-link>
            </h2>
            <p class="excerpt">{{ article.content.substring(0, 200) }}...</p>
            <div class="meta">
              <span class="author">
                <el-icon><User /></el-icon>
                {{ article.author?.username }}
              </span>
              <span class="date">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(article.createdAt) }}
              </span>
              <span class="views">
                <el-icon><View /></el-icon>
                {{ article.views }}
              </span>
              <span class="edit-date" v-if="formatDate(article.updatedAt) !== formatDate(article.createdAt)">
                更新于 {{ formatDate(article.updatedAt) }}
              </span>
            </div>
            <div class="tags" v-if="article.tags && article.tags.length > 0">
              <span
                v-for="tag in article.tags"
                :key="tag"
                :class="['tag', { active: selectedTag === tag }]"
                @click="selectTag(tag)"
              >#{{ tag }}</span>
            </div>
          </div>
          <div class="read-link">
            <router-link :to="`/article/${article._id}`">
              阅读全文
              <el-icon><ArrowRight /></el-icon>
            </router-link>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-if="!loading && filteredArticles.length === 0" class="empty">
        <el-empty :description="hasActiveFilters ? '没有找到符合条件的文章' : '暂无文章，快去创建第一篇吧！'">
          <template #image>
            <img src="https://res.cloudinary.com/hzxejch6p/image/upload/v1693459400/empty-box_2x_klq8po.png" alt="" />
          </template>
          <el-button type="primary" v-if="hasActiveFilters" @click="clearAllFilters">清除筛选条件</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, User, Calendar, View, ArrowRight } from '@element-plus/icons-vue'
import { articles as articleApi, tags as tagApi } from '../api'

const articles = ref([])
const allTags = ref([])
const searchQuery = ref('')
const selectedTag = ref('')
const selectedCategory = ref('')
const sortBy = ref('newest')
const loading = ref(false)

const totalArticles = computed(() => articles.value.length)

const filteredArticles = computed(() => {
  let result = [...articles.value]
  if (sortBy.value === 'views') {
    result.sort((a, b) => b.views - a.views)
  }
  return result
})

const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedTag.value || selectedCategory.value
})

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
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }
    const res = await articleApi.list(params)
    articles.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const loadTags = async () => {
  try {
    const res = await tagApi.list()
    allTags.value = res.data
  } catch (err) {
    console.error(err)
  }
}

const handleSearch = () => {
  loadArticles()
}

const handleSort = () => {
}

const selectTag = (tagName) => {
  selectedTag.value = tagName
  loadArticles()
}

const clearSearch = () => {
  searchQuery.value = ''
  loadArticles()
}

const clearTagFilter = () => {
  selectedTag.value = ''
  loadArticles()
}

const clearCategoryFilter = () => {
  selectedCategory.value = ''
  loadArticles()
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedTag.value = ''
  selectedCategory.value = ''
  loadArticles()
}

onMounted(() => {
  loadArticles()
  loadTags()
})
</script>

<style scoped>
.article-list-page {
  padding: 20px 0 60px;
}

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  text-align: center;
  padding: 40px 0 32px;
}

.page-header h1 {
  font-size: 36px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #999;
  font-size: 14px;
}

.search-filters {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-bar :deep(.el-input) {
  flex: 1;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-weight: 500;
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

.tag-filter {
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.filter-tag {
  padding: 5px 14px;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s;
  background: #f5f7fa;
  color: #666;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.filter-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-tag.active {
  color: var(--tag-color, #667eea);
  background: var(--tag-color, #667eea) + '15';
  font-weight: 500;
}

.filter-tag .check {
  font-size: 11px;
}

.tag-count {
  font-size: 11px;
  color: #999;
  background: rgba(0, 0, 0, 0.06);
  padding: 1px 7px;
  border-radius: 10px;
}

.filter-tag.active .tag-count {
  color: var(--tag-color, #667eea);
  background: var(--tag-color, #667eea) + '20';
}

.active-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  margin-top: 4px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.article-item {
  background: white;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  transition: all 0.3s;
  position: relative;
}

.article-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
}

.content {
  flex: 1;
  min-width: 0;
}

.category-badge {
  display: inline-block;
  padding: 3px 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 10px;
}

.article-item h2 {
  margin-bottom: 12px;
}

.article-item h2 a {
  color: #333;
  text-decoration: none;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.4;
  display: inline-block;
  transition: color 0.3s;
}

.article-item h2 a:hover {
  color: #667eea;
}

.excerpt {
  color: #666;
  line-height: 1.8;
  margin-bottom: 16px;
  font-size: 14px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  color: #999;
  font-size: 13px;
  margin-bottom: 14px;
}

.meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta .edit-date {
  color: #bbb;
  font-size: 12px;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  background: #f0f4ff;
  color: #667eea;
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.tag:hover,
.tag.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.read-link {
  flex-shrink: 0;
  align-self: flex-end;
}

.read-link a {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s;
}

.read-link a:hover {
  background: #f0f4ff;
  transform: translateX(4px);
}

.loading-state {
  background: white;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.empty {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

@media (max-width: 640px) {
  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .article-item {
    flex-direction: column;
  }

  .read-link {
    align-self: flex-start;
    width: 100%;
  }

  .read-link a {
    justify-content: center;
  }

  .page-header h1 {
    font-size: 28px;
  }
}
</style>