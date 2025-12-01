import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZMKIwktvlZLdHacAHCGVtwUodwBj7NJY",
  authDomain: "prompt-dump.firebaseapp.com",
  projectId: "prompt-dump",
  storageBucket: "prompt-dump.firebasestorage.app",
  messagingSenderId: "802819973596",
  appId: "1:802819973596:web:521a3ae0d7ab3faf5eef19",
  measurementId: "G-NVWK4W0969"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
