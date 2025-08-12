<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useParkingStore } from '@/stores/parking'
import { apiForgotSendEmail, apiVerifyOtp } from '@/lib/api'

const store = useParkingStore()
const router = useRouter()
const pin = ref('')
const err = ref('')

const mode = ref('pin') // 'pin' | 'forgotEmail' | 'otp' | 'done'
const email = ref('')
const otp = ref('')
const info = ref('')
const sending = ref(false)
const sentEmail = ref('') // remember the email for resend/verify

function goLogin() {
  mode.value = 'pin'
  err.value = ''
  info.value = ''
  email.value = ''
  otp.value = ''
}

async function onForgotClick() {
  mode.value = 'forgotEmail'
  err.value = ''
  info.value = ''
  email.value = ''
  otp.value = ''
}

async function onSendEmail() {
  err.value = ''
  info.value = ''
  const e = email.value.trim()
  if (!e) {
    err.value = 'Please enter your email address.'
    return
  }
  try {
    sending.value = true
    const res = await apiForgotSendEmail(e)
    if (res?.StatusCode === 200 && res?.Data) {
      sentEmail.value = e
      info.value = 'We’ve emailed you a verification code. Enter it below within 2 minutes.'
      mode.value = 'otp'
    } else {
      err.value = res?.Error || 'Invalid email request.'
    }
  } catch (e) {
    err.value = 'Could not send verification email.'
    console.error(e)
  } finally {
    sending.value = false
  }
}

async function onResend() {
  if (!sentEmail.value) return
  err.value = ''
  info.value = ''
  try {
    sending.value = true
    const res = await apiForgotSendEmail(sentEmail.value)
    if (res?.StatusCode === 200 && res?.Data) {
      info.value = 'A new verification code has been sent.'
    } else {
      err.value = res?.Error || 'Could not resend code.'
    }
  } catch (e) {
    err.value = 'Could not resend code.'
    console.error(e)
  } finally {
    sending.value = false
  }
}

async function onVerifyOtp() {
  err.value = ''
  info.value = ''
  const code = otp.value.trim()
  if (!code) {
    err.value = 'Please enter the verification code.'
    return
  }
  try {
    sending.value = true
    const res = await apiVerifyOtp(sentEmail.value, code)
    if (res?.StatusCode === 200 && res?.Data) {
      info.value = `Your PIN has been sent to ${sentEmail.value}.`
      mode.value = 'done'
    } else {
      err.value = res?.Error || 'Invalid or expired code. Please try again.'
    }
  } catch (e) {
    err.value = 'Verification failed. Please try again.'
    console.error(e)
  } finally {
    sending.value = false
  }
}

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
    <div class="bg-white shadow rounded-lg p-6 w-full max-w-xs flex flex-col items-center gap-4">
      <img src="/logo.svg" alt="Logo" class="w-24 h-24 mx-auto" />

      <!-- PIN login -->
      <template v-if="mode === 'pin'">
        <input
          id="pinNo"
          v-model="pin"
          type="password"
          maxlength="10"
          autocomplete="current-password"
          placeholder="Enter PIN"
          class="border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center"
          @keyup.enter="onSubmit"
        />
        <button
          @click="onSubmit"
          class="w-full bg-indigo-600 text-white rounded py-2 font-semibold hover:bg-indigo-700 flex items-center justify-center gap-1"
          :disabled="store.loading"
        >
          <span class="material-icons">login</span>
          <span>{{ store.loading ? 'Signing in…' : 'Submit' }}</span>
        </button>
        <button class="text-xs text-indigo-700 underline" @click="onForgotClick" type="button">
          Forgot PIN?
        </button>
      </template>

      <!-- Forgot: email input -->
      <template v-else-if="mode === 'forgotEmail'">
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="Enter your email"
          class="border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
          @keyup.enter="onSendEmail"
        />
        <button
          @click="onSendEmail"
          class="w-full bg-indigo-600 text-white rounded py-2 font-semibold hover:bg-indigo-700 flex items-center justify-center gap-1"
          :disabled="sending"
        >
          <span class="material-icons">mail</span>
          <span>{{ sending ? 'Sending…' : 'Send Code' }}</span>
        </button>
        <button class="text-xs text-gray-600 underline" @click="goLogin" type="button">
          Back to login
        </button>
      </template>

      <!-- OTP entry -->
      <template v-else-if="mode === 'otp'">
        <p class="text-sm text-gray-700 text-center px-1">
          We’ve sent a verification code to <span class="font-medium">{{ sentEmail }}</span
          >. Enter it below within 2 minutes.
        </p>
        <input
          id="otp"
          v-model="otp"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="one-time-code"
          formcontrolname="otp"
          placeholder="Verification code"
          class="border w-full py-2 px-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center tracking-widest"
          @keyup.enter="onVerifyOtp"
        />
        <button
          @click="onVerifyOtp"
          class="w-full bg-indigo-600 text-white rounded py-2 font-semibold hover:bg-indigo-700 flex items-center justify-center gap-1"
          :disabled="sending"
        >
          <span class="material-icons">verified</span>
          <span>{{ sending ? 'Verifying…' : 'Verify Code' }}</span>
        </button>
        <button
          class="text-xs text-indigo-700 underline"
          @click="onResend"
          type="button"
          :disabled="sending"
        >
          Resend code
        </button>
        <button class="text-xs text-gray-600 underline" @click="goLogin" type="button">
          Back to login
        </button>
      </template>

      <!-- Done -->
      <template v-else-if="mode === 'done'">
        <p class="text-sm text-gray-700 text-center px-1">
          {{ info }}
        </p>
        <button
          class="w-full bg-indigo-600 text-white rounded py-2 font-semibold hover:bg-indigo-700"
          @click="goLogin"
          type="button"
        >
          Back to login
        </button>
      </template>

      <!-- Messages -->
      <div v-if="err" class="text-red-500 text-sm text-center">{{ err }}</div>
      <div v-if="info && mode !== 'done'" class="text-indigo-700 text-xs text-center">
        {{ info }}
      </div>
    </div>
  </div>
</template>
