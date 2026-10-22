import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { isAuthCollection, isRevokedAuthError } from '../services/api';
import { getJwtExpiryMs } from '../services/jwtExpiry';
import { syncDevicesToWidget } from '../services/widgetSync';
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

const AUTH_COLLECTION_KEY = 'auth_collection';
const REFRESH_BEFORE_EXPIRY_MS = 60_000;
const MAX_REFRESH_DELAY_MS = 2_147_483_647;
const REFRESH_RETRY_MS = 30_000;
const REFRESH_BACKOFF_MS = 15_000;

function msUntilRefresh(token: string): number | null {
  const expiresAt = getJwtExpiryMs(token);
  if (expiresAt == null) return null;
  return expiresAt - Date.now() - REFRESH_BEFORE_EXPIRY_MS;
}

function collectionFromUser(user: User | null): 'users' | '_superusers' | null {
  return isAuthCollection(user?.collectionName) ? user.collectionName : null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [serverAddress, setServerAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshingRef = useRef(false);
  const sessionWriteRef = useRef<Promise<void>>(Promise.resolve());
  const refreshSessionRef = useRef<() => Promise<void>>(async () => {});
  const armRefreshTimerRef = useRef<(token: string, overdueDelay?: number) => void>(() => {});

  const enqueueSessionWrite = useCallback((task: () => Promise<void>) => {
    const run = sessionWriteRef.current.then(task, task);
    sessionWriteRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current != null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const clearSession = useCallback(async () => {
    clearRefreshTimer();
    api.clearToken();
    api.clearCanCreate();
    api.clearAuthCollection();
    setToken(null);
    setUser(null);
    setCanCreate(null);

    await enqueueSessionWrite(async () => {
      await AsyncStorage.multiRemove([
        'auth_token',
        'auth_user',
        'auth_can_create',
        AUTH_COLLECTION_KEY,
      ]);
    });
  }, [clearRefreshTimer, enqueueSessionWrite]);

  const armRefreshTimer = useCallback((nextToken: string, overdueDelay = 0) => {
    clearRefreshTimer();
    const untilRefresh = msUntilRefresh(nextToken);
    if (untilRefresh == null) return;

    const delay = untilRefresh <= 0 ? overdueDelay : Math.min(untilRefresh, MAX_REFRESH_DELAY_MS);
    const rescheduleOnly = untilRefresh > MAX_REFRESH_DELAY_MS;

    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      const latest = api.getToken();
      if (!latest) return;
      if (rescheduleOnly) {
        armRefreshTimerRef.current(latest);
        return;
      }
      void refreshSessionRef.current();
    }, delay);
  }, [clearRefreshTimer]);

  const refreshSession = useCallback(async () => {
    if (refreshingRef.current || !api.getToken()) return;

    refreshingRef.current = true;
    try {
      await api.refreshAuth();
    } catch {
      // The failure listener either keeps the session and retries, or signs out.
    } finally {
      refreshingRef.current = false;
    }
  }, []);

  const handleRefreshFailure = useCallback(async (error: unknown) => {
    if (isRevokedAuthError(error)) {
      await clearSession();
      return;
    }

    if (!api.getToken()) return;

    clearRefreshTimer();
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      void refreshSessionRef.current();
    }, REFRESH_RETRY_MS);
  }, [clearRefreshTimer, clearSession]);

  const persistRefreshedAuth = useCallback(async (auth: AuthResponse) => {
    await enqueueSessionWrite(async () => {
      if (api.getToken() !== auth.token) return;

      const collection = api.getAuthCollection();
      const pairs: [string, string][] = [
        ['auth_token', auth.token],
        ['auth_user', JSON.stringify(auth.record)],
      ];
      if (collection) {
        pairs.push([AUTH_COLLECTION_KEY, collection]);
      }
      if (collection === '_superusers') {
        pairs.push(['auth_can_create', 'true']);
      }

      await AsyncStorage.multiSet(pairs);
      if (api.getToken() !== auth.token) return;

      setToken(auth.token);
      setUser(auth.record);
      if (collection === '_superusers') {
        setCanCreate(true);
      }
      armRefreshTimerRef.current(auth.token, REFRESH_BACKOFF_MS);
    });
  }, [enqueueSessionWrite]);

  const watchToken = useCallback((nextToken: string) => {
    const untilRefresh = msUntilRefresh(nextToken);
    if (untilRefresh != null && untilRefresh <= 0) {
      void refreshSessionRef.current();
      return;
    }
    armRefreshTimerRef.current(nextToken);
  }, []);

  useEffect(() => {
    refreshSessionRef.current = refreshSession;
    armRefreshTimerRef.current = armRefreshTimer;
  }, [armRefreshTimer, refreshSession]);

  useEffect(() => {
    api.setUnauthorizedHandler(clearSession);
    api.setAuthUpdateListener(persistRefreshedAuth);
    api.setAuthFailureListener(handleRefreshFailure);

    return () => {
      api.setUnauthorizedHandler(null);
      api.setAuthUpdateListener(null);
      api.setAuthFailureListener(null);
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, clearSession, handleRefreshFailure, persistRefreshedAuth]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [
          [, storedToken],
          [, storedUser],
          [, storedServerAddress],
          [, storedCanCreate],
          [, storedCollection],
        ] = await AsyncStorage.multiGet([
          'auth_token',
          'auth_user',
          'auth_server_address',
          'auth_can_create',
          AUTH_COLLECTION_KEY,
        ]);
        if (cancelled) return;

        let restoredUser: User | null = null;
        if (storedToken && storedUser) {
          restoredUser = JSON.parse(storedUser) as User;
          api.setToken(storedToken);
          setToken(storedToken);
          setUser(restoredUser);
        }

        const collection = isAuthCollection(storedCollection)
          ? storedCollection
          : collectionFromUser(restoredUser);
        if (collection) {
          api.setAuthCollection(collection);
        }

        if (collection === '_superusers') {
          api.setCanCreate(true);
          setCanCreate(true);
        } else if (storedCanCreate) {
          const restoredCanCreate = storedCanCreate === 'true';
          api.setCanCreate(restoredCanCreate);
          setCanCreate(restoredCanCreate);
        }

        if (storedServerAddress) {
          setServerAddress(storedServerAddress);
          api.setAddress(storedServerAddress + '/api');
        }

        const untilRefresh = storedToken ? msUntilRefresh(storedToken) : null;
        const refreshIsDue = !!storedToken && !!restoredUser && untilRefresh != null && untilRefresh <= 0;

        if (refreshIsDue) {
          try {
            // Hold the loading gate so an expired token does not flash the device list.
            await api.refreshAuth();
          } catch {
            // Revoked tokens sign out; transient failures keep the session and retry.
          }
        } else if (storedToken && restoredUser) {
          watchToken(storedToken);
        }

        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load auth', error);
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [watchToken]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active') return;

      const currentToken = api.getToken();
      if (!currentToken) return;

      const untilRefresh = msUntilRefresh(currentToken);
      if (untilRefresh == null) return;
      if (untilRefresh <= 0) {
        void refreshSessionRef.current();
        return;
      }
      armRefreshTimerRef.current(currentToken);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const login = async (nextServerAddress: string, identity: string, password: string) => {
    const response: AuthResponse = await api.authenticate(nextServerAddress, identity, password);
    const collection = api.getAuthCollection();

    await enqueueSessionWrite(async () => {
      const pairs: [string, string][] = [
        ['auth_token', response.token],
        ['auth_user', JSON.stringify(response.record)],
        ['auth_server_address', nextServerAddress],
        ['auth_can_create', api.getCanCreate() ? 'true' : 'false'],
      ];
      if (collection) {
        pairs.push([AUTH_COLLECTION_KEY, collection]);
      }
      await AsyncStorage.multiSet(pairs);
    });

    setToken(response.token);
    setUser(response.record);
    setServerAddress(nextServerAddress);
    setCanCreate(api.getCanCreate() || false);
    watchToken(response.token);
  };

  const logout = async () => {
    try {
      await clearSession();
      syncDevicesToWidget([]);
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
