import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";

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
