// Backend menyimpan image_url sebagai path relatif, mis: "/uploads/rooms/xxx.jpg"
// Tapi ada juga kemungkinan admin memasukkan URL absolut (https://...) secara manual.
// Fungsi ini menggabungkan path relatif dengan origin server backend (bukan /api).
const API_URL =
  import.meta.env.VITE_API_URL || "https://backend-ruang-kita.vercel.app/api";
const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function resolveImageUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${SERVER_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}
