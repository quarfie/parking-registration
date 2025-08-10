import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import RegistrationView from '@/views/RegistrationView.vue'
import HistoryView from '@/views/HistoryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/', name: 'registration', component: RegistrationView },
    { path: '/history', name: 'history', component: HistoryView },
  ],
})

import { useParkingStore } from '@/stores/parking'

router.beforeEach((to) => {
  const store = useParkingStore()
  if (!store.auth) store.loadAuthFromStorage()

  const authed = !!store.auth?.Token

  // Allow visiting /login when not authed
  if (to.name === 'login') {
    return authed ? { name: 'registration' } : true
  }

  // Protect other routes
  if (!authed) return { name: 'login' }
  return true
})

export default router
