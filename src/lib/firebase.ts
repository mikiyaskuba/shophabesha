// src/lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB41KLbO6APFHxHA8tR9FbYEXF49a25nwI",
  authDomain: "shophabesha-pro.firebaseapp.com",
  projectId: "shophabesha-pro",
  storageBucket: "shophabesha-pro.firebasestorage.app",
  messagingSenderId: "949043874544",
  appId: "1:949043874544:web:e48663eb9971a74031d035"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the instances we need everywhere
export const db = getFirestore(app);     // For saving sales, customers, credits
export const auth = getAuth(app);        // For anonymous login (already working!)