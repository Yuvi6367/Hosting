import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2x5ivOaSl1JL_Td1prVCXyBMGaid6cI8",
  authDomain: "mazdoor-connect.firebaseapp.com",
  projectId: "mazdoor-connect",
  storageBucket: "mazdoor-connect.firebasestorage.app",
  messagingSenderId: "66822026739",
  appId: "1:66822026739:web:ad6582a98897b4bc0b8e86",
  measurementId: "G-FEK4301ZJB"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, provider, signInWithPopup, db };