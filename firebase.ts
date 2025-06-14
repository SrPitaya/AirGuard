import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDaS6kC9yBHTdsArMVufxiqITwtNPQWgCY",
  authDomain: "airguard-losfoo.firebaseapp.com",
  projectId: "airguard-losfoo",
  storageBucket: "airguard-losfoo.firebasestorage.app",
  messagingSenderId: "870843375211",
  appId: "1:870843375211:web:7d654f625aa9b59d0e1b2e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
