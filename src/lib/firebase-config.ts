import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth, PhoneAuthProvider } from 'firebase/auth';
import { getDatabase } from "firebase/database";
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';

// Your Firebase configuration from the Firebase console
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: "https://wedding-planner-4192c-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// Initialize Firebase
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

export const auth = getAuth(firebaseApp);
export const db = getDatabase(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

// Initialize App Check with reCAPTCHA Enterprise
if (typeof window !== 'undefined') {
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!recaptchaSiteKey) {
    console.error('❌ reCAPTCHA Enterprise site key is missing in .env.local');
  } else {
    try {
      // Set up debug token for local development if needed
      if (process.env.NODE_ENV === 'development') {
        (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }

      initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.error('App Check initialization error:', error);
    }
  }
}

export { firebaseApp };