import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useAuth } from "../src/context/AuthContext";

export default function IndexRedirect() {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useAuth();

	useEffect(() => {
		if (!isLoading) {
			if (isAuthenticated) {
				router.replace("/(tabs)");
			} else {
				router.replace("/login");
			}
		}
	}, [isAuthenticated, isLoading, router]);

	return <StatusBar style="auto" />;
}
