import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";

function RootStack() {
  const router = useRouter();
	const { isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading) {
			if (isAuthenticated) {
				router.replace('/(tabs)');
			} else {
				router.replace('/login');
			}
		}
	}, [isAuthenticated, isLoading, router]);

	return (
		<Stack>
			{isAuthenticated ? (
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			) : (
				<Stack.Screen name="login" options={{ headerShown: false }} />
			)}
			<Stack.Screen name="add-device" options={{ headerShown: false }} />
			<Stack.Screen name="scan-devices" options={{ headerShown: false }} />
			<Stack.Screen name="devices/[id]" />
		</Stack>
	);
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<RootStack />
			<StatusBar style="auto" />
		</AuthProvider>
	);
}
