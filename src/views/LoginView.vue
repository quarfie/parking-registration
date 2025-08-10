<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useParkingStore } from '@/stores/parking'

const store = useParkingStore()
const router = useRouter()
const pin = ref('')
const err = ref('')

async function onSubmit() {
  err.value = ''
  if (!pin.value.trim()) {
    err.value = 'Please enter your PIN.'
    return
  }
  const ok = await store.loginWithPin(pin.value.trim())
  if (ok) {
    await store.getData()
    router.push('/') // go to registration
  } else {
    err.value = store.error || 'Login failed.'
  }
}
</script>

<template>
  <div class="min-h-[60vh] flex items-center justify-center px-4">
    <div class="bg-white shadow rounded-lg p-6 w-full max-w-xs">
      <label for="pinNo" class="block mb-1 text-sm font-medium">Enter PIN No</label>
      <input
        id="pinNo"
        v-model="pin"
        type="text"
        maxlength="10"
        autocomplete="off"
        class="border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
        @keyup.enter="onSubmit"
      />
      <button
        @click="onSubmit"
        class="mt-4 w-full bg-indigo-600 text-white rounded py-2 font-semibold hover:bg-indigo-700 flex items-center justify-center gap-1"
        :disabled="store.loading"
      >
        <span class="material-icons text-base">login</span>
        <span>{{ store.loading ? 'Signing in…' : 'Submit' }}</span>
      </button>
      <div v-if="err" class="text-red-500 mt-2 text-sm">{{ err }}</div>
    </div>
  </div>
</template>
