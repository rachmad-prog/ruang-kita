import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRooms } from '../api/rooms';
import { resolveImageUrl } from '../utils/media';

// Warna gradien kartu dirotasi berdasarkan index, supaya tiap ruang
// punya identitas visual meski belum ada foto asli.
const CARD_GRADIENTS = [
  'linear-gradient(135deg,#E63946,#B3212D)',
  'linear-gradient(135deg,#2B2D42,#1B1B1F)',
  'linear-gradient(135deg,#457B9D,#1D3557)',
  'linear-gradient(135deg,#E9967A,#C1121F)',
];

// Kategori & lokasi sekarang datang langsung dari data backend (field
// `category` dan `location`). Fallback dipasang untuk data lama yang mungkin kosong.
function getCategory(room) {
  return room.category || 'Lainnya';
}

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [guests, setGuests] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    setLoading(true);
    setError('');
    try {
      const data = await getRooms();
      setRooms(data);
    } catch (err) {
      setError('Gagal memuat daftar ruang. Coba muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const set = new Set(rooms.map(getCategory));
    return ['Semua', ...Array.from(set)];
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesCategory = activeCategory === 'Semua' || getCategory(room) === activeCategory;
      const matchesQuery =
        !query ||
        room.name.toLowerCase().includes(query.toLowerCase()) ||
        (room.location || '').toLowerCase().includes(query.toLowerCase()) ||
        (room.country || '').toLowerCase().includes(query.toLowerCase()) ||
        (room.description || '').toLowerCase().includes(query.toLowerCase());
      const matchesGuests = !guests || room.capacity >= Number(guests);
      return matchesCategory && matchesQuery && matchesGuests;
    });
  }, [rooms, activeCategory, query, guests]);

  return (
    <div>
      {/* ============ HERO + SEARCH ============ */}
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">✦ Booking ruang tanpa ribet</span>
          <h1>Ruang nyaman, harga bersahabat untuk setiap kebutuhan.</h1>
          <p>
            Dari meeting kecil sampai aula konferensi — cek ketersediaan, bandingkan harga
            per hari, dan pesan dalam hitungan menit.
          </p>

          <div className="search-card">
            <div className="search-field">
              <label>🔎 Cari ruang / kota</label>
              <input
                type="text"
                placeholder="Nama ruang, fasilitas, atau kota"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="search-field">
              <label>👥 Jumlah orang</label>
              <input
                type="number"
                min={1}
                placeholder="Berapa orang?"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              />
            </div>
            <div className="search-field">
              <label>🏷️ Kategori</label>
              <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="search-field">
              <label>&nbsp;</label>
              <div className="muted" style={{ paddingTop: '0.5rem' }}>
                {filteredRooms.length} ruang tersedia
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => document.getElementById('room-grid')?.scrollIntoView({ behavior: 'smooth' })}>
              Cari Ruang
            </button>
          </div>
        </div>
      </section>

      <div className="container">
        {/* ============ FILTER CHIPS ============ */}
        <div className="chip-row">
          {categories.map((c) => (
            <button
              key={c}
              className={`chip${activeCategory === c ? ' active' : ''}`}
              onClick={() => setActiveCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="section-head" id="room-grid">
          <div>
            <h2>Ruang tersedia untukmu</h2>
            <p className="section-sub">Pilih ruang untuk lihat detail &amp; booking.</p>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        {loading ? (
          <div className="state-container">Memuat ruang...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="empty-state">
            <h3>Belum ada ruang yang cocok</h3>
            <p>Coba ubah kata kunci, kategori, atau jumlah orang.</p>
          </div>
        ) : (
          <div className="grid">
            {filteredRooms.map((room, i) => (
              <div className="room-card" key={room.id}>
                <Link to={`/rooms/${room.id}`} className="room-card-media-link">
                  <div
                    className="room-card-media"
                    style={{ background: room.image_url ? undefined : CARD_GRADIENTS[i % CARD_GRADIENTS.length] }}
                  >
                    {room.image_url ? (
                      <img src={resolveImageUrl(room.image_url)} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      room.name.slice(0, 2).toUpperCase()
                    )}
                    <span className="room-card-badge">{getCategory(room)}</span>
                  </div>
                </Link>
                <div className="room-card-body">
                  <h3>
                    <Link to={`/rooms/${room.id}`} className="room-card-title-link">
                      {room.name}
                    </Link>
                  </h3>
                  <div className="room-card-tag">
                    {(room.location || room.country) && (
                      <span>📍 {[room.location, room.country].filter(Boolean).join(', ')}</span>
                    )}
                    {(room.location || room.country) && <span>·</span>}
                    <span>👥 Maks {room.capacity} orang</span>
                    {Number(room.rating) > 0 && (
                      <>
                        <span>·</span>
                        <span className="room-rating">⭐ {Number(room.rating).toFixed(1)}</span>
                      </>
                    )}
                  </div>
                  <p className="room-card-desc">{room.description || 'Tidak ada deskripsi tambahan.'}</p>
                  <div className="room-card-footer">
                    <div className="room-price">
                      <span className="amount">Rp {Number(room.price_per_day).toLocaleString('id-ID')}</span>
                      <span className="unit"> /hari</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
