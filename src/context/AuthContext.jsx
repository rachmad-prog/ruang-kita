import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe, verifyOtp as verifyOtpApi, resendOtp as resendOtpApi, googleLogin } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then(({ user }) => {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { user, token } = await loginUser({ email, password });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  }

  async function register(name, email, password) {
    // Daftar manual: akun belum aktif sampai kode OTP diverifikasi, jadi belum login di sini.
    const data = await registerUser({ name, email, password });
    return data; // { message, email, needsVerification }
  }

  async function verifyOtp(email, otp) {
    const { user, token } = await verifyOtpApi({ email, otp });
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  }

  async function resendOtp(email) {
    return resendOtpApi({ email });
  }

  async function loginWithGoogle(credential) {
    const { user, token } = await googleLogin(credential);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, resendOtp, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
