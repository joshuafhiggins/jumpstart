import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	RefreshControl,
	Alert,
	ActivityIndicator,
} from "react-native";
import { ContextMenu, Button as SwiftUIButton, Host } from "@expo/ui/swift-ui";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../src/services/api";
import { Device } from "../../src/types";

function DevicesHeader() {
	const router = useRouter();

	return (
		<View>
			<TouchableOpacity onPress={() => router.push("/scan-devices")}>
				<Ionicons name="add-circle-outline" size={24} color="#007AFF" />
			</TouchableOpacity>
		</View>
	);
}

export default function DeviceListScreen() {
	const router = useRouter();
	const [devices, setDevices] = useState<Device[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		loadDevices();
	}, []);

	const loadDevices = async () => {
		try {
			setIsLoading(true);
			const data = await api.getDevices();
			setDevices(data);
		} catch (error: any) {
			Alert.alert("Error", error.message || "Failed to load devices");
		} finally {
			setIsLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadDevices();
		setRefreshing(false);
	};

	const handleWake = async (device: Device) => {
		try {
			await api.wakeDevice(device.id);
			Alert.alert("Success", `Wake signal sent to ${device.name}`);
		} catch (error: any) {
			Alert.alert("Error", error.message || "Failed to wake device");
		}
	};

	const handleSleep = async (device: Device) => {
		Alert.alert("Confirm", `Send ${device.name} to sleep?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sleep",
				style: "destructive",
				onPress: async () => {
					try {
						await api.sleepDevice(device.id);
						Alert.alert("Success", `Sleep signal sent to ${device.name}`);
					} catch (error: any) {
						Alert.alert("Error", error.message || "Failed to sleep device");
					}
				},
			},
		]);
	};

	const handleReboot = async (device: Device) => {
		Alert.alert("Confirm", `Reboot ${device.name}?`, [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Reboot",
				style: "destructive",
				onPress: async () => {
					try {
						await api.rebootDevice(device.id);
						Alert.alert("Success", `Reboot signal sent to ${device.name}`);
					} catch (error: any) {
						Alert.alert("Error", error.message || "Failed to reboot device");
					}
				},
			},
		]);
	};

	const handleShutdown = async (device: Device) => {
		Alert.alert(
			"Confirm Shutdown",
			`Shutdown ${device.name}? This cannot be undone.`,
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Shutdown",
					style: "destructive",
					onPress: async () => {
						try {
							await api.shutdownDevice(device.id);
							Alert.alert("Success", `Shutdown signal sent to ${device.name}`);
						} catch (error: any) {
							Alert.alert(
								"Error",
								error.message || "Failed to shutdown device"
							);
						}
					},
				},
			]
		);
	};

	const handleDelete = (device: Device) => {
		Alert.alert("Delete Device", `Delete "${device.name}"?`, [
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					try {
						await api.deleteDevice(device.id);
						Alert.alert("Success", "Device deleted successfully");
						loadDevices();
					} catch (error: any) {
						Alert.alert("Error", error.message || "Failed to delete device");
					}
				},
			},
		]);
	};

	const getStatusColor = (status: string) => {
		switch (status?.toLowerCase()) {
			case "online":
				return "#4CAF50";
			case "offline":
				return "#f44336";
			default:
				return "#ff9800";
		}
	};

	const renderDevice = ({ item }: { item: Device }) => (
		<Host>
			<ContextMenu activationMethod="longPress">
				<ContextMenu.Items>
					<SwiftUIButton
						systemImage="trash"
						role="destructive"
						onPress={() => handleDelete(item)}
					>
						Delete Device
					</SwiftUIButton>
				</ContextMenu.Items>
				<ContextMenu.Trigger>
					<View style={styles.deviceCard}>
						<TouchableOpacity
							onPress={() => router.push(`/devices/${item.id}`)}
							activeOpacity={1}
						>
							<View style={styles.deviceHeader}>
								<View style={styles.deviceInfo}>
									<Text style={styles.deviceName}>{item.name}</Text>
									<Text style={styles.deviceIP}>{item.ip}</Text>
								</View>
								<View
									style={[
										styles.statusDot,
										{ backgroundColor: getStatusColor(item.status) },
									]}
								/>
							</View>

							<View style={styles.deviceActions}>
								<TouchableOpacity
									style={[styles.actionButton, styles.wakeButton]}
									onPress={() => handleWake(item)}
								>
									<Text style={styles.actionButtonText}>Wake</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.actionButton, styles.sleepButton]}
									onPress={() => handleSleep(item)}
								>
									<Text style={styles.actionButtonText}>Sleep</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.actionButton, styles.rebootButton]}
									onPress={() => handleReboot(item)}
								>
									<Text style={styles.actionButtonText}>Reboot</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.actionButton, styles.shutdownButton]}
									onPress={() => handleShutdown(item)}
								>
									<Text style={styles.actionButtonText}>Shutdown</Text>
								</TouchableOpacity>
							</View>
						</TouchableOpacity>
					</View>
				</ContextMenu.Trigger>
			</ContextMenu>
		</Host>
	);

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#007AFF" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Stack.Screen
				options={{
					title: "Devices",
					headerRight: () => <DevicesHeader />,
				}}
			/>
			<FlatList
				data={devices}
				renderItem={renderDevice}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.list}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyText}>No devices found</Text>
					</View>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	headerRight: {
		flexDirection: "row",
		gap: 16,
	},
	headerButton: {
		paddingHorizontal: 8,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	list: {
		padding: 15,
	},
	deviceCard: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 15,
		marginBottom: 15,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	deviceHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	deviceInfo: {
		flex: 1,
	},
	deviceName: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 4,
	},
	deviceIP: {
		fontSize: 14,
		color: "#666",
	},
	statusDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
	},
	deviceActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 8,
	},
	actionButton: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: "center",
	},
	wakeButton: {
		backgroundColor: "#4CAF50",
	},
	sleepButton: {
		backgroundColor: "#FF9800",
	},
	rebootButton: {
		backgroundColor: "#2196F3",
	},
	shutdownButton: {
		backgroundColor: "#f44336",
	},
	actionButtonText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 12,
	},
	emptyContainer: {
		alignItems: "center",
		paddingVertical: 50,
	},
	emptyText: {
		fontSize: 16,
		color: "#999",
	},
});
