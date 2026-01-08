import AppIntents
import SwiftUI
import WidgetKit

// MARK: - Control Widget for Quick Wake Action

struct widgetControl: ControlWidget {
    static let kind: String = "wakecontrol"

    var body: some ControlWidgetConfiguration {
        AppIntentControlConfiguration(
            kind: Self.kind,
            provider: WakeControlProvider()
        ) { value in
            ControlWidgetButton(action: WakeDeviceIntent(deviceId: value.deviceId, deviceName: value.deviceName)) {
                Label(value.deviceName, systemImage: "bolt.fill")
            }
        }
        .displayName("Wake Device")
        .description("Quickly wake a device from Control Center.")
    }
}

// MARK: - Control Widget Value

extension widgetControl {
    struct Value {
        var deviceId: String
        var deviceName: String
    }
}

// MARK: - Control Widget Provider

struct WakeControlProvider: AppIntentControlValueProvider {
    func previewValue(configuration: WakeControlConfiguration) -> widgetControl.Value {
        widgetControl.Value(
            deviceId: configuration.device?.id ?? "",
            deviceName: configuration.device?.name ?? "Select Device"
        )
    }

    func currentValue(configuration: WakeControlConfiguration) async throws -> widgetControl.Value {
        widgetControl.Value(
            deviceId: configuration.device?.id ?? "",
            deviceName: configuration.device?.name ?? "Select Device"
        )
    }
}

// MARK: - Control Widget Configuration Intent

struct WakeControlConfiguration: ControlConfigurationIntent {
    static let title: LocalizedStringResource = "Device to Wake"

    @Parameter(title: "Device")
    var device: DeviceEntity?
}

// MARK: - Wake Device Intent (Opens Deep Link)

struct WakeDeviceIntent: AppIntent { 
 static var title: LocalizedStringResource = "Wake Device"
 static var description = IntentDescription("Wakes the selected device using Wake-on-LAN.")
 static var openAppWhenRun: Bool = true
 static var isDiscoverable: Bool = true

 @Parameter(title: "Device ID")
 var deviceId: String

 @Parameter(title: "Device Name")
 var deviceName: String

//  static var parameterSummary: some ParameterSummary {
//    Summary("Wake \(\.$deviceName)")
//  }

 init() {
   self.deviceId = ""
   self.deviceName = ""
 }

 init(deviceId: String, deviceName: String) {
   self.deviceId = deviceId
   self.deviceName = deviceName
 }

 func perform() async throws -> some IntentResult & OpensIntent {
   print("WakeDeviceIntent performed for device: \(deviceName) (id: \(deviceId))")
   let url = URL(string: "remotewol-upsnap://actions/wake/\(deviceId)")!
   return .result(opensIntent: OpenURLIntent(url))
 }
}
