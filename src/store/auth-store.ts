import { makeAutoObservable, runInAction } from "mobx";
import type { User } from "firebase/auth";
import {
  onAuthStateChange,
  signInWithGoogle,
  signOutUser,
  getIdToken,
  requestAuthorizationCode,
  exchangeCodeForRefreshToken,
  storeRefreshTokenOnServer,
} from "@/services/firebase";

const NETLIFY_FUNCTIONS_URL = "/.netlify/functions";

export class AuthStore {
  user: User | null = null;
  googleAccessToken: string | null = null;
  firebaseToken: string | null = null;
  isLoading = true;
  isAuthenticating = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
    this.initAuthListener();
  }

  private initAuthListener() {
    onAuthStateChange(async (user) => {
      let firebaseToken: string | null = null;

      if (user) {
        try {
          firebaseToken = await getIdToken(user);
        } catch (e) {
          firebaseToken = null;
        }
      }

      runInAction(() => {
        this.user = user;
        this.firebaseToken = firebaseToken;
        this.isLoading = false;
      });
    });
  }

  // Get or refresh Google access token from server
  getGoogleAccessToken = async (): Promise<string | null> => {
    // If we have token in memory, use it
    if (this.googleAccessToken) {
      return this.googleAccessToken;
    }

    // Request from server using stored refresh token
    if (this.user && this.firebaseToken) {
      try {
        const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/google-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "getAccessToken",
            uid: this.user.uid,
          }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            // No refresh token stored
            return null;
          }
          throw new Error("Failed to get access token");
        }

        const data = await response.json();
        if (data.accessToken) {
          runInAction(() => {
            this.googleAccessToken = data.accessToken;
          });
        }
        return data.accessToken || null;
      } catch {
        return null;
      }
    }

    return null;
  };

  // Ensure we have Google access token - re-authorize if needed
  ensureGoogleAccessToken = async (): Promise<string | null> => {
    // Try to get existing token
    let token = await this.getGoogleAccessToken();
    if (token) return token;

    // No refresh token stored - need to re-authorize
    if (!this.user) return null;

    try {
      // Request new authorization code
      const code = await requestAuthorizationCode();
      if (!code) return null;

      // Exchange for refresh token
      const refreshToken = await exchangeCodeForRefreshToken(code);
      if (!refreshToken) return null;

      // Store on server
      const stored = await storeRefreshTokenOnServer(this.user.uid, refreshToken);
      if (!stored) return null;

      // Now get access token using stored refresh token
      token = await this.getGoogleAccessToken();
      return token;
    } catch {
      return null;
    }
  };

  // Store refresh token on server
  storeRefreshTokenOnServer = async (refreshToken: string): Promise<boolean> => {
    if (!this.user) return false;

    try {
      const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/google-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "store",
          uid: this.user.uid,
          refreshToken,
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  signInWithGoogle = async () => {
    this.error = null;
    this.isAuthenticating = true;
    try {
      const { user, accessToken, refreshToken } = await signInWithGoogle();
      // Store refresh token on server if available
      if (refreshToken) {
        await this.storeRefreshTokenOnServer(refreshToken);
      }

      runInAction(() => {
        this.user = user;
        this.googleAccessToken = accessToken || null;
      });

      // Redirect to app after successful login
      window.location.href = "/app";
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Sign in failed";
      });
      throw error;
    } finally {
      runInAction(() => {
        this.isAuthenticating = false;
      });
    }
  };

  signOut = async () => {
    await signOutUser();
    runInAction(() => {
      this.user = null;
      this.googleAccessToken = null;
      this.firebaseToken = null;
    });
    // Redirect to landing page after sign out
    window.location.href = "/";
  };

  clearGoogleToken = () => {
    this.googleAccessToken = null;
  };

  get isAuthenticated() {
    return !!this.user;
  }

  get userEmail() {
    return this.user?.email || null;
  }

  get userDisplayName() {
    return this.user?.displayName || null;
  }

  get userPhotoURL() {
    return this.user?.photoURL || null;
  }
}

export const authStore = new AuthStore();
