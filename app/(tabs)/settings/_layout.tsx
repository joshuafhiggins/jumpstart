import { Stack } from 'expo-router';
import { useColorScheme } from '../../../hooks/use-color-scheme';

export default function Layout() {
  const isDark = useColorScheme() === 'dark';
  const titleColor = isDark ? '#fff' : '#000';

  return (
    <Stack
      screenOptions={{
        title: 'Settings',
        headerLargeTitle: true,
        headerTintColor: titleColor,
        headerLargeTitleStyle: { color: titleColor },
      }}
    />
  );
}
