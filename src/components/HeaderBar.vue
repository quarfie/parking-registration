<script setup>
import { storeToRefs } from 'pinia'
import { useParkingStore } from '@/stores/parking'
import { RouterLink, useRouter } from 'vue-router'

const store = useParkingStore()
const { hasLoaded, data, remainingAllDay } = storeToRefs(store)
const router = useRouter()

function logout() {
  store.logout()
  router.push('/login')
}
</script>

<template>
  <div class="bg-white shadow-md py-3 px-4 sticky top-0 z-10">
    <!-- Title -->
    <h1 class="text-xl font-semibold text-center tracking-tight">109OZ Parking Registration</h1>

    <!-- Account summary -->
    <div
      v-if="hasLoaded && data.account && data.account.SuiteNo"
      class="flex flex-wrap justify-center gap-4 gap-y-1 text-sm py-1 items-center text-center"
    >
      <span class="font-medium flex items-center gap-1">
        <span class="material-icons" aria-hidden="true">person</span>
        {{ data.account.Name }}
      </span>

      <span class="font-medium flex items-center gap-1">
        <span class="material-icons" aria-hidden="true">home</span>
        Suite {{ data.account.SuiteNo }}
      </span>

      <span class="font-medium flex items-center gap-1">
        <span class="material-icons" aria-hidden="true">directions_car</span>
        Remaining: {{ remainingAllDay }}
      </span>

      <button @click="logout" type="button" class="font-medium flex items-center gap-1">
        <span class="material-icons">logout</span>
        Logout
      </button>
    </div>

    <nav class="flex justify-center gap-3 text-sm pt-1">
      <RouterLink to="/" class="text-indigo-700 hover:underline">Registration</RouterLink>
      <RouterLink to="/history" class="text-indigo-700 hover:underline">History</RouterLink>
      <RouterLink to="/account" class="text-indigo-700 hover:underline">Account</RouterLink>
    </nav>
  </div>
</template>
