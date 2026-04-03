import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

declare global {
  interface Window {
    google?: typeof google;
  }
}

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
export const storeRefreshTokenOnServer = async (
  uid: string,
  refreshToken: string,
): Promise<boolean> => {
  try {
    const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/google-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "store",
        uid,
        refreshToken,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
};

let tokenClient: google.accounts.oauth2.CodeClient | null = null;
let currentCodeResolver: ((code: string | null) => void) | null = null;

const initCodeClient = () => {
  if (!window.google || tokenClient) return;

  tokenClient = window.google.accounts.oauth2.initCodeClient({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
    scope:
      "openid email profile https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/drive.file",
    ux_mode: "popup",
    select_account: true,
    callback: (response) => {
      if (currentCodeResolver) {
        currentCodeResolver(response.code || null);
        currentCodeResolver = null;
      }
    },
  });
};

export const requestAuthorizationCode = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!window.google) {
      resolve(null);
      return;
    }

    initCodeClient();
    currentCodeResolver = resolve;
    tokenClient?.requestCode();
  });
};

export const signInWithGoogle = async (): Promise<{
  user: User;
  accessToken: string;
  refreshToken?: string;
}> => {
  try {
    // Step 1: Get authorization code from Google Identity Services
    const code = await requestAuthorizationCode();
    if (!code) {
      throw new Error("Failed to get authorization code");
    }

    // Step 2: Exchange code for tokens via Netlify Function
    const tokenResponse = await fetch(`${NETLIFY_FUNCTIONS_URL}/exchange-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const { accessToken, refreshToken, idToken } = await tokenResponse.json();

    console.log("Token exchange response:", {
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
      idToken: !!idToken,
    });

    if (!idToken) {
      throw new Error("ID token is missing from server response");
    }

    // Step 3: Sign in to Firebase with the Google ID token
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);

    return { user: result.user, accessToken, refreshToken };
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
