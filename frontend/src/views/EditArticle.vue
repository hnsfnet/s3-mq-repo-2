<template>
  <div class="edit-article">
    <div class="container">
      <h1>编辑文章</h1>
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入文章标题"></el-input>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option label="默认" value="默认"></el-option>
            <el-option label="技术" value="技术"></el-option>
            <el-option label="生活" value="生活"></el-option>
            <el-option label="随笔" value="随笔"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="form.tags" placeholder="多个标签用逗号分隔"></el-input>
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="15"
            placeholder="请输入文章内容"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submit">保存修改</el-button>
          <el-button @click="cancel">取消</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { articles as articleApi } from '../api'

const route = useRoute()
const form = ref({
  title: '',
  category: '默认',
  tags: '',
  content: ''
})

const loadArticle = async () => {
  try {
    const res = await articleApi.get(route.params.id)
    const article = res.data
    form.value.title = article.title
    form.value.category = article.category
    form.value.tags = article.tags.join(', ')
    form.value.content = article.content
  } catch (err) {
    console.error(err)
  }
}

const submit = async () => {
  if (!form.value.title || !form.value.content) {
    ElMessage.error('请填写标题和内容')
    return
  }
  try {
    await articleApi.update(route.params.id, form.value)
    ElMessage.success('保存成功')
    window.location.href = '/admin'
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '保存失败')
  }
}

const cancel = () => {
  window.history.back()
}

onMounted(loadArticle)
</script>

<style scoped>
.edit-article {
  padding: 20px 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

h1 {
  font-size: 28px;
  margin-bottom: 24px;
}
</style>