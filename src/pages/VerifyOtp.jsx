import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // detik

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [info, setInfo] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  function handleChange(index, value) {
    const clean = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    text.split('').forEach((ch, i) => (next[i] = ch));
    setDigits(next);
    inputsRef.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    const otp = digits.join('');
    if (otp.length !== OTP_LENGTH) {
      setError(`Kode OTP harus ${OTP_LENGTH} digit.`);
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Verifikasi gagal.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    setResending(true);
    try {
      await resendOtp(email);
      setInfo('Kode OTP baru sudah dikirim ke emailmu.');
      setDigits(Array(OTP_LENGTH).fill(''));
      setCooldown(RESEND_COOLDOWN);
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="form-container">
        <div className="form-title-row">
          <span className="logo-mark" style={{ marginBottom: '0.6rem' }}>RK</span>
          <h2>Verifikasi Email</h2>
          <p>
            Masukkan kode 6 digit yang sudah dikirim ke <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="otp-input-row" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                className="otp-input-box"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
            ))}
          </div>

          {error && <p className="error-text">{error}</p>}
          {info && <p className="hint" style={{ color: 'var(--color-primary-dark)' }}>{info}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: '1.2rem' }}>
            {loading ? 'Memverifikasi...' : 'Verifikasi'}
          </button>
        </form>

        <p className="form-footnote">
          Tidak dapat kode?{' '}
          {cooldown > 0 ? (
            <span className="hint">Kirim ulang dalam {cooldown}s</span>
          ) : (
            <button type="button" className="link-btn" onClick={handleResend} disabled={resending}>
              {resending ? 'Mengirim...' : 'Kirim ulang OTP'}
            </button>
          )}
        </p>
        <p className="form-footnote">
          Salah email? <Link to="/register">Daftar ulang</Link>
        </p>
      </div>
    </div>
  );
}
