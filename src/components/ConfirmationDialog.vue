<script setup>
//note, I removed "const props = " from the next line, because it was not referenced
defineProps({
  open: { type: Boolean, default: false },
  message: { type: String, default: '' },
})
const emit = defineEmits(['new', 'history', 'close'])

function onBackdrop(e) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-20 bg-black/30 flex items-center justify-center"
    @click="onBackdrop"
  >
    <div class="bg-white rounded-lg shadow-lg w-11/12 max-w-sm p-6 text-center flex flex-col gap-3">
      <span class="material-icons text-green-500 text-4xl mb-2">check_circle</span>
      <div class="text-lg mb-2 whitespace-pre-line">
        {{ message || 'Registration Created!' }}
      </div>
      <div class="flex gap-2 justify-center">
        <button
          @click="$emit('new')"
          class="flex-1 bg-indigo-600 text-white rounded py-2 font-medium"
        >
          New Registration
        </button>
        <button
          @click="$emit('history')"
          class="flex-1 bg-indigo-100 text-indigo-700 rounded py-2 font-medium"
        >
          View History
        </button>
      </div>
    </div>
  </div>
</template>
