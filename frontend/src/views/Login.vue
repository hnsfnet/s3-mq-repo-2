<template>
  <div class="login">
    <div class="container">
      <div class="form-wrapper">
        <div class="logo-section">
          <div class="logo-icon">
            <el-icon><UserFilled /></el-icon>
          </div>
          <h2>欢迎回来</h2>
          <p class="subtitle">登录您的博客账号</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              size="large"
              :prefix-icon="User"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleLogin"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              @click="handleLogin"
              :loading="userStore.loading"
              style="width: 100%"
            >登录</el-button>
          </el-form-item>
        </el-form>

        <div class="divider">
          <span>或者</span>
        </div>

        <p class="link">
          还没有账号？<router-link to="/register">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UserFilled, User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为 2-20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  try {
    await userStore.login(form)
    ElMessage.success('登录成功，欢迎回来！')
    const redirect = route.query.redirect || '/'
    setTimeout(() => {
      router.push(redirect)
    }, 500)
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '登录失败，请检查用户名和密码')
  }
}
</script>

<style scoped>
.login {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  padding: 40px 0;
}

.container {
  max-width: 420px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

.form-wrapper {
  background: white;
  padding: 40px 36px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
  font-size: 32px;
}

.logo-section h2 {
  font-size: 24px;
  color: #1a1a1a;
  margin: 0 0 6px;
  font-weight: 600;
}

.subtitle {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.divider {
  position: relative;
  text-align: center;
  margin: 24px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #eee;
}

.divider span {
  position: relative;
  background: white;
  padding: 0 16px;
  color: #bbb;
  font-size: 13px;
}

.link {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin: 0;
}

.link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}

.link a:hover {
  text-decoration: underline;
}
</style>