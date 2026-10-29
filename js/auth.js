import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export async function daftar(nama, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (nama) await updateProfile(cred.user, { displayName: nama });
  return cred.user;
}

export function masuk(email, password) {
  return signInWithEmailAndPassword(auth, email, password).then(c => c.user);
}

export function keluar() {
  return signOut(auth).then(() => { location.href = "login.html"; });
}

export function cekUser() {
  return new Promise(resolve => {
    const off = onAuthStateChanged(auth, u => { off(); resolve(u); });
  });
}

export async function wajibLogin() {
  const user = await cekUser();
  if (!user) {
    location.href = "login.html";
    throw new Error("Belum login");
  }
  return user;
}

export function pesanError(e) {
  const m = {
    "auth/invalid-email": "Format email tidak valid.",
    "auth/user-not-found": "Akun tidak ditemukan.",
    "auth/wrong-password": "Password salah.",
    "auth/invalid-credential": "Email atau password salah.",
    "auth/email-already-in-use": "Email sudah terdaftar.",
    "auth/weak-password": "Password minimal 6 karakter.",
    "auth/network-request-failed": "Tidak ada koneksi internet."
  };
  return m[e.code] || ("Terjadi kesalahan: " + (e.message || e));
}