// Isi nilai firebaseConfig dari: Konsol Firebase > Project settings > Your apps > Web app (</>)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIkTWegTr7E-TjQxeo5_JCzJ95fqqP-OY",
  authDomain: "latihansikotes.firebaseapp.com",
  projectId: "latihansikotes",
  storageBucket: "latihansikotes.firebasestorage.app",
  messagingSenderId: "502782533581",
  appId: "1:502782533581:web:f96d2850de1ea78742ee84",
  measurementId: "G-KN8YGR6ZX4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

