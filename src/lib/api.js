const BASE = import.meta.env.VITE_API_BASE

export function getToken() {
  try {
    return JSON.parse(localStorage.getItem('auth') || '{}')?.Token || ''
  } catch {
    return ''
  }
}

export function setAuth(authObj) {
  localStorage.setItem('auth', JSON.stringify(authObj || {}))
}

export function clearAuth() {
  localStorage.removeItem('auth')
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  // consider non-2xx as errors
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`)
  }
  return res.json()
}

// Auth
export const apiLogin = (pinno) =>
  request(`/login/user`, { method: 'POST', body: { pinno }, auth: false })

export const apiForgotSendEmail = (email) =>
  request(`/login/sendemail/?email=${encodeURIComponent(email)}`, { auth: false })

export const apiVerifyOtp = (email, otp) =>
  request(`/login/verifyotp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`, {
    auth: false,
  })

// Account
export const apiSaveMyAccount = (payload) =>
  request(`/myaccount/save`, { method: 'POST', body: payload })

// Data
export const apiGetAccount = () => request(`/visitorparking/get`)
export const apiGetHistory = () => request(`/previousparking/getpreviousparking`)
export const apiGetMakes = () => request(`/visitorparking/getmake`)
export const apiGetRules = () => request(`/buildingrules/get`)

export const apiGetPlateWiseData = (plateNo) =>
  request(`/visitorparking/getplatewisedata?plateNo=${encodeURIComponent(plateNo)}`)

export const apiCreateVehicleMake = (VehicleName) =>
  request(`/visitorparking/createvehicle`, { method: 'POST', body: { VehicleName } })

export const apiSaveRegistration = (payload) =>
  request(`/visitorparking/save`, { method: 'POST', body: payload })
