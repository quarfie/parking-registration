// src/stores/parking.js
import { defineStore } from 'pinia'
import {
  apiLogin,
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

    // sample data for now (will be replaced by API later)
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
    logout() {
      this.auth = null
      clearAuth()
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
      // fetch account, history, makes, rules in parallel
      this.loading = true
      this.error = ''
      try {
        const [acct, hist, makes, rules] = await Promise.all([
          apiGetAccount(),
          apiGetHistory(),
          apiGetMakes(),
          apiGetRules(),
        ])
        if (acct?.Data) this.data.account = acct.Data
        if (hist?.Data) this.data.history = hist.Data
        if (makes?.Data) this.data.makes = makes.Data
        if (rules?.Data) this.data.rules = rules.Data.Rules
        this.hasLoaded = true
      } catch (e) {
        this.error = 'Failed to load data.'
        console.error(e)
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

        const end = new Date(start.getTime() + reg.days * 24 * 60 * 60 * 1000)

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
          ProvinceId: null, // as per your spec (if API expects a number, we can adjust)
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

        return true
      } catch (err) {
        console.error(err)
        this.error = 'Could not submit registration.'
        return false
      } finally {
        this.submitting = false
      }
    },
  },
})
