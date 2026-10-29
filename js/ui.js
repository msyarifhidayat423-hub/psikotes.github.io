import { keluar } from "./auth.js";

export const NAMA_KATEGORI = {
  verbal: "Verbal", numerik: "Numerik", figural: "Figural",
  logika: "Logika", kraepelin: "Kraepelin"
};

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function pasangNavbar(aktif, user) {
  const menu = [
    ["index.html", "Beranda"], ["latihan.html", "Latihan"],
    ["kraepelin.html", "Kraepelin"], ["statistik.html", "Statistik"]
  ];
  const nav = document.createElement("nav");
  nav.className = "navbar";
  nav.innerHTML = `<span class="brand">Latihan Sikotes</span>` +
    menu.map(([h, t]) => `<a href="${h}" class="${h === aktif ? "aktif" : ""}">${t}</a>`).join("") +
    (user ? `<button id="btnKeluar">Keluar</button>` : "");
  document.body.prepend(nav);
  const b = document.getElementById("btnKeluar");
  if (b) b.addEventListener("click", keluar);
}

export function tampilPesan(el, teks, jenis = "info") {
  el.className = "pesan " + jenis;
  el.textContent = teks;
  el.classList.remove("hidden");
}

export function sembunyiPesan(el) { el.classList.add("hidden"); }

export function loading(tampil, teks = "Memuat...") {
  let el = document.getElementById("loadingBox");
  if (!el) {
    el = document.createElement("div");
    el.id = "loadingBox";
    el.style.cssText = "position:fixed;inset:0;background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;font-weight:600;z-index:99";
    document.body.appendChild(el);
  }
  el.textContent = teks;
  el.style.display = tampil ? "flex" : "none";
}

export function formatWaktu(detik) {
  const m = Math.floor(detik / 60), s = detik % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

export function formatTanggal(ms) {
  return new Date(ms).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}