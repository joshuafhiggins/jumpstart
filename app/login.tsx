import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { useColorScheme } from "../hooks/use-color-scheme";
import { useAuth } from "../src/context/AuthContext";

export default function LoginScreen() {
	const router = useRouter();
	const colorScheme = useColorScheme() ?? "light";
	const isDark = colorScheme === "dark";
	const bgColor = isDark ? "#0b0b0d" : "#f5f5f5";
	const textColor = isDark ? "#fff" : "#333";
	const subText = isDark ? "#c6c6c8" : "#666";
	const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
	const borderColor = isDark ? "rgba(255,255,255,0.06)" : "#ddd";
	const primary = isDark ? "#0A84FF" : "#007AFF";

	const { serverAddress: storedServerAddress, login } = useAuth();
  const [serverAddress, setServerAddress] = useState(storedServerAddress || "");
	const [identity, setIdentity] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleLogin = async () => {
		if (!serverAddress || !identity || !password) {
			Alert.alert("Error", "Please enter server address, identity, and password");
			return;
		}

		setIsLoading(true);
		try {
			await login(serverAddress, identity, password);
			router.replace("/");
		} catch (error: any) {
			Alert.alert("Login Failed", error.message || "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: bgColor }]}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
		>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.header}>
					<Text style={[styles.title, { color: textColor }]}>Jumpstart</Text>
					<Text style={[styles.subtitle, { color: subText }]}>
						Mobile Frontend for UpSnap
					</Text>
				</View>

				<View style={styles.form}>
					<TextInput
						style={[
							styles.input,
							{ backgroundColor: inputBg, borderColor, color: textColor },
						]}
						placeholder="Server Address"
						placeholderTextColor={subText}
						value={serverAddress}
						onChangeText={setServerAddress}
						autoCapitalize="none"
						autoCorrect={false}
						selectionColor={primary}
						keyboardAppearance={isDark ? "dark" : "light"}
					/>

					<TextInput
						style={[
							styles.input,
							{ backgroundColor: inputBg, borderColor, color: textColor },
						]}
						placeholder="Username or Email"
						placeholderTextColor={subText}
						value={identity}
						onChangeText={setIdentity}
						autoCapitalize="none"
						autoCorrect={false}
						selectionColor={primary}
						keyboardAppearance={isDark ? "dark" : "light"}
					/>

					<TextInput
						style={[
							styles.input,
							{ backgroundColor: inputBg, borderColor, color: textColor },
						]}
						placeholder="Password"
						placeholderTextColor={subText}
						value={password}
						onChangeText={setPassword}
						secureTextEntry
						autoCapitalize="none"
						selectionColor={primary}
						keyboardAppearance={isDark ? "dark" : "light"}
					/>

					<TouchableOpacity
						style={[
							styles.button,
							isLoading && styles.buttonDisabled,
							{
								backgroundColor: isLoading
									? isDark
										? "#333"
										: "#ccc"
									: primary,
							},
						]}
						onPress={handleLogin}
						disabled={isLoading}
					>
						<Text style={[styles.buttonText, { color: "#fff" }]}>
							{isLoading ? "Logging in..." : "Login"}
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: "center",
		padding: 20,
	},
	header: {
		alignItems: "center",
		marginBottom: 40,
	},
	title: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
	},
	form: {
		width: "100%",
	},
	input: {
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		padding: 15,
		fontSize: 16,
		marginBottom: 15,
	},
	checkboxContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},
	checkbox: {
		width: 24,
		height: 24,
		borderWidth: 2,
		borderColor: "#007AFF",
		borderRadius: 4,
		marginRight: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxChecked: {
		backgroundColor: "#007AFF",
	},
	checkmark: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
	checkboxLabel: {
		fontSize: 16,
		color: "#333",
	},
	button: {
		backgroundColor: "#007AFF",
		borderRadius: 8,
		padding: 15,
		alignItems: "center",
	},
	buttonDisabled: {
		backgroundColor: "#ccc",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
	},
});
