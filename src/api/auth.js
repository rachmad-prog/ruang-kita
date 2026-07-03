import api from './axios';

export const checkEmail = (email) => api.post('/auth/check-email', { email }).then((r) => r.data);
export const registerUser = (data) => api.post('/auth/register', data).then((r) => r.data);
export const verifyOtp = (data) => api.post('/auth/verify-otp', data).then((r) => r.data);
export const resendOtp = (data) => api.post('/auth/resend-otp', data).then((r) => r.data);
export const googleLogin = (credential) => api.post('/auth/google', { credential }).then((r) => r.data);
export const loginUser = (data) => api.post('/auth/login', data).then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data);
