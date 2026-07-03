// Helper untuk ambil data wilayah Indonesia (Provinsi -> Kota/Kabupaten -> Kecamatan)
// dari API publik emsifa (https://www.emsifa.com/api-wilayah-indonesia/).
// Ini di-fetch langsung dari browser pengguna saat form dibuka, jadi butuh koneksi
// internet di sisi client saat aplikasi berjalan (bukan dari server).
const BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

async function fetchJson(url, errorMessage) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(errorMessage);
  return res.json();
}

// -> [{ id, name }]
export function fetchProvinces() {
  return fetchJson(`${BASE}/provinces.json`, 'Gagal memuat daftar provinsi.');
}

// -> [{ id, province_id, name }]
export function fetchRegencies(provinceId) {
  return fetchJson(`${BASE}/regencies/${provinceId}.json`, 'Gagal memuat daftar kota/kabupaten.');
}

// -> [{ id, regency_id, name }]
export function fetchDistricts(regencyId) {
  return fetchJson(`${BASE}/districts/${regencyId}.json`, 'Gagal memuat daftar kecamatan.');
}
