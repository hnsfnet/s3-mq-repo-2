<template>
  <div class="edit-article">
    <div class="container">
      <h1>编辑文章</h1>
      <el-form :model="form" label-width="100px" v-loading="articleStore.detailLoading">
        <el-form-item label="标题">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题"
            size="large"
          ></el-input>
        </el-form-item>
        <div class="form-row">
          <el-form-item label="分类" class="form-item-half">
            <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
              <el-option label="默认" value="默认"></el-option>
              <el-option label="技术" value="技术"></el-option>
              <el-option label="生活" value="生活"></el-option>
              <el-option label="随笔" value="随笔"></el-option>
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="标签">
          <div class="tag-input-wrapper">
            <div class="selected-tags">
              <el-tag
                v-for="(tag, index) in tagList"
                :key="index"
                :closable="true"
                class="tag-item"
                effect="light"
                type="primary"
                @close="removeTag(index)"
              >#{{ tag }}</el-tag>
              <el-select
                v-model="tagInput"
                filterable
                allow-create
                default-first-option
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="输入标签，回车添加"
                class="tag-select"
                :reserve-keyword="false"
                @change="handleTagSelect"
              >
                <el-option
                  v-for="tag in tagStore.tags"
                  :key="tag._id"
                  :label="tag.name"
                  :value="tag.name"
                >
                  <span class="option-tag">#{{ tag.name }}</span>
                  <span class="option-count">({{ tag.count || 0 }}篇)</span>
                </el-option>
              </el-select>
            </div>
            <div class="tag-tips" v-if="tagStore.popularTags.length > 0">
              <span class="tip-title">推荐标签:</span>
              <span
                v-for="tag in tagStore.popularTags"
                :key="tag._id"
                :class="['quick-tag', { disabled: tagList.includes(tag.name) }]"
                :style="{ borderColor: tag.color, color: tag.color }"
                @click="addQuickTag(tag.name)"
              >+ {{ tag.name }}</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :autosize="{ minRows: 15, maxRows: 40 }"
            placeholder="请输入文章内容，支持纯文本内容..."
            class="content-textarea"
          ></el-input>
        </el-form-item>
        <div class="form-actions">
          <el-button size="large" @click="cancel">取消</el-button>
          <el-button size="large" type="primary" @click="submit" :loading="articleStore.loading">
            <el-icon><Edit /></el-icon>
            保存修改
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { useArticleStore } from '../stores/article'
import { useTagStore } from '../stores/tag'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const tagStore = useTagStore()

const form = ref({
  title: '',
  category: '默认',
  tags: '',
  content: ''
})

const tagList = ref([])
const tagInput = ref([])

watch(tagList, () => {
  form.value.tags = tagList.value.join(',')
}, { immediate: true })

const loadArticle = async () => {
  try {
    const article = await articleStore.loadArticleDetail(route.params.id)
    if (article) {
      form.value.title = article.title
      form.value.category = article.category || '默认'
      form.value.content = article.content
      tagList.value = [...(article.tags || [])]
    }
  } catch (err) {
    ElMessage.error('加载文章失败')
  }
}

const handleTagSelect = (values) => {
  const newTags = values.filter(t => !tagList.value.includes(t))
  tagList.value = [...tagList.value, ...newTags]
  tagInput.value = []
}

const removeTag = (index) => {
  tagList.value.splice(index, 1)
}

const addQuickTag = (tagName) => {
  if (!tagList.value.includes(tagName)) {
    tagList.value.push(tagName)
    ElMessage.success(`已添加标签: ${tagName}`)
  }
}

const submit = async () => {
  if (!form.value.title || !form.value.content) {
    ElMessage.error('请填写标题和内容')
    return
  }
  if (form.value.title.length < 2) {
    ElMessage.error('标题至少需要2个字符')
    return
  }
  if (form.value.content.length < 10) {
    ElMessage.error('文章内容至少需要10个字符')
    return
  }
  try {
    await articleStore.updateArticle(route.params.id, form.value)
    ElMessage.success('保存成功！')
    router.push('/admin')
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '保存失败')
  }
}

const cancel = () => {
  router.back()
}

onMounted(async () => {
  await Promise.all([
    loadArticle(),
    tagStore.loadAllTags(),
    tagStore.loadPopularTags(12)
  ])
})

onBeforeUnmount(() => {
  articleStore.clearCurrentArticle()
})
</script>

<style scoped>
.edit-article {
  padding: 20px 0 60px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

h1 {
  font-size: 32px;
  margin-bottom: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
}

:deep(.el-form) {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.form-row {
  display: flex;
  gap: 24px;
}

.form-item-half {
  flex: 1;
}

.tag-input-wrapper {
  width: 100%;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  min-height: 40px;
}

.tag-item {
  margin: 0;
  font-size: 13px;
}

.tag-select {
  min-width: 200px;
  flex: 1;
}

.tag-tips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9ff;
  border-radius: 8px;
  font-size: 13px;
}

.tip-title {
  color: #666;
  font-weight: 500;
}

.quick-tag {
  padding: 3px 10px;
  border: 1px dashed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  font-size: 12px;
  background: white;
}

.quick-tag:hover:not(.disabled) {
  transform: scale(1.05);
  background: currentColor;
  color: white !important;
}

.quick-tag.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.option-tag {
  font-weight: 500;
}

.option-count {
  margin-left: 8px;
  color: #999;
  font-size: 12px;
}

.content-textarea {
  font-size: 15px;
  line-height: 1.8;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding-top: 20px;
}

@media (max-width: 640px) {
  :deep(.el-form) {
    padding: 24px 16px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  h1 {
    font-size: 24px;
  }
}
</style>