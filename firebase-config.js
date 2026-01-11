// Firebase Configuration for Shireen Bakers
// Using Firebase SDK v9 Compat mode for compatibility with auth.js

const firebaseConfig = {
    apiKey: "AIzaSyBmmeIKJgEMkzhqR4heqj4bp-wfbzOpjpU",
    authDomain: "bakery-website-efebd.firebaseapp.com",
    projectId: "bakery-website-efebd",
    storageBucket: "bakery-website-efebd.firebasestorage.app",
    messagingSenderId: "235221776824",
    appId: "1:235221776824:web:5e0102dc71ee75da8c374d",
    measurementId: "G-Q51VD2HSV8"
};

// Initialize Firebase (compat mode)
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = firebase.auth();

// Initialize Firestore (for storing user data)
const db = firebase.firestore();

console.log("Firebase initialized successfully!");
