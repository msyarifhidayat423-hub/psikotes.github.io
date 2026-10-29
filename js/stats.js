import { wajibLogin } from "./auth.js";
import { ambilHasil } from "./db.js";
import { pasangNavbar, tampilPesan, loading, esc, formatTanggal, NAMA_KATEGORI } from "./ui.js";

let semua = [], chartRata = null, chartRiwayat = null;
const $ = id => document.getElementById(id);

function gambarChart(data) {
  // Chart 1: rata-rata skor per kategori (balok)
  const kats = Object.keys(NAMA_KATEGORI);
  const rata = kats.map(k => {
    const d = semua.filter(x => x.kategori === k);
    return d.length ? Math.round(d.reduce((a, b) => a + b.skor, 0) / d.length) : 0;
  });
  if (chartRata) chartRata.destroy();
  chartRata = new Chart($("chartRata"), {
    type: "bar",
    data: { labels: kats.map(k => NAMA_KATEGORI[k]), datasets: [{ label: "Rata-rata skor", data: rata, backgroundColor: "#1d4ed8" }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }
  });

  // Chart 2: perkembangan skor per sesi (balok)
  const last = data.slice(-15);
  if (chartRiwayat) chartRiwayat.destroy();
  chartRiwayat = new Chart($("chartRiwayat"), {
    type: "bar",
    data: {
      labels: last.map((d, i) => `${i + 1}. ${formatTanggal(d.tanggalMs)}`),
      datasets: [{ label: "Skor sesi", data: last.map(d => d.skor), backgroundColor: "#60a5fa" }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }
  });
}

function isiTabel(data) {
  const baris = data.slice().reverse().slice(0, 20).map(d => `
    <tr><td>${formatTanggal(d.tanggalMs)}</td><td>${esc(NAMA_KATEGORI[d.kategori] || d.kategori)}</td>
    <td>${d.benar}/${d.total}</td><td><b>${d.skor}</b></td></tr>`).join("");
  $("isiTabel").innerHTML = baris || `<tr><td colspan="4" class="kecil">Belum ada data.</td></tr>`;
}

function tampilkan() {
  const f = $("filter").value;
  const data = f === "semua" ? semua : semua.filter(x => x.kategori === f);
  $("jumlahSesi").textContent = data.length;
  $("rataSkor").textContent = data.length ? Math.round(data.reduce((a, b) => a + b.skor, 0) / data.length) : "-";
  $("skorTertinggi").textContent = data.length ? Math.max(...data.map(d => d.skor)) : "-";
  gambarChart(data);
  isiTabel(data);
}

async function init() {
  const user = await wajibLogin();
  pasangNavbar("statistik.html", user);
  $("filter").innerHTML = `<option value="semua">Semua kategori</option>` +
    Object.keys(NAMA_KATEGORI).map(k => `<option value="${k}">${NAMA_KATEGORI[k]}</option>`).join("");
  $("filter").addEventListener("change", tampilkan);
  try {
    loading(true);
    semua = await ambilHasil(user.uid);
  } catch (e) {
    tampilPesan($("pesan"), "Gagal mengambil data: " + e.message, "error");
  }
  loading(false);
  tampilkan();
}
init();