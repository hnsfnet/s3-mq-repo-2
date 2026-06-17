import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '../api'

interface UserInfo {
  id: string
  username: string
  email?: string
  [key: string]: any
}

interface LoginForm {
  username: string
  password: string
}

interface RegisterForm {
  username: string
  email: string
  password: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(
    (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || 'null')
      } catch {
        return null
      }
    })()
  )
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  const persistAuth = (newToken: string, user: UserInfo) => {
    token.value = newToken
    userInfo.value = user
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(user))
  }

  const login = async (formData: LoginForm): Promise<UserInfo> => {
    loading.value = true
    error.value = null
    try {
      const res = await auth.login(formData)
      const newToken = res.meta?.token || res.data?.token
      const user = res.data?.user || res.data

      if (!newToken || !user) {
        throw new Error('登录响应数据异常')
      }

      persistAuth(newToken, user)
      return user
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
    }
  }

  const register = async (formData: RegisterForm): Promise<UserInfo> => {
    loading.value = true
    error.value = null
    try {
      const res = await auth.register(formData)
      const newToken = res.meta?.token || res.data?.token
      const user = res.data?.user || res.data

      if (!newToken || !user) {
        throw new Error('注册响应数据异常')
      }

      persistAuth(newToken, user)
      return user
    } catch (err) {
      error.value = err as Error
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCurrentUser = async (): Promise<UserInfo | null> => {
    if (!token.value) return null

    try {
      const res = await auth.me()
      userInfo.value = res.data?.user || res.data
      localStorage.setItem('user', JSON.stringify(userInfo.value))
      return userInfo.value
    } catch {
      return null
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    error.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const updateUserInfo = (data: Partial<UserInfo>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...data }
      localStorage.setItem('user', JSON.stringify(userInfo.value))
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    token,
    userInfo,
    loading,
    error,
    isLoggedIn,
    login,
    register,
    logout,
    fetchCurrentUser,
    updateUserInfo,
    clearError
  }
})