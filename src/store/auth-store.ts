import { makeAutoObservable, runInAction } from "mobx";
import type { User } from "firebase/auth";
import {
  onAuthStateChange,
  signInWithGoogle,
  signOutUser,
  getIdToken,
  requestGoogleAccessToken,
} from "@/services/firebase";

export class AuthStore {
  user: User | null = null;
  googleAccessToken: string | null = null;
  googleRefreshToken: string | null = null; // Store in memory only
  firebaseToken: string | null = null;
  isLoading = true;
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

  // Get or refresh Google access token automatically
  getGoogleAccessToken = async (): Promise<string | null> => {
    // If we have token in memory, use it
    if (this.googleAccessToken) {
      return this.googleAccessToken;
    }

    // If we have refresh token, use server to get new access token
    if (this.user && this.googleRefreshToken) {
      try {
        const token = await requestGoogleAccessToken(this.googleRefreshToken);
        if (token) {
          runInAction(() => {
            this.googleAccessToken = token;
          });
        }
        return token;
      } catch {
        return null;
      }
    }

    return null;
  };

  signInWithGoogle = async () => {
    this.error = null;
    try {
      const { user, token } = await signInWithGoogle();
      runInAction(() => {
        this.user = user;
        this.googleAccessToken = token || null;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : "Sign in failed";
      });
      throw error;
    }
  };

  signOut = async () => {
    await signOutUser();
    runInAction(() => {
      this.user = null;
      this.googleAccessToken = null;
      this.googleRefreshToken = null;
      this.firebaseToken = null;
    });
  };

  clearGoogleToken = () => {
    this.googleAccessToken = null;
    this.googleRefreshToken = null;
  };

  setRefreshToken = (token: string) => {
    this.googleRefreshToken = token;
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
