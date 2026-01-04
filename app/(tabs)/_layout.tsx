import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useColorScheme } from "../../hooks/use-color-scheme";

export function DevicesHeader() {
	const router = useRouter();
	const isDark = useColorScheme() === "dark";
	const activityColor = isDark ? "#0A84FF" : "#007AFF";

	return (
		<View style={styles.headerRight}>
			<TouchableOpacity
				onPress={() => router.push("/scan-devices")}
				style={styles.headerButton}
			>
				<Ionicons name="add-circle-outline" size={24} color={activityColor} />
			</TouchableOpacity>
		</View>
	);
}

export default function TabsLayout() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<Icon sf="desktopcomputer" />
				<Label>Devices</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="settings">
				<Icon sf="gear" />
				<Label>Settings</Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}

const styles = StyleSheet.create({
	headerRight: {
		flexDirection: "row",
		gap: 16,
	},
	headerButton: {
		paddingHorizontal: 8,
	},
});
