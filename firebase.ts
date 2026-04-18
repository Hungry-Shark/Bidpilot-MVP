import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// Helper to load config from env or file
const getFirebaseConfig = () => {
  const env = import.meta.env;
  
  // Try to use environment variables first (Production/Vercel)
  if (env.VITE_FIREBASE_API_KEY) {
     return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
      firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID,
    };
  }

  // Fallback: try to import from the JSON file (Local Dev)
  try {
    // This will be stripped in production if the file is ignored
    const config = (import.meta as any).glob('./firebase-applet-config.json', { eager: true, import: 'default' });
    const keys = Object.keys(config);
    if (keys.length > 0) return config[keys[0]];
  } catch (e) {
    console.warn("Firebase config not found in environment or file.");
  }

  return {};
};

const firebaseConfig = getFirebaseConfig();

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// CRITICAL: Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network.");
    }
  }
}
testConnection();
