import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const WORKOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID ?? 'client_01KKYG4JJK79BPD8C3QHRPKVS9';
const WORKOS_REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'meroauto-driver' });
const WORKOS_BASE_URL = 'https://api.workos.com';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'meroauto_driver_token';
const REFRESH_KEY = 'meroauto_driver_refresh';
const USER_KEY = 'meroauto_driver_user';
const TOKEN_EXPIRY_KEY = 'meroauto_driver_token_expiry';

// Refresh 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'driver';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  signup: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadStoredAuth();
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  // Refresh token when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && token) {
        checkAndRefresh();
      }
    });
    return () => sub.remove();
  }, [token]);

  async function clearAuth() {
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY).catch(() => {});
  }

  async function loadStoredAuth() {
    try {
      const [storedToken, storedUser, storedRefresh] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Check if token needs refresh
        if (storedRefresh) {
          const expiry = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
          const expiryMs = expiry ? Number(expiry) : 0;
          if (expiryMs > 0 && Date.now() > expiryMs - REFRESH_BUFFER_MS) {
            await refreshAccessToken(storedRefresh);
          } else {
            scheduleRefresh(expiryMs);
          }
        }
      }
    } catch {
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  }

  function scheduleRefresh(expiryMs: number) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (!expiryMs) return;

    const delay = Math.max(0, expiryMs - Date.now() - REFRESH_BUFFER_MS);
    refreshTimer.current = setTimeout(() => {
      checkAndRefresh();
    }, delay);
  }

  async function checkAndRefresh() {
    try {
      const storedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
      const expiry = await SecureStore.getItemAsync(TOKEN_EXPIRY_KEY);
      const expiryMs = expiry ? Number(expiry) : 0;

      if (storedRefresh && expiryMs > 0 && Date.now() > expiryMs - REFRESH_BUFFER_MS) {
        await refreshAccessToken(storedRefresh);
      }
    } catch {
      // Silent fail — will retry on next foreground
    }
  }

  async function refreshAccessToken(refreshToken: string) {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken,
          clientId: WORKOS_CLIENT_ID,
        }),
      });

      if (!response.ok) {
        // Refresh failed — force re-login
        await clearAuth();
        setToken(null);
        setUser(null);
        return;
      }

      const data = await response.json();
      const newToken = data.accessToken ?? data.access_token;
      const newRefresh = data.refreshToken ?? data.refresh_token;
      const expiresIn = data.expiresIn ?? data.expires_in ?? 3600;
      const expiryMs = Date.now() + expiresIn * 1000;

      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      if (newRefresh) {
        await SecureStore.setItemAsync(REFRESH_KEY, newRefresh);
      }
      await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, String(expiryMs));

      setToken(newToken);
      scheduleRefresh(expiryMs);
    } catch {
      // Network error — keep current token, retry later
    }
  }

  const login = useCallback(async () => {
    const authUrl =
      `${WORKOS_BASE_URL}/user_management/authorize` +
      `?client_id=${WORKOS_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(WORKOS_REDIRECT_URI)}` +
      `&response_type=code` +
      `&provider=authkit` +
      `&state=driver_login`;

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
    const response = await fetch(`${API_URL}/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirectUri: WORKOS_REDIRECT_URI,
        role: 'driver',
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
      name:
        `${data.user?.firstName ?? data.user?.first_name ?? ''} ${data.user?.lastName ?? data.user?.last_name ?? ''}`.trim() ||
        (data.user?.email ?? ''),
      phone: data.user?.phone,
      avatar: data.user?.avatar ?? data.user?.profile_picture_url,
      role: 'driver',
    };

    const accessToken = data.accessToken ?? data.access_token ?? '';
    const refreshToken = data.refreshToken ?? data.refresh_token;
    const expiresIn = data.expiresIn ?? data.expires_in ?? 3600;
    const expiryMs = Date.now() + expiresIn * 1000;

    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    }
    await SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, String(expiryMs));
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(authUser));

    setToken(accessToken);
    setUser(authUser);
    scheduleRefresh(expiryMs);
  }

  const logout = useCallback(async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    await clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !!token,
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
