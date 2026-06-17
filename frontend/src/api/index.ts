import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

interface ApiResponse<T = any> {
  data: T
  meta?: {
    total?: number
    results?: number
    page?: number
    message?: string
    token?: string
  }
}

interface LoginData {
  username: string
  password: string
}

interface RegisterData {
  username: string
  email: string
  password: string
}

interface ArticleData {
  title: string
  content: string
  category?: string
  tags?: string
}

interface CommentData {
  content: string
  article: string
  parentComment?: string | null
}

interface TagData {
  name: string
  description?: string
  color?: string
}

const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000
})

instance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  (response: AxiosResponse) => {
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
      } as ApiResponse
    }

    return { data: res } as ApiResponse
  },
  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || error.message || '请求失败'

    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
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
  login: (data: LoginData): Promise<ApiResponse> => instance.post('/auth/login', data),
  register: (data: RegisterData): Promise<ApiResponse> => instance.post('/auth/register', data),
  me: (): Promise<ApiResponse> => instance.get('/auth/me')
}

export const articles = {
  list: (params: Record<string, any> = {}): Promise<ApiResponse> =>
    instance.get('/articles', { params }),
  get: (id: string): Promise<ApiResponse> => instance.get(`/articles/${id}`),
  create: (data: ArticleData): Promise<ApiResponse> => instance.post('/articles', data),
  update: (id: string, data: ArticleData): Promise<ApiResponse> => instance.put(`/articles/${id}`, data),
  delete: (id: string): Promise<ApiResponse> => instance.delete(`/articles/${id}`)
}

export const comments = {
  list: (articleId: string): Promise<ApiResponse> => instance.get(`/comments/article/${articleId}`),
  create: (data: CommentData): Promise<ApiResponse> => instance.post('/comments', data),
  delete: (id: string): Promise<ApiResponse> => instance.delete(`/comments/${id}`)
}

export const tags = {
  list: (params: Record<string, any> = {}): Promise<ApiResponse> =>
    instance.get('/tags', { params }),
  popular: (limit: number = 10): Promise<ApiResponse> =>
    instance.get('/tags/popular', { params: { limit } }),
  get: (name: string): Promise<ApiResponse> => instance.get(`/tags/${name}`),
  create: (data: TagData): Promise<ApiResponse> => instance.post('/tags', data),
  update: (id: string, data: Partial<TagData>): Promise<ApiResponse> => instance.put(`/tags/${id}`, data),
  delete: (id: string): Promise<ApiResponse> => instance.delete(`/tags/${id}`)
}

export default instance