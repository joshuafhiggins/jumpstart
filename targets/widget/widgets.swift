import WidgetKit
import SwiftUI

// MARK: - Timeline Entry

struct DeviceEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
    let device: DeviceInfo?
}

// MARK: - Timeline Provider

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> DeviceEntry {
        DeviceEntry(
            date: Date(),
            configuration: ConfigurationAppIntent(),
            device: DeviceInfo(id: "placeholder", name: "My Computer", mac: "AA:BB:CC:DD:EE:FF", ip: "192.168.1.100", canSleep: true, canShutdown: true, status: "unknown")
        )
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> DeviceEntry {
        let device = configuration.device.flatMap { SharedDeviceData.getDevice(id: $0.id) }
        return DeviceEntry(date: Date(), configuration: configuration, device: device)
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<DeviceEntry> {
        let device = configuration.device.flatMap { SharedDeviceData.getDevice(id: $0.id) }
        let entry = DeviceEntry(date: Date(), configuration: configuration, device: device)
        
        // Widgets don't update frequently enough for status, so we just provide a static entry
        // Refresh every 30 minutes to pick up device list changes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        return Timeline(entries: [entry], policy: .after(nextUpdate))
    }
}

// MARK: - Deep Link Helper

enum DeviceAction: String {
    case wake
    case sleep
    case restart
    case shutdown
    
    func url(for deviceId: String) -> URL {
        URL(string: "remotewol-upsnap://action/\(self.rawValue)/\(deviceId)")!
    }
}

// MARK: - Widget View

struct DeviceWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var widgetFamily
    
    var body: some View {
        if let device = entry.device {
            VStack(alignment: .leading, spacing: 8) {
                // Device Info Header
                VStack(alignment: .leading, spacing: 2) {
                    Text(device.name)
                        .font(.system(size: 15, weight: .semibold))
                        .lineLimit(1)
                    Text(device.mac)
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
                
                Spacer(minLength: 4)
                
                // Action Buttons
                if widgetFamily == .systemSmall {
                    // Small widget: 2x2 grid
                    VStack(spacing: 6) {
                        HStack(spacing: 6) {
                            ActionButton(action: .wake, deviceId: device.id, enabled: device.status == "offline")
                            ActionButton(action: .sleep, deviceId: device.id, enabled: device.status == "online" && device.canSleep)
                        }
                        HStack(spacing: 6) {
                            ActionButton(action: .restart, deviceId: device.id, enabled: device.status == "online" && device.canShutdown)
                            ActionButton(action: .shutdown, deviceId: device.id, enabled: device.status == "online" && device.canShutdown)
                        }
                    }
                } else {
                    // Medium/Large widget: horizontal layout
                    HStack(spacing: 8) {
                        ActionButton(action: .wake, deviceId: device.id, enabled: device.status == "offline")
                        ActionButton(action: .sleep, deviceId: device.id, enabled: device.status == "online" && device.canSleep)
                        ActionButton(action: .restart, deviceId: device.id, enabled: device.status == "online" && device.canShutdown)
                        ActionButton(action: .shutdown, deviceId: device.id, enabled: device.status == "online" && device.canShutdown)
                    }
                }
            }
            .padding(.vertical, 4)
        } else {
            // No device selected
            VStack(spacing: 8) {
                Image(systemName: "desktopcomputer")
                    .font(.system(size: 32))
                    .foregroundColor(.secondary)
                Text("Select a Device")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.secondary)
                Text("Long press to configure")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary.opacity(0.7))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

// MARK: - Action Button

struct ActionButton: View {
    let action: DeviceAction
    let deviceId: String
    let enabled: Bool
    
    var icon: String {
        switch action {
        case .wake: return "bolt.fill"
        case .sleep: return "moon.fill"
        case .restart: return "arrow.clockwise"
        case .shutdown: return "power"
        }
    }
    
    var color: Color {
        switch action {
        case .wake: return .green
        case .sleep: return .orange
        case .restart: return .blue
        case .shutdown: return .red
        }
    }

    var disabled: Color {
      return .gray
    }
    
    var label: String {
        switch action {
        case .wake: return "Wake"
        case .sleep: return "Sleep"
        case .restart: return "Restart"
        case .shutdown: return "Shut Down"
        }
    }
    
    var body: some View {
        Link(destination: enabled ? action.url(for: deviceId) : URL("")!) {
            VStack(spacing: 2) {
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(enabled ? color : disabled)
            }
            .frame(maxWidth: .infinity, minHeight: 36)
            .background((enabled ? color : disabled).opacity(0.15))
            .cornerRadius(8)
            .disabled(!enabled)
        }
    }
}

// MARK: - Widget Definition

struct DeviceControlWidget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            DeviceWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Device Control")
        .description("Control your devices with wake, sleep, restart, and shutdown actions.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// Keep legacy name for backwards compatibility with existing widget installations
typealias widget = DeviceControlWidget

// MARK: - Preview

#Preview(as: .systemSmall) {
    DeviceControlWidget()
} timeline: {
    DeviceEntry(
        date: .now,
        configuration: ConfigurationAppIntent(),
        device: DeviceInfo(id: "preview", name: "Gaming PC", mac: "AA:BB:CC:DD:EE:FF", ip: "192.168.1.100", canSleep: true, canShutdown: true, status: "online")
    )
}

#Preview(as: .systemMedium) {
    DeviceControlWidget()
} timeline: {
    DeviceEntry(
        date: .now,
        configuration: ConfigurationAppIntent(),
        device: DeviceInfo(id: "preview", name: "Home Server", mac: "11:22:33:44:55:66", ip: "192.168.1.50", canSleep: true, canShutdown: true, status: "offline")
    )
}
