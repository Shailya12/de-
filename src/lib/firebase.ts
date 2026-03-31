'use client'
// Firebase initialization
//
// SETUP INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com and create a new project
// 2. Enable Authentication → Sign-in method → Email/Password
// 3. Create a Firestore Database (start in production mode)
// 4. Create a Storage bucket (start in production mode)
// 5. Go to Project Settings → Your apps → Add a Web app
// 6. Copy the firebaseConfig values into .env.local (see .env.local.example)
// 7. In Firestore → Rules, paste the security rules from firestore.rules
// 8. In Storage → Rules, paste the rules from storage.rules

import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
