import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000
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
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const auth = {
  login: data => instance.post('/auth/login', data),
  register: data => instance.post('/auth/register', data)
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
  list: () => instance.get('/tags'),
  popular: (limit = 10) => instance.get(`/tags/popular?limit=${limit}`),
  create: data => instance.post('/tags', data),
  update: (id, data) => instance.put(`/tags/${id}`, data),
  delete: id => instance.delete(`/tags/${id}`)
}

export default instance