// Loader untuk Snap.js Midtrans. Script dimuat dinamis (bukan hardcode di index.html)
// supaya sandbox/production URL & client key bisa diatur lewat .env.

let snapScriptPromise = null;

function getSnapUrl() {
  const isProduction = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true';
  return isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
}

export function loadSnapScript() {
  if (window.snap) return Promise.resolve(window.snap);
  if (snapScriptPromise) return snapScriptPromise;

  snapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = getSnapUrl();
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
    script.onload = () => resolve(window.snap);
    script.onerror = () => reject(new Error('Gagal memuat Snap.js Midtrans.'));
    document.body.appendChild(script);
  });

  return snapScriptPromise;
}

// Membuka popup pembayaran Snap. Mengembalikan Promise yang resolve
// dengan hasil akhir interaksi user: 'success' | 'pending' | 'error' | 'closed'
export async function openSnapPayment(snapToken) {
  const snap = await loadSnapScript();

  return new Promise((resolve) => {
    snap.pay(snapToken, {
      onSuccess: () => resolve('success'),
      onPending: () => resolve('pending'),
      onError: () => resolve('error'),
      onClose: () => resolve('closed'),
    });
  });
}
