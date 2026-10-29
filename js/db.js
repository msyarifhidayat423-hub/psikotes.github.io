import { db } from "./firebase-config.js";
import {
  collection, addDoc, getDocs, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const KOLEKSI = "hasil";

// data: { kategori, skor, benar, salah, kosong, total, durasiDetik, ... }
export async function simpanHasil(user, data) {
  return addDoc(collection(db, KOLEKSI), {
    ...data,
    uid: user.uid,
    tanggal: serverTimestamp(),
    tanggalMs: Date.now()
  });
}

// Ambil semua hasil milik pengguna, urut dari yang terlama ke terbaru
export async function ambilHasil(uid) {
  const snap = await getDocs(query(collection(db, KOLEKSI), where("uid", "==", uid)));
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  list.sort((a, b) => (a.tanggalMs || 0) - (b.tanggalMs || 0));
  return list;
}