import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnolv5fR5IuriMhMibLu8AIWqLk43nJnw",
  authDomain: "ajsm-vms.firebaseapp.com",
  projectId: "ajsm-vms",
  storageBucket: "ajsm-vms.firebasestorage.app",
  messagingSenderId: "1085957630720",
  appId: "1:1085957630720:web:80a6c0c66c842c69a5a1e5",
  measurementId: "G-TP5LM1GP44"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
