import { wajibLogin } from "./auth.js";
import { simpanHasil } from "./db.js";
import { pasangNavbar, tampilPesan, loading, esc, formatWaktu, NAMA_KATEGORI } from "./ui.js";

const FILE = {
  verbal: "data/verbal.json", numerik: "data/numerik.json",
  figural: "data/figural.json", logika: "data/logika.json"
};

let user, soal = [], idx = 0, jawab = [], sisa = 0, timer = null,
  kategori = "", mulaiMs = 0, selesai = false;
const $ = id => document.getElementById(id);

function acak(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function mulai() {
  kategori = $("pilihKategori").value;
  const jumlah = parseInt($("jumlahSoal").value, 10);
  const menit = parseInt($("menitTimer").value, 10);
  try {
    loading(true, "Memuat soal...");
    const res = await fetch(FILE[kategori]);
    if (!res.ok) throw new Error("File soal tidak ditemukan");
    const bank = await res.json();
    soal = acak(bank).slice(0, jumlah);
  } catch (e) {
    loading(false);
    tampilPesan($("pesan"), "Gagal memuat soal: " + e.message, "error");
    return;
  }
  loading(false);
  if (!soal.length) {
    tampilPesan($("pesan"), "Bank soal kosong.", "error");
    return;
  }
  idx = 0; selesai = false; jawab = new Array(soal.length).fill(null);
  sisa = menit * 60; mulaiMs = Date.now();
  $("setup").classList.add("hidden");
  $("kuis").classList.remove("hidden");
  $("pesan").classList.add("hidden");
  tampilSoal();
  clearInterval(timer);
  $("timer").textContent = formatWaktu(sisa);
  timer = setInterval(() => {
    sisa--;
    $("timer").textContent = formatWaktu(Math.max(sisa, 0));
    if (sisa <= 30) $("timer").classList.add("habis");
    if (sisa <= 0) selesaiKuis(true);
  }, 1000);
}

function tampilSoal() {
  const s = soal[idx];
  $("nomor").textContent = `Soal ${idx + 1} dari ${soal.length}`;
  $("progress").style.width = ((idx + 1) / soal.length * 100) + "%";
  $("teksSoal").textContent = s.soal;
  const g = $("gambarSoal");
  if (s.gambar) { g.src = s.gambar; g.classList.remove("hidden"); }
  else { g.classList.add("hidden"); g.removeAttribute("src"); }
  $("pilihan").innerHTML = s.pilihan.map((p, i) =>
    `<button class="opsi ${jawab[idx] === i ? "dipilih" : ""}" data-i="${i}">${String.fromCharCode(65 + i)}. ${esc(p)}</button>`
  ).join("");
  $("btnPrev").disabled = idx === 0;
  $("btnNext").classList.toggle("hidden", idx === soal.length - 1);
}

function pilih(i) {
  jawab[idx] = i;
  tampilSoal();
}

async function selesaiKuis(habisWaktu = false) {
  if (selesai) return;
  const kosong = jawab.filter(j => j === null).length;
  if (!habisWaktu && kosong > 0 && !confirm(`Masih ada ${kosong} soal belum dijawab. Selesaikan sekarang?`)) return;
  selesai = true;
  clearInterval(timer);

  let benar = 0, salah = 0;
  const review = soal.map((s, i) => {
    const ok = jawab[i] === s.jawaban;
    if (jawab[i] === null) { /* kosong */ }
    else if (ok) benar++; else salah++;
    return {
      soal: s.soal, gambar: s.gambar || null, pilihan: s.pilihan,
      jawabanBenar: s.jawaban, jawabanUser: jawab[i], pembahasan: s.pembahasan || ""
    };
  });
  const total = soal.length;
  const hasil = {
    kategori, total, benar, salah, kosong: total - benar - salah,
    skor: Math.round(benar / total * 100),
    durasiDetik: Math.round((Date.now() - mulaiMs) / 1000)
  };

  loading(true, "Menyimpan hasil...");
  let tersimpan = true;
  try { await simpanHasil(user, hasil); } catch (e) { tersimpan = false; console.error(e); }
  loading(false);
  sessionStorage.setItem("hasilTerakhir", JSON.stringify({ ...hasil, review, tersimpan, tanggalMs: Date.now() }));
  location.href = "hasil.html";
}

async function init() {
  user = await wajibLogin();
  pasangNavbar("latihan.html", user);
  $("pilihKategori").innerHTML = Object.keys(FILE).map(k =>
    `<option value="${k}">${NAMA_KATEGORI[k]}</option>`).join("");
  const q = new URLSearchParams(location.search).get("kategori");
  if (q && FILE[q]) $("pilihKategori").value = q;

  $("btnMulai").addEventListener("click", mulai);
  $("pilihan").addEventListener("click", e => {
    const b = e.target.closest(".opsi");
    if (b) pilih(parseInt(b.dataset.i, 10));
  });
  $("btnPrev").addEventListener("click", () => { if (idx > 0) { idx--; tampilSoal(); } });
  $("btnNext").addEventListener("click", () => { if (idx < soal.length - 1) { idx++; tampilSoal(); } });
  $("btnSelesai").addEventListener("click", () => selesaiKuis(false));
  window.addEventListener("beforeunload", e => {
    if ($("kuis") && !$("kuis").classList.contains("hidden") && !selesai) {
      e.preventDefault(); e.returnValue = "";
    }
  });
}
init();