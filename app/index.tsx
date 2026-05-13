import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../src/context/AuthContext";

export default function IndexRedirect() {
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return <StatusBar style="auto" />;
	}

	return <Redirect href={isAuthenticated ? "/devices" : "/login"} />;
}
