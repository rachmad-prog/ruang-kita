import api from './axios';

export const getBookings = () => api.get('/bookings').then((r) => r.data.bookings);
export const getBookingById = (id) => api.get(`/bookings/${id}`).then((r) => r.data.booking);
export const createBooking = (data) => api.post('/bookings', data).then((r) => r.data.booking);
export const updateBookingStatus = (id, status) =>
  api.put(`/bookings/${id}/status`, { status }).then((r) => r.data.booking);
export const cancelBooking = (id) => api.delete(`/bookings/${id}`).then((r) => r.data);
