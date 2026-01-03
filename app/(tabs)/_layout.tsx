import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

export function DevicesHeader() {
	const router = useRouter();

	return (
		<View style={styles.headerRight}>
			<TouchableOpacity
				onPress={() => router.push("/scan-devices")}
				style={styles.headerButton}
			>
				<Ionicons name="add-circle-outline" size={24} color="#007AFF" />
			</TouchableOpacity>
		</View>
	);
}

export default function TabsLayout() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<Icon sf="desktopcomputer"/>
        <Label>Devices</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="settings">
				<Icon sf="gear"/>
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
