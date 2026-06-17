// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdY6V4D_xXhI1tpSSLNv93cFWpMddQ94U",
  authDomain: "on-eagles-wings-1c8f5.firebaseapp.com",
  projectId: "on-eagles-wings-1c8f5",
  storageBucket: "on-eagles-wings-1c8f5.firebasestorage.app",
  messagingSenderId: "858585282489",
  appId: "1:858585282489:web:b7849b092456f445956868"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);