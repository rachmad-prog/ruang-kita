import React, { useEffect, useState } from 'react';
import { getBookings, cancelBooking, updateBookingStatus } from '../api/bookings';
import { createPayment } from '../api/payments';
import { openSnapPayment } from '../utils/midtrans';
import { useAuth } from '../context/AuthContext';

const statusColor = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  cancelled: 'badge-cancelled',
};

const statusLabel = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  cancelled: 'Dibatalkan',
};

const paymentStatusColor = {
  unpaid: 'badge-cancelled',
  pending: 'badge-pending',
  paid: 'badge-confirmed',
  failed: 'badge-cancelled',
};

const paymentStatusLabel = {
  unpaid: 'Belum Dibayar',
  pending: 'Menunggu Pembayaran',
  paid: 'Lunas',
  failed: 'Gagal',
};

export default function Bookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      setError('Gagal memuat data booking.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!confirm('Batalkan booking ini?')) return;
    try {
      await cancelBooking(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membatalkan booking.');
    }
  }

  async function handlePay(booking) {
    setPayingId(booking.id);
    try {
      const { snap_token } = await createPayment(booking.id);
      const result = await openSnapPayment(snap_token);

      if (result === 'success' || result === 'pending') {
        setTimeout(load, 1500);
      }
      if (result === 'error') {
        alert('Pembayaran gagal diproses. Silakan coba lagi.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membuat transaksi pembayaran.');
    } finally {
      setPayingId(null);
    }
  }

  async function handleConfirm(id) {
    try {
      await updateBookingStatus(id, 'confirmed');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status.');
    }
  }

  function formatDate(str) {
    return new Date(str).toLocaleDateString('id-ID', {
      dateStyle: 'medium',
    });
  }

  if (loading) return <div className="state-container">Memuat booking...</div>;
  if (error) return <div className="container"><p className="error-text">{error}</p></div>;

  return (
    <div className="container" style={{ paddingTop: '2.4rem' }}>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>{user.role === 'admin' ? 'Semua Booking' : 'Booking Saya'}</h2>
          <p className="section-sub">
            {user.role === 'admin' ? 'Pantau seluruh transaksi booking di RuangKita.' : 'Lihat status dan lakukan pembayaran booking-mu.'}
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <h3>Belum ada booking</h3>
          <p>Yuk cari ruang yang cocok dan mulai booking pertamamu.</p>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => (
            <div className="booking-card" key={b.id}>
              <div className="booking-main">
                <h3>{b.room_name}</h3>
                {user.role === 'admin' && <div className="muted">Pemesan: {b.user_name}</div>}
                <div className="booking-meta">
                  <span>🗓️ {formatDate(b.start_time)} → {formatDate(b.end_time)}</span>
                </div>
                <div className="booking-badges" style={{ marginTop: '0.6rem' }}>
                  <span className={`badge ${statusColor[b.status]}`}>{statusLabel[b.status] || b.status}</span>
                  <span className={`badge ${paymentStatusColor[b.payment_status]}`}>
                    {paymentStatusLabel[b.payment_status] || b.payment_status}
                  </span>
                </div>
              </div>

              <div className="booking-price">Rp {Number(b.total_price).toLocaleString('id-ID')}</div>

              <div className="booking-actions">
                {b.status !== 'cancelled' && b.payment_status !== 'paid' && user.role !== 'admin' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handlePay(b)}
                    disabled={payingId === b.id}
                  >
                    {payingId === b.id ? 'Memproses...' : 'Bayar'}
                  </button>
                )}
                {b.status !== 'cancelled' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>
                    Batalkan
                  </button>
                )}
                {user.role === 'admin' && b.status === 'pending' && (
                  <button className="btn btn-outline btn-sm" onClick={() => handleConfirm(b.id)}>
                    Konfirmasi Manual
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
