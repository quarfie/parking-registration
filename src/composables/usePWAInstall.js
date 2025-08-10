import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

export function usePWAInstall() {
  const deferredPrompt = ref(null)
  const canInstall = computed(() => !!deferredPrompt.value)

  function onBeforeInstallPrompt(e) {
    // Stop Chrome from auto-showing the mini-infobar
    e.preventDefault()
    deferredPrompt.value = e
  }

  async function promptInstall() {
    if (!deferredPrompt.value) return null
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    return outcome // 'accepted' | 'dismissed'
  }

  function onAppInstalled() {
    deferredPrompt.value = null
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onAppInstalled)
  })

  // iOS detection (Safari)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true

  const shouldShowIOSHint = computed(() => isIOS && !isStandalone)

  return { canInstall, promptInstall, shouldShowIOSHint }
}
