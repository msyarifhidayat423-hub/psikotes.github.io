import { wajibLogin } from "./auth.js";
import { simpanHasil } from "./db.js";
import { pasangNavbar, tampilPesan, loading, formatWaktu } from "./ui.js";

const PANJANG_KOLOM = 60; // jumlah angka per kolom
let user, kolom = [], kolomKe = 0, pos = 0, sisaKolom = 0, timer = null,
  jumlahKolom = 0, detikPerKolom = 0;
let statKolom = [], mulaiMs = 0, jalan = false, sudahSelesai = false;
const $ = id => document.getElementById(id);

function buatKolom() {
  return Array.from({ length: PANJANG_KOLOM }, () => Math.floor(Math.random() * 10));
}

function mulai() {
  if (sudahSelesai) return;
  jumlahKolom = parseInt($("jumlahKolom").value, 10);
  detikPerKolom = parseInt($("detikKolom").value, 10);
  kolomKe = 0; statKolom = []; mulaiMs = Date.now(); jalan = true;
  $("setup").classList.add("hidden");
  $("tes").classList.remove("hidden");
  mulaiKolom();
}

function mulaiKolom() {
  kolom = buatKolom(); pos = 0; sisaKolom = detikPerKolom;
  statKolom[kolomKe] = { dijawab: 0, benar: 0 };
  gambar();
  clearInterval(timer);
  $("timer").textContent = formatWaktu(sisaKolom);
  timer = setInterval(() => {
    sisaKolom--;
    $("timer").textContent = formatWaktu(Math.max(sisaKolom, 0));
    if (sisaKolom <= 0) lanjutKolom();
  }, 1000);
}

function lanjutKolom() {
  clearInterval(timer);
  timer = null;
  kolomKe++;
  if (kolomKe >= jumlahKolom) { selesai(); return; }
  mulaiKolom();
}

function gambar() {
  $("infoKolom").textContent = `Kolom ${kolomKe + 1} dari ${jumlahKolom}`;
  // tampilkan jendela 7 angka di sekitar posisi aktif
  const awal = Math.max(0, Math.min(pos - 1, PANJANG_KOLOM - 7));
  let html = "";
  for (let i = awal; i < Math.min(awal + 7, PANJANG_KOLOM); i++) {
    const aktif = (i === pos || i === pos + 1) ? "aktif" : "";
    html += `<div class="${aktif}">${kolom[i]}</div>`;
  }
  $("kolomAngka").innerHTML = html;
}

function jawab(angka) {
  if (!jalan || sudahSelesai) return;
  if (pos >= PANJANG_KOLOM - 1) return; // sudah mentok
  const benar = (kolom[pos] + kolom[pos + 1]) % 10;
  const st = statKolom[kolomKe];
  st.dijawab++;
  if (angka === benar) st.benar++;
  pos++;
  if (pos >= PANJANG_KOLOM - 1) {
    lanjutKolom();
    return;
  }
  gambar();
}

async function selesai() {
  if (sudahSelesai) return;
  sudahSelesai = true;
  jalan = false;
  clearInterval(timer);
  const dijawab = statKolom.reduce((a, k) => a + k.dijawab, 0);
  const benar = statKolom.reduce((a, k) => a + k.benar, 0);
  const salah = dijawab - benar;
  const hasil = {
    kategori: "kraepelin", total: dijawab, benar, salah, kosong: 0,
    skor: dijawab ? Math.round(benar / dijawab * 100) : 0,
    kolom: statKolom.map(k => k.dijawab),
    durasiDetik: Math.round((Date.now() - mulaiMs) / 1000)
  };
  loading(true, "Menyimpan hasil...");
  let tersimpan = true;
  try { await simpanHasil(user, hasil); } catch (e) { tersimpan = false; console.error(e); }
  loading(false);
  sessionStorage.setItem("hasilTerakhir", JSON.stringify({ ...hasil, review: [], tersimpan, tanggalMs: Date.now() }));
  location.href = "hasil.html";
}

async function init() {
  user = await wajibLogin();
  pasangNavbar("kraepelin.html", user);
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