import { writable, get } from "svelte/store";
import { setAuthToken, USE_CONVEX } from "$lib/convex";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
  avatar?: string;
  accessToken?: string;
}

const WORKOS_CLIENT_ID = import.meta.env.VITE_WORKOS_CLIENT_ID as string | undefined;
const WORKOS_REDIRECT_URI = import.meta.env.VITE_WORKOS_REDIRECT_URI as string | undefined;

// Mock admin for dev (no WorkOS keys)
const mockAdmin: AuthUser = {
  id: "admin_001",
  email: "admin@meroauto.com",
  name: "Admin User",
  role: "super_admin",
};

export const currentUser = writable<AuthUser | null>(WORKOS_CLIENT_ID ? null : mockAdmin);
export const isAuthenticated = writable(!WORKOS_CLIENT_ID);
export const authLoading = writable(false);

/** Redirect to WorkOS AuthKit login */
export async function signIn() {
  if (!WORKOS_CLIENT_ID) {
    // Dev mode — use mock
    currentUser.set(mockAdmin);
    isAuthenticated.set(true);
    return;
  }

  // WorkOS AuthKit OAuth redirect
  const params = new URLSearchParams({
    client_id: WORKOS_CLIENT_ID,
    redirect_uri: WORKOS_REDIRECT_URI ?? "http://localhost:1420/auth/callback",
    response_type: "code",
    provider: "authkit",
  });
  window.location.href = `https://api.workos.com/sso/authorize?${params.toString()}`;
}

/** Handle WorkOS callback with auth code */
export async function handleAuthCallback(code: string) {
  authLoading.set(true);
  try {
    // In production, exchange code for token via your backend
    // The Convex backend handles this via the auth.ts HTTP routes
    // For Tauri, we'd use tauri-plugin-oauth or a local server
    const user: AuthUser = {
      id: "workos_user",
      email: "admin@meroauto.com",
      name: "Admin",
      role: "admin",
      accessToken: code,
    };
    currentUser.set(user);
    isAuthenticated.set(true);

    // Set Convex auth token
    if (USE_CONVEX && user.accessToken) {
      setAuthToken(user.accessToken);
    }
  } finally {
    authLoading.set(false);
  }
}

/** Sign out */
export async function signOut() {
  currentUser.set(null);
  isAuthenticated.set(false);
}

/** Check if user has admin role */
export function requireAdmin(): boolean {
  const user = get(currentUser);
  return user?.role === "admin" || user?.role === "super_admin";
}
