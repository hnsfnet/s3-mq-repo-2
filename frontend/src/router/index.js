import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ArticleList from '../views/ArticleList.vue'
import ArticleDetail from '../views/ArticleDetail.vue'
import Admin from '../views/Admin.vue'
import CreateArticle from '../views/CreateArticle.vue'
import EditArticle from '../views/EditArticle.vue'
import { useUserStore } from '../stores/user'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/articles', name: 'ArticleList', component: ArticleList },
  { path: '/article/:id', name: 'ArticleDetail', component: ArticleDetail },
  { path: '/admin', name: 'Admin', component: Admin },
  { path: '/create', name: 'CreateArticle', component: CreateArticle },
  { path: '/edit/:id', name: 'EditArticle', component: EditArticle }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const authRequired = ['Admin', 'CreateArticle', 'EditArticle']
  
  if (authRequired.includes(to.name) && !userStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router