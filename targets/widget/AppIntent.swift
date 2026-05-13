import WidgetKit
import AppIntents

// MARK: - Shared Data Access

struct SharedDeviceData {
    static let appGroupIdentifier = "group.abunchofknowitalls.remotewol-upsnap"
    
    static var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupIdentifier)
    }
    
    static func getDevices() -> [DeviceInfo] {
        guard let defaults = sharedDefaults,
              let jsonString = defaults.string(forKey: "devices"),
              let data = jsonString.data(using: .utf8),
              let devices = try? JSONDecoder().decode([DeviceInfo].self, from: data) else {
            return []
        }
        return devices
    }
    
    static func getDevice(id: String) -> DeviceInfo? {
        return getDevices().first { $0.id == id }
    }
}

// MARK: - Device Model

struct DeviceInfo: Codable, Hashable, Identifiable {
    let id: String
    let name: String
    let mac: String
    let ip: String
    let canSleep: Bool
    let canShutdown: Bool
    let status: String
}

// MARK: - Device Entity for AppIntents

struct DeviceEntity: AppEntity {
    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Device"
    static var defaultQuery = DeviceQuery()
    
    var id: String
    var name: String
    var mac: String
    
    var displayRepresentation: DisplayRepresentation {
        DisplayRepresentation(title: "\(name)", subtitle: "\(mac)")
    }
}

struct DeviceQuery: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [DeviceEntity] {
        let devices = SharedDeviceData.getDevices()
        return devices
            .filter { identifiers.contains($0.id) }
            .map { DeviceEntity(id: $0.id, name: $0.name, mac: $0.mac) }
    }
    
    func suggestedEntities() async throws -> [DeviceEntity] {
        let devices = SharedDeviceData.getDevices()
        return devices.map { DeviceEntity(id: $0.id, name: $0.name, mac: $0.mac) }
    }
    
    func defaultResult() async -> DeviceEntity? {
        let devices = SharedDeviceData.getDevices()
        return devices.first.map { DeviceEntity(id: $0.id, name: $0.name, mac: $0.mac) }
    }
}

// MARK: - Widget Configuration Intent

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Device Control" }
    static var description: IntentDescription { "Select a device to control from your home screen." }

    @Parameter(title: "Device")
    var device: DeviceEntity?
}
