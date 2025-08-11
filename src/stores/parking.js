// src/stores/parking.js
import { defineStore } from 'pinia'
import {
  apiLogin,
  apiSaveMyAccount,
  apiGetAccount,
  apiGetHistory,
  apiGetMakes,
  apiGetRules,
  apiGetPlateWiseData,
  apiCreateVehicleMake,
  apiSaveRegistration,
  setAuth,
  clearAuth,
} from '@/lib/api'

// --- offline caching helpers (localStorage) ---
const CACHE_KEYS = {
  account: 'parking:account',
  history: 'parking:history',
  makes: 'parking:makes',
  rules: 'parking:rules',
}

function cacheSet(key, value) {
  try {
    const payload = { ts: Date.now(), value }
    localStorage.setItem(key, JSON.stringify(payload))
  } catch (e) {
    // storage might be full or disabled; ignore
    console.warn(`Failed to cache ${key}:`, e)
  }
}

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { value } = JSON.parse(raw)
    // If data is too old, you can choose to ignore it by returning null.
    // For now, we always return it so the app can show *something* offline.
    // If you want TTL enforcement, uncomment below:
    // if (Date.now() - ts > CACHE_TTL_MS) return null;
    return value
  } catch (e) {
    console.warn(`Failed to retrieve cache for ${key}:`, e)
    return null
  }
}

function cacheRemove(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    // Ignore errors, e.g., if storage is full or disabled
    console.warn(`Failed to remove cache for ${key}:`, e)
  }
}

function cacheClearAll() {
  Object.values(CACHE_KEYS).forEach(cacheRemove)
}
// --- end offline caching helpers ---

function getDefaultRegistration() {
  const now = new Date()
  const pad = (n) => (n < 10 ? '0' : '') + n
  return {
    plate: '',
    make: '',
    model: '',
    when: 'now',
    date: now.toISOString().substring(0, 10),
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    days: 1,
  }
}

//functions for date/time formatting

function pad2(n) {
  return n < 10 ? '0' + n : '' + n
}
function noPad(n) {
  return String(n)
} // API samples show no leading zeros

function toDateParts(dt) {
  const y = dt.getFullYear()
  const m = dt.getMonth() + 1
  const d = dt.getDate()
  return { y, m, d }
}

function toTimeParts(dt) {
  let h = dt.getHours()
  const m = dt.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return { h, m, ampm } // 12-hour clock
}

function fmtDateNoLeadingZeros(dt) {
  const { y, m, d } = toDateParts(dt)
  return `${noPad(y)}-${noPad(m)}-${noPad(d)}` // e.g., 2025-8-9
}

function fmtTimeAMPM(dt) {
  const { h, m, ampm } = toTimeParts(dt)
  return `${h}:${pad2(m)} ${ampm}` // e.g., 1:39 PM
}

function fmtApplyTime(dt) {
  const { y, m, d } = toDateParts(dt)
  const { h, m: mi, ampm } = toTimeParts(dt)
  // The sample shows lowercase am/pm; we’ll match that:
  const ampmLower = ampm.toLowerCase()
  return `${noPad(y)}-${noPad(m)}-${noPad(d)} ${h}:${pad2(mi)} ${ampmLower}` // 2025-8-9 01:40 pm
}

export const useParkingStore = defineStore('parking', {
  state: () => ({
    hasLoaded: false,
    pinEntered: false,
    pinError: '',
    page: 'registration',
    readRules: false,
    showRulesModal: false,
    showConfirmation: false,
    auth: null,
    loading: false,
    error: '',
    confirmationMessage: '',
    submitting: false,
    accountSaving: false,
    accountError: '',

    // Data structure to hold fetched data
    data: {
      account: {},
      history: [],
      makes: [],
      rules: '',
    },

    registration: getDefaultRegistration(),
    inputErrors: {
      plate: false,
      make: false,
      model: false,
      readRules: false,
    },
  }),

  getters: {
    remainingAllDay: (s) =>
      (s.data.account?.AllocateAllDay || 0) - (s.data.account?.TakenAllDay || 0),
    isRegistrationFormValid: (s) =>
      s.registration.plate.trim().length > 0 &&
      s.registration.make.trim().length > 0 &&
      s.readRules,
    isAuthenticated: (s) => !!s.auth?.Token,
  },

  actions: {
    async getData() {
      // if authenticated, load everything; else leave hasLoaded false
      if (!this.auth?.Token) return
      await this.fetchAll()
      if (this.data.account?.PinNo) this.pinEntered = true
    },
    onSubmitPin(pinInput) {
      this.pinError = ''
      if (!pinInput || pinInput.length < 2) {
        this.pinError = 'Please enter a valid PIN.'
        return
      }
      // later: authenticate via API, store token in storage
      this.getData()
    },
    resetRegistration() {
      // reset form + errors (same defaults as when app starts)
      const now = new Date()
      const pad = (n) => (n < 10 ? '0' : '') + n
      this.registration = {
        plate: '',
        make: '',
        model: '',
        when: 'now',
        date: now.toISOString().substring(0, 10),
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
        days: 1,
      }
      this.readRules = false
      this.inputErrors = { plate: false, make: false, model: false, readRules: false }
    },
    repeatFromHistory(item) {
      this.registration.plate = item.PlateNo || ''
      this.registration.make = item.Make || ''
      this.registration.model = item.Model || ''
      this.readRules = false
      this.inputErrors = { plate: false, make: false, model: false, readRules: false }
    },
    loadAuthFromStorage() {
      try {
        const saved = JSON.parse(localStorage.getItem('auth') || 'null')
        this.auth = saved
      } catch {
        this.auth = null
      }
    },
    async loginWithPin(pin) {
      this.loading = true
      this.error = ''
      try {
        const authObj = await apiLogin(pin) // { Name, Token, ... }
        this.auth = authObj
        setAuth(authObj)
        return true
      } catch (e) {
        this.error = 'Invalid PIN or server error.'
        console.error(e)
        return false
      } finally {
        this.loading = false
      }
    },
    async saveMyAccount({ name, email, phone, newPin }) {
      this.accountSaving = true
      this.accountError = ''
      try {
        const acct = this.data.account || {}
        const payload = {
          Name: name?.trim() ?? '',
          Email: email?.trim() ?? '',
          Phone: phone?.trim() ?? '',
          ApartmentNo: acct.SuiteNo, // not editable, required by API
          ...(newPin ? { NewPinNo: newPin.trim() } : {}),
        }

        const res = await apiSaveMyAccount(payload)

        if (res?.StatusCode === 200 && res?.Data) {
          // Refresh account so UI reflects latest info
          const a = await apiGetAccount()
          if (a?.Data) this.data.account = a.Data
          return { ok: true, message: 'Your changes have been saved.' }
        }

        // Handle known error shapes
        if (res?.errors) {
          // validation object { Field: [messages...] }
          const messages = Object.values(res.errors).flat().join(' ')
          return { ok: false, message: messages || 'Validation failed.' }
        }
        if (res?.Error) {
          return { ok: false, message: res.Error }
        }
        return { ok: false, message: 'Could not save changes.' }
      } catch (err) {
        // If server returned validation as JSON with 400 status, our request() throws — you can optionally
        // parse here if your backend sends JSON bodies. For now, show generic error:
        console.error('Save account error:', err)
        this.accountError = 'Request failed.'
        return { ok: false, message: 'Request failed.' }
      } finally {
        this.accountSaving = false
      }
    },
    logout() {
      this.auth = null
      clearAuth()
      // Clear any cached API data so a new user doesn't see previous data
      cacheClearAll()
      // Clear loaded data & UI flags so header summary hides immediately
      this.hasLoaded = false
      this.pinEntered = false
      this.data = {
        account: {},
        history: [],
        //makes: [],
        //rules: '',
      }
      this.readRules = false
      this.showRulesModal = false
      this.showConfirmation = false
      this.confirmationMessage = ''
      this.submitting = false

      // Optional: reset the form too
      this.registration = getDefaultRegistration()
      this.inputErrors = { plate: false, make: false, model: false, readRules: false }
    },
    async fetchAll() {
      this.loading = true
      this.error = ''
      try {
        const [acct, hist, makes, rules] = await Promise.all([
          apiGetAccount(),
          apiGetHistory(),
          apiGetMakes(),
          apiGetRules(),
        ])

        if (acct?.Data) {
          this.data.account = acct.Data
          cacheSet(CACHE_KEYS.account, acct.Data)
        }
        if (hist?.Data) {
          this.data.history = hist.Data
          cacheSet(CACHE_KEYS.history, hist.Data)
        }
        if (makes?.Data) {
          this.data.makes = makes.Data
          cacheSet(CACHE_KEYS.makes, makes.Data)
        }
        if (rules?.Data) {
          this.data.rules = rules.Data.Rules
          cacheSet(CACHE_KEYS.rules, this.data.rules)
        }
        this.hasLoaded = true
      } catch (e) {
        // Network failed → try cache
        const cachedAccount = cacheGet(CACHE_KEYS.account)
        const cachedHistory = cacheGet(CACHE_KEYS.history)
        const cachedMakes = cacheGet(CACHE_KEYS.makes)
        const cachedRules = cacheGet(CACHE_KEYS.rules)

        if (cachedAccount || cachedHistory || cachedMakes || cachedRules) {
          if (cachedAccount) this.data.account = cachedAccount
          if (cachedHistory) this.data.history = cachedHistory
          if (cachedMakes) this.data.makes = cachedMakes
          if (cachedRules) this.data.rules = cachedRules
          this.hasLoaded = true
          this.error = ''
          console.warn('Loaded data from offline cache')
        } else {
          this.error = 'Failed to load data.'
          console.error(e)
        }
      } finally {
        this.loading = false
      }
    },
    async fetchPlateDataByPlate(plateNo) {
      const plate = (plateNo || '').trim()
      if (!plate) return
      try {
        const res = await apiGetPlateWiseData(plate)
        if (res && Array.isArray(res.Data) && res.Data.length > 0) {
          const hit = res.Data[0]
          // Ensure makes are available (fetch if empty)
          if (!this.data.makes || this.data.makes.length === 0) {
            const makesRes = await apiGetMakes()
            if (makesRes?.Data) this.data.makes = makesRes.Data
          }
          // Map MakeId to name
          const found = this.data.makes.find((m) => m.Id === hit.MakeId)
          this.registration.make = found?.Name || this.registration.make
          // Fill model if provided
          if (hit.Model) this.registration.model = hit.Model
        }
      } catch (err) {
        console.warn('Plate-wise lookup failed:', err)
      }
    },
    async submitRegistration() {
      // guard
      if (!this.auth?.Token) {
        this.error = 'Not authenticated.'
        return false
      }
      const acct = this.data.account
      const reg = this.registration
      this.submitting = true
      this.error = ''
      this.confirmationMessage = ''

      try {
        // 1) Find MakeId (case-insensitive). If not found, create and refresh makes.
        const makeName = (reg.make || '').trim()
        let make = this.data.makes.find(
          (m) => (m.Name || '').toLowerCase() === makeName.toLowerCase(),
        )
        if (!make) {
          const createRes = await apiCreateVehicleMake(makeName)
          if (!createRes || createRes.StatusCode !== 200) {
            throw new Error('Failed to create make')
          }
          const makesRes = await apiGetMakes()
          if (makesRes?.Data) this.data.makes = makesRes.Data
          make = this.data.makes.find(
            (m) => (m.Name || '').toLowerCase() === makeName.toLowerCase(),
          )
          if (!make) {
            throw new Error('Created make but could not resolve MakeId')
          }
        }
        const makeId = make.Id

        // 2) Build payload for /visitorparking/save
        // Determine start from form ("now" or user-provided)
        const now = new Date()
        let start = now
        if (reg.when === 'future') {
          // reg.date: yyyy-mm-dd, reg.time: HH:mm (24h)
          const [y, mo, d] = reg.date.split('-').map(Number)
          const [hh, mm] = (reg.time || '00:00').split(':').map(Number)
          start = new Date(y, (mo || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0)
        }

        const end = new Date(start.getTime() + reg.days * 24 * 60 * 60 * 1000 - 1000) // end is 24h later minus 1 second

        const payload = {
          // account fields
          PinNo: acct.PinNo,
          PinId: acct.PinId,
          Name: acct.Name,
          SuiteNo: acct.SuiteNo,
          Email: acct.Email,
          Phone: acct.Phone,
          AllocateDay: acct.AllocateDay,
          AllocateNight: acct.AllocateNight,
          AllocateAllDay: acct.AllocateAllDay,
          TakenDay: acct.TakenDay,
          TakenNight: acct.TakenNight,
          TakenAllDay: acct.TakenAllDay,
          ParkingMonth: acct.ParkingMonth,

          // registration fields
          StartDate: fmtDateNoLeadingZeros(start),
          IsReadRules: true,
          PlateNo: reg.plate,
          MakeId: makeId,
          Model: reg.model || '',
          ParkingFor: '24 Hours',
          StartTime: fmtTimeAMPM(start),
          EndTime: fmtTimeAMPM(start), // per your “same as start time”
          EndDate: fmtDateNoLeadingZeros(end),
          NoQty: reg.days,
          //ProvinceId: , //Null doesn't work. need to exclude if not providing a provinceId
          ApplyTime: fmtApplyTime(now),
        }

        // 3) Save
        const saveRes = await apiSaveRegistration(payload)
        if (saveRes?.StatusCode !== 200) {
          throw new Error('Save failed')
        }

        // 4) Show message from server
        this.confirmationMessage = (saveRes?.Message || 'Registration Created!').trim()
        this.showConfirmation = true

        // 5) Refresh account + history
        await Promise.all([
          (async () => {
            const a = await apiGetAccount()
            if (a?.Data) this.data.account = a.Data
          })(),
          (async () => {
            const h = await apiGetHistory()
            if (h?.Data) this.data.history = h.Data
          })(),
        ])

        // Update cache with the fresh data
        cacheSet(CACHE_KEYS.account, this.data.account)
        cacheSet(CACHE_KEYS.history, this.data.history)

        return true
      } catch (err) {
        console.error(err)
        let msg = 'Could not submit registration.'
        // Try to extract server JSON error if available (e.g., validation title)
        try {
          // Some request() implementations include raw JSON in err.message like
          // "HTTP 400: { ...json... }". Try to parse the JSON portion.
          const m = typeof err?.message === 'string' ? err.message : ''
          const start = m.indexOf('{')
          const end = m.lastIndexOf('}')
          if (start !== -1 && end !== -1 && end > start) {
            const jsonText = m.slice(start, end + 1)
            const obj = JSON.parse(jsonText)
            msg = obj?.title || obj?.Error || msg
          }
        } catch (e) {
          console.warn('Failed to parse error message JSON:', e)
          // ignore parse errors, keep default msg
        }
        this.error = msg
        return false
      } finally {
        this.submitting = false
      }
    },
  },
})
