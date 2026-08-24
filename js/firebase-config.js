import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDvdbKutCCijlFegNQZ-xOIfhirUZfSQB4",
    authDomain: "gestion-vehicules-fce81.firebaseapp.com",
    projectId: "gestion-vehicules-fce81",
    storageBucket: "gestion-vehicules-fce81.firebasestorage.app",
    messagingSenderId: "1068231574012",
    appId: "1:1068231574012:web:e94c99f1e869f6fdf5b279",
    measurementId: "G-ZH1NNFLKYW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { 
    app, db, auth, 
    collection, getDocs, addDoc, doc, setDoc, deleteDoc, query, where,
    signInWithEmailAndPassword, onAuthStateChanged, signOut 
};
