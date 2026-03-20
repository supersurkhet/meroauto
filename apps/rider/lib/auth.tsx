import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

const WORKOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID ?? 'client_01KKYG4JJK79BPD8C3QHRPKVS9';
const WORKOS_REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'meroauto-rider' });
const WORKOS_BASE_URL = 'https://api.workos.com';
const TOKEN_KEY = 'meroauto_auth_token';
const REFRESH_KEY = 'meroauto_refresh_token';
const USER_KEY = 'meroauto_user';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'rider';
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => Promise<void>;
  token: string | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // Token expired or corrupt — clear
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  }

  async function clearAuth() {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
  }

  const login = useCallback(async () => {
    const authUrl =
      `${WORKOS_BASE_URL}/user_management/authorize` +
      `?client_id=${WORKOS_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(WORKOS_REDIRECT_URI)}` +
      `&response_type=code` +
      `&provider=authkit` +
      `&state=rider_login`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, WORKOS_REDIRECT_URI);

    if (result.type === 'success' && result.url) {
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      if (code) {
        await exchangeCode(code);
      }
    } else if (result.type === 'cancel' || result.type === 'dismiss') {
      // User cancelled — no-op
    }
  }, []);

  const signup = useCallback(async () => {
    // WorkOS AuthKit handles both login and signup in the same flow
    return login();
  }, [login]);

  async function exchangeCode(code: string) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirectUri: WORKOS_REDIRECT_URI,
        role: 'rider',
        clientId: WORKOS_CLIENT_ID,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      throw new Error(`Auth exchange failed: ${response.status} — ${text}`);
    }

    const data = await response.json();
    const authUser: User = {
      id: data.user?.id ?? data.userId ?? '',
      email: data.user?.email ?? '',
      firstName: data.user?.firstName ?? data.user?.first_name ?? '',
      lastName: data.user?.lastName ?? data.user?.last_name ?? '',
      phone: data.user?.phone,
      avatar: data.user?.avatar ?? data.user?.profile_picture_url,
      role: 'rider',
    };

    await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken ?? data.access_token ?? '');
    if (data.refreshToken ?? data.refresh_token) {
      await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken ?? data.refresh_token);
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(authUser));

    setToken(data.accessToken ?? data.access_token);
    setUser(authUser);
  }

  const logout = useCallback(async () => {
    await clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
