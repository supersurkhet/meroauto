import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { AppState, type AppStateStatus } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const WORKOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID ?? 'client_01KKYG4JJK79BPD8C3QHRPKVS9';
const WORKOS_REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'meroauto-rider' });
const WORKOS_BASE_URL = 'https://api.workos.com';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

// SecureStore keys
const TOKEN_KEY = 'meroauto_auth_token';
const REFRESH_KEY = 'meroauto_refresh_token';
const EXPIRY_KEY = 'meroauto_token_expiry';
const USER_KEY = 'meroauto_user';

// Refresh 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

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
  refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Persist helpers ─────────────────────────────────────────────

  async function persistAuth(
    accessToken: string,
    refreshTkn: string | undefined,
    expiresInSeconds: number | undefined,
    authUser: User,
  ) {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    if (refreshTkn) {
      await SecureStore.setItemAsync(REFRESH_KEY, refreshTkn);
    }
    if (expiresInSeconds) {
      const expiryMs = Date.now() + expiresInSeconds * 1000;
      await SecureStore.setItemAsync(EXPIRY_KEY, String(expiryMs));
      scheduleRefresh(expiryMs);
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(authUser));
    setToken(accessToken);
    setUser(authUser);
  }

  async function clearAuth() {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(EXPIRY_KEY).catch(() => {});
    await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
    setToken(null);
    setUser(null);
  }

  // ── Token refresh ───────────────────────────────────────────────

  function scheduleRefresh(expiryMs: number) {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    const msUntilRefresh = expiryMs - Date.now() - REFRESH_BUFFER_MS;
    if (msUntilRefresh <= 0) {
      // Already expired or about to — refresh now
      doRefresh();
      return;
    }
    refreshTimer.current = setTimeout(doRefresh, msUntilRefresh);
  }

  async function doRefresh(): Promise<boolean> {
    try {
      const storedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!storedRefresh) {
        // No refresh token — force re-login
        await clearAuth();
        return false;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: storedRefresh,
          clientId: WORKOS_CLIENT_ID,
        }),
      });

      if (!response.ok) {
        // Refresh failed — clear auth, user must re-login
        console.warn('Token refresh failed:', response.status);
        await clearAuth();
        return false;
      }

      const data = await response.json();
      const newToken = data.accessToken ?? data.access_token;
      const newRefresh = data.refreshToken ?? data.refresh_token;
      const expiresIn = data.expiresIn ?? data.expires_in ?? 3600;

      if (!newToken) {
        await clearAuth();
        return false;
      }

      // Persist new tokens — keep existing user
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      const currentUser = storedUser ? JSON.parse(storedUser) : user;

      if (currentUser) {
        await persistAuth(newToken, newRefresh, expiresIn, currentUser);
      }
      return true;
    } catch (err) {
      console.warn('Token refresh error:', err);
      return false;
    }
  }

  // ── Load stored auth on mount ───────────────────────────────────

  useEffect(() => {
    loadStoredAuth();
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      const storedExpiry = await SecureStore.getItemAsync(EXPIRY_KEY);

      if (!storedToken || !storedUser) {
        setIsLoading(false);
        return;
      }

      const parsedUser: User = JSON.parse(storedUser);
      const expiryMs = storedExpiry ? Number(storedExpiry) : 0;

      // Check if token has expired
      if (expiryMs > 0 && Date.now() >= expiryMs) {
        // Token expired — try refresh
        const refreshed = await doRefresh();
        if (!refreshed) {
          setIsLoading(false);
          return;
        }
      } else {
        // Token still valid
        setToken(storedToken);
        setUser(parsedUser);
        if (expiryMs > 0) {
          scheduleRefresh(expiryMs);
        }
      }
    } catch {
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  }

  // ── Refresh on app foreground ───────────────────────────────────

  useEffect(() => {
    const handleAppState = async (state: AppStateStatus) => {
      if (state !== 'active' || !user) return;
      const storedExpiry = await SecureStore.getItemAsync(EXPIRY_KEY).catch(() => null);
      if (!storedExpiry) return;
      const expiryMs = Number(storedExpiry);
      if (expiryMs > 0 && Date.now() >= expiryMs - REFRESH_BUFFER_MS) {
        await doRefresh();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [user]);

  // ── Login ───────────────────────────────────────────────────────

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
      if (!code) throw new Error('No authorization code received');
      await exchangeCode(code);
    }
    // cancel/dismiss — no-op
  }, []);

  const signup = useCallback(async () => login(), [login]);

  // ── Code exchange ───────────────────────────────────────────────

  async function exchangeCode(code: string) {
    const response = await fetch(`${API_URL}/auth/callback`, {
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
      throw new Error(`Auth failed: ${response.status} — ${text}`);
    }

    const data = await response.json();
    const accessToken = data.accessToken ?? data.access_token;
    const refreshTkn = data.refreshToken ?? data.refresh_token;
    const expiresIn = data.expiresIn ?? data.expires_in ?? 3600;

    if (!accessToken) throw new Error('No access token received');

    const authUser: User = {
      id: data.user?.id ?? '',
      email: data.user?.email ?? '',
      firstName: data.user?.firstName ?? data.user?.first_name ?? '',
      lastName: data.user?.lastName ?? data.user?.last_name ?? '',
      phone: data.user?.phone ?? data.user?.phone_number,
      avatar: data.user?.avatar ?? data.user?.profile_picture_url,
      role: 'rider',
    };

    if (!authUser.id) throw new Error('No user ID received');

    await persistAuth(accessToken, refreshTkn, expiresIn, authUser);
  }

  // ── Logout ──────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await clearAuth();
  }, []);

  // ── Public refresh (for manual retry) ───────────────────────────

  const refreshToken = useCallback(async () => doRefresh(), []);

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
        refreshToken,
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
