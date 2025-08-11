<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useParkingStore } from '@/stores/parking'

const emit = defineEmits(['submitted'])

const store = useParkingStore()
const { registration, data, readRules, inputErrors } = storeToRefs(store)

// iOS detection (includes iPadOS Safari that reports as Mac)
const isIOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

const makeFocused = ref(false)

const filteredMakes = computed(() => {
  const q = (registration.value.make || '').trim().toLowerCase()
  if (!q) return []
  const list = (data.value.makes || []).filter((m) => (m.Name || '').toLowerCase().includes(q))
  return list.slice(0, 20) // cap results
})

const showMakeDropdown = computed(
  () => isIOS && makeFocused.value && filteredMakes.value.length > 0,
)

function onSelectMake(item) {
  registration.value.make = item.Name
  clearError('make')
  // close after select
  makeFocused.value = false
}
const makeWrapper = ref(null)

function onMakeBlur(e) {
  // If focus is moving to something inside the make wrapper, keep it open.
  const next = e.relatedTarget
  if (makeWrapper.value && next instanceof Node && makeWrapper.value.contains(next)) return
  // Otherwise (including iOS where relatedTarget may be null), close it.
  makeFocused.value = false
}

// --- Helpers (local, can be moved to a utils file later) ---
function parseDateTime(dateStr, timeStr) {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  let h = 0,
    m = 0
  if (timeStr) {
    const [hr, mi] = timeStr.split(':')
    h = Number(hr)
    m = Number(mi)
  }
  return new Date(year, month - 1, day, h, m, 0, 0) // local time
}
function formatDateTime(dt) {
  if (!dt) return ''
  const pad = (n) => (n < 10 ? '0' + n : n)
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function onPlateInput() {
  registration.value.plate = registration.value.plate.toUpperCase()
  clearError('plate')
}

async function onPlateBlur() {
  const plate = registration.value.plate?.trim()
  if (!plate) return
  await store.fetchPlateDataByPlate(plate)
}

const isRegistrationFormValid = computed(() => store.isRegistrationFormValid)

const calculatedEndDateTime = computed(() => {
  let startDate, startTime
  if (registration.value.when === 'future') {
    startDate = registration.value.date
    startTime = registration.value.time
  } else {
    const now = new Date()
    const pad = (n) => (n < 10 ? '0' : '') + n
    startDate = now.toISOString().substring(0, 10)
    startTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  }
  const dt = parseDateTime(startDate, startTime)
  if (!dt) return ''
  const endDt = new Date(dt.getTime() + registration.value.days * 24 * 60 * 60 * 1000)
  return formatDateTime(endDt)
})

function clearError(field) {
  inputErrors.value[field] = false
}
function handleDaysInput() {
  if (registration.value.days < 1 || !registration.value.days) {
    registration.value.days = 1
  }
}
function incDays() {
  registration.value.days = Math.min(registration.value.days + 1, 30)
}
function decDays() {
  if (registration.value.days > 1) registration.value.days--
}

function validateForm() {
  let valid = true
  if (!registration.value.plate.trim()) {
    inputErrors.value.plate = true
    valid = false
  }
  if (!registration.value.make.trim()) {
    inputErrors.value.make = true
    valid = false
  }
  if (!readRules.value) {
    inputErrors.value.readRules = true
    valid = false
  } else {
    inputErrors.value.readRules = false
  }
  return valid
}

function onSubmit() {
  if (!validateForm()) return
  // emit a shallow copy so parent can work with a snapshot
  emit('submitted', { ...registration.value })
}
</script>

<template>
  <form @submit.prevent="onSubmit" class="bg-white shadow rounded-lg p-4 flex flex-col gap-5">
    <!-- Plate -->
    <div>
      <label class="block font-medium mb-1">Plate <span class="text-red-500">*</span></label>
      <input
        v-model="registration.plate"
        @input="onPlateInput"
        @blur="onPlateBlur"
        :class="[
          'border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 uppercase tracking-wider',
          inputErrors.plate ? 'ring-2 ring-red-500 border-red-500' : '',
        ]"
        maxlength="10"
        autocomplete="off"
        required
      />
    </div>

    <!-- Make -->
    <div>
      <label class="block font-medium mb-1">Make <span class="text-red-500">*</span></label>

      <!-- Wrapper so the custom dropdown can position under the input -->
      <div class="relative" ref="makeWrapper">
        <input
          :list="isIOS ? null : 'makeList'"
          v-model="registration.make"
          @input="clearError('make')"
          @focus="makeFocused = true"
          @blur="onMakeBlur"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          :class="[
            'border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400',
            inputErrors.make ? 'ring-2 ring-red-500 border-red-500' : '',
          ]"
          autocomplete="off"
          required
        />

        <!-- iOS-only custom dropdown -->
        <div
          v-if="showMakeDropdown"
          class="absolute z-10 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto"
        >
          <button
            v-for="m in filteredMakes"
            :key="m.Id"
            type="button"
            class="w-full text-left px-3 py-2 hover:bg-indigo-50"
            @mousedown.prevent="onSelectMake(m)"
          >
            <!-- mousedown so blur doesn't kill the click -->
            {{ m.Name }}
          </button>
        </div>
      </div>

      <!-- Keep native datalist for non‑iOS -->
      <datalist id="makeList">
        <option v-for="make in data.makes" :key="make.Id" :value="make.Name" />
      </datalist>
    </div>

    <!-- Model (optional) -->
    <div>
      <label class="block font-medium mb-1">Model (optional)</label>
      <input
        v-model="registration.model"
        @input="clearError('model')"
        :class="[
          'border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400',
          inputErrors.model ? 'ring-2 ring-red-500 border-red-500' : '',
        ]"
        maxlength="30"
        autocomplete="off"
      />
    </div>

    <!-- Start -->
    <div>
      <label class="block font-medium mb-1">Start</label>
      <div class="flex gap-3 items-center">
        <label class="flex items-center gap-1">
          <input type="radio" value="now" v-model="registration.when" class="accent-indigo-600" />
          <span>Now</span>
        </label>
        <label class="flex items-center gap-1">
          <input
            type="radio"
            value="future"
            v-model="registration.when"
            class="accent-indigo-600"
          />
          <span>Future</span>
        </label>
      </div>
      <div v-if="registration.when === 'future'" class="mt-2 flex gap-2">
        <input
          type="date"
          v-model="registration.date"
          class="border rounded py-2 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="time"
          v-model="registration.time"
          class="border rounded py-2 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
    </div>

    <!-- Days -->
    <div>
      <label class="block font-medium mb-1">Days</label>
      <div class="flex items-center gap-2">
        <button type="button" class="px-2 py-1 rounded bg-gray-200 text-lg" @click="decDays">
          -
        </button>
        <input
          type="number"
          class="border w-16 text-center rounded py-2"
          v-model.number="registration.days"
          min="1"
          @input="handleDaysInput"
        />
        <button type="button" class="px-2 py-1 rounded bg-gray-200 text-lg" @click="incDays">
          +
        </button>
        <span class="ml-3 text-gray-600 font-medium">Until</span>
        <span class="ml-1 font-semibold">{{ calculatedEndDateTime }}</span>
      </div>
    </div>

    <!-- Rules -->
    <div class="flex items-center gap-3">
      <input
        type="checkbox"
        id="readRules"
        v-model="readRules"
        class="accent-indigo-600"
        required
      />
      <label for="readRules" class="text-sm">
        I have read the
        <template v-if="store.data.rules">
          <a
            href="#"
            @click.prevent="store.showRulesModal = true"
            class="text-indigo-600 underline cursor-pointer"
            >rules</a
          >
        </template>
        <template v-else> rules </template>
      </label>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="store.submitting"
      :class="[
        'mt-2 w-full rounded py-2 font-semibold flex items-center justify-center gap-1',
        store.submitting ? 'opacity-70 cursor-not-allowed' : '',
        isRegistrationFormValid
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'bg-gray-300 text-gray-400',
      ]"
    >
      <span class="material-icons">check_circle</span>
      <span>{{ store.submitting ? 'Submitting…' : 'Submit' }}</span>
    </button>
    <div v-if="store.error" class="text-red-500 text-sm text-center mt-2">{{ store.error }}</div>
  </form>
</template>
