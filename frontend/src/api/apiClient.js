import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
});

export const loginUser = (email, password) => apiClient.post("/auth/login", { email, password });
export const registerUser = (data) => apiClient.post("/auth/register", data);
export const getCoaches = () => apiClient.get("/coaches");
export const getCoachById = (id) => apiClient.get(`/coaches/${id}`);
export const createBooking = (data) => apiClient.post("/bookings", data);
export const getUserBookings = () => apiClient.get("/bookings/client");
export const makePayment = (bookingId) => apiClient.post("/payments/create-payment-intent", { bookingId });
