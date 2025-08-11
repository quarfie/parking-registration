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
    { path: '/account', name: 'account', component: () => import('@/views/AccountView.vue') },
  ],
})

import { useParkingStore } from '@/stores/parking'

router.beforeEach(async (to) => {
  const store = useParkingStore()

  // Ensure auth is loaded from storage
  if (!store.auth) store.loadAuthFromStorage()

  const authed = !!store.auth?.Token

  // Allow visiting /login when not authed
  if (to.name === 'login') {
    return authed ? { name: 'registration' } : true
  }

  // Protect other routes
  if (!authed) return { name: 'login' }

  // Ensure account data is loaded (needed to check completeness)
  if (!store.hasLoaded) {
    try {
      await store.getData()
    } catch (e) {
      console.error('Failed to load account data:', e)
    }
  }

  const acct = store.data?.account || {}
  const missingProfile = !acct.Name || !acct.Email || !acct.Phone

  // Force completion on Account page; allow navigating to Account, block others
  if (missingProfile && to.name !== 'account') {
    return { name: 'account', query: { reason: 'complete-profile' } }
  }

  return true
})

export default router
