<template>
  <div class="register">
    <div class="container">
      <div class="form-wrapper">
        <h2>注册</h2>
        <el-form :model="form" label-width="80px" @submit.prevent="register">
          <el-form-item label="用户名">
            <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="form.email" type="email" placeholder="请输入邮箱"></el-input>
          </el-form-item>
          <el-form-item label="密码">
            <el-input type="password" v-model="form.password" placeholder="请输入密码"></el-input>
          </el-form-item>
          <el-form-item label="确认密码">
            <el-input type="password" v-model="form.confirmPassword" placeholder="请确认密码"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="register" style="width: 100%">注册</el-button>
          </el-form-item>
        </el-form>
        <p class="link">
          已有账号？<router-link to="/login">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { auth } from '../api'

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const register = async () => {
  if (!form.value.username || !form.value.email || !form.value.password) {
    ElMessage.error('请填写完整信息')
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  try {
    const res = await auth.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password
    })
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    ElMessage.success('注册成功')
    window.location.href = '/'
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '注册失败')
  }
}
</script>

<style scoped>
.register {
  padding: 80px 0;
}

.container {
  max-width: 400px;
  margin: 0 auto;
  padding: 0 20px;
}

.form-wrapper {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 32px;
  font-size: 24px;
  color: #333;
}

.link {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.link a {
  color: #667eea;
  text-decoration: none;
}
</style>