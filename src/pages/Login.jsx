import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo);
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        navigate('/verify-otp', { state: { email: data.email, message: data.message } });
        return;
      }
      setError(data?.message || "Gagal login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="form-container">
        <div className="form-title-row">
          <span className="logo-mark" style={{ marginBottom: '0.6rem' }}>RK</span>
          <h2>Masuk ke RuangKita</h2>
          <p>Kelola booking ruangmu dalam satu tempat.</p>
        </div>
        {location.state?.message && (
          <p className="hint" style={{ marginBottom: '0.8rem' }}>{location.state.message}</p>
        )}

        <div className="google-btn-center">
          <GoogleAuthButton
            text="signin_with"
            onSuccess={() => navigate(redirectTo)}
            onError={(msg) => setError(msg)}
          />
        </div>

        <div className="divider-with-text"><span>atau masuk manual</span></div>

        <form onSubmit={handleSubmit} className="form">
          <label>Email</label>
          <input
            type="email"
            required
            placeholder="nama@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label>Password</label>
          <input
            type="password"
            required
            placeholder="Masukkan password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: '1.2rem' }}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <p className="form-footnote">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}
