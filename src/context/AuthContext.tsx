import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      const storedServerAddress = await AsyncStorage.getItem('auth_server_address');
      const storedCanCreate = await AsyncStorage.getItem('auth_can_create');

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
    } catch (error) {
      console.error('Failed to load auth', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('auth_user');
      await AsyncStorage.removeItem('auth_can_create');
      
      api.clearToken();
      api.clearAddress();
      api.clearCanCreate();
      setToken(null);
      setUser(null);
      setServerAddress(null);
      setCanCreate(null);
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
