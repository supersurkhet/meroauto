/**
 * WorkOS authentication via Convex Auth.
 *
 * Flow:
 * 1. signIn() → redirects to Convex HTTP auth endpoint → WorkOS hosted login
 * 2. WorkOS redirects back to VITE_CONVEX_SITE_URL/auth/callback
 * 3. Convex exchanges code for tokens, sets session
 * 4. Client fetches session via fetchUser()
 *
 * Env vars required:
 *   VITE_CONVEX_URL        — Convex deployment URL
 *   VITE_CONVEX_SITE_URL   — Convex HTTP site URL (for auth routes)
 */
import { writable, get } from "svelte/store";
import { USE_CONVEX, query, getClient } from "$lib/convex";

export interface AuthUser {
  _id: string;
  name?: string;
  email?: string;
  role: "rider" | "driver" | "admin";
  phone?: string;
  avatarUrl?: string;
  preferredLanguage?: "en" | "ne";
}

const CONVEX_SITE_URL = import.meta.env.VITE_CONVEX_SITE_URL as string | undefined;

export const currentUser = writable<AuthUser | null>(null);
export const isAuthenticated = writable(false);
export const authLoading = writable(true);

/** Fetch current user from Convex (uses session cookie/token) */
export async function fetchUser() {
  if (!USE_CONVEX) {
    authLoading.set(false);
    return;
  }
  authLoading.set(true);
  try {
    const user = await query<AuthUser | null>("users:me");
    if (user && user.role === "admin") {
      currentUser.set(user);
      isAuthenticated.set(true);
    } else if (user) {
      // Authenticated but not admin — deny access
      currentUser.set(null);
      isAuthenticated.set(false);
    } else {
      currentUser.set(null);
      isAuthenticated.set(false);
    }
  } catch {
    // Not authenticated
    currentUser.set(null);
    isAuthenticated.set(false);
  } finally {
    authLoading.set(false);
  }
}

/**
 * Redirect to WorkOS login via Convex Auth HTTP endpoint.
 * Convex Auth handles the OAuth flow server-side.
 */
export function signIn() {
  if (!CONVEX_SITE_URL) {
    throw new Error("VITE_CONVEX_SITE_URL not configured — cannot authenticate");
  }
  const redirectUrl = `${window.location.origin}/auth/callback`;
  const authUrl = `${CONVEX_SITE_URL}/api/auth/signin/workos?redirectTo=${encodeURIComponent(redirectUrl)}`;
  window.location.href = authUrl;
}

/**
 * Handle auth callback — extract token from URL params and set on Convex client.
 * Called from /auth/callback route.
 */
export async function handleAuthCallback(token: string) {
  if (!USE_CONVEX) return;
  authLoading.set(true);
  try {
    // Set the JWT on the Convex client for authenticated requests
    getClient().setAuth(token);
    // Fetch the authenticated user profile
    await fetchUser();
  } finally {
    authLoading.set(false);
  }
}

/** Sign out — clear local state and call Convex signOut */
export async function signOut() {
  if (CONVEX_SITE_URL) {
    // Hit Convex auth signout endpoint
    try {
      await fetch(`${CONVEX_SITE_URL}/api/auth/signout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Best-effort signout
    }
  }
  currentUser.set(null);
  isAuthenticated.set(false);
}

/** Check if current user has admin role */
export function requireAdmin(): boolean {
  const user = get(currentUser);
  return user?.role === "admin";
}
