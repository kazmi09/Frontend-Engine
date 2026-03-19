import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface User {
  id: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User>({
    id: 'demo-user',
    name: 'Demo User',
    role: 'admin'
  })

  const setUserRole = (role: User['role']) => {
    user.value.role = role
  }

  return {
    user,
    setUserRole
  }
})