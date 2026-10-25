// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA8UdspC9gw7JjJKng3oEkKOa7m8DbYbaQ",
  authDomain: "pitex-ebe93.firebaseapp.com",
  projectId: "pitex-ebe93",
  storageBucket: "pitex-ebe93.firebasestorage.app",
  messagingSenderId: "974919265108",
  appId: "1:974919265108:web:a51cfd66290a4f4daf76c1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
