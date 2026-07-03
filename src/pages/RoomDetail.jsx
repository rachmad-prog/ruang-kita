import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRoomById } from '../api/rooms';
import { createBooking } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import { resolveImageUrl } from '../utils/media';

export default function RoomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePhoto, setActivePhoto] = useState(0);

  const [form, setForm] = useState({ start_time: '', end_time: '', notes: '' });
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getRoomById(id);
      setRoom(data);
      setActivePhoto(0);
    } catch (err) {
      setError('Ruang tidak ditemukan atau gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }

  // Galeri: gabungkan image_url utama (cover) + semua foto dari room_images, tanpa duplikat.
  const gallery = useMemo(() => {
    if (!room) return [];
    const urls = [];
    if (room.image_url) urls.push(room.image_url);
    for (const img of room.images || []) {
      if (!urls.includes(img.image_url)) urls.push(img.image_url);
    }
    return urls;
  }, [room]);

  const estimatedDays = useMemo(() => {
    if (!form.start_time || !form.end_time) return 0;
    const diff = (new Date(form.end_time) - new Date(form.start_time)) / (1000 * 60 * 60 * 24);
    return diff > 0 ? Math.round(diff) : 0;
  }, [form.start_time, form.end_time]);

  async function handleBookingSubmit(e) {
    e.preventDefault();
    if (!user) {
      navigate('/login', { state: { from: `/rooms/${id}`, message: 'Masuk dulu untuk melanjutkan booking.' } });
      return;
    }
    setFormError('');
    setMessage('');
    setSubmitting(true);
    try {
      await createBooking({
        room_id: room.id,
        start_time: form.start_time,
        end_time: form.end_time,
        notes: form.notes,
      });
      setMessage(`Booking untuk "${room.name}" berhasil dibuat. Cek status di halaman Booking Saya.`);
      setForm({ start_time: '', end_time: '', notes: '' });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal membuat booking.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="state-container">Memuat detail ruang...</div>;

  if (error || !room) {
    return (
      <div className="container" style={{ paddingTop: '2.4rem' }}>
        <p className="error-text">{error || 'Ruang tidak ditemukan.'}</p>
        <Link to="/" className="btn btn-outline">← Kembali ke daftar ruang</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
      <div className="breadcrumb">
        <Link to="/">Indonesia</Link>
        {room.country && room.country !== 'Indonesia' && <> › <span>{room.country}</span></>}
        {room.location && <> › <span>{room.location}</span></>}
        <> › <span>{room.name}</span></>
      </div>

      {/* ============ GALERI FOTO ============ */}
      {gallery.length > 0 ? (
        <div className="detail-gallery">
          <div className="detail-gallery-main">
            <img src={resolveImageUrl(gallery[activePhoto])} alt={room.name} />
          </div>
          {gallery.length > 1 && (
            <div className="detail-gallery-thumbs">
              {gallery.slice(0, 5).map((url, i) => (
                <button
                  key={url + i}
                  className={`detail-thumb${i === activePhoto ? ' active' : ''}`}
                  onClick={() => setActivePhoto(i)}
                  type="button"
                >
                  <img src={resolveImageUrl(url)} alt={`${room.name} ${i + 1}`} />
                  {i === 4 && gallery.length > 5 && (
                    <span className="detail-thumb-more">+{gallery.length - 5}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="detail-gallery-empty">Belum ada foto untuk ruang ini.</div>
      )}

      <div className="detail-layout">
        {/* ============ INFO UTAMA ============ */}
        <div className="detail-main">
          <span className="room-card-badge detail-badge">{room.category || 'Lainnya'}</span>
          <h1 className="detail-title">{room.name}</h1>
          <p className="detail-location">
            📍 {[room.location, room.country].filter(Boolean).join(', ') || 'Lokasi belum diisi'}
          </p>

          <div className="detail-stats">
            <span>👥 Maks {room.capacity} orang</span>
            {Number(room.rating) > 0 && <span>⭐ {Number(room.rating).toFixed(1)} / 5</span>}
          </div>

          <h3 className="detail-subhead">Deskripsi</h3>
          <p className="detail-desc">{room.description || 'Tidak ada deskripsi tambahan.'}</p>
        </div>

        {/* ============ KARTU BOOKING ============ */}
        <div className="detail-side">
          <div className="detail-booking-card">
            <div className="room-price">
              <span className="amount">Rp {Number(room.price_per_day).toLocaleString('id-ID')}</span>
              <span className="unit"> /hari</span>
            </div>

            <form onSubmit={handleBookingSubmit} className="form">
              <label>Tanggal Check-in</label>
              <input
                type="date"
                required
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />

              <label>Tanggal Check-out</label>
              <input
                type="date"
                required
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />

              <label>Catatan (opsional)</label>
              <textarea
                rows={3}
                placeholder="Contoh: butuh proyektor tambahan"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />

              {estimatedDays > 0 && (
                <div className="modal-summary">
                  <span>Estimasi {estimatedDays} hari</span>
                  <strong>≈ Rp {(estimatedDays * Number(room.price_per_day)).toLocaleString('id-ID')}</strong>
                </div>
              )}

              {formError && <p className="error-text">{formError}</p>}
              {message && <p className="success-text">{message}</p>}

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: '0.8rem' }}>
                {submitting ? 'Memproses...' : user ? 'Pesan Sekarang' : 'Masuk untuk Booking'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
