<template>
  <!-- Android / Desktop Chrome -->
  <div class="w-full flex items-start justify-center py-6 px-4">
    <button
      v-if="canInstall"
      class="px-4 py-2 rounded-xl shadow text-white bg-blue-600 hover:bg-blue-700 install-button"
      @click="install"
    >
      Install App
    </button>

    <!-- iOS Safari hint -->
    <div
      v-else-if="shouldShowIOSHint && showIOSHint"
      class="fixed inset-x-3 bottom-3 rounded-xl bg-white/90 backdrop-blur shadow p-3 text-sm border install-banner"
    >
      <div class="font-medium mb-1">You can install this app to your device!</div>
      <p class="opacity-80">
        Open the <strong>Share</strong> menu
        <span aria-label="share icon">⎋</span>
        and choose <strong>Add to Home Screen</strong>.
      </p>
      <button class="mt-2 text-blue-700 underline" @click="showIOSHint = false">Got it</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePWAInstall } from '@/composables/usePWAInstall'

const { canInstall, promptInstall, shouldShowIOSHint } = usePWAInstall()
const showIOSHint = ref(true)

async function install() {
  await promptInstall()
  // const outcome = await promptInstall()
  // Optional: toast/log outcome === 'accepted' | 'dismissed'
}
</script>

<style scoped>
/* Hide install UI when app runs as standalone */
@media (display-mode: standalone) {
  .install-button,
  .install-banner {
    display: none !important;
  }
}
</style>
