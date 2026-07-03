import api from './axios';

export const createPayment = (booking_id) =>
  api.post('/payments', { booking_id }).then((r) => r.data);

export const getPaymentByBooking = (bookingId) =>
  api.get(`/payments/booking/${bookingId}`).then((r) => r.data);
