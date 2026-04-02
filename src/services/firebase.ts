import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Netlify Functions endpoints
const NETLIFY_FUNCTIONS_URL = "/.netlify/functions";

export const googleProvider = new GoogleAuthProvider();

// Request Google Drive scope to access user's documents
googleProvider.addScope("https://www.googleapis.com/auth/drive.readonly");
googleProvider.addScope("https://www.googleapis.com/auth/documents.readonly");
googleProvider.addScope("https://www.googleapis.com/auth/drive.file");

// Force consent screen to get access token
googleProvider.setCustomParameters({
  prompt: "consent",
  access_type: "offline",
});

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    return { user: result.user, token };
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const getIdToken = async (user: User): Promise<string> => {
  return await user.getIdToken();
};

/**
 * Exchange authorization code for refresh token via Netlify Function
 */
export const exchangeCodeForRefreshToken = async (code: string): Promise<string | null> => {
  try {
    const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/exchange-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error("Failed to exchange code");
    }

    const data = await response.json();
    return data.refreshToken;
  } catch (error) {
    console.error("Error exchanging code:", error);
    return null;
  }
};

/**
 * Get new access token using refresh token via Netlify Function
 */
export const requestGoogleAccessToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
};
