import React from "react";
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
	const { user, serverAddress, logout } = useAuth();
	const router = useRouter();
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";
	const bgColor = isDark ? "#0b0b0d" : "#f5f5f5";
	const sectionBg = isDark ? "#1c1c1e" : "#fff";
	const sectionTitleBg = isDark ? "#111111" : "#f9f9f9";
	const textColor = isDark ? "#fff" : "#333";
	const subTextColor = isDark ? "#c6c6c8" : "#666";
	const primary = isDark ? "#0A84FF" : "#007AFF";
	const destructiveColor = "#f44336";

	const handleLogout = () => {
		Alert.alert("Logout", "Are you sure you want to logout?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Logout",
				style: "destructive",
				onPress: async () => {
					router.replace("/login");
					await logout();
				},
			},
		]);
	};

	const SettingItem = ({
		label,
		value,
		onPress,
	}: {
		label: string;
		value?: string;
		onPress?: () => void;
	}) => (
		<TouchableOpacity
			style={[
				styles.settingItem,
				{ borderBottomColor: isDark ? "rgba(255,255,255,0.03)" : "#f0f0f0" },
			]}
			onPress={onPress}
			disabled={!onPress}
			activeOpacity={onPress ? 0.7 : 1}
		>
			<Text style={[styles.settingLabel, { color: textColor }]}>{label}</Text>
			<View style={styles.settingValueContainer}>
				<Text
					style={[styles.settingValue, { color: subTextColor }]}
					numberOfLines={1}
				>
					{value}
				</Text>
			</View>
		</TouchableOpacity>
	);

	const ActionButton = ({
		title,
		onPress,
		destructive = false,
	}: {
		title: string;
		onPress: () => void;
		destructive?: boolean;
	}) => (
		<TouchableOpacity
			style={[
				styles.actionButton,
				{ backgroundColor: destructive ? destructiveColor : primary },
			]}
			onPress={onPress}
		>
			<Text style={styles.actionButtonText}>{title}</Text>
		</TouchableOpacity>
	);

	return (
		<ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
			<View style={styles.content}>
				<View
					style={[
						styles.section,
						{
							backgroundColor: sectionBg,
							shadowColor: isDark ? "rgba(255,255,255,0.02)" : "#000",
						},
					]}
				>
					<Text
						style={[
							styles.sectionTitle,
							{ color: subTextColor, backgroundColor: sectionTitleBg },
						]}
					>
						User Information
					</Text>
					<SettingItem label="Username" value={user?.username || "Admin"} />
					<SettingItem label="Email" value={user?.email || "N/A"} />
					<SettingItem label="Server URL" value={serverAddress || "N/A"} />
				</View>

				<View
					style={[
						styles.section,
						{
							backgroundColor: sectionBg,
							shadowColor: isDark ? "rgba(255,255,255,0.02)" : "#000",
						},
					]}
				>
					<Text
						style={[
							styles.sectionTitle,
							{ color: subTextColor, backgroundColor: sectionTitleBg },
						]}
					>
						App Info
					</Text>
					<SettingItem label="Version" value="1.0.0" />
					<SettingItem label="Build" value="Expo" />
				</View>

				<View
					style={[
						styles.section,
						{
							backgroundColor: sectionBg,
							shadowColor: isDark ? "rgba(255,255,255,0.02)" : "#000",
						},
					]}
				>
					<Text
						style={[
							styles.sectionTitle,
							{ color: subTextColor, backgroundColor: sectionTitleBg },
						]}
					>
						Actions
					</Text>
					<ActionButton title="Logout" onPress={handleLogout} destructive />
				</View>

				<View style={styles.footer}>
					<Text style={[styles.footerText, { color: subTextColor }]}>
						UpSnap Mobile App
					</Text>
					<Text style={[styles.footerText, { color: subTextColor }]}>
						Connect to your UpSnap server
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	content: {
		padding: 20,
	},
	section: {
		backgroundColor: "#fff",
		borderRadius: 12,
		marginBottom: 20,
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "bold",
		color: "#666",
		paddingHorizontal: 15,
		paddingTop: 15,
		paddingBottom: 10,
		backgroundColor: "#f9f9f9",
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
	},
	settingItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 15,
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	settingLabel: {
		fontSize: 16,
		color: "#333",
		flex: 1,
	},
	settingValueContainer: {
		flex: 1,
		alignItems: "flex-end",
	},
	settingValue: {
		fontSize: 14,
		color: "#666",
		maxWidth: 200,
	},
	actionButton: {
		backgroundColor: "#007AFF",
		margin: 15,
		padding: 15,
		borderRadius: 8,
		alignItems: "center",
	},
	actionButtonDestructive: {
		backgroundColor: "#f44336",
	},
	actionButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	actionButtonTextDestructive: {
		color: "#fff",
	},
	footer: {
		alignItems: "center",
		paddingVertical: 30,
	},
	footerText: {
		fontSize: 14,
		color: "#999",
		marginBottom: 5,
	},
});
