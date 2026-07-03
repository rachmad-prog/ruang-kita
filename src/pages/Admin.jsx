import React, { useEffect, useRef, useState } from "react";
import {
  getRooms,
  createRoom,
  updateRoom,
  uploadRoomImages,
  deleteRoomImage,
} from "../api/rooms";
import { resolveImageUrl } from "../utils/media";
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
} from "../utils/wilayah";

const emptyForm = {
  name: "",
  description: "",
  capacity: "",
  price_per_day: "",
  category: "Meeting Room",
  location: "",
  country: "Indonesia",
  rating: "",
};
const CATEGORIES = [
  "Meeting Room",
  "Aula Konferensi",
  "Coworking Desk",
  "Lainnya",
];

export default function Admin() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Foto: untuk ruang baru, file di-"staging" dulu (belum diupload) sampai ruang disimpan.
  // Untuk ruang yang sedang diedit, file langsung diupload ke server seperti biasa.
  const [stagedFiles, setStagedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef(null);

  // Data wilayah Indonesia (Provinsi -> Kota/Kabupaten -> Kecamatan), diambil dari API publik.
  const [provinces, setProvinces] = useState([]);
  const [regencies, setRegencies] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedRegencyId, setSelectedRegencyId] = useState("");
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [wilayahLoading, setWilayahLoading] = useState({
    province: false,
    regency: false,
    district: false,
  });
  const [wilayahError, setWilayahError] = useState("");

  useEffect(() => {
    load();
    loadProvinces();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getRooms({ includeInactive: true });
      setRooms(data);
    } catch (err) {
      setError("Gagal memuat rooms.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProvinces() {
    setWilayahLoading((s) => ({ ...s, province: true }));
    setWilayahError("");
    try {
      const data = await fetchProvinces();
      setProvinces(data);
    } catch (err) {
      setWilayahError(
        "Gagal memuat data provinsi. Cek koneksi internet lalu coba lagi.",
      );
    } finally {
      setWilayahLoading((s) => ({ ...s, province: false }));
    }
  }

  async function handleProvinceChange(provinceId) {
    setSelectedProvinceId(provinceId);
    setSelectedRegencyId("");
    setSelectedDistrictId("");
    setRegencies([]);
    setDistricts([]);
    if (!provinceId) return;
    setWilayahLoading((s) => ({ ...s, regency: true }));
    setWilayahError("");
    try {
      const data = await fetchRegencies(provinceId);
      setRegencies(data);
    } catch (err) {
      setWilayahError(
        "Gagal memuat data kota/kabupaten. Cek koneksi internet lalu coba lagi.",
      );
    } finally {
      setWilayahLoading((s) => ({ ...s, regency: false }));
    }
  }

  async function handleRegencyChange(regencyId) {
    setSelectedRegencyId(regencyId);
    setSelectedDistrictId("");
    setDistricts([]);
    if (!regencyId) return;
    setWilayahLoading((s) => ({ ...s, district: true }));
    setWilayahError("");
    try {
      const data = await fetchDistricts(regencyId);
      setDistricts(data);
    } catch (err) {
      setWilayahError(
        "Gagal memuat data kecamatan. Cek koneksi internet lalu coba lagi.",
      );
    } finally {
      setWilayahLoading((s) => ({ ...s, district: false }));
    }
  }

  function handleDistrictChange(districtId) {
    setSelectedDistrictId(districtId);
    const province = provinces.find(
      (p) => String(p.id) === String(selectedProvinceId),
    );
    const regency = regencies.find(
      (r) => String(r.id) === String(selectedRegencyId),
    );
    const district = districts.find((d) => String(d.id) === String(districtId));
    if (province && regency && district) {
      setForm((f) => ({
        ...f,
        location: `${district.name}, ${regency.name}, ${province.name}`,
      }));
    }
  }

  function resetWilayahSelection() {
    setSelectedProvinceId("");
    setSelectedRegencyId("");
    setSelectedDistrictId("");
    setRegencies([]);
    setDistricts([]);
  }

  function startEdit(room) {
    setEditingId(room.id);
    setForm({
      name: room.name,
      description: room.description || "",
      capacity: room.capacity,
      price_per_day: room.price_per_day,
      category: room.category || "Meeting Room",
      location: room.location || "",
      country: room.country || "Indonesia",
      rating: room.rating || "",
    });
    resetWilayahSelection();
    clearStagedFiles();
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setPhotoError("");
    resetWilayahSelection();
    clearStagedFiles();
  }

  function clearStagedFiles() {
    stagedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setStagedFiles([]);
  }

  async function handleSubmit(e) {
  e.preventDefault();
  setError("");
  setMessage("");
  setSaving(true);
  try {
    const payload = {
      ...form,
      capacity: Number(form.capacity),
      price_per_day: Number(form.price_per_day),
      rating: form.rating === "" ? 0 : Number(form.rating),
    };

    if (editingId) {
      // 1. Update data text room
      await updateRoom(editingId, payload);[cite: 1]

      // 2. Jika ada foto baru di-stage, upload sekarang
      if (stagedFiles.length > 0) {
        await uploadRoomImages(editingId, stagedFiles.map((f) => f.file));
      }
      setMessage("Ruang dan foto berhasil diperbarui.");
    } else {
      // Logika untuk tambah ruangan baru (tetap sama)
      const newRoom = await createRoom(payload);[cite: 1]
      if (stagedFiles.length > 0) {
        await uploadRoomImages(newRoom.id, stagedFiles.map((f) => f.file));[cite: 1]
      }
      setMessage("Ruang berhasil ditambahkan.");[cite: 1]
    }
    resetForm();[cite: 1]
    load();[cite: 1]
  } catch (err) {
    setError(err.response?.data?.message || "Gagal menyimpan ruang.");[cite: 1]
  } finally {
    setSaving(false);[cite: 1]
  }
}

  async function handleToggleActive(room) {
    try {
      await updateRoom(room.id, { is_active: !room.is_active });
      load();
    } catch (err) {
      alert("Gagal mengubah status ruang.");
    }
  }

  // Kalau sedang edit ruang yang sudah ada -> langsung upload ke server.
  // Kalau sedang bikin ruang baru -> simpan dulu sebagai staged file (preview lokal),
  // baru benar-benar diupload saat form disubmit.
  function handleFilesSelected(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Satukan logika: kumpulkan semua file ke staging terlebih dahulu
    const newStaged = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setStagedFiles((prev) => [...prev, ...newStaged]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadToRoom(roomId, files) {
    setUploading(true);
    setPhotoError("");
    try {
      await uploadRoomImages(roomId, files);
      await load();
    } catch (err) {
      setPhotoError(err.response?.data?.message || "Gagal mengupload foto.");
    } finally {
      setUploading(false);
    }
  }

  function removeStagedFile(index) {
    setStagedFiles((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return copy;
    });
  }

  async function handleDeletePhoto(roomId, imageId) {
    if (!confirm("Hapus foto ini?")) return;
    try {
      await deleteRoomImage(roomId, imageId);
      await load();
    } catch (err) {
      alert("Gagal menghapus foto.");
    }
  }

  if (loading) return <div className="state-container">Memuat...</div>;

  const editingRoom = rooms.find((r) => r.id === editingId);

  return (
    <div className="container" style={{ paddingTop: "2.4rem" }}>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <h2>Kelola Ruang</h2>
          <p className="section-sub">
            Tambah, ubah, atau nonaktifkan ruang yang tersedia untuk dibooking.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form form-inline">
        <div className="form-row">
          <input
            placeholder="Nama ruang"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Kapasitas (orang)"
            type="number"
            required
            min={1}
            value={form.capacity}
            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
          />
          <input
            placeholder="Harga / hari (Rp)"
            type="number"
            required
            min={0}
            value={form.price_per_day}
            onChange={(e) =>
              setForm({ ...form, price_per_day: e.target.value })
            }
          />
        </div>

        {/* ============ FOTO RUANG (upload langsung, bisa beberapa sekaligus) ============ */}
        <div className="photo-panel photo-panel-inline">
          <p className="hint" style={{ marginTop: 0 }}>
            Foto ruang — pilih beberapa foto sekaligus. Foto pertama otomatis
            jadi cover.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={uploading}
            onChange={handleFilesSelected}
          />
          {uploading && (
            <p className="hint" style={{ marginTop: "0.5rem" }}>
              Mengupload...
            </p>
          )}
          {photoError && <p className="error-text">{photoError}</p>}

          <div className="photo-grid">
            {editingId ? (
              (editingRoom?.images || []).length === 0 ? (
                <p className="muted">Belum ada foto untuk ruang ini.</p>
              ) : (
                editingRoom.images.map((img) => (
                  <div className="photo-thumb" key={img.id}>
                    <img
                      src={resolveImageUrl(img.image_url)}
                      alt={editingRoom.name}
                    />
                    <button
                      type="button"
                      className="photo-thumb-remove"
                      onClick={() => handleDeletePhoto(editingId, img.id)}
                      title="Hapus foto">
                      ✕
                    </button>
                  </div>
                ))
              )
            ) : stagedFiles.length === 0 ? (
              <p className="muted">
                Belum ada foto dipilih. Foto akan diupload saat ruang disimpan.
              </p>
            ) : (
              stagedFiles.map((sf, i) => (
                <div className="photo-thumb" key={sf.previewUrl}>
                  <img src={sf.previewUrl} alt={`Foto baru ${i + 1}`} />
                  <button
                    type="button"
                    className="photo-thumb-remove"
                    onClick={() => removeStagedFile(i)}
                    title="Batal pakai foto ini">
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="form-row">
          <select
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            placeholder="Negara (mis: Indonesia)"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <input
            placeholder="Rating (0 - 5)"
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
          />
        </div>

        {/* ============ LOKASI: Provinsi -> Kota/Kabupaten -> Kecamatan ============ */}
        <div className="photo-panel photo-panel-inline">
          <p className="hint" style={{ marginTop: 0 }}>
            Lokasi ruang — pilih Provinsi, Kota/Kabupaten, lalu Kecamatan.
            {form.location && (
              <>
                {" "}
                Lokasi saat ini: <strong>{form.location}</strong>
              </>
            )}
          </p>
          <div className="form-row">
            <select
              value={selectedProvinceId}
              onChange={(e) => handleProvinceChange(e.target.value)}
              disabled={wilayahLoading.province}>
              <option value="">
                {wilayahLoading.province
                  ? "Memuat provinsi..."
                  : "Pilih Provinsi"}
              </option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={selectedRegencyId}
              onChange={(e) => handleRegencyChange(e.target.value)}
              disabled={!selectedProvinceId || wilayahLoading.regency}>
              <option value="">
                {wilayahLoading.regency
                  ? "Memuat kota/kabupaten..."
                  : "Pilih Kota/Kabupaten"}
              </option>
              {regencies.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              value={selectedDistrictId}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!selectedRegencyId || wilayahLoading.district}>
              <option value="">
                {wilayahLoading.district
                  ? "Memuat kecamatan..."
                  : "Pilih Kecamatan"}
              </option>
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          {wilayahError && <p className="error-text">{wilayahError}</p>}
        </div>

        <textarea
          placeholder="Deskripsi ruang"
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {error && <p className="error-text">{error}</p>}
        {message && <p className="success-text">{message}</p>}

        <div className="form-row" style={{ marginTop: "0.5rem" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? "Menyimpan..."
              : editingId
                ? "Simpan Perubahan"
                : "+ Tambah Ruang"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={resetForm}>
              Batal Edit
            </button>
          )}
        </div>
      </form>

      <div className="table-wrap" style={{ marginTop: "2rem" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Kategori</th>
              <th>Lokasi</th>
              <th>Negara</th>
              <th>Kapasitas</th>
              <th>Harga/hari</th>
              <th>Rating</th>
              <th>Foto</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id}>
                <td>{room.name}</td>
                <td>{room.category || "-"}</td>
                <td>{room.location || "-"}</td>
                <td>{room.country || "-"}</td>
                <td>{room.capacity}</td>
                <td>Rp {Number(room.price_per_day).toLocaleString("id-ID")}</td>
                <td>
                  {Number(room.rating) > 0
                    ? `⭐ ${Number(room.rating).toFixed(1)}`
                    : "-"}
                </td>
                <td>{(room.images || []).length} foto</td>
                <td>
                  <span
                    className={`badge ${room.is_active ? "badge-confirmed" : "badge-cancelled"}`}>
                    {room.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => startEdit(room)}>
                    Edit
                  </button>
                  <label
                    className="toggle-active"
                    title={
                      room.is_active ? "Nonaktifkan ruang" : "Aktifkan ruang"
                    }>
                    <input
                      type="checkbox"
                      checked={!!room.is_active}
                      onChange={() => handleToggleActive(room)}
                    />
                    Aktif
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
