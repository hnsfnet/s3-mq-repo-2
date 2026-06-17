<template>
  <div class="admin">
    <div class="container">
      <div class="page-header">
        <h1>
          <el-icon><Setting /></el-icon>
          管理后台
        </h1>
        <router-link to="/create" class="create-btn">
          <el-icon><Edit /></el-icon>
          写文章
        </router-link>
      </div>

      <div class="stats-row">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon article-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ articleStore.total }}</p>
              <p class="stat-label">文章总数</p>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon view-icon">
              <el-icon><View /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ totalViews }}</p>
              <p class="stat-label">总阅读量</p>
            </div>
          </div>
        </el-card>
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon tag-icon">
              <el-icon><PriceTag /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ tagStore.tags.length }}</p>
              <p class="stat-label">标签总数</p>
            </div>
          </div>
        </el-card>
      </div>

      <el-card class="table-card" shadow="hover">
        <div class="table-header">
          <h2>文章列表</h2>
          <div class="table-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索文章..."
              clearable
              style="width: 200px"
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button :icon="Refresh" @click="refresh" :loading="articleStore.loading">
              刷新
            </el-button>
          </div>
        </div>

        <el-table
          :data="filteredArticles"
          style="width: 100%"
          v-loading="articleStore.loading"
          stripe
        >
          <el-table-column prop="title" label="标题" min-width="240">
            <template #default="scope">
              <router-link :to="`/article/${scope.row._id}`" class="article-title">
                {{ scope.row.title }}
              </router-link>
            </template>
          </el-table-column>
          <el-table-column prop="author.username" label="作者" width="120">
            <template #default="scope">
              <el-tag size="small" type="info">{{ scope.row.author?.username }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="100">
            <template #default="scope">
              <el-tag size="small">{{ scope.row.category || '默认' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="views" label="阅读量" width="100" sortable>
            <template #default="scope">
              <el-icon><View /></el-icon>
              {{ scope.row.views }}
            </template>
          </el-table-column>
          <el-table-column label="标签" min-width="150">
            <template #default="scope">
              <el-tag
                v-for="tag in (scope.row.tags || []).slice(0, 3)"
                :key="tag"
                size="small"
                type="primary"
                effect="light"
                style="margin-right: 4px; margin-bottom: 4px;"
              >{{ tag }}</el-tag>
              <el-tag
                v-if="(scope.row.tags || []).length > 3"
                size="small"
                type="info"
              >+{{ (scope.row.tags || []).length - 3 }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180" sortable>
            <template #default="scope">
              <span class="date-text">{{ formatDate(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button
                size="small"
                :icon="View"
                @click="viewArticle(scope.row._id)"
              >查看</el-button>
              <el-button
                size="small"
                type="primary"
                :icon="Edit"
                @click="editArticle(scope.row._id)"
              >编辑</el-button>
              <el-popconfirm
                title="确定要删除这篇文章吗？"
                @confirm="deleteArticle(scope.row._id)"
              >
                <template #reference>
                  <el-button
                    size="small"
                    type="danger"
                    :icon="Delete"
                  >删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="filteredArticles.length === 0 && !articleStore.loading" class="empty">
          <el-empty description="暂无文章">
            <router-link to="/create" class="empty-btn">
              <el-button type="primary">
                <el-icon><Edit /></el-icon>
                写第一篇文章
              </el-button>
            </router-link>
          </el-empty>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Setting,
  Edit,
  Document,
  View,
  PriceTag,
  Search,
  Refresh,
  Delete
} from '@element-plus/icons-vue'
import { useArticleStore } from '../stores/article'
import { useTagStore } from '../stores/tag'

const router = useRouter()
const articleStore = useArticleStore()
const tagStore = useTagStore()
const searchKeyword = ref('')

const totalViews = computed(() => {
  return articleStore.articles.reduce((sum, a) => sum + (a.views || 0), 0)
})

const filteredArticles = computed(() => {
  if (!searchKeyword.value) return articleStore.articles
  const keyword = searchKeyword.value.toLowerCase()
  return articleStore.articles.filter(a =>
    a.title.toLowerCase().includes(keyword) ||
    a.content.toLowerCase().includes(keyword)
  )
})

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
  await Promise.all([
    articleStore.loadArticles(),
    tagStore.loadAllTags()
  ])
}

const refresh = () => {
  loadData()
  ElMessage.success('已刷新')
}

const handleSearch = () => {
}

const viewArticle = (id) => {
  router.push(`/article/${id}`)
}

const editArticle = (id) => {
  router.push(`/edit/${id}`)
}

const deleteArticle = async (id) => {
  try {
    await articleStore.deleteArticle(id)
    ElMessage.success('删除成功')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '删除失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin {
  padding: 24px 0 60px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 12px;
  border: none;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.article-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.view-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.tag-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #1a1a1a;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.table-card {
  border-radius: 12px;
  border: none;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h2 {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.table-actions {
  display: flex;
  gap: 12px;
}

.article-title {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.article-title:hover {
  color: #667eea;
}

.date-text {
  color: #999;
  font-size: 13px;
}

.empty {
  padding: 40px 0;
}

.empty-btn {
  text-decoration: none;
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>