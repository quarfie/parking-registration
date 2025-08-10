<script setup>
import { useRouter } from 'vue-router'
import { useParkingStore } from '@/stores/parking'
import RegistrationForm from '@/components/RegistrationForm.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import RulesModal from '@/components/RulesModal.vue'

const store = useParkingStore()
const router = useRouter()

async function handleSubmitted() {
  const ok = await store.submitRegistration()
  if (!ok) {
    // Optionally surface store.error to the user
    console.error(store.error)
  }
}

function handleNew() {
  store.showConfirmation = false
  store.resetRegistration()
}

function handleHistory() {
  store.showConfirmation = false
  router.push('/history')
}
</script>

<template>
  <div class="w-full min-h-screen flex items-start justify-center py-6 px-4">
    <div class="w-full max-w-md">
      <RegistrationForm @submitted="handleSubmitted" />
    </div>
  </div>

  <ConfirmationDialog
    :open="store.showConfirmation"
    :message="store.confirmationMessage"
    @new="handleNew"
    @history="handleHistory"
    @close="store.showConfirmation = false"
  />

  <RulesModal />
</template>
