import AppIntents

@available(iOS 18.0, *)
struct AppShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: WakeDeviceIntent(),
      phrases: [
        "Wake a device in \(.applicationName)",
        "Wake \(\.$device) in \(.applicationName)",
      ],
      shortTitle: "Wake Device",
      systemImageName: "bolt.fill"
    )
    AppShortcut(
      intent: SleepDeviceIntent(),
      phrases: [
        "Sleep a device in \(.applicationName)",
        "Sleep \(\.$device) in \(.applicationName)",
      ],
      shortTitle: "Sleep Device",
      systemImageName: "moon.fill"
    )
    AppShortcut(
      intent: RestartDeviceIntent(),
      phrases: [
        "Restart a device in \(.applicationName)",
        "Restart \(\.$device) in \(.applicationName)",
      ],
      shortTitle: "Restart Device",
      systemImageName: "arrow.clockwise"
    )
    AppShortcut(
      intent: ShutdownDeviceIntent(),
      phrases: [
        "Shut down a device in \(.applicationName)",
        "Shut down \(\.$device) in \(.applicationName)",
      ],
      shortTitle: "Shut Down Device",
      systemImageName: "power"
    )
  }
}
