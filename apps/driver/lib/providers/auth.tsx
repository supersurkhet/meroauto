import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'driver';
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

const TOKEN_KEY = 'meroauto_driver_token';
const USER_KEY = 'meroauto_driver_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  async function loadStoredSession() {
    try {
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // No stored session
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, _password: string) {
    // TODO: Replace with actual WorkOS AuthKit flow
    const mockUser: User = {
      id: 'driver_' + Date.now(),
      email,
      name: email.split('@')[0],
      role: 'driver',
    };
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(mockUser));
    await SecureStore.setItemAsync(TOKEN_KEY, 'mock_token_' + Date.now());
    setUser(mockUser);
  }

  async function signup(email: string, _password: string, name: string) {
    const mockUser: User = {
      id: 'driver_' + Date.now(),
      email,
      name,
      role: 'driver',
    };
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(mockUser));
    await SecureStore.setItemAsync(TOKEN_KEY, 'mock_token_' + Date.now());
    setUser(mockUser);
  }

  async function logout() {
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
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
