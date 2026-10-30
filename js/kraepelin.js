import { wajibLogin } from "./auth.js";
import { simpanHasil } from "./db.js";
import { pasangNavbar, tampilPesan, loading, formatWaktu } from "./ui.js";

const PANJANG_KOLOM = 60;

// State runtime
let user, kolom = [], kolomKe = 0, pos = 0, sisaKolom = 0, timer = null;
let statKolom = [], mulaiMs = 0, jalan = false, sudahSelesai = false;

// Konfigurasi sesi — DIBEKUKAN saat mulai() agar tidak berubah di tengah tes
let config = null; // { jumlahKolom, detikPerKolom, angkaMin, angkaMax }

const $ = id => document.getElementById(id);

/**
 * Angka acak inklusif dalam [min, max].
 * Guard: jika min/max bukan number valid, fallback ke 0..9.
 */
function angkaAcak(min, max) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 9; }
  if (min > max) { const t = min; min = max; max = t; } // safety swap
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buatKolom(min, max) {
  return Array.from({ length: PANJANG_KOLOM }, () => angkaAcak(min, max));
}

/**
 * Baca & validasi rentang dari input.
 * Mengembalikan { min, max } atau null jika tidak valid.
 */
function bacaRentang() {
  const rawMin = $("angkaMin").value.trim();
  const rawMax = $("angkaMax").value.trim();
  const min = parseInt(rawMin, 10);
  const max = parseInt(rawMax, 10);

  if (rawMin === "" || rawMax === "" || Number.isNaN(min) || Number.isNaN(max)) {
    return { error: "Rentang angka tidak boleh kosong dan harus berupa angka." };
  }
  if (min < 0 || min > 9 || max < 0 || max > 9) {
    return { error: "Rentang angka harus di antara 0 dan 9." };
  }
  if (min > max) {
    return { error: "Angka minimum tidak boleh lebih besar dari angka maksimum." };
  }
  return { min, max };
}

function mulai() {
  // Reset flag agar bisa mulai sesi baru setelah sesi sebelumnya selesai
  if (jalan) return; // sudah ada sesi berjalan, cegah double-click

  const rentang = bacaRentang();
  if (rentang.error) {
    tampilPesan($("pesan"), rentang.error, "error");
    return;
  }

  const jumlahKolom = parseInt($("jumlahKolom").value, 10);
  const detikPerKolom = parseInt($("detikKolom").value, 10);

  // BEKUKAN konfigurasi — nilai ini TIDAK akan berubah selama sesi berjalan,
  // meskipun user mengubah input di tengah tes (input sudah disembunyikan).
  config = Object.freeze({
    jumlahKolom,
    detikPerKolom,
    angkaMin: rentang.min,
    angkaMax: rentang.max
  });

  // Reset state
  kolomKe = 0;
  statKolom = [];
  mulaiMs = Date.now();
  jalan = true;
  sudahSelesai = false;

  $("pesan").classList.add("hidden");
  $("setup").classList.add("hidden");
  $("tes").classList.remove("hidden");

  mulaiKolom();
}

function mulaiKolom() {
  // Gunakan config yang sudah dibekukan, BUKAN variabel global yang bisa berubah
  kolom = buatKolom(config.angkaMin, config.angkaMax);
  pos = 0;
  sisaKolom = config.detikPerKolom;

  statKolom[kolomKe] = { dijawab: 0, benar: 0, salah: 0 };
  gambar();

  clearInterval(timer);
  $("timer").textContent = formatWaktu(sisaKolom);
  $("timer").classList.remove("habis");

  timer = setInterval(() => {
    sisaKolom--;
    $("timer").textContent = formatWaktu(Math.max(sisaKolom, 0));
    if (sisaKolom <= 5) $("timer").classList.add("habis");
    if (sisaKolom <= 0) lanjutKolom();
  }, 1000);
}

function lanjutKolom() {
  clearInterval(timer);
  timer = null;
  kolomKe++;
  if (kolomKe >= config.jumlahKolom) { selesai(); return; }
  mulaiKolom(); // akan memakai config yang sama
}

function gambar() {
  $("infoKolom").textContent = `Kolom ${kolomKe + 1} dari ${config.jumlahKolom}`;
  const awal = Math.max(0, Math.min(pos - 1, PANJANG_KOLOM - 7));
  let html = "";
  for (let i = awal; i < Math.min(awal + 7, PANJANG_KOLOM); i++) {
    const aktif = (i === pos || i === pos + 1) ? "aktif" : "";
    html += `<div class="${aktif}">${kolom[i]}</div>`;
  }
  $("kolomAngka").innerHTML = html;
}

function jawab(angka) {
  if (!jalan || sudahSelesai || !config) return;
  if (pos >= PANJANG_KOLOM - 1) return;

  const benar = (kolom[pos] + kolom[pos + 1]) % 10;
  const st = statKolom[kolomKe];
  st.dijawab++;
  if (angka === benar) st.benar++;
  else st.salah++;

  pos++;
  if (pos >= PANJANG_KOLOM - 1) { lanjutKolom(); return; }
  gambar();
}

async function selesai() {
  if (sudahSelesai || !config) return;
  sudahSelesai = true;
  jalan = false;
  clearInterval(timer);

  const dijawab = statKolom.reduce((a, k) => a + k.dijawab, 0);
  const benar = statKolom.reduce((a, k) => a + k.benar, 0);
  const salah = dijawab - benar;

  const kolomDijawab = statKolom.map(k => k.dijawab);
  const kolomBenar   = statKolom.map(k => k.benar);
  const kolomSalah   = statKolom.map(k => k.salah);

  const hasil = {
    kategori: "kraepelin",
    total: dijawab, benar, salah, kosong: 0,
    skor: dijawab ? Math.round(benar / dijawab * 100) : 0,
    kolom: kolomDijawab,
    kolomBenar,
    kolomSalah,
    jumlahKolom: config.jumlahKolom,
    durasiDetik: Math.round((Date.now() - mulaiMs) / 1000),
    rentangAngka: { min: config.angkaMin, max: config.angkaMax }
  };

  loading(true, "Menyimpan hasil...");
  let tersimpan = true;
  try { await simpanHasil(user, hasil); }
  catch (e) { tersimpan = false; console.error(e); }
  loading(false);

  sessionStorage.setItem("hasilTerakhir", JSON.stringify({
    ...hasil, review: [], tersimpan, tanggalMs: Date.now()
  }));
  location.href = "hasil.html";
}

async function init() {
  user = await wajibLogin();
  pasangNavbar("kraepelin.html", user);

  // Preview rentang real-time
  const updateInfo = () => {
    const el = $("infoRentang");
    const rentang = bacaRentang();
    if (rentang.error) {
      el.textContent = rentang.error;
      el.style.color = "#dc2626";
    } else {
      const list = [];
      for (let i = rentang.min; i <= rentang.max; i++) list.push(i);
      el.textContent = `Angka yang akan muncul: ${list.join(", ")}`;
      el.style.color = "";
    }
  };
  $("angkaMin").addEventListener("input", updateInfo);
  $("angkaMax").addEventListener("input", updateInfo);
  updateInfo();

  $("btnMulai").addEventListener("click", mulai);

  document.querySelectorAll("#pad button").forEach(b =>
    b.addEventListener("click", () => jawab(parseInt(b.dataset.n, 10))));

  document.addEventListener("keydown", e => {
    if (/^[0-9]$/.test(e.key) && !$("tes").classList.contains("hidden")) {
      jawab(parseInt(e.key, 10));
    }
  });

  $("btnBerhenti").addEventListener("click", () => {
    if (confirm("Hentikan tes dan simpan hasil sementara?")) selesai();
  });
}
init();
