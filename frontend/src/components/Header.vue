<template>
  <header class="header">
    <div class="container">
      <div class="logo">
        <router-link to="/">
          <el-icon class="logo-icon"><Reading /></el-icon>
          我的博客
        </router-link>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-item">
          <el-icon><HomeFilled /></el-icon>
          首页
        </router-link>
        <router-link to="/articles" class="nav-item">
          <el-icon><Document /></el-icon>
          文章列表
        </router-link>
        <template v-if="userStore.isLoggedIn">
          <router-link to="/admin" class="nav-item">
            <el-icon><Setting /></el-icon>
            管理后台
          </router-link>
          <router-link to="/create" class="nav-item write-btn">
            <el-icon><Edit /></el-icon>
            写文章
          </router-link>
          <div class="user-menu">
            <el-avatar :size="32" class="user-avatar">
              {{ userStore.userInfo?.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <span class="username">{{ userStore.userInfo?.username }}</span>
            <button class="logout-btn" @click="handleLogout" :title="退出登录">
              <el-icon><SwitchButton /></el-icon>
            </button>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-item">
            <el-icon><User /></el-icon>
            登录
          </router-link>
          <router-link to="/register" class="nav-item register-btn">
            <el-icon><UserFilled /></el-icon>
            注册
          </router-link>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Reading,
  HomeFilled,
  Document,
  Setting,
  Edit,
  User,
  UserFilled,
  SwitchButton
} from '@element-plus/icons-vue'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning'
    })
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  } catch {
  }
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 14px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.logo a {
  font-size: 22px;
  font-weight: 700;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 28px;
}

.nav {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-item {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.write-btn {
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.write-btn:hover {
  background: white;
  color: #667eea !important;
  transform: translateY(-1px);
}

.register-btn {
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.register-btn:hover {
  background: white;
  color: #667eea !important;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 12px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.3);
}

.user-avatar {
  background: rgba(255, 255, 255, 0.3);
  font-weight: 600;
  font-size: 14px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.35);
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .logo a {
    font-size: 18px;
  }

  .nav-item {
    padding: 8px 10px;
    font-size: 13px;
  }

  .nav-item span {
    display: none;
  }

  .username {
    display: none;
  }

  .user-menu {
    padding-left: 10px;
    margin-left: 6px;
  }
}
</style>