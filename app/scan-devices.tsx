import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useColorScheme } from "../hooks/use-color-scheme";
import api from "../src/services/api";
import { NetworkScanResult } from "../src/types";
import { SymbolView } from "expo-symbols";
import * as Burnt from "burnt";

export default function ScanDevicesScreen() {
	const router = useRouter();
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";
	const bgColor = isDark ? "#0b0b0d" : "#f5f5f5";
	const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(255, 255, 255, 0.8)";
	const primary = isDark ? "#0A84FF" : "#007AFF";
	const primaryPressed = isDark ? "#004BB5" : "#0051CC";
	const textColor = isDark ? "#fff" : "#333";
	const subText = isDark ? "#c6c6c8" : "#666";

	const [scanning, setScanning] = useState(false);
	const [devices, setDevices] = useState<NetworkScanResult[]>([]);

	const handleScan = async () => {
		setScanning(true);
		try {
			const results = await api.scanNetwork();
			setDevices(results);
		} catch (error: any) {
			Alert.alert("Error", error.message || "Failed to scan network");
		} finally {
			setScanning(false);
		}
	};

	const handleAddFromScan = async (device: NetworkScanResult) => {
		const deviceName =
			device.name ||
			device.hostname ||
			`Device ${device.ip || device.ip_address}`;
		const deviceIP = device.ip || device.ip_address || "";
		const deviceMAC = device.mac || device.mac_address || "";

		try {
			await api.createDevice({
				name: deviceName,
				mac: deviceMAC,
				ip: deviceIP,
				netmask: "255.255.255.0",
				broadcast: "",
				secureOnPassword: "",
				port: 9,
				groups: [],
				status: "offline",
			});
			Burnt.toast({
				title: "Success",
				preset: "done",
				message: `Added ${deviceName} successfully`,
			});
			router.back();
		} catch (error: any) {
			Burnt.toast({
				title: "Error",
				preset: "error",
				message: error.message || "Failed to add device",
			});
		}
	};

	const renderDevice = ({ item }: { item: NetworkScanResult }) => {
		const displayName = item.name || item.hostname || "Unknown Device";
		const displayIP = item.ip || item.ip_address || "";
		const displayMAC = item.mac || item.mac_address || "";
		const displayVendor = item.mac_vendor || "";

		return (
			<View
				style={[
					styles.deviceCard,
					{
						backgroundColor: cardBg,
						shadowColor: isDark ? "rgba(255,255,255,0.02)" : "#000",
					},
				]}
			>
				<View style={styles.deviceInfo}>
					<Text
						style={[styles.deviceName, { color: textColor }]}
						numberOfLines={1}
					>
						{displayName}
					</Text>
					<Text style={[styles.deviceDetail, { color: subText }]}>
						{displayIP}
					</Text>
					<Text style={[styles.deviceDetail, { color: subText }]}>
						{displayMAC}
					</Text>
					{displayVendor && displayVendor !== "Unknown" && (
						<Text style={[styles.vendorText, { color: subText }]}>
							{displayVendor}
						</Text>
					)}
				</View>
				<TouchableOpacity onPress={() => handleAddFromScan(item)}>
					<SymbolView
						name="plus.circle.fill"
						size={20}
						type="hierarchical"
						style={styles.addButton}
					/>
				</TouchableOpacity>
			</View>
		);
	};

	return (
		<View style={[styles.container, { backgroundColor: bgColor }]}>
			<View style={styles.header}>
				<Text style={[styles.headerText, { color: textColor }]}>
					Add Devices
				</Text>
				<Text style={[styles.headerSubtext, { color: subText }]}>
					Discover devices on your local network
				</Text>
			</View>

			<TouchableOpacity
				style={[
					styles.scanButton,
					{
						backgroundColor: scanning ? primaryPressed : primary,
					},
				]}
				onPress={handleScan}
				disabled={scanning}
			>
				{scanning ? (
					<ActivityIndicator color="#fff" />
				) : (
					<Text style={[styles.scanButtonText, { color: "#fff" }]}>
						Scan Network
					</Text>
				)}
			</TouchableOpacity>

			<Text style={[styles.infoText, { color: subText }]}>
				Note: This requires the server to have nmap installed and may take
        several minutes. To allow for shutdown, reboot, and sleep actions,
        please configure their respective commands in your UpSnap server.
			</Text>

			{devices.length > 0 && (
				<View style={styles.resultsContainer}>
					<Text style={[styles.resultsHeader, { color: textColor }]}>
						Discovered Devices ({devices.length})
					</Text>
					<FlatList
						data={devices}
						renderItem={renderDevice}
						keyExtractor={(item, index) =>
							`${item.ip || item.ip_address || index}-${index}`
						}
						contentContainerStyle={styles.list}
					/>
				</View>
			)}

			{devices.length === 0 && !scanning && (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>
						Tap &quot;Scan Network&quot; to discover devices
					</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
		padding: 20,
	},
	header: {
		marginBottom: 20,
	},
	headerText: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 5,
	},
	headerSubtext: {
		fontSize: 14,
		color: "#666",
	},
	scanButton: {
		backgroundColor: "#007AFF",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
		marginBottom: 15,
	},
	scanButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	infoText: {
		fontSize: 12,
		color: "#999",
		textAlign: "center",
		marginBottom: 20,
	},
	resultsContainer: {
		flex: 1,
	},
	resultsHeader: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 15,
	},
	list: {
		gap: 10,
	},
	deviceCard: {
		backgroundColor: "rgba(255, 255, 255, 0.8)",
		borderRadius: 16,
		padding: 15,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 3,
	},
	deviceInfo: {
		flex: 1,
	},
	deviceName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 4,
	},
	deviceDetail: {
		fontSize: 14,
		color: "#666",
		marginBottom: 2,
	},
	vendorText: {
		fontSize: 12,
		color: "#999",
		fontStyle: "italic",
	},
	addButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: "center",
		alignItems: "center",
	},
	addButtonText: {
		color: "#fff",
		fontSize: 24,
		fontWeight: "bold",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	emptyText: {
		fontSize: 16,
		color: "#999",
		textAlign: "center",
	},
	modalBlur: {
		flex: 1,
		justifyContent: "flex-end",
	},
	modalContent: {
		backgroundColor: "rgba(255, 255, 255, 0.95)",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		maxHeight: "90%",
	},
	modalHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 0, 0, 0.1)",
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#333",
	},
	closeButton: {
		fontSize: 24,
		color: "#999",
		padding: 8,
	},
	modalBody: {
		padding: 20,
	},
	formGroup: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#333",
		marginBottom: 8,
	},
	input: {
		backgroundColor: "rgba(255, 255, 255, 0.8)",
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.1)",
		borderRadius: 12,
		padding: 14,
		fontSize: 16,
	},
	hint: {
		fontSize: 12,
		color: "#666",
		marginTop: 4,
	},
	saveButton: {
		backgroundColor: "#4CAF50",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
		marginTop: 10,
	},
	saveButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
});
