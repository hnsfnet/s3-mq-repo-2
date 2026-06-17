<template>
  <div class="admin">
    <div class="container">
      <h1>管理后台</h1>
      
      <el-table :data="articles" border style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="scope">
            <router-link :to="`/article/${scope.row._id}`">{{ scope.row.title }}</router-link>
          </template>
        </el-table-column>
        <el-table-column prop="author.username" label="作者"></el-table-column>
        <el-table-column prop="views" label="阅读量"></el-table-column>
        <el-table-column prop="createdAt" label="创建时间" formatter="formatDate"></el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editArticle(scope.row._id)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteArticle(scope.row._id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="articles.length === 0" class="empty">
        <p>暂无文章</p>
        <router-link to="/create" class="btn">写文章</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
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

const editArticle = (id) => {
  window.location.href = `/edit/${id}`
}

const deleteArticle = async (id) => {
  if (!confirm('确定要删除这篇文章吗？')) {
    return
  }
  try {
    await articleApi.delete(id)
    ElMessage.success('删除成功')
    loadArticles()
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '删除失败')
  }
}

onMounted(loadArticles)
</script>

<style scoped>
.admin {
  padding: 20px 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

h1 {
  font-size: 28px;
  margin-bottom: 24px;
}

.empty {
  text-align: center;
  padding: 60px;
  color: #999;
}

.btn {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 16px;
}
</style>