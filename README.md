# Latihan Sikotes

Web latihan soal sikotes (verbal, numerik, figural, logika, Kraepelin) dengan penyimpanan hasil di Firebase dan grafik perkembangan nilai.

## Struktur singkat
- `index.html` beranda, `login.html` masuk/daftar, `latihan.html` kuis, `kraepelin.html` tes Kraepelin/Pauli, `hasil.html` hasil sesi, `statistik.html` chart.
- `js/` logika aplikasi, `data/` bank soal JSON, `assets/img/figural/` gambar soal figural.

## Menjalankan di komputer
Halaman memakai ES module, jadi **tidak bisa dibuka langsung dengan klik dua kali** (file://). Jalankan server lokal:

```
cd sikotes-latihan
python -m http.server 8000
```
Lalu buka http://localhost:8000

## Menyiapkan Firebase
1. Buka https://console.firebase.google.com, buat project baru.
2. **Authentication** > Sign-in method > aktifkan **Email/Password**.
3. **Firestore Database** > Create database (mode production).
4. Tab **Rules**: salin isi `firestore.rules`, lalu Publish.
5. **Project settings** > Your apps > ikon web `</>` > daftarkan aplikasi, salin `firebaseConfig`.
6. Tempel nilainya ke `js/firebase-config.js`.
7. Authentication > Settings > **Authorized domains**: tambahkan `localhost` dan `USERNAME.github.io`.

Data disimpan di koleksi `hasil` dengan field: `uid, kategori, skor, benar, salah, kosong, total, durasiDetik, tanggal, tanggalMs`.

## Deploy ke GitHub Pages
1. Buat repository baru di GitHub, upload seluruh isi folder ini.
2. Settings > Pages > Source: branch `main`, folder `/ (root)`.
3. Tunggu beberapa menit, situs tersedia di `https://USERNAME.github.io/NAMA-REPO/`.

Catatan: `apiKey` Firebase untuk web memang tampil di sisi klien. Keamanan data dijaga oleh `firestore.rules`, bukan dengan menyembunyikan key.

## Menambah soal
Edit file di `data/`. Format satu soal:

```json
{ "id": "v10", "subkategori": "sinonim", "soal": "...", "pilihan": ["A","B","C","D"], "jawaban": 0, "pembahasan": "..." }
```
`jawaban` adalah indeks pilihan yang benar (0 = A). Untuk soal figural tambahkan `"gambar": "assets/img/figural/nama.svg"`.
