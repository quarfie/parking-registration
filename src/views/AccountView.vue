<script setup>
import { ref, watchEffect } from 'vue'
import { storeToRefs } from 'pinia'
import { useParkingStore } from '@/stores/parking'
import { useRouter } from 'vue-router'

const store = useParkingStore()
const { data } = storeToRefs(store)

const router = useRouter()

// Local editable copy so you can cancel without mutating store mid-typing
const name = ref('')
const email = ref('')
const phone = ref('')
const showPin = ref(false)
const newPin = ref('')

const message = ref('')
const error = ref('')

// Initialize fields from store when account loads/changes
watchEffect(() => {
  name.value = data.value.account?.Name || ''
  email.value = data.value.account?.Email || ''
  phone.value = data.value.account?.Phone || ''
})

//const canSubmit = computed(() => name.value.trim() && email.value.trim() && phone.value.trim())

function resetAccountForm() {
  name.value = data.value.account?.Name || ''
  email.value = data.value.account?.Email || ''
  phone.value = data.value.account?.Phone || ''
  newPin.value = ''
  showPin.value = false
  router.push('/')
}

async function onSubmit() {
  message.value = ''
  error.value = ''

  // Let browser show native hints first
  const form = document.getElementById('account-form')
  if (form && !form.reportValidity()) return

  const res = await store.saveMyAccount({
    name: name.value,
    email: email.value,
    phone: phone.value,
    newPin: showPin.value ? newPin.value : '',
  })

  if (res.ok) {
    message.value = res.message
    // Clear PIN field after success
    newPin.value = ''
    showPin.value = false
  } else {
    error.value = res.message
  }
}
</script>

<template>
  <div class="w-full flex items-start justify-center py-6 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white shadow rounded-lg p-4 flex flex-col gap-4">
        <h2 class="text-xl font-semibold tracking-tight">Account</h2>

        <form id="account-form" @submit.prevent="onSubmit" class="flex flex-col gap-4">
          <!-- Name -->
          <div>
            <label class="block font-medium mb-1">Name <span class="text-red-500">*</span></label>
            <input
              v-model="name"
              required
              autocomplete="name"
              class="border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block font-medium mb-1">Email <span class="text-red-500">*</span></label>
            <input
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <!-- Phone -->
          <div>
            <label class="block font-medium mb-1">Phone <span class="text-red-500">*</span></label>
            <input
              v-model="phone"
              type="tel"
              required
              autocomplete="tel"
              class="border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <!-- Change PIN reveal -->
          <div>
            <button
              type="button"
              class="text-indigo-700 hover:underline text-sm"
              @click="showPin = !showPin"
            >
              {{ showPin ? 'Cancel PIN change' : 'Change PIN' }}
            </button>

            <div v-if="showPin" class="mt-2">
              <label class="block font-medium mb-1">New PIN</label>
              <input
                v-model="newPin"
                type="password"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="10"
                autocomplete="new-password"
                placeholder="Enter new PIN"
                class="border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <p class="text-xs text-gray-500 mt-1">
                Leave blank if you don’t want to change your PIN.
              </p>
            </div>
          </div>

          <!-- Submit -->
          <button
            type="submit"
            :disabled="store.accountSaving"
            :class="[
              'w-full rounded py-2 font-semibold flex items-center justify-center gap-1',
              store.accountSaving
                ? 'opacity-70 cursor-progress'
                : 'bg-indigo-600 text-white hover:bg-indigo-700',
            ]"
          >
            <span class="material-icons">save</span>
            <span>{{ store.accountSaving ? 'Saving…' : 'Save changes' }}</span>
          </button>

          <!-- Cancel Button -->
          <button
            type="button"
            class="text-gray-600 hover:underline text-sm self-start"
            @click="resetAccountForm"
          >
            Cancel
          </button>
        </form>

        <!-- Messages -->
        <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
        <div v-if="message" class="text-green-600 text-sm">{{ message }}</div>
      </div>
    </div>
  </div>
</template>
