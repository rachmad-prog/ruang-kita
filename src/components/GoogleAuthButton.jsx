import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Tombol "Lanjutkan dengan Google" pakai Google Identity Services (GSI).
// Alurnya: Google merender tombol resminya sendiri di dalam div ini -> user klik ->
// Google mengembalikan ID token (credential) yang sudah membuktikan email itu valid & milik user ->
// token itu dikirim ke backend (/api/auth/google) untuk diverifikasi & login/daftar otomatis.
export default function GoogleAuthButton({ onSuccess, onError, text = 'continue_with' }) {
  const { loginWithGoogle } = useAuth();
  const divRef = useRef(null);
  const renderedRef = useRef(false); // cegah render dobel (React StrictMode di dev me-render efek 2x)

  // Simpan callback/props terbaru di ref, TANPA bikin effect utama di bawah ikut re-run
  // setiap kali props ini berubah identitasnya (mis. gara-gara parent re-render saat user mengetik).
  const latestRef = useRef({ loginWithGoogle, onSuccess, onError, text });
  useEffect(() => {
    latestRef.current = { loginWithGoogle, onSuccess, onError, text };
  }, [loginWithGoogle, onSuccess, onError, text]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer = null;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID belum diset di .env frontend.');
      return;
    }

    function renderButton() {
      if (cancelled || renderedRef.current || !divRef.current) return;
      if (!window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            const { loginWithGoogle: login, onSuccess: succ, onError: err } = latestRef.current;
            try {
              const user = await login(response.credential);
              succ?.(user);
            } catch (e) {
              err?.(e.response?.data?.message || 'Gagal masuk dengan Google.');
            }
          },
        });

        divRef.current.innerHTML = '';

        window.google.accounts.id.renderButton(divRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: latestRef.current.text,
          shape: 'pill',
          width: 320,
        });

        renderedRef.current = true;
      } catch (err) {
        console.error('Gagal merender tombol Google:', err);
        latestRef.current.onError?.('Tombol Google gagal dimuat. Coba refresh halaman.');
      }
    }

    if (window.google?.accounts?.id) {
      renderButton();
    } else {
      pollTimer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(pollTimer);
          renderButton();
        }
      }, 200);
    }

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
    // Sengaja cuma jalan sekali saat mount — supaya proses "tunggu script Google siap"
    // nggak kepotong tiap kali form di atasnya re-render (mis. saat user mengetik).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={divRef} className="google-btn-wrap" />;
}
