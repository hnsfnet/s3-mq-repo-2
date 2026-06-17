import axios from 'axios'
import { ElMessage } from 'element-plus'

const instance = axios.create({
  baseURL: '/api',
  timeout: 15000
})

instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  response => {
    const res = response.data

    if (res && res.status === 'success') {
      return {
        data: res.data,
        meta: {
          total: res.total,
          results: res.results,
          page: res.page,
          message: res.message,
          token: res.token
        }
      }
    }

    return { data: res }
  },
  error => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '请求失败'

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const userStore = window.__PINIA__?.state?.value?.user
      if (userStore) {
        userStore.token = ''
        userStore.userInfo = null
      }
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      }
      return Promise.reject(new Error('未授权，请重新登录'))
    }

    if (status === 403) {
      ElMessage.error('没有权限执行此操作')
      return Promise.reject(new Error('没有权限'))
    }

    if (status === 404) {
      ElMessage.error('请求的资源不存在')
      return Promise.reject(new Error('资源不存在'))
    }

    if (status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
      return Promise.reject(new Error('服务器错误'))
    }

    if (!error.response) {
      ElMessage.error('网络错误，请检查网络连接')
      return Promise.reject(new Error('网络错误'))
    }

    return Promise.reject(error)
  }
)

export const auth = {
  login: data => instance.post('/auth/login', data),
  register: data => instance.post('/auth/register', data),
  me: () => instance.get('/auth/me')
}

export const articles = {
  list: (params = {}) => instance.get('/articles', { params }),
  get: id => instance.get(`/articles/${id}`),
  create: data => instance.post('/articles', data),
  update: (id, data) => instance.put(`/articles/${id}`, data),
  delete: id => instance.delete(`/articles/${id}`)
}

export const comments = {
  list: articleId => instance.get(`/comments/article/${articleId}`),
  create: data => instance.post('/comments', data),
  delete: id => instance.delete(`/comments/${id}`)
}

export const tags = {
  list: (params = {}) => instance.get('/tags', { params }),
  popular: (limit = 10) => instance.get('/tags/popular', { params: { limit } }),
  get: name => instance.get(`/tags/${name}`),
  create: data => instance.post('/tags', data),
  update: (id, data) => instance.put(`/tags/${id}`, data),
  delete: id => instance.delete(`/tags/${id}`)
}

export default instance