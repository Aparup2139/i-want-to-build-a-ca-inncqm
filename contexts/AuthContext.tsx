
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    fetchUser();

    const subscription = Linking.addEventListener("url", () => {
      console.log("Deep link received, refreshing user session");
      refreshUser();
    });

    const intervalId = setInterval(() => {
      console.log("Auto-refreshing user session to sync token...");
      refreshUser();
    }, 5 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, []);

  // Silent refresh — does NOT touch loading state
  const refreshUser = async () => {
    try {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        setUser(session.data.user as User);
        userRef.current = session.data.user as User;
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        userRef.current = null;
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      if (Platform.OS === "ios" && error instanceof Error) {
        if (
          error.message.includes("525") ||
          error.message.includes("SSL") ||
          error.message.includes("Network request failed") ||
          error.message.includes("certificate")
        ) {
          console.error("[iOS] Network/SSL error during refresh. Keeping existing session.");
          // Don't clear user on network errors during refresh
        } else {
          setUser(null);
          userRef.current = null;
        }
      }
      // On refresh errors, keep existing user state
    }
  };

  const fetchUser = async () => {
    // Only show loading spinner on initial load (when user is not yet known)
    const isInitial = userRef.current === null;
    if (isInitial) {
      setLoading(true);
    }
    try {
      const session = await authClient.getSession();
      if (session?.data?.user) {
        setUser(session.data.user as User);
        userRef.current = session.data.user as User;
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        setUser(null);
        userRef.current = null;
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      if (Platform.OS === "ios" && error instanceof Error) {
        if (
          error.message.includes("525") ||
          error.message.includes("SSL") ||
          error.message.includes("Network request failed") ||
          error.message.includes("certificate")
        ) {
          console.error("[iOS] Network/SSL error detected. Keeping existing session if available.");
          if (!userRef.current) {
            setUser(null);
          }
        } else {
          setUser(null);
          userRef.current = null;
        }
      } else {
        setUser(null);
        userRef.current = null;
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    console.log("[Auth] signInWithEmail called", { email });
    try {
      await authClient.signIn.email({ email, password });
      await fetchUser();
    } catch (error) {
      console.error("Email sign in failed:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    console.log("[Auth] signUpWithEmail called", { email, name });
    try {
      await authClient.signUp.email({ email, password, name });
      await fetchUser();
    } catch (error) {
      console.error("Email sign up failed:", error);
      throw error;
    }
  };

  const signInWithSocial = async (provider: "google" | "apple") => {
    console.log(`[Auth] signInWithSocial called`, { provider });
    try {
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        await fetchUser();
      } else {
        const callbackURL = Linking.createURL("/");
        await authClient.signIn.social({ provider, callbackURL });
        await fetchUser();
      }
    } catch (error) {
      console.error(`${provider} sign in failed:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");

  const signOut = async () => {
    console.log("[Auth] signOut called");
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Sign out failed (API):", error);
    } finally {
      setUser(null);
      userRef.current = null;
      await clearAuthTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
