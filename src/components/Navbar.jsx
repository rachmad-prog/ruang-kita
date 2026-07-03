import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/img/ruang-kita.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function initials(name = "") {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src={logo} alt="RuangKita" className="logo-img" />
          <span className="logo-text">RuangKita</span>
        </Link>

        <nav className="navbar-links">
          {/* <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            Cari Ruang
          </NavLink> */}
          {user && (
            <>
              <NavLink
                to="/bookings"
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }>
                Booking Saya
              </NavLink>
              {user.role === "admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `nav-link${isActive ? " active" : ""}`
                  }>
                  Kelola Ruang
                </NavLink>
              )}
            </>
          )}
        </nav>

        <div className="navbar-auth">
          {user ? (
            <>
              <div className="navbar-user">
                <span className="avatar">{initials(user.name) || "U"}</span>
                <span>Hai, {user.name?.split(" ")[0]}</span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Masuk
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
