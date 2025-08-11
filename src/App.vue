<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useParkingStore } from '@/stores/parking'
import HeaderBar from '@/components/HeaderBar.vue'
import InstallPrompt from './components/InstallPrompt.vue'

const store = useParkingStore()
const route = useRoute()

onMounted(async () => {
  store.loadAuthFromStorage()
  await store.getData()
})

const mainClass = computed(() => (route.name === 'history' ? 'p-0' : 'p-4'))

const showFooter = computed(() => route.name !== 'login')
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <HeaderBar />
    <main :class="mainClass">
      <RouterView />
    </main>
    <InstallPrompt />
    <footer v-if="showFooter">
      <div class="py-6 text-center text-sm text-gray-600 flex flex-col items-center gap-2">
        <img src="/logo.svg" alt="Logo" class="w-24 h-24 mx-auto" />
        <p>Created for the 109OZ community by Jason Wood</p>
        <a
          href="https://github.com/quarfie/parking-registration"
          target="_blank"
          rel="noopener"
          class="text-indigo-600 hover:underline"
        >
          View on GitHub
        </a>
      </div>
    </footer>
  </div>
</template>
