<template>
  <div class="register">
    <div class="container">
      <div class="form-wrapper">
        <div class="logo-section">
          <div class="logo-icon">
            <el-icon><UserPlus /></el-icon>
          </div>
          <h2>创建账号</h2>
          <p class="subtitle">加入我们，开启博客之旅</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              size="large"
              :prefix-icon="User"
              clearable
            ></el-input>
          </el-form-item>
          <el-form-item prop="email">
            <el-input
              v-model="form.email"
              type="email"
              placeholder="邮箱"
              size="large"
              :prefix-icon="Message"
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
            ></el-input>
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="确认密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              @keyup.enter="handleRegister"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              @click="handleRegister"
              :loading="userStore.loading"
              style="width: 100%"
            >立即注册</el-button>
          </el-form-item>
        </el-form>

        <div class="divider">
          <span>或者</span>
        </div>

        <p class="link">
          已有账号？<router-link to="/login">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UserPlus, User, Message, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为 2-20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度为 6-32 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  try {
    await userStore.register({
      username: form.username,
      email: form.email,
      password: form.password
    })
    ElMessage.success('注册成功，欢迎加入！')
    setTimeout(() => {
      router.push('/')
    }, 500)
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '注册失败，请稍后重试')
  }
}
</script>

<style scoped>
.register {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  padding: 40px 0;
}

.container {
  max-width: 440px;
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
  font-size: 28px;
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
  margin: 20px 0;
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