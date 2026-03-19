import { createRouter, createWebHistory } from 'vue-router'
import GenericGrid from '@/pages/GenericGrid.vue'

const routes = [
  {
    path: '/',
    redirect: '/grid/users'
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
