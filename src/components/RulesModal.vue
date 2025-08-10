<script setup>
import { storeToRefs } from 'pinia'
import { useParkingStore } from '@/stores/parking'

const store = useParkingStore()
const { showRulesModal, data } = storeToRefs(store)

function close() {
  showRulesModal.value = false
}
function onBackdrop(e) {
  if (e.target === e.currentTarget) close()
}
</script>

<template>
  <div
    v-if="showRulesModal"
    class="fixed inset-0 z-30 bg-black/50 flex justify-center items-start pt-20 px-4"
    @click="onBackdrop"
  >
    <div class="bg-white rounded-lg shadow-md max-w-md w-full relative max-h-[80vh] overflow-auto">
      <button @click="close" class="absolute top-2 left-2 text-gray-600 hover:text-gray-900">
        <span class="material-icons">close</span>
      </button>
      <div class="p-6">
        <div v-html="data.rules" class="prose max-w-none"></div>
      </div>
    </div>
  </div>
</template>
