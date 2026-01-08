import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { useColorScheme } from '../hooks/use-color-scheme';
import { AuthProvider } from '../src/context/AuthContext';

function DevicesHeader() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const activityColor = isDark ? '#0A84FF' : '#007AFF';

  return (
    <TouchableOpacity
      onPress={() => router.push('/scan-devices')}
      style={{ paddingHorizontal: 8 }}
    >
      <Ionicons name="add-circle-outline" size={24} color={activityColor} />
    </TouchableOpacity>
  );
}

function TabsTitle(props: { title: string }) {
  const segments = useSegments();
  const last = segments[segments.length - 1];
  const isDark = useColorScheme() === 'dark';
  const titleColor = isDark ? '#fff' : '#000';
  const title = last === 'settings' ? 'Settings' : props.title;
  return (
    <Text style={{ color: titleColor, fontSize: 17, fontWeight: '600' }}>
      {title}
    </Text>
  );
}

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const bgColor = isDark ? '#0b0b0d' : '#fff';
  const titleColor = isDark ? '#fff' : '#000';

  const segments = useSegments();
  const last = segments[segments.length - 1];
  const isIndex = last === '(tabs)' || last === undefined;

  return (
    <AuthProvider>
      <Stack>
        {/* Root index that performs auth redirect (app/index.tsx) */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Tabs parent - render tabs with dynamic header */}
        <Stack.Screen
          name="(tabs)"
          options={
            {
              headerTitle: () => <TabsTitle title="Devices" />,
              headerRight: isIndex ? () => <DevicesHeader /> : undefined,
              headerRightContainerStyle: isIndex
                ? undefined
                : { width: 0, paddingRight: 0 },
              headerStyle: { backgroundColor: bgColor },
              headerTintColor: titleColor,
            } as any
          }
        />{' '}
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="scan-devices"
          options={{
            headerShown: true,
            headerTitle: () => <TabsTitle title="Scan Devices" />,
            headerStyle: { backgroundColor: bgColor },
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        {/* Deep link action handler - no header, immediately redirects */}
        <Stack.Screen
          name="action/[action]/[deviceId]"
          options={{ headerShown: false, animation: 'none' }}
        />
      </Stack>
    </AuthProvider>
  );
}
