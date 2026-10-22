// jumpstart-wake-control
// Control Center wake button. Device choices are the home-screen widget's dynamic
// configuration, which JavaScript updates when the device list loads.

@available(iOS 18.0, *)
struct WakeDeviceControl: ControlWidget {
  static let kind: String = "wakecontrol"

  var body: some ControlWidgetConfiguration {
    AppIntentControlConfiguration(
      kind: Self.kind,
      provider: WakeDeviceControlProvider()
    ) { value in
      ControlWidgetButton(action: WakeControlIntent(deviceId: value.deviceId, deviceName: value.deviceName)) {
        Label(value.deviceName, systemImage: "bolt.fill")
      }
    }
    .displayName("Wake Device")
    .description("Quickly wake a device from Control Center.")
  }
}

@available(iOS 18.0, *)
extension WakeDeviceControl {
  struct Value {
    var deviceId: String
    var deviceName: String
  }
}

@available(iOS 18.0, *)
struct WakeDeviceControlProvider: AppIntentControlValueProvider {
  func previewValue(configuration: WakeControlConfiguration) -> WakeDeviceControl.Value {
    WakeDeviceControl.Value(
      deviceId: configuration.device ?? "",
      deviceName: deviceName(for: configuration.device)
    )
  }

  func currentValue(configuration: WakeControlConfiguration) async throws -> WakeDeviceControl.Value {
    WakeDeviceControl.Value(
      deviceId: configuration.device ?? "",
      deviceName: deviceName(for: configuration.device)
    )
  }

  private func deviceName(for deviceId: String?) -> String {
    guard let deviceId, !deviceId.isEmpty, deviceId != "none" else {
      return "Select Device"
    }

    let options = widgetConfigurationOptions(
      name: "DeviceControl",
      parameter: "device",
      fallback: []
    )
    return options.first { $0.value == deviceId }?.name ?? "Select Device"
  }
}

@available(iOS 18.0, *)
struct WakeControlConfiguration: ControlConfigurationIntent {
  static let title: LocalizedStringResource = "Device to Wake"

  @Parameter(title: "Device", optionsProvider: WakeControlDeviceOptionsProvider())
  var device: String?
}

@available(iOS 18.0, *)
struct WakeControlDeviceOptionsProvider: DynamicOptionsProvider {
  func results() async throws -> IntentItemCollection<String> {
    let options = widgetConfigurationOptions(
      name: "DeviceControl",
      parameter: "device",
      fallback: [
        WidgetConfigurationOption(name: "Select a Device", value: "none")
      ]
    )

    return IntentItemCollection(sections: [
      IntentItemSection(items: options.map { option in
        IntentItem(
          option.value,
          title: LocalizedStringResource(stringLiteral: option.name),
          subtitle: option.subtitle.map { LocalizedStringResource(stringLiteral: $0) }
        )
      })
    ])
  }

  func defaultResult() async -> String? {
    let options = widgetConfigurationOptions(
      name: "DeviceControl",
      parameter: "device",
      fallback: []
    )
    return options.first { $0.value != "none" }?.value ?? options.first?.value
  }
}

@available(iOS 18.0, *)
struct WakeControlIntent: AppIntent {
  static let title: LocalizedStringResource = "Wake Device"
  static let description = IntentDescription("Wakes the selected device using Wake-on-LAN.")
  static let openAppWhenRun: Bool = true
  static let isDiscoverable: Bool = false

  @Parameter(title: "Device ID")
  var deviceId: String

  @Parameter(title: "Device Name")
  var deviceName: String

  init() {
    self.deviceId = ""
    self.deviceName = ""
  }

  init(deviceId: String, deviceName: String) {
    self.deviceId = deviceId
    self.deviceName = deviceName
  }

  func perform() async throws -> some IntentResult & OpensIntent {
    let encoded = deviceId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? deviceId
    if !encoded.isEmpty, encoded != "none", let url = URL(string: "remotewol-upsnap://action/wake/\(encoded)") {
      return .result(opensIntent: OpenURLIntent(url))
    }

    guard let fallback = URL(string: "remotewol-upsnap://") else {
      throw WakeControlIntentError.invalidDevice
    }
    return .result(opensIntent: OpenURLIntent(fallback))
  }
}

enum WakeControlIntentError: LocalizedError {
  case invalidDevice

  var errorDescription: String? {
    "Select a device to wake."
  }
}
