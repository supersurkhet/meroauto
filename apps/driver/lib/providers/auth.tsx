import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const WORKOS_CLIENT_ID = process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID ?? '';
const WORKOS_REDIRECT_URI = AuthSession.makeRedirectUri({ scheme: 'meroauto-driver' });
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const TOKEN_KEY = 'meroauto_driver_token';
const USER_KEY = 'meroauto_driver_user';

export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
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

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
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
      // Token expired or invalid
    } finally {
      setIsLoading(false);
    }
  }

  async function login() {
    const authUrl = `https://api.workos.com/user_management/authorize?client_id=${WORKOS_CLIENT_ID}&redirect_uri=${encodeURIComponent(WORKOS_REDIRECT_URI)}&response_type=code&provider=authkit&state=driver_login`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, WORKOS_REDIRECT_URI);

    if (result.type === 'success' && result.url) {
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      if (code) {
        await exchangeCode(code);
      }
    }
  }

  async function signup() {
    // WorkOS handles signup vs login via the same OAuth flow
    return login();
  }

  async function exchangeCode(code: string) {
    const response = await fetch(`${API_URL}/auth/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri: WORKOS_REDIRECT_URI, role: 'driver' }),
    });

    if (!response.ok) throw new Error('Auth exchange failed');

    const data = await response.json();
    const authUser: User = {
      ...data.user,
      name: `${data.user.firstName ?? ''} ${data.user.lastName ?? ''}`.trim() || data.user.email,
      role: 'driver',
    };

    await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(authUser));
    setToken(data.accessToken);
    setUser(authUser);
  }

  async function logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
