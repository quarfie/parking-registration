<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useParkingStore } from '@/stores/parking'
import HeaderBar from '@/components/HeaderBar.vue'

const store = useParkingStore()
const route = useRoute()

onMounted(async () => {
  store.loadAuthFromStorage()
  await store.getData()
})

const mainClass = computed(() => (route.name === 'history' ? 'p-0' : 'p-4'))
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <HeaderBar />
    <main :class="mainClass">
      <RouterView />
    </main>
  </div>
</template>
