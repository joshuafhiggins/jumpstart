import AppIntents

enum DeviceActionPath: String {
  case wake
  case sleep
  case restart
  case shutdown
}

enum DeviceActionIntentError: LocalizedError {
  case invalidDevice

  var errorDescription: String? {
    "That device can't be opened."
  }
}

func deviceActionURL(_ action: DeviceActionPath, deviceId: String) throws -> URL {
  let encoded = deviceId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? deviceId
  guard !encoded.isEmpty,
        let url = URL(string: "remotewol-upsnap://action/\(action.rawValue)/\(encoded)") else {
    throw DeviceActionIntentError.invalidDevice
  }
  return url
}

@available(iOS 18.0, *)
struct WakeDeviceIntent: AppIntent {
  static let title: LocalizedStringResource = "Wake Device"
  static let description = IntentDescription("Wakes the selected device using Wake-on-LAN.")
  static let openAppWhenRun = true

  @Parameter(title: "Device", requestValueDialog: "Which device should be woken?")
  var device: DeviceEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Wake \(\.$device)")
  }

  @MainActor
  func perform() async throws -> some IntentResult & OpensIntent {
    let url = try deviceActionURL(.wake, deviceId: device.id)
    return .result(opensIntent: OpenURLIntent(url))
  }
}

@available(iOS 18.0, *)
struct SleepDeviceIntent: AppIntent {
  static let title: LocalizedStringResource = "Sleep Device"
  static let description = IntentDescription("Sends the selected device to sleep.")
  static let openAppWhenRun = true

  @Parameter(title: "Device", requestValueDialog: "Which device should sleep?")
  var device: DeviceEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Sleep \(\.$device)")
  }

  @MainActor
  func perform() async throws -> some IntentResult & OpensIntent {
    let url = try deviceActionURL(.sleep, deviceId: device.id)
    return .result(opensIntent: OpenURLIntent(url))
  }
}

@available(iOS 18.0, *)
struct RestartDeviceIntent: AppIntent {
  static let title: LocalizedStringResource = "Restart Device"
  static let description = IntentDescription("Restarts the selected device.")
  static let openAppWhenRun = true

  @Parameter(title: "Device", requestValueDialog: "Which device should restart?")
  var device: DeviceEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Restart \(\.$device)")
  }

  @MainActor
  func perform() async throws -> some IntentResult & OpensIntent {
    let url = try deviceActionURL(.restart, deviceId: device.id)
    return .result(opensIntent: OpenURLIntent(url))
  }
}

@available(iOS 18.0, *)
struct ShutdownDeviceIntent: AppIntent {
  static let title: LocalizedStringResource = "Shut Down Device"
  static let description = IntentDescription("Shuts down the selected device.")
  static let openAppWhenRun = true

  @Parameter(title: "Device", requestValueDialog: "Which device should shut down?")
  var device: DeviceEntity

  static var parameterSummary: some ParameterSummary {
    Summary("Shut down \(\.$device)")
  }

  @MainActor
  func perform() async throws -> some IntentResult & OpensIntent {
    let url = try deviceActionURL(.shutdown, deviceId: device.id)
    return .result(opensIntent: OpenURLIntent(url))
  }
}
