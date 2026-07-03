import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { checkEmail } from '../api/auth';

const DEBOUNCE_MS = 600;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Status pengecekan email real-time: 'idle' | 'checking' | 'valid' | 'invalid' | 'registered'
  const [emailStatus, setEmailStatus] = useState('idle');
  const [emailMessage, setEmailMessage] = useState('');
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const email = form.email.trim();
    clearTimeout(debounceRef.current);

    const basicFormatOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!email || !basicFormatOk) {
      setEmailStatus('idle');
      setEmailMessage('');
      return;
    }

    setEmailStatus('checking');
    setEmailMessage('Mengecek email...');

    debounceRef.current = setTimeout(async () => {
      const myRequestId = ++requestIdRef.current;
      try {
        const data = await checkEmail(email);
        if (myRequestId !== requestIdRef.current) return; // hasil sudah usang, abaikan

        if (!data.valid) {
          const reasonText = {
            format: 'Format email tidak valid.',
            disposable: 'Email sementara/sekali-pakai tidak diperbolehkan.',
            no_mx: 'Domain email ini sepertinya tidak valid atau tidak bisa menerima email.',
          };
          setEmailStatus('invalid');
          setEmailMessage(reasonText[data.reason] || 'Email tidak valid.');
        } else if (data.alreadyRegistered) {
          setEmailStatus('registered');
          setEmailMessage('Email ini sudah terdaftar. Coba masuk / login.');
        } else {
          setEmailStatus('valid');
          setEmailMessage('Email valid.');
        }
      } catch (err) {
        if (myRequestId !== requestIdRef.current) return;
        // Kalau pengecekan gagal (server sibuk/jaringan), jangan blokir user —
        // biarkan tetap bisa submit, validasi final tetap dilakukan lagi di backend saat register.
        setEmailStatus('idle');
        setEmailMessage('');
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [form.email]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (emailStatus === 'invalid') {
      setError(emailMessage || 'Email tidak valid.');
      return;
    }
    if (emailStatus === 'registered') {
      setError('Email ini sudah terdaftar. Silakan masuk.');
      return;
    }

    setLoading(true);
    try {
      const data = await register(form.name, form.email, form.password);
      // Akun belum aktif sampai kode OTP yang dikirim ke email diverifikasi.
      navigate('/verify-otp', { state: { email: data.email, message: data.message } });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mendaftar.');
    } finally {
      setLoading(false);
    }
  }

  const emailStatusClass =
    emailStatus === 'valid' ? 'success-text' : emailStatus === 'checking' ? 'hint' : 'error-text';

  return (
    <div className="auth-shell">
      <div className="form-container">
        <div className="form-title-row">
          <span className="logo-mark" style={{ marginBottom: '0.6rem' }}>RK</span>
          <h2>Buat Akun RuangKita</h2>
          <p>Daftar sekali, booking ruang kapan saja.</p>
        </div>

        <div className="google-btn-center">
          <GoogleAuthButton
            text="signup_with"
            onSuccess={() => navigate('/')}
            onError={(msg) => setError(msg)}
          />
        </div>

        <div className="divider-with-text"><span>atau daftar manual</span></div>

        <form onSubmit={handleSubmit} className="form">
          <label>Nama</label>
          <input
            required
            placeholder="Nama lengkap"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label>Email</label>
          <input
            type="email"
            required
            placeholder="nama@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {emailMessage && <p className={emailStatusClass} style={{ marginTop: '0.2rem' }}>{emailMessage}</p>}

          <label>Password</label>
          <input
            type="password"
            required
            minLength={6}
            placeholder="Minimal 6 karakter"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error && <p className="error-text">{error}</p>}

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={loading || emailStatus === 'checking'}
            style={{ marginTop: '1.2rem' }}
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        <p className="form-footnote">
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
