<script setup>
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useParkingStore } from '@/stores/parking'
import HistoryTable from '@/components/HistoryTable.vue'

const store = useParkingStore()
const { data } = storeToRefs(store)
const router = useRouter()

function handleRepeat(item) {
  store.repeatFromHistory(item)
  router.push('/') // go back to Registration
}
</script>

<template>
  <div class="w-full flex items-start justify-center py-6">
    <HistoryTable :items="data.history" @repeat="handleRepeat" />
  </div>
</template>
