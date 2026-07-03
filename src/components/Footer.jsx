import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">
            <span className="logo-mark">RK</span>
            <span className="logo-text">RuangKita</span>
          </div>
          <p>
            Platform booking ruang untuk meeting, coworking, hingga acara besar.
            Cek ketersediaan, bandingkan harga per hari, dan pesan dalam hitungan menit.
          </p>
        </div>
        <div>
          <h4>Navigasi</h4>
          <ul>
            <li><Link to="/">Cari Ruang</Link></li>
            <li><Link to="/bookings">Booking Saya</Link></li>
            <li><Link to="/login">Masuk</Link></li>
            <li><Link to="/register">Daftar Akun</Link></li>
          </ul>
        </div>
        <div>
          <h4>Bantuan</h4>
          <ul>
            <li><a href="#faq">Pertanyaan Umum</a></li>
            <li><a href="#kebijakan">Kebijakan Pembatalan</a></li>
            <li><a href="#kontak">Hubungi Kami</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} RuangKita. Semua hak dilindungi.
      </div>
    </footer>
  );
}
