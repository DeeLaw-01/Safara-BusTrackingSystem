import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Only redirect if the user had a token (authenticated session expired)
      // Don't redirect for login/register auth failures
      const isAuthRoute = error.config?.url?.startsWith('/auth/')
      if (!isAuthRoute) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authApi = {
  // Registration (2-step, invitation-gated)
  sendRegisterOtp: (data: {
    email: string
    name: string
    password: string
    phone?: string
    inviteToken: string
  }) => api.post('/auth/send-register-otp', data),
  resendRegisterOtp: (email: string) =>
    api.post('/auth/resend-register-otp', { email }),
  verifyRegisterOtp: (data: { email: string; otp: string }) =>
    api.post('/auth/verify-register-otp', data),
  // Login
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  // Forgot / reset password
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  // Invitation validation (public)
  validateInvitation: (token: string) =>
    api.get(`/auth/invitations/${token}`),
  // Me
  getMe: () => api.get('/auth/me')
}

// User API
export const userApi = {
  updateProfile: (data: { name?: string; phone?: string }) =>
    api.patch('/users/profile', data),
  setHomeStop: (stopId: string) => api.patch('/users/home-stop', { stopId }),
  updateFcmToken: (fcmToken: string) =>
    api.patch('/users/fcm-token', { fcmToken })
}

// Routes API
export const routesApi = {
  getAll: (active?: boolean) => api.get('/routes', { params: { active } }),
  getById: (id: string) => api.get(`/routes/${id}`),
  getStops: (id: string) => api.get(`/routes/${id}/stops`),
  getActiveBuses: (id: string) => api.get(`/routes/${id}/buses`),
  create: (data: { name: string; description?: string }) =>
    api.post('/routes', data),
  update: (
    id: string,
    data: { name?: string; description?: string; isActive?: boolean }
  ) => api.patch(`/routes/${id}`, data),
  delete: (id: string) => api.delete(`/routes/${id}`)
}

// Stops API
export const stopsApi = {
  getAll: (routeId?: string) => api.get('/stops', { params: { routeId } }),
  getById: (id: string) => api.get(`/stops/${id}`),
  create: (data: {
    name: string
    latitude: number
    longitude: number
    sequence: number
    routeId: string
  }) => api.post('/stops', data),
  update: (
    id: string,
    data: {
      name?: string
      latitude?: number
      longitude?: number
      sequence?: number
    }
  ) => api.patch(`/stops/${id}`, data),
  delete: (id: string) => api.delete(`/stops/${id}`),
  reorder: (stops: { id: string; sequence: number }[]) =>
    api.post('/stops/reorder', { stops })
}

// Buses API
export const busesApi = {
  getAll: (params?: { routeId?: string; active?: boolean }) =>
    api.get('/buses', { params }),
  getById: (id: string) => api.get(`/buses/${id}`),
  getLocation: (id: string) => api.get(`/buses/${id}/location`),
  create: (data: {
    plateNumber: string
    name: string
    capacity: number
    routeId?: string
    driverId?: string
  }) => api.post('/buses', data),
  update: (
    id: string,
    data: {
      plateNumber?: string
      name?: string
      capacity?: number
      isActive?: boolean
    }
  ) => api.patch(`/buses/${id}`, data),
  delete: (id: string) => api.delete(`/buses/${id}`),
  assignDriver: (id: string, driverId: string | null) =>
    api.patch(`/buses/${id}/driver`, { driverId }),
  assignRoute: (id: string, routeId: string | null) =>
    api.patch(`/buses/${id}/route`, { routeId })
}

// Trips API
export const tripsApi = {
  getMyTrips: (params?: { status?: string; limit?: number; page?: number }) =>
    api.get('/trips/my-trips', { params }),
  getCurrent: () => api.get('/trips/current'),
  getMyBus: () => api.get('/trips/my-bus'),
  getById: (id: string) => api.get(`/trips/${id}`),
  getLocations: (id: string) => api.get(`/trips/${id}/locations`),
  getAll: (params?: {
    status?: string
    routeId?: string
    limit?: number
    page?: number
  }) => api.get('/trips', { params })
}

// Reminders API
export const remindersApi = {
  getMyReminders: () => api.get('/reminders'),
  create: (data: {
    stopId: string
    routeId: string
    minutesBefore?: number
    notificationType?: string
  }) => api.post('/reminders', data),
  update: (
    id: string,
    data: {
      minutesBefore?: number
      notificationType?: string
      isActive?: boolean
    }
  ) => api.patch(`/reminders/${id}`, data),
  toggle: (id: string) => api.patch(`/reminders/${id}/toggle`),
  delete: (id: string) => api.delete(`/reminders/${id}`)
}

// Admin API
export const adminApi = {
  getUsers: (params?: {
    role?: string
    approved?: boolean
    search?: string
    limit?: number
    page?: number
  }) => api.get('/admin/users', { params }),
  getPendingDrivers: () => api.get('/admin/drivers/pending'),
  approveDriver: (id: string) => api.patch(`/admin/users/${id}/approve`),
  rejectDriver: (id: string) => api.delete(`/admin/users/${id}/reject`),
  changeUserRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  // Invitations
  createInvitation: (email: string) => api.post('/admin/invitations', { email }),
  createBatchInvitations: (emails: string[]) =>
    api.post('/admin/invitations/batch', { emails }),
  listInvitations: (params?: {
    status?: string
    limit?: number
    page?: number
  }) => api.get('/admin/invitations', { params }),
  revokeInvitation: (id: string) => api.delete(`/admin/invitations/${id}`),
  resendInvitation: (id: string) => api.post(`/admin/invitations/${id}/resend`),
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getRecentTrips: (limit?: number) =>
    api.get('/admin/trips/recent', { params: { limit } }),
  getLiveBuses: () => api.get('/admin/buses/live')
}
