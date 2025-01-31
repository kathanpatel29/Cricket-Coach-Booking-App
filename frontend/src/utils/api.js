import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auth
export const register = (userData) => api.post("/auth/register", userData)
export const login = (credentials) => api.post("/auth/login", credentials)
export const getMe = () => api.get("/auth/me")

// Coaches
export const getAllCoaches = () => api.get("/coaches")
export const getCoachById = (id) => api.get(`/coaches/${id}`)
export const createCoachProfile = (profileData) => api.post("/coaches", profileData)
export const updateCoachProfile = (profileData) => api.put("/coaches", profileData)
export const approveCoach = (id) => api.patch(`/coaches/${id}/approve`)
export const rejectCoach = (id) => api.patch(`/coaches/${id}/reject`)

// Bookings
export const createBooking = (bookingData) => api.post("/bookings", bookingData)
export const getClientBookings = () => api.get("/bookings/client")
export const getCoachBookings = () => api.get("/bookings/coach")
export const updateBookingStatus = (id, status) => api.put(`/bookings/${id}`, { status })

// Reviews
export const createReview = (reviewData) => api.post("/reviews", reviewData)
export const getCoachReviews = (coachId) => api.get(`/reviews/${coachId}`)

// Payments
export const createPaymentIntent = (bookingId) => api.post("/payments/create-payment-intent", { bookingId })
export const confirmPayment = (bookingId) => api.post("/payments/confirm-payment", { bookingId })

// Admin
export const getAdminStats = () => api.get("/auth/admin/stats")
export const getPendingCoaches = () => api.get("/auth/admin/pending-coaches")
export const getRecentReviews = () => api.get("/auth/admin/recent-reviews")

export default api

