<template>
  <div class="login">
    <div class="container">
      <div class="form-wrapper">
        <h2>登录</h2>
        <el-form :model="form" label-width="80px" @submit.prevent="login">
          <el-form-item label="用户名">
            <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
          </el-form-item>
          <el-form-item label="密码">
            <el-input type="password" v-model="form.password" placeholder="请输入密码"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="login" style="width: 100%">登录</el-button>
          </el-form-item>
        </el-form>
        <p class="link">
          还没有账号？<router-link to="/register">立即注册</router-link>
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
  password: ''
})

const login = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.error('请填写完整信息')
    return
  }
  try {
    const res = await auth.login(form.value)
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    ElMessage.success('登录成功')
    window.location.href = '/'
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '登录失败')
  }
}
</script>

<style scoped>
.login {
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