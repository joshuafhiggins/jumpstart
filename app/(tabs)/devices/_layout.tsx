import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from '../../../hooks/use-color-scheme';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';

function Header() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const activityColor = isDark ? '#0A84FF' : '#007AFF';
  const { canCreate } = useAuth();

  return (
    <TouchableOpacity
      onPress={() => router.push('/scan-devices')}
      disabled={!canCreate}
      style={{ paddingHorizontal: 8 }}
    >
      <Ionicons
        name="add-circle-outline"
        size={24}
        color={canCreate ? activityColor : 'gray'}
      />
    </TouchableOpacity>
  );
}

export default function Layout() {
  const isDark = useColorScheme() === 'dark';
  const titleColor = isDark ? '#fff' : '#000';

  return (
    <Stack
      screenOptions={{
        title: 'Devices',
        headerLargeTitle: true,
        headerRight: () => <Header />,
        headerTintColor: titleColor,
        headerLargeTitleStyle: { color: titleColor },
      }}
    />
  );
}
