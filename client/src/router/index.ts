import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/pages/Dashboard.vue'
import Users from '@/pages/Users.vue'
import GenericGrid from '@/pages/GenericGrid.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/users',
    name: 'Users',
    component: Users
  },
  {
    path: '/grid/:gridId',
    name: 'GenericGrid',
    component: GenericGrid
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router