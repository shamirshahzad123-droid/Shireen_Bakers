// Firebase Configuration for Shireen Bakers
// Using Firebase SDK v9 Compat mode for compatibility with auth.js

const firebaseConfig = {
    apiKey: "AIzaSyBmmeIKJgEMkzhqR4heqj4bp-wfbzOpjpU",
    authDomain: "shireen-bakers.com", // <-- Corrected
    databaseURL: "https://bakery-website-efebd.firebaseio.com", // <-- Added (verify actual value from console)
    projectId: "bakery-website-efebd",
    storageBucket: "bakery-website-efebd.firebasestorage.app",
    messagingSenderId: "235221776824",
    appId: "1:235221776824:web:5e0102dc71ee75da8c374d",
    measurementId: "G-Q51VD2HSV8" // <-- Verify this is correct for your GA4 property
};

// Initialize Firebase (compat mode)
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = firebase.auth();

// Initialize Firestore with Persistence enabled
const db = firebase.firestore();
db.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn("Firestore Persistence: Multiple tabs open. Local caching might be limited.");
        } else if (err.code == 'unimplemented') {
            console.warn("Firestore Persistence: Browser doesn't support offline features.");
        }
    });

console.log("Firebase initialized successfully!");
