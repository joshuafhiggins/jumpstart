import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme } from '../hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function AuthRedirect() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuth();
  const firstSegment = segments[0];

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isLoginRoute = firstSegment === 'login';

    if (!isAuthenticated && !isLoginRoute) {
      router.replace('/login');
    } else if (isAuthenticated && isLoginRoute) {
      router.replace('/devices');
    }
  }, [firstSegment, isAuthenticated, isLoading, router]);

  return null;
}

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const bgColor = isDark ? '#0b0b0d' : '#fff';
  const titleColor = isDark ? '#fff' : '#000';

  return (
    <AuthProvider>
      <AuthRedirect />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="scan-devices"
          options={{
            headerShown: true,
            title: 'Scan for Devices',
            headerStyle: { backgroundColor: bgColor },
            headerTintColor: titleColor,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen
          name="action/[action]/[deviceId]"
          options={{ animation: 'none' }}
        />
      </Stack>
    </AuthProvider>
  );
}
