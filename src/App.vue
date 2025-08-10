<script setup>
import { onMounted } from 'vue'
import { useParkingStore } from '@/stores/parking'
import HeaderBar from '@/components/HeaderBar.vue'

const store = useParkingStore()

onMounted(async () => {
  store.loadAuthFromStorage()
  await store.getData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <HeaderBar />
    <main class="p-4">
      <RouterView />
    </main>
  </div>
</template>
