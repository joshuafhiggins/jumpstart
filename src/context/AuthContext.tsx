import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { AuthResponse, User } from '../types';

interface AuthContextType {
  user: User | null;
  serverAddress: string | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  canCreate: boolean;
  login: (serverAddress: string, identity: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [serverAddress, setServerAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);

  const clearSession = useCallback(async () => {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user', 'auth_can_create']);

    api.clearToken();
    api.clearCanCreate();
    setToken(null);
    setUser(null);
    setCanCreate(null);
  }, []);

  useEffect(() => {
    api.setUnauthorizedHandler(clearSession);

    return () => {
      api.setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  useEffect(() => {
    let cancelled = false;

    void AsyncStorage.multiGet([
      'auth_token',
      'auth_user',
      'auth_server_address',
      'auth_can_create',
    ]).then(
      ([[, storedToken], [, storedUser], [, storedServerAddress], [, storedCanCreate]]) => {
        if (cancelled) return;

        if (storedCanCreate) {
          setCanCreate(storedCanCreate === 'true');
        }

        if (storedToken && storedUser) {
          setToken(storedToken);
          api.setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }

        if (storedServerAddress) {
          setServerAddress(storedServerAddress);
          api.setAddress(storedServerAddress + '/api');
        }

        setIsLoading(false);
      },
      error => {
        if (cancelled) return;
        console.error('Failed to load auth', error);
        setIsLoading(false);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (serverAddress: string, identity: string, password: string) => {
    try {
      const response: AuthResponse = await api.authenticate(serverAddress, identity, password);
      
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(response.record));
      await AsyncStorage.setItem('auth_server_address', serverAddress);
      await AsyncStorage.setItem('auth_can_create', api.getCanCreate() ? 'true' : 'false');
      
      setToken(response.token);
      setUser(response.record);
      setServerAddress(serverAddress);
      setCanCreate(api.getCanCreate() || false);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await clearSession();
    } catch (error) {
      console.error('Failed to logout', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        serverAddress,
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        canCreate: canCreate === true,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
