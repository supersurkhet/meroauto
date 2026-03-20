import { writable } from "svelte/store";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "super_admin";
  avatar?: string;
}

// WorkOS auth stub - in production this integrates with WorkOS AuthKit
const mockAdmin: AdminUser = {
  id: "admin_001",
  email: "admin@meroauto.com",
  name: "Admin User",
  role: "super_admin",
};

export const currentUser = writable<AdminUser | null>(mockAdmin);
export const isAuthenticated = writable(true);

export async function signIn() {
  // WorkOS AuthKit integration
  // In production: redirect to WorkOS hosted auth page
  currentUser.set(mockAdmin);
  isAuthenticated.set(true);
}

export async function signOut() {
  currentUser.set(null);
  isAuthenticated.set(false);
}
