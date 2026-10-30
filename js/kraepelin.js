import { wajibLogin } from "./auth.js";
import { simpanHasil } from "./db.js";
import { pasangNavbar, tampilPesan, loading, formatWaktu } from "./ui.js";

const PANJANG_KOLOM = 60;
let user, kolom = [], kolomKe = 0, pos = 0, sisaKolom = 0, timer = null,
    jumlahKolom = 0, detikPerKolom = 0;
let statKolom = [], mulaiMs = 0, jalan = false, sudahSelesai = false;

// State rentang angka
let angkaMin = 0, angkaMax = 9;

const $ = id => document.getElementById(id);

function angkaAcak() {
  return Math.floor(Math.random() * (angkaMax - angkaMin + 1)) + angkaMin;
}

function buatKolom() {
  return Array.from({ length: PANJANG_KOLOM }, () => angkaAcak());
}

function validasiRentang() {
  const min = parseInt($("angkaMin").value, 10);
  const max = parseInt($("angkaMax").value, 10);
  if (Number.isNaN(min) || Number.isNaN(max)) return "Rentang angka harus berupa angka.";
  if (min < 0 || min > 9 || max < 0 || max > 9) return "Rentang angka harus di antara 0 dan 9.";
  if (min > max) return "Angka minimum tidak boleh lebih besar dari angka maksimum.";
  return null;
}

function mulai() {
  if (sudahSelesai) return;
  const err = validasiRentang();
  if (err) { tampilPesan($("pesan"), err, "error"); return; }

  angkaMin = parseInt($("angkaMin").value, 10);
  angkaMax = parseInt($("angkaMax").value, 10);
  jumlahKolom = parseInt($("jumlahKolom").value, 10);
  detikPerKolom = parseInt($("detikKolom").value, 10);

  kolomKe = 0; statKolom = []; mulaiMs = Date.now(); jalan = true;
  $("pesan").classList.add("hidden");
  $("setup").classList.add("hidden");
  $("tes").classList.remove("hidden");
  mulaiKolom();
}

function mulaiKolom() {
  kolom = buatKolom();
  pos = 0;
  sisaKolom = detikPerKolom;
  // Simpan dijawab, benar, dan salah per kolom
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
  if (kolomKe >= jumlahKolom) { selesai(); return; }
  mulaiKolom();
}

function gambar() {
  $("infoKolom").textContent = `Kolom ${kolomKe + 1} dari ${jumlahKolom}`;
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
  if (sudahSelesai) return;
  sudahSelesai = true;
  jalan = false;
  clearInterval(timer);

  const dijawab = statKolom.reduce((a, k) => a + k.dijawab, 0);
  const benar = statKolom.reduce((a, k) => a + k.benar, 0);
  const salah = dijawab - benar;

  // Data per kolom untuk chart di hasil.html
  const kolomDijawab = statKolom.map(k => k.dijawab);
  const kolomBenar   = statKolom.map(k => k.benar);
  const kolomSalah   = statKolom.map(k => k.salah);

  const hasil = {
    kategori: "kraepelin",
    total: dijawab, benar, salah, kosong: 0,
    skor: dijawab ? Math.round(benar / dijawab * 100) : 0,
    kolom: kolomDijawab,        // kompatibilitas data lama
    kolomBenar,
    kolomSalah,
    jumlahKolom,
    durasiDetik: Math.round((Date.now() - mulaiMs) / 1000),
    rentangAngka: { min: angkaMin, max: angkaMax }
  };

  loading(true, "Menyimpan hasil...");
  let tersimpan = true;
  try { await simpanHasil(user, hasil); } catch (e) { tersimpan = false; console.error(e); }
  loading(false);

  sessionStorage.setItem("hasilTerakhir", JSON.stringify({
    ...hasil, review: [], tersimpan, tanggalMs: Date.now()
  }));
  location.href = "hasil.html";
}

async function init() {
  user = await wajibLogin();
  pasangNavbar("kraepelin.html", user);

  const updateInfo = () => {
    const min = parseInt($("angkaMin").value, 10);
    const max = parseInt($("angkaMax").value, 10);
    const el = $("infoRentang");
    if (Number.isNaN(min) || Number.isNaN(max) || min > max || min < 0 || max > 9) {
      el.textContent = "Rentang tidak valid. Pastikan 0 ≤ min ≤ max ≤ 9.";
      el.style.color = "#dc2626";
    } else {
      const list = [];
      for (let i = min; i <= max; i++) list.push(i);
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
